# ds-sentinel.ps1 - 10s poller that watches GitHub for /ds requests.
# Polling uses ETag conditional requests: a 304 Not Modified costs no API quota.
# On a real hit it appends a task to queue.jsonl and starts ds-worker.ps1.
$ErrorActionPreference = 'Stop'
$Root = Split-Path -Parent $MyInvocation.MyCommand.Path
$Cfg = Get-Content (Join-Path $Root 'config.json') -Raw -Encoding UTF8 | ConvertFrom-Json

$StatePath = Join-Path $Root 'state.json'
$QueuePath = Join-Path $Root 'queue.jsonl'
$LockPath = Join-Path $Root 'worker.lock'
$LogPath = Join-Path $Root 'sentinel.log'

function Write-Log {
    param([string]$Level, [string]$Message)
    try {
        # 超过大小就按时间戳归档，再按天数/数量清理旧档（不再覆盖）
        if ((Test-Path $LogPath) -and ((Get-Item $LogPath).Length -ge [int]$Cfg.logMaxBytes)) {
            $arch = Join-Path $Root ("sentinel-" + (Get-Date -Format 'yyyyMMdd-HHmmss') + ".log")
            Move-Item $LogPath $arch -Force -ErrorAction SilentlyContinue
            $cut = (Get-Date).AddDays(-1 * [int]$Cfg.logRetainDays)
            $old = @(Get-ChildItem $Root -Filter 'sentinel-*.log' -ErrorAction SilentlyContinue | Sort-Object LastWriteTime -Descending)
            if ($old.Count -gt [int]$Cfg.logMaxFiles) { $old | Select-Object -Skip ([int]$Cfg.logMaxFiles) | Remove-Item -Force -ErrorAction SilentlyContinue }
            Get-ChildItem $Root -Filter 'sentinel-*.log' -ErrorAction SilentlyContinue | Where-Object { $_.LastWriteTime -lt $cut } | Remove-Item -Force -ErrorAction SilentlyContinue
        }
        $line = "{0} [{1}] {2}" -f (Get-Date -Format 'yyyy-MM-dd HH:mm:ss'), $Level, $Message
        Add-Content -Path $LogPath -Value $line -Encoding UTF8
    } catch { }
}

# ---------- state ----------
function Load-State {
    if (Test-Path $StatePath) {
        try {
            $raw = Get-Content $StatePath -Raw -Encoding UTF8 | ConvertFrom-Json
            $s = @{ repos = @{}; processed = @{} }
            if ($raw.repos) {
                foreach ($p in $raw.repos.PSObject.Properties) {
                    $s.repos[$p.Name] = @{
                        commentsSince = $p.Value.commentsSince
                        issuesSince = $p.Value.issuesSince
                        etagC = $p.Value.etagC
                        etagI = $p.Value.etagI
                    }
                }
            }
            if ($raw.processed) {
                foreach ($p in $raw.processed.PSObject.Properties) { $s.processed[$p.Name] = $p.Value }
            }
            return $s
        } catch { Write-Log 'WARN' "state unreadable, starting fresh: $($_.Exception.Message)" }
    }
    return @{ repos = @{}; processed = @{} }
}

function Save-State {
    try {
        $cut = (Get-Date).ToUniversalTime().AddDays(-7).ToString('yyyy-MM-ddTHH:mm:ssZ')
        foreach ($k in @($state.processed.Keys)) {
            if ($state.processed[$k] -lt $cut) { $state.processed.Remove($k) }
        }
        $state | ConvertTo-Json -Depth 8 | Set-Content $StatePath -Encoding UTF8
    } catch { Write-Log 'WARN' "state save failed: $($_.Exception.Message)" }
}

$state = Load-State

# ---------- auth / http ----------
function Get-Token {
    $env:GIT_TERMINAL_PROMPT = '0'
    $env:GCM_INTERACTIVE = 'never'
    $lines = "protocol=https`nhost=github.com`n`n" | & $Cfg.gitExe credential fill 2>$null
    return (($lines | Where-Object { $_ -like 'password=*' }) -replace '^password=', '')
}

