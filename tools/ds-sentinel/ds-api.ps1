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

$req = New-Object System.Net.Http.HttpRequestMessage($Method, $uri)
if ($Body) {
    $req.Content = New-Object System.Net.Http.StringContent($Body, [Text.Encoding]::UTF8, 'application/json')
}

$resp = $client.SendAsync($req).Result
$text = $resp.Content.ReadAsStringAsync().Result

if (-not $resp.IsSuccessStatusCode) {
    [Console]::Error.WriteLine("HTTP $([int]$resp.StatusCode) $($resp.ReasonPhrase)")
    [Console]::Error.WriteLine($text)
    exit 1
}

[Console]::Out.Write($text)
