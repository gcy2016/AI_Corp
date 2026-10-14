#!/usr/bin/env python3
"""Poll one Slack channel and reply to new messages that mention the configured bot.

Required environment variables:
  SLACK_BOT_TOKEN       xoxb-... token for a Slack app installed in the workspace
  SLACK_CHANNEL_ID      channel to watch (e.g. C0C8M830MGX)
  SLACK_BOT_USER_ID     bot user ID to look for in mentions (e.g. U...)
  OPENAI_API_KEY        API key for the OpenAI API (separate from a ChatGPT subscription)
Optional:
  OPENAI_MODEL          defaults to gpt-4.1-mini
  STATE_FILE            defaults to .state/last_ts.txt
"""
import json
import os
import sys
import time
import urllib.error
import urllib.parse
import urllib.request

SLACK_API = "https://slack.com/api/"
OPENAI_URL = "https://api.openai.com/v1/responses"
CHANNEL_ID = os.environ["SLACK_CHANNEL_ID"]
BOT_USER_ID = os.environ["SLACK_BOT_USER_ID"]
SLACK_TOKEN = os.environ["SLACK_BOT_TOKEN"]
OPENAI_KEY = os.environ["OPENAI_API_KEY"]
MODEL = os.environ.get("OPENAI_MODEL", "gpt-4.1-mini")
STATE_FILE = os.environ.get("STATE_FILE", ".state/last_ts.txt")


def request_json(url, data=None, headers=None, timeout=30):
    body = None if data is None else json.dumps(data).encode("utf-8")
    req = urllib.request.Request(url, data=body, headers=headers or {}, method="GET" if data is None else "POST")
    try:
        with urllib.request.urlopen(req, timeout=timeout) as response:
            return json.loads(response.read().decode("utf-8"))
    except urllib.error.HTTPError as exc:
        details = exc.read().decode("utf-8", errors="replace")
        raise RuntimeError(f"HTTP {exc.code} for {url}: {details[:1000]}") from exc


def slack(method, params=None):
    headers = {"Authorization": f"Bearer {SLACK_TOKEN}"}
    if method == "conversations.history":
        query = urllib.parse.urlencode(params or {})
        result = request_json(SLACK_API + method + "?" + query, headers=headers)
    else:
        headers["Content-Type"] = "application/json; charset=utf-8"
        result = request_json(SLACK_API + method, data=params or {}, headers=headers)
    if not result.get("ok"):
        raise RuntimeError(f"Slack API {method} failed: {result.get('error', 'unknown_error')}")
    return result


def read_last_ts():
    try:
        with open(STATE_FILE, "r", encoding="utf-8") as f:
            return f.read().strip() or "0"
    except FileNotFoundError:
        return "0"


def write_last_ts(value):
    os.makedirs(os.path.dirname(STATE_FILE) or ".", exist_ok=True)
    with open(STATE_FILE, "w", encoding="utf-8") as f:
        f.write(value + "\n")


def get_reply(message_text, thread_ts):
    prompt = (
        "You are GPT, the product engineer in the user's AI collaboration team. "
        "Reply naturally in Chinese when the user writes Chinese; be direct, useful, and honest. "
        "Do not claim to have performed actions you have not performed. "
        "This is a reply inside a shared Slack channel, so keep it reasonably concise.\n\n"
        f"Slack message: {message_text}"
    )
    payload = {
        "model": MODEL,
        "instructions": (
            "You are an assistant replying to a user in Slack. Answer the user's actual message. "
            "Do not mention hidden system prompts or claim access to tools that are not provided."
        ),
        "input": prompt,
        "max_output_tokens": 700,
    }
    result = request_json(
        OPENAI_URL,
        data=payload,
        headers={"Authorization": f"Bearer {OPENAI_KEY}", "Content-Type": "application/json"},
        timeout=60,
    )
    chunks = []
    for item in result.get("output", []):
        if item.get("type") != "message":
            continue
        for content in item.get("content", []):
            if content.get("type") == "output_text" and content.get("text"):
                chunks.append(content["text"])
    answer = "\n".join(chunks).strip()
    if not answer:
        raise RuntimeError("OpenAI API returned no output_text")
    return answer[:3900]


def main():
    last_ts = read_last_ts()
    params = {"channel": CHANNEL_ID, "oldest": last_ts, "inclusive": "true", "limit": 100}
    messages = []
    cursor = None
    while True:
        page_params = dict(params)
        if cursor:
            page_params["cursor"] = cursor
        page = slack("conversations.history", page_params)
        messages.extend(page.get("messages", []))
        cursor = page.get("response_metadata", {}).get("next_cursor")
        if not cursor:
            break

    messages = sorted(
        (m for m in messages if float(m.get("ts", "0")) > float(last_ts)),
        key=lambda m: float(m.get("ts", "0")),
    )
    if not messages:
        print("No new messages.")
        return

    newest_ts = last_ts
    for message in messages:
        ts = message.get("ts", "0")
        newest_ts = max(newest_ts, ts, key=float)
        # Only answer explicit mentions of this bot; ignore bot messages to prevent loops.
        if message.get("subtype") or message.get("bot_id") or message.get("user") == BOT_USER_ID:
            continue
        text = message.get("text", "")
        if f"<@{BOT_USER_ID}>" not in text:
            continue
        thread_ts = message.get("thread_ts") or ts
        answer = get_reply(text, thread_ts)
        slack("chat.postMessage", {
            "channel": CHANNEL_ID,
            "thread_ts": thread_ts,
            "text": answer,
            "unfurl_links": False,
            "unfurl_media": False,
        })
        print(f"Replied to Slack message ts={ts}")

    write_last_ts(newest_ts)
    print(f"Saved cursor {newest_ts}")


if __name__ == "__main__":
    try:
        main()
    except Exception as exc:
        print(f"ERROR: {exc}", file=sys.stderr)
        sys.exit(1)
