# ds-api.ps1 - GitHub API helper for the DeepSeek sentinel and its workers.
# Usage:
#   powershell -File ds-api.ps1 GET  /repos/gcy2016/AI_Corp/issues/48
#   powershell -File ds-api.ps1 POST /repos/gcy2016/AI_Corp/issues/48/comments '{"body":"DeepSeek留言"}'
# Token comes from the Windows credential manager via `git credential fill`.
param(
    [ValidateSet('GET', 'POST', 'PATCH', 'PUT', 'DELETE')]
    [string]$Method = 'GET',
    [Parameter(Mandatory = $true)]
    [string]$Path,
    [string]$Body = '',
    [string]$BodyFile = ''
)

$ErrorActionPreference = 'Stop'
$Root = Split-Path -Parent $MyInvocation.MyCommand.Path
$Cfg = Get-Content (Join-Path $Root 'config.json') -Raw -Encoding UTF8 | ConvertFrom-Json

if ($BodyFile) {
    if (-not (Test-Path $BodyFile)) { [Console]::Error.WriteLine("body file not found: $BodyFile"); exit 1 }
    $Body = [IO.File]::ReadAllText($BodyFile, [Text.Encoding]::UTF8)
}

function Get-GitHubToken {
    $env:GIT_TERMINAL_PROMPT = '0'
    $env:GCM_INTERACTIVE = 'never'
    $lines = "protocol=https`nhost=github.com`n`n" | & $Cfg.gitExe credential fill 2>$null
    $tok = ($lines | Where-Object { $_ -like 'password=*' }) -replace '^password=', ''
    if (-not $tok) { throw 'no github credential found' }
    return $tok
}

$token = Get-GitHubToken

Add-Type -AssemblyName System.Net.Http
$client = New-Object System.Net.Http.HttpClient
[void]$client.DefaultRequestHeaders.Add('User-Agent', 'dsh-sentinel')
[void]$client.DefaultRequestHeaders.Add('Authorization', "Bearer $token")
$client.Timeout = [TimeSpan]::FromSeconds([int]$Cfg.apiTimeoutSeconds)

if ($Path -notmatch '^https?://') {
    $uri = if ($Path.StartsWith('/')) { "https://api.github.com$Path" } else { "https://api.github.com/$Path" }
} else {
    $uri = $Path
}

# 线路丢包严重（实测同一 IP 连测 6 次只有 1 次成功），所以网络失败要重试
$attempt = 0
$maxAttempts = [Math]::Max(1, [int]$Cfg.httpRetryCount)
$delay = [int]$Cfg.httpRetryDelaySeconds
$resp = $null
$text = ''

while ($attempt -lt $maxAttempts) {
    $attempt++
    try {
        $req = New-Object System.Net.Http.HttpRequestMessage($Method, $uri)
        if ($Body) {
            $req.Content = New-Object System.Net.Http.StringContent($Body, [Text.Encoding]::UTF8, 'application/json')
        }
        $resp = $client.SendAsync($req).Result
        $text = $resp.Content.ReadAsStringAsync().Result
        if ($resp.IsSuccessStatusCode) { break }
        $code = [int]$resp.StatusCode
        # 4xx（除 429）是请求本身的问题，重试没用
        if ($code -ge 400 -and $code -lt 500 -and $code -ne 429) { break }
    } catch {
        $resp = $null
        $text = ''
    }
    if ($attempt -lt $maxAttempts) { Start-Sleep -Seconds $delay }
}

if ($null -eq $resp) {
    [Console]::Error.WriteLine("network failure after $attempt attempt(s)")
    exit 2
}

if (-not $resp.IsSuccessStatusCode) {
    [Console]::Error.WriteLine("HTTP $([int]$resp.StatusCode) $($resp.ReasonPhrase) after $attempt attempt(s)")
    [Console]::Error.WriteLine($text)
    exit 1
}

[Console]::Out.Write($text)
