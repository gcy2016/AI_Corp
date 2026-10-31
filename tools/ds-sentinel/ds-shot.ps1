# ds-shot.ps1 - render a page to PNG with the installed Chrome (headless + swiftshader).
# Works for file:// pages (local repo copies) and http(s):// pages.
# Usage:
#   powershell -File ds-shot.ps1 -Url "file:///C:/path/house.html" -Out "C:\tmp\house.png"
#   powershell -File ds-shot.ps1 -Url "file:///C:/x/a.html" -Out "C:\tmp\a.png" -Width 1280 -Height 800 -WaitMs 6000
param(
    [Parameter(Mandatory = $true)][string]$Url,
    [Parameter(Mandatory = $true)][string]$Out,
    [int]$Width = 1280,
    [int]$Height = 800,
    [int]$WaitMs = 5000
)

$ErrorActionPreference = 'Stop'

$chromeCandidates = @(
    "$env:ProgramFiles\Google\Chrome\Application\chrome.exe",
    "${env:ProgramFiles(x86)}\Google\Chrome\Application\chrome.exe",
    "$env:LOCALAPPDATA\Google\Chrome\Application\chrome.exe",
    "$env:ProgramFiles\Microsoft\Edge\Application\msedge.exe"
)
$chrome = $chromeCandidates | Where-Object { Test-Path $_ } | Select-Object -First 1
if (-not $chrome) { Write-Error "no chrome/edge found"; exit 1 }

$Out = [IO.Path]::GetFullPath($Out)
$dir = Split-Path -Parent $Out
if (-not (Test-Path $dir)) { New-Item -ItemType Directory -Path $dir -Force | Out-Null }
Remove-Item $Out -Force -ErrorAction SilentlyContinue

# 单独的临时配置目录，避免和用户正在用的 Chrome 抢锁
$profile = Join-Path $env:TEMP ("ds-shot-" + [guid]::NewGuid().ToString('N').Substring(0, 8))

$args = @(
    '--headless=new',
    '--disable-gpu',
    '--enable-unsafe-swiftshader',   # 没有显卡也能跑 WebGL
    '--hide-scrollbars',
    '--no-first-run',
    '--no-default-browser-check',
    '--disable-extensions',
    '--allow-file-access-from-files',
    "--user-data-dir=$profile",
    "--window-size=$Width,$Height",
    "--virtual-time-budget=$WaitMs",
    "--screenshot=$Out",
    $Url
)

$sw = [Diagnostics.Stopwatch]::StartNew()
$p = Start-Process -FilePath $chrome -ArgumentList $args -PassThru -Wait -WindowStyle Hidden
$sw.Stop()
try { Remove-Item $profile -Recurse -Force -ErrorAction SilentlyContinue } catch { }

if (-not (Test-Path $Out)) {
    Write-Error "screenshot not produced (chrome exit $($p.ExitCode))"
    exit 2
}

$size = (Get-Item $Out).Length
if ($size -lt 1024) {
    Write-Error "screenshot looks empty ($size bytes)"
    exit 3
}

"saved: $Out ({0:N0} KB, {1:N1}s)" -f ($size / 1KB), $sw.Elapsed.TotalSeconds