Add-Type -AssemblyName System.Net.Http
$script:token = Get-Token
if (-not $script:token) { throw 'no github credential' }

function New-Client {
    $c = New-Object System.Net.Http.HttpClient
    [void]$c.DefaultRequestHeaders.Add('User-Agent', 'dsh-sentinel')
    [void]$c.DefaultRequestHeaders.Add('Authorization', "Bearer $($script:token)")
    $c.Timeout = [TimeSpan]::FromSeconds([int]$Cfg.apiTimeoutSeconds)
    return $c
}
$script:client = New-Client
$script:tokenBorn = Get-Date

function Get-Api {
    param([string]$Path, [string]$ETag)
    try {
        if (((Get-Date) - $script:tokenBorn).TotalHours -ge 6) {
            $script:token = Get-Token
            $script:client = New-Client
            $script:tokenBorn = Get-Date
        }
        $uri = if ($Path.StartsWith('/')) { "https://api.github.com$Path" } else { "https://api.github.com/$Path" }
        $req = New-Object System.Net.Http.HttpRequestMessage('GET', $uri)
        if ($ETag) { [void]$req.Headers.TryAddWithoutValidation('If-None-Match', $ETag) }
        $resp = $script:client.SendAsync($req).Result
        $code = [int]$resp.StatusCode
        if ($code -eq 304) { return @{ NotModified = $true; ETag = $ETag; Remaining = $null } }
        if ($code -eq 403 -or $code -eq 429) {
            $rem = $resp.Headers.GetValues('X-RateLimit-Remaining')[0]
            return @{ NotModified = $false; RateLimited = $true; Remaining = $rem }
        }
        if (-not $resp.IsSuccessStatusCode) { throw "HTTP $code on $Path" }
        $json = $resp.Content.ReadAsStringAsync().Result | ConvertFrom-Json
        $newTag = $null
        if ($resp.Headers.ETag) { $newTag = $resp.Headers.ETag.Tag }
        $rem = $null
        try { $rem = $resp.Headers.GetValues('X-RateLimit-Remaining')[0] } catch { }
        return @{ NotModified = $false; Data = $json; ETag = $newTag; Remaining = $rem }
    } catch {
        Write-Log 'WARN' "api error: $($_.Exception.Message)"
        return @{ Error = $true }
    }
}

# ---------- trigger detection ----------
function Get-ContentLine {
    param([string]$Body)
    if (-not $Body) { return '' }
    foreach ($raw in ($Body -split "`r?`n")) {
        $t = $raw.Trim()
        if ($t -eq '') { continue }
        # signature lines: short lines ending in 留言 that are not commands
        if ($t -notmatch '^/' -and $t.Length -le 14 -and $t -match '留言$') { continue }
        if ($t -match '^署名[:：]') { continue }
        if ($t -match '^回复\s*#') { continue }
        if ($t -match '^>') { continue }
        if ($t -match '^```') { continue }
        return $t
    }
    return ''
}

function Test-Trigger {
    param([string]$Body)
    $first = Get-ContentLine $Body
    if (-not $first) { return $null }
    $trig = [string]$Cfg.trigger
    if ($first -ieq $trig) { return '' }
    if ($first.Length -gt $trig.Length -and $first.Substring(0, $trig.Length) -ieq $trig) {
        $next = $first.Substring($trig.Length, 1)
        # 允许：空白、冒号、逗号，或直接接中文（/ds干活）；不允许直接接英文字母（/dsfoo）
        if ($next -match '[\s:：,，]' -or $next -match '[^\x00-\x7F]') {
            return $first.Substring($trig.Length).TrimStart([char[]]@(' ', ':', '：', ',', '，'))
        }
    }
    return $null
}

function Test-Self {
    param([string]$Body)
    if (-not $Body) { return $false }
    # 必须看原始第一行：Get-ContentLine 会把署名行跳过，用它永远判不出自己
    $raw = (($Body -split "`r?`n") | Where-Object { $_.Trim() } | Select-Object -First 1)
    if (-not $raw) { return $false }
    return ($raw.Trim() -ieq [string]$Cfg.signature)
}

