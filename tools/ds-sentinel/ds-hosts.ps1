# ds-hosts.ps1 - keeps the github.com hosts pin usable.
#   -Check   : test the current pin; if dead, probe candidates once, rewrite hosts, flush DNS
#   -Status  : print the current pin and whether it answers
#   -Reset   : clear the backoff marker and force a probe next time
# Requires admin (the scheduled task runs with Highest).
param(
    [switch]$Check,
    [switch]$Status,
    [switch]$Reset
)

$ErrorActionPreference = 'Stop'
$Root = Split-Path -Parent $MyInvocation.MyCommand.Path
$Cfg = Get-Content (Join-Path $Root 'config.json') -Raw -Encoding UTF8 | ConvertFrom-Json

$HostsFile = "$env:SystemRoot\System32\drivers\etc\hosts"
$LogPath = Join-Path $Root 'hosts.log'
$BackoffFile = Join-Path $Root 'hosts-backoff.txt'
$Marker = '# ds-sentinel: github.com pin'

function Write-Log {
    param([string]$Level, [string]$Message)
    try {
        if ((Test-Path $LogPath) -and ((Get-Item $LogPath).Length -ge [int]$Cfg.logMaxBytes)) {
            $arch = Join-Path $Root ("hosts-" + (Get-Date -Format 'yyyyMMdd-HHmmss') + ".log")
            Move-Item $LogPath $arch -Force -ErrorAction SilentlyContinue
            $cut = (Get-Date).AddDays(-1 * [int]$Cfg.logRetainDays)
            $old = @(Get-ChildItem $Root -Filter 'hosts-*.log' -ErrorAction SilentlyContinue | Sort-Object LastWriteTime -Descending)
            if ($old.Count -gt [int]$Cfg.logMaxFiles) { $old | Select-Object -Skip ([int]$Cfg.logMaxFiles) | Remove-Item -Force -ErrorAction SilentlyContinue }
            Get-ChildItem $Root -Filter 'hosts-*.log' -ErrorAction SilentlyContinue | Where-Object { $_.LastWriteTime -lt $cut } | Remove-Item -Force -ErrorAction SilentlyContinue
        }
        Add-Content -Path $LogPath -Value ("{0} [{1}] {2}" -f (Get-Date -Format 'yyyy-MM-dd HH:mm:ss'), $Level, $Message) -Encoding UTF8
    } catch { }
}

function Get-CurrentPin {
    $line = Get-Content $HostsFile -ErrorAction SilentlyContinue |
        Where-Object { $_ -match '^\s*\d+\.\d+\.\d+\.\d+\s+github\.com\s*$' } |
        Select-Object -First 1
    if ($line) { return ($line.Trim() -split '\s+')[0] }
    return ''
}

# 真实可用 = TCP 能通 + TLS 握手成功 + 能把一个 HTTP 响应头读回来
function Test-Ip {
    param([string]$Ip)
    if (-not $Ip) { return $false }
    $client = New-Object Net.Sockets.TcpClient
    try {
        $ar = $client.BeginConnect($Ip, 443, $null, $null)
        if (-not $ar.AsyncWaitHandle.WaitOne([int]$Cfg.hostsProbeTimeoutSeconds * 1000)) { return $false }
        if (-not $client.Connected) { return $false }

        $ssl = New-Object Net.Security.SslStream($client.GetStream(), $false)
        $ssl.ReadTimeout = [int]$Cfg.hostsProbeTimeoutSeconds * 1000
        $ssl.WriteTimeout = [int]$Cfg.hostsProbeTimeoutSeconds * 1000
        $ssl.AuthenticateAsClient('github.com')

        $req = "GET /robots.txt HTTP/1.1`r`nHost: github.com`r`nUser-Agent: ds-sentinel`r`nConnection: close`r`n`r`n"
        $ssl.Write([Text.Encoding]::ASCII.GetBytes($req))

        $buf = New-Object byte[] 256
        $n = $ssl.Read($buf, 0, $buf.Length)
        if ($n -le 0) { return $false }
        $head = [Text.Encoding]::ASCII.GetString($buf, 0, $n)
        return ($head -match '^HTTP/1\.[01] 200')
    } catch {
        return $false
    } finally {
        try { $client.Close() } catch { }
    }
}

function Set-Pin {
    param([string]$Ip)
    $lines = @(Get-Content $HostsFile -ErrorAction SilentlyContinue)
    $kept = $lines | Where-Object {
        $_ -notmatch '^\s*\d+\.\d+\.\d+\.\d+\s+(www\.)?github\.com\s*$' -and
        $_ -notmatch [regex]::Escape($Marker)
    }
    $block = @(
        ("$Marker (auto-managed, do not edit by hand)"),
        ("$Ip github.com"),
        ("$Ip www.github.com")
    )
    $out = @($kept) + $block
    [IO.File]::WriteAllLines($HostsFile, $out, (New-Object Text.UTF8Encoding($false)))
    ipconfig /flushdns | Out-Null
}

$current = Get-CurrentPin

if ($Reset) {
    Remove-Item $BackoffFile -Force -ErrorAction SilentlyContinue
    "backoff cleared"
    exit 0
}

if ($Status) {
    $until = ''
    if (Test-Path $BackoffFile) { $until = (Get-Content $BackoffFile -Raw).Trim() }
    "current pin: $current"
    "reachable: $(Test-Ip $current)"
    "backoff until: $(if($until){$until}else{'none'})"
    exit 0
}

if (-not $Check) {
    "usage: ds-hosts.ps1 -Check | -Status | -Reset"
    exit 1
}

# 全部失效时退避，避免每分钟空转几十秒
if (Test-Path $BackoffFile) {
    $raw = (Get-Content $BackoffFile -Raw).Trim()
    if ($raw) {
        $until = [datetime]::MinValue
        if ([datetime]::TryParse($raw, [ref]$until) -and (Get-Date) -lt $until) { exit 0 }
    }
}

# 连续两次都失败才判定失效，避免偶发抖动导致换 IP
if ((Test-Ip $current) -or (Test-Ip $current)) {
    Remove-Item $BackoffFile -Force -ErrorAction SilentlyContinue
    exit 0
}

Write-Log 'WARN' "pin '$current' is dead, probing candidates"

# 第一个能用的就用，不再全量探测
$best = $null
foreach ($ip in @($Cfg.githubHostsCandidates)) {
    if ($ip -eq $current) { continue }
    if (Test-Ip $ip) { $best = $ip; break }
}

if (-not $best) {
    $until = (Get-Date).AddMinutes([int]$Cfg.hostsBackoffMinutes)
    [IO.File]::WriteAllText($BackoffFile, $until.ToString('o'), (New-Object Text.UTF8Encoding($false)))
    Write-Log 'ERROR' "no candidate reachable, backing off until $($until.ToString('HH:mm'))"
    exit 2
}

try {
    Set-Pin $best
    Remove-Item $BackoffFile -Force -ErrorAction SilentlyContinue
    Write-Log 'INFO' "pin rotated: '$current' -> $best"
    "rotated: $current -> $best"
} catch {
    Write-Log 'ERROR' "failed to write hosts: $($_.Exception.Message)"
    exit 3
}
