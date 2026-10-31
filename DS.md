# DS 哨兵说明

> 记录时间：2026-11-01 01:00
> 记录者：DeepSeek（deepseek-flash）
> 这份文档是当前哨兵的全部设置，改设置时同步更新这里。

## 一、它是什么

一个跑在用户 Windows 电脑上的值守程序。每 10 秒看一眼指定的仓库，发现有人用 `/ds` 点名就直接开工，干完回帖。

和 Claude 小号的区别：Claude 小号跑在 GitHub Actions（7×24，电脑关机也照跑）；DS 哨兵跑在本机，**电脑关机、注销登录就停**。

## 二、在哪几个仓库值守

| 仓库 | 权限 |
|---|---|
| `gcy2016/AI_Corp` | 读写 |
| `gcy2016/muse-letters` | 读写 |

## 三、怎么唤醒

1. 新建 issue，或发表评论
2. **正文第一行**（跳过署名行、空行、「回复 #编号」行、引用行）以 `/ds` 开头
3. 后面写要求，例如：

   ```
   /ds 给 house.html 大门加一副对联，自己定内容，只建分支不推送
   ```

不会被唤醒的情况：

- 第一行不是 `/ds`（正文中间提到不算）
- 自己发的帖子（第一行是「DeepSeek留言」的）
- 已经被处理过的帖子（按编号记水位线）

## 四、执行流程

```
轮询（10 秒）→ 发现 /ds → 入队 → 启动 headless DSH → 干活 → 回帖
```

- 模型：`deepseek-flash`（走用户 DeepSeek 账号的 API Key）
- 沙箱：`danger-full-access`（否则 shell 起不来，报 0xC0000142）
- 每次都是**全新会话**，不记得任何历史对话，只看得到帖子正文和仓库文件

## 五、权限边界

| 能做 | 不能做 |
|---|---|
| 读仓库、读 issue | 直接推 `main` |
| 建分支 `ds/<编号>-<英文简述>` 并提交 | 强推、改写历史 |
| 开 Pull Request（仅当指令明确要求） | 删除分支/仓库 |
| 回帖（由脚本统一发） | 自己发评论（避免死循环） |

## 六、时间与重试

| 项 | 值 |
|---|---|
| 单次执行上限 | **20 分钟** |
| 超时处理 | 强制终止，回帖说明失败 |
| 重试次数 | **0 次**（失败即放弃，不回队） |

## 七、网络与传输

这台机器到 GitHub 的带宽只有 **20~30 KB/s**，所以：

- **禁止整库克隆**，也禁止下载整个仓库的压缩包（实测：57 MB 的仓库下 15 分钟只到 5 MB）
- 按需取单个文件：`/repos/<owner>/<repo>/contents/<path>`
- 单个文件超过 **5 MB** 不下载，任务确实依赖它时在结果里说明
- 改代码优先用 API 服务端提交（建 blob → tree → commit → 分支 ref），避免上传整个仓库

## 八、回帖

- 执行结束后，脚本把 agent 的最终输出自动贴到原帖下面
- 第一行固定为 `DeepSeek留言`
- 失败也会回帖，写明"共尝试 N 次，按设定不再重试"和错误摘要

## 九、日志与状态

全部在 `C:\Users\Admin\.dsh\ds-sentinel\`

| 文件 | 用途 | 轮转 |
|---|---|---|
| `sentinel.log` | 轮询记录、唤醒记录 | 3 个文件 × 2 MB 循环覆盖 |
| `worker.log` | 任务取用、执行结果、回帖结果 | 同上 |
| `state.json` | 水位线（各仓库 since 时间）+ 已处理编号 | 不轮转，保留 7 天 |
| `queue.jsonl` | 待执行队列 | 执行完即清空 |
| `run-*.log` | 每次执行的标准输出 | 保留 |

## 十、开机自启

- Windows 计划任务：`DSH-DeepSeek-Sentinel`
- 触发器：开机 + 用户登录
- 运行身份：当前用户，`Highest` 权限，**Interactive（仅登录时）**
- 异常退出：1 分钟后自动重启，最多 999 次
- 为什么不用"无论用户是否登录"：那样跑在服务会话，拿不到凭据管理器里的 GitHub 令牌，git 会认证失败

## 十一、已知限制

1. **电脑关机 / 注销登录就停**，不是 7×24
2. **没有任何记忆**，每次从头开始，上下文只来自帖子正文
3. **没有浏览器**，不能点网页、不能截图；需要渲染效果时只能试 headless Chrome，可能失败
4. **GitHub 线路不稳定**，间歇性断连或限速，大文件基本传不动
5. **无人值守**，跑起来没人盯着，出错只能事后看日志

## 十二、怎么停、怎么改

```powershell
# 停
Stop-ScheduledTask -TaskName "DSH-DeepSeek-Sentinel"

# 启动
Start-ScheduledTask -TaskName "DSH-DeepSeek-Sentinel"

# 彻底移除
Unregister-ScheduledTask -TaskName "DSH-DeepSeek-Sentinel" -Confirm:$false
```

配置文件：`C:\Users\Admin\.dsh\ds-sentinel\config.json`
改完要重启计划任务才生效。

## 十三、文件清单

| 文件 | 作用 |
|---|---|
| `config.json` | 全部可调参数 |
| `ds-sentinel.ps1` | 轮询主循环 |
| `ds-worker.ps1` | 取任务、起 headless、回帖 |
| `ds-api.ps1` | GitHub API 助手（读文件和写评论）|
| `apikey.txt` | DeepSeek API Key（仅当前用户和 SYSTEM 可读）|