function Add-Task {
    param($Repo, $Kind, $Number, $Url, $Body, $Id, $Author)
    $task = [ordered]@{
        id      = $Id
        repo    = $Repo
        kind    = $Kind
        number  = $Number
        url     = $Url
        body    = $Body
        author  = $Author
        queued  = (Get-Date).ToUniversalTime().ToString('yyyy-MM-ddTHH:mm:ssZ')
        attempts = 0
    }
    ($task | ConvertTo-Json -Compress -Depth 4) | Add-Content -Path $QueuePath -Encoding UTF8
    Write-Log 'HIT' "$Id -> queued ($Repo #$Number)"
}

# ---------- worker ----------
function Ensure-Worker {
    $busy = $false
    if (Test-Path $LockPath) {
        $wp = (Get-Content $LockPath -Raw -ErrorAction SilentlyContinue)
        if ($wp) {
            $wp = $wp.Trim()
            if ($wp -match '^\d+$' -and (Get-Process -Id ([int]$wp) -ErrorAction SilentlyContinue)) { $busy = $true }
        }
        if (-not $busy) { Remove-Item $LockPath -Force -ErrorAction SilentlyContinue }
    }
    if ($busy) { return }

    $pending = @()
    if (Test-Path $QueuePath) {
        $pending = @(Get-Content $QueuePath -Encoding UTF8 -ErrorAction SilentlyContinue | Where-Object { $_.Trim() -ne '' })
    }
    $outbox = @()
    $OutboxPath = Join-Path $Root 'outbox.jsonl'
    if (Test-Path $OutboxPath) {
        $outbox = @(Get-Content $OutboxPath -Encoding UTF8 -ErrorAction SilentlyContinue | Where-Object { $_.Trim() -ne '' })
    }
    # 队列为空但 outbox 有积压时也要起 worker，否则限额恢复后没人补发
    if ($pending.Count -eq 0 -and $outbox.Count -eq 0) { return }
    Start-Process -FilePath 'powershell.exe' `
        -ArgumentList @('-NoProfile', '-ExecutionPolicy', 'Bypass', '-File', (Join-Path $Root 'ds-worker.ps1')) `
        -WindowStyle Hidden
    Write-Log 'INFO' 'worker started'
}

# ---------- poll ----------
function Poll-Repo {
    param([string]$Repo)
    $st = $state.repos[$Repo]
    $now = (Get-Date).ToUniversalTime()
    if (-not $st) {
        $st = @{
            commentsSince = $now.AddMinutes(-2).ToString('yyyy-MM-ddTHH:mm:ssZ')
            issuesSince   = $now.AddMinutes(-2).ToString('yyyy-MM-ddTHH:mm:ssZ')
            etagC         = ''
            etagI         = ''
        }
        $state.repos[$Repo] = $st
    }

    # --- comments ---
    $q = "/repos/$Repo/issues/comments?per_page=100&sort=created&direction=asc&since=$($st.commentsSince)"
    $r = Get-Api -Path $q -ETag $st.etagC
    if ($r.RateLimited) { Write-Log 'WARN' "rate limited (remaining=$($r.Remaining))"; return $false }
    if (-not $r.Error -and -not $r.NotModified) {
        if ($r.ETag) { $st.etagC = $r.ETag }
        foreach ($c in @($r.Data)) {
            $id = "comment:$($c.id)"
            if ($state.processed.ContainsKey($id)) { continue }
            if (Test-Self $c.body) { $state.processed[$id] = $now.ToString('yyyy-MM-ddTHH:mm:ssZ'); continue }
            $instr = Test-Trigger $c.body
            if ($null -ne $instr) {
                $num = [int](($c.issue_url -split '/')[-1])
                Add-Task -Repo $Repo -Kind 'comment' -Number $num -Url $c.html_url -Body $c.body -Id $id -Author $c.user.login
                $state.processed[$id] = $now.ToString('yyyy-MM-ddTHH:mm:ssZ')
            } else {
                $state.processed[$id] = $now.ToString('yyyy-MM-ddTHH:mm:ssZ')
            }
        }
        $st.commentsSince = $now.AddMinutes(-1).ToString('yyyy-MM-ddTHH:mm:ssZ')
        Save-State
    }

    # --- new issues only ---
    $q2 = "/repos/$Repo/issues?state=all&per_page=100&sort=created&direction=asc&since=$($st.issuesSince)"
    $r2 = Get-Api -Path $q2 -ETag $st.etagI
    if ($r2.RateLimited) { return $false }
    if (-not $r2.Error -and -not $r2.NotModified) {
        if ($r2.ETag) { $st.etagI = $r2.ETag }
        foreach ($i in @($r2.Data)) {
            if ($i.pull_request) { continue }
            if ($i.created_at -lt $st.issuesSince) { continue }
            $id = "issue:$($i.number)"
            if ($state.processed.ContainsKey($id)) { continue }
            if (Test-Self $i.body) { $state.processed[$id] = $now.ToString('yyyy-MM-ddTHH:mm:ssZ'); continue }
            $instr = Test-Trigger $i.body
            if ($null -ne $instr) {
                Add-Task -Repo $Repo -Kind 'issue' -Number $i.number -Url $i.html_url -Body $i.body -Id $id -Author $i.user.login
            }
            $state.processed[$id] = $now.ToString('yyyy-MM-ddTHH:mm:ssZ')
        }
        $st.issuesSince = $now.AddMinutes(-1).ToString('yyyy-MM-ddTHH:mm:ssZ')
        Save-State
    }
    return $true
}

# ---------- main ----------
Write-Log 'INFO' "sentinel started, pid=$PID, poll=$($Cfg.pollSeconds)s, repos=$($Cfg.repos -join ',')"

# 上次跑到一半被重启/关机打断的任务：重新入队，attempts+1
# worker 会发现 attempts 已达上限，于是只回帖说明「被中断」，不再重跑
$curPath = Join-Path $Root 'current.json'
if (Test-Path $curPath) {
    try {
        $stuck = Get-Content $curPath -Raw -Encoding UTF8 | ConvertFrom-Json
        $stuck.attempts = [int]$stuck.attempts + 1
        ($stuck | ConvertTo-Json -Compress -Depth 4) | Add-Content -Path $QueuePath -Encoding UTF8
        Write-Log 'WARN' "recovered interrupted task $($stuck.id), attempts=$($stuck.attempts)"
    } catch {
        Write-Log 'ERROR' "inflight recovery failed: $($_.Exception.Message)"
    }
    Remove-Item $curPath -Force -ErrorAction SilentlyContinue
}

$lastHostCheck = [datetime]::MinValue

while ($true) {
    $ok = $true
    foreach ($repo in $Cfg.repos) {
        try {
            $r = Poll-Repo -Repo $repo
            if ($r -eq $false) { $ok = $false }
        } catch {
            Write-Log 'ERROR' "poll $repo failed: $($_.Exception.Message)"
            $ok = $false
        }
    }
    try { Ensure-Worker } catch { Write-Log 'ERROR' "worker start failed: $($_.Exception.Message)" }

    # github.com 的 hosts 体检。
    # 默认关闭（hostsAutoCheck=false）：实测线路是"随机丢包"（同一 IP 连测 6 次只成功 1 次），
    # 换 IP 治不了，反而增加抖动。需要时手动跑 ds-hosts.ps1 -Check。
    try {
        if ([bool]$Cfg.hostsAutoCheck -and ((Get-Date) - $lastHostCheck).TotalSeconds -ge [int]$Cfg.githubHostsCheckSeconds) {
            $lastHostCheck = Get-Date
            Start-Process -FilePath 'powershell.exe' `
                -ArgumentList @('-NoProfile', '-ExecutionPolicy', 'Bypass', '-File', (Join-Path $Root 'ds-hosts.ps1'), '-Check') `
                -WindowStyle Hidden
        }
    } catch {
        Write-Log 'WARN' "hosts check failed: $($_.Exception.Message)"
    }

    $sleep = [int]$Cfg.pollSeconds
    if (-not $ok) { $sleep = [Math]::Max($sleep, 60) }
    Start-Sleep -Seconds $sleep
}
