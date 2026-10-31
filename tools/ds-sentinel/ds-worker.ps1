# ds-worker.ps1 - takes one queued /ds task and runs it in a fresh headless DSH session.
# Started by ds-sentinel.ps1 only when the queue is non-empty and no other worker holds the lock.
$ErrorActionPreference = 'Stop'
$Root = Split-Path -Parent $MyInvocation.MyCommand.Path
$Cfg = Get-Content (Join-Path $Root 'config.json') -Raw -Encoding UTF8 | ConvertFrom-Json

$QueuePath = Join-Path $Root 'queue.jsonl'
$LockPath = Join-Path $Root 'worker.lock'
$LogPath = Join-Path $Root 'worker.log'
$CurrentPath = Join-Path $Root 'current.json'
$OutboxPath = Join-Path $Root 'outbox.jsonl'

function Write-Log {
    param([string]$Level, [string]$Message)
    try {
        # 超过大小就按时间戳归档，再按天数/数量清理旧档（不再覆盖）
        if ((Test-Path $LogPath) -and ((Get-Item $LogPath).Length -ge [int]$Cfg.logMaxBytes)) {
            $arch = Join-Path $Root ("worker-" + (Get-Date -Format 'yyyyMMdd-HHmmss') + ".log")
            Move-Item $LogPath $arch -Force -ErrorAction SilentlyContinue
            $cut = (Get-Date).AddDays(-1 * [int]$Cfg.logRetainDays)
            $old = @(Get-ChildItem $Root -Filter 'worker-*.log' -ErrorAction SilentlyContinue | Sort-Object LastWriteTime -Descending)
            if ($old.Count -gt [int]$Cfg.logMaxFiles) { $old | Select-Object -Skip ([int]$Cfg.logMaxFiles) | Remove-Item -Force -ErrorAction SilentlyContinue }
            Get-ChildItem $Root -Filter 'worker-*.log' -ErrorAction SilentlyContinue | Where-Object { $_.LastWriteTime -lt $cut } | Remove-Item -Force -ErrorAction SilentlyContinue
        }
        $line = "{0} [{1}] {2}" -f (Get-Date -Format 'yyyy-MM-dd HH:mm:ss'), $Level, $Message
        Add-Content -Path $LogPath -Value $line -Encoding UTF8
    } catch { }
}

function Get-DisplayName {
    param($Author, $Body)
    $first = ''
    if ($Body) { $first = (($Body -split "`r?`n") | Where-Object { $_.Trim() } | Select-Object -First 1) }
    if ($first -eq '噜噜小兵留言') { return '噜噜小兵' }
    if ($first -eq '噜噜大王留言') { return '噜噜大王' }
    if ($Author -and $Cfg.memberNames) {
        $p = $Cfg.memberNames.PSObject.Properties[$Author]
        if ($p -and $p.Value) { return $p.Value }
    }
    if ($Author) { return $Author }
    return '用户'
}

# 发帖限流：每日上限 + 最小间隔，防止逻辑出错把账号刷成垃圾号
function Get-PostLimits {
    $f = Join-Path $Root 'post-limits.json'
    $today = (Get-Date).ToString('yyyy-MM-dd')
    $st = @{ day = $today; count = 0; last = '' }
    if (Test-Path $f) {
        try {
            $j = Get-Content $f -Raw -Encoding UTF8 | ConvertFrom-Json
            if ($j.day -eq $today) { $st.count = [int]$j.count; $st.last = [string]$j.last }
        } catch { }
    }
    return $st
}

function Save-PostLimits($st) {
    try { $st | ConvertTo-Json -Compress | Set-Content -Path (Join-Path $Root 'post-limits.json') -Encoding UTF8 } catch { }
}

function Wait-PostSlot {
    $st = Get-PostLimits
    if ($st.count -ge [int]$Cfg.maxPostsPerDay) {
        Write-Log 'WARN' "daily post limit reached ($($st.count)/$($Cfg.maxPostsPerDay)), refusing to post"
        return $null
    }
    if ($st.last) {
        $last = [datetime]::MinValue
        if ([datetime]::TryParse($st.last, [ref]$last)) {
            $gap = ((Get-Date) - $last).TotalSeconds
            if ($gap -lt [int]$Cfg.minSecondsBetweenPosts) {
                $wait = [int][math]::Ceiling([int]$Cfg.minSecondsBetweenPosts - $gap)
                if ($wait -gt 0) {
                    Write-Log 'INFO' "post throttle: waiting ${wait}s"
                    Start-Sleep -Seconds $wait
                }
            }
        }
    }
    return $st
}

function Build-Post {
    param($Task, [string]$Text)
    if (-not $Text) { $Text = '（无输出）' }
    if (@($Cfg.issueReplyRepos) -contains $Task.repo) {
        $display = Get-DisplayName -Author $Task.author -Body $Task.body
        $prefix = [string]$Cfg.boardTitlePrefix
        $title = "$prefix $($Cfg.boardDisplayName)：回复 #$($Task.number)（$display）"
        $body = "$($Cfg.signature)`n`n回复 #$($Task.number)（$display）：`n`n$Text"
        $json = @{ title = $title; body = $body } | ConvertTo-Json -Compress -Depth 3
        $endpoint = "/repos/$($Task.repo)/issues"
    } else {
        $body = "$($Cfg.signature)`n`n$Text"
        $json = @{ body = $body } | ConvertTo-Json -Compress -Depth 3
        $endpoint = "/repos/$($Task.repo)/issues/$($Task.number)/comments"
    }
    return @{ endpoint = $endpoint; json = $json; label = "$($Task.repo)#$($Task.number)" }
}

function Send-Post {
    param([string]$Endpoint, [string]$Json, [string]$Tag)
    try {
        $api = Join-Path $Root 'ds-api.ps1'
        $bodyFile = Join-Path $Root ("reply-" + ($Tag -replace '[:/#]', '-') + ".json")
        [IO.File]::WriteAllText($bodyFile, $Json, (New-Object Text.UTF8Encoding($false)))
        $resp = & powershell.exe -NoProfile -ExecutionPolicy Bypass -File $api POST $Endpoint -BodyFile $bodyFile 2>&1
        if ($LASTEXITCODE -eq 0) { return $true }
        Write-Log 'ERROR' "post failed ($Tag): $($resp -join ' ')"
        return $false
    } catch {
        Write-Log 'ERROR' "post error ($Tag): $($_.Exception.Message)"
        return $false
    }
}

# 超出限额时不丢掉结果：写进 outbox，等下一次有额度再发
function Add-Outbox {
    param($Post, [string]$Tag)
    try {
        $entry = @{ endpoint = $Post.endpoint; json = $Post.json; tag = $Tag; at = (Get-Date).ToString('o') }
        ($entry | ConvertTo-Json -Compress -Depth 3) | Add-Content -Path $OutboxPath -Encoding UTF8
        Write-Log 'WARN' "daily limit hit, deferred $Tag to outbox"
    } catch { }
}

function Flush-Outbox {
    if (-not (Test-Path $OutboxPath)) { return }
    $lines = @(Get-Content $OutboxPath -Encoding UTF8 -ErrorAction SilentlyContinue | Where-Object { $_.Trim() -ne '' })
    if ($lines.Count -eq 0) { return }
    $remaining = @()
    foreach ($ln in $lines) {
        try { $e = $ln | ConvertFrom-Json } catch { continue }
        $limits = Wait-PostSlot
        if ($null -eq $limits) { $remaining += $ln; continue }
        if (Send-Post -Endpoint $e.endpoint -Json $e.json -Tag $e.tag) {
            $limits.count = [int]$limits.count + 1
            $limits.last = (Get-Date).ToString('o')
            Save-PostLimits $limits
            Write-Log 'INFO' "outbox delivered $($e.tag)"
        } else {
            $remaining += $ln
        }
    }
    if ($remaining.Count -gt 0) { Set-Content -Path $OutboxPath -Value ($remaining -join "`r`n") -Encoding UTF8 }
    else { Remove-Item $OutboxPath -Force -ErrorAction SilentlyContinue }
}

function Post-Reply {
    param($Task, [string]$Text)
    try {
        $post = Build-Post -Task $Task -Text $Text
        $limits = Wait-PostSlot
        if ($null -eq $limits) {
            Add-Outbox -Post $post -Tag $Task.id
            return
        }
        if (-not (Send-Post -Endpoint $post.endpoint -Json $post.json -Tag $Task.id)) { return }
        $limits.count = [int]$limits.count + 1
        $limits.last = (Get-Date).ToString('o')
        Save-PostLimits $limits
        Write-Log 'INFO' "replied to $($post.label) via $($post.endpoint) (today: $($limits.count)/$($Cfg.maxPostsPerDay))"
    } catch {
        Write-Log 'ERROR' "reply error: $($_.Exception.Message)"
    }
}

Set-Content -Path $LockPath -Value $PID -Encoding ASCII
$task = $null

try {
    # 先补发 outbox 里积压的（即使当前没有新任务也要补）
    try { Flush-Outbox } catch { Write-Log 'WARN' "outbox flush failed: $($_.Exception.Message)" }

    if (-not (Test-Path $QueuePath)) { exit }
    $lines = @(Get-Content $QueuePath -Encoding UTF8 | Where-Object { $_.Trim() -ne '' })
    if ($lines.Count -eq 0) { exit }

    $task = $lines[0] | ConvertFrom-Json
    $rest = @()
    if ($lines.Count -gt 1) { $rest = $lines[1..($lines.Count - 1)] }
    Set-Content -Path $QueuePath -Value ($rest -join "`r`n") -Encoding UTF8

    Write-Log 'INFO' "picked $($task.id) ($($task.repo) #$($task.number)), attempt $($task.attempts + 1)"

    # 上次执行被中断过（attempts 已用完）：不再重跑，只回帖说明
    if ([int]$task.attempts -ge [int]$Cfg.maxAttempts) {
        Write-Log 'WARN' "$($task.id) was interrupted before; reporting and skipping"
        Post-Reply $task "上次执行在跑到一半时被中断（重启或关机），按设定不自动重试。请重新发一条 /ds 触发。"
        exit
    }

    # 记录正在跑的任务，供重启后恢复识别
    try { ($task | ConvertTo-Json -Compress -Depth 4) | Set-Content -Path $CurrentPath -Encoding UTF8 } catch { }

    # 运行产生的临时文件只保留最近 N 份，避免无限堆积
    try {
        $keep = [int]$Cfg.runLogKeep
        if ($keep -gt 0) {
            foreach ($pat in @('run-*.log', 'task-*.txt', 'reply-*.json')) {
                $items = @(Get-ChildItem $Root -Filter $pat -ErrorAction SilentlyContinue | Sort-Object LastWriteTime -Descending)
                if ($items.Count -gt $keep) {
                    $items | Select-Object -Skip $keep | Remove-Item -Force -ErrorAction SilentlyContinue
                }
            }
        }
    } catch { }

    $prompt = @"
你是 DeepSeek，在用户的 Windows 电脑上工作。这是一次由仓库留言自动唤醒的无人值守任务。

【任务来源】
仓库：$($task.repo)
帖子：$($task.url)
类型：$($task.kind)（第 $($task.number) 号）

【帖子正文（原样）】
<post>
$($task.body)
</post>

【要求】
1. 按正文第一行 /ds 之后的指令执行。指令不清楚或有歧义时不要猜，把需要用户补充的问题写在最后输出里，然后结束。
2. **绝对不要整库克隆，也不要整库下载压缩包。** 这台机器到 GitHub 的带宽只有 20~30 KB/s，几十 MB 的仓库必然超时（已实测：57 MB 的仓库下 15 分钟只到 5 MB）。正确做法是按需取文件：
   - 单个文件：powershell -NoProfile -File "$Root\ds-api.ps1" GET /repos/<owner>/<repo>/contents/<path>，返回 JSON，content 字段是 base64
   - 列目录：GET /repos/<owner>/<repo>/git/trees/<branch>?recursive=1
   - 只看分支：git ls-remote --heads https://github.com/<owner>/<repo>
   - 单个文件超过 5 MB 就不要下载；任务确实依赖它时，在结果里说明并结束
3. 改代码并提交时，优先用 GitHub API 服务端提交（不传文件内容）：
   建 blob → 建 tree（基于原 tree，只替换改动项）→ 建 commit → 建分支 ref ds/<编号>-<英文简述>。
   **绝不直接推 main，也绝不强推。** 只在指令明确要求时才开 Pull Request。
4. 修改 AI_TEAM.md 这类团队规则文件时，只改指定文件；用 API 提交时确保 tree 里只多/改这一项，出现删除项立刻停止。
5. **不要自己发评论**。你的最终输出会被自动贴到那个帖子下面，署名为「DeepSeek留言」。所以：先把结果写成给人看的正文，最后单独一行写结论摘要。
6. git 凭据已存在 Windows 凭据管理器里，git 命令可以直接用，不需要登录。
7. 这台机器的沙箱已设为全权限，powershell 可以正常启动进程。若出现 0xC0000142 之类错误，把错误原样写进最终输出，不要反复重试。
8. **截图**：需要看页面/3D 渲染效果时，用这个脚本（已封装 headless Chrome + 软件渲染，支持 WebGL）：
   powershell -NoProfile -File "$Root\ds-shot.ps1" -Url "file:///C:/<本地文件路径>" -Out "C:\<输出路径>.png" -Width 1280 -Height 800 -WaitMs 6000
   截完**用你的图片查看工具打开这张 PNG**，确认渲染是否正确（布局、颜色、有没有空白/报错），再写结论。同一页面最多截 2 次。
9. 不能点网页、不能填表单、不能登录任何网站。只能发 HTTP 请求和截图。

【工作目录】
$($Cfg.workDir)

【时限】
整个过程 $($Cfg.maxRuntimeMinutes) 分钟，超时会被强制终止且不会重试。

现在开始。
"@

    $tag = $task.id -replace '[:/]', '-'
    $promptFile = Join-Path $Root "task-$tag.txt"
    $outFile = Join-Path $Root "run-$tag.log"
    $errFile = Join-Path $Root "run-$tag.err.log"
    Set-Content -Path $promptFile -Value $prompt -Encoding UTF8

    # hand the DeepSeek API key to the headless child only (this process env is not persisted)
    $keyFile = Join-Path $Root 'apikey.txt'
    if (Test-Path $keyFile) {
        $env:DEEPSEEK_API_KEY = (Get-Content $keyFile -Raw -Encoding UTF8).Trim()
    } else {
        Write-Log 'WARN' 'apikey.txt not found; headless will fail to authenticate'
    }

    # the headless agent needs full access or its shell cannot start (0xC0000142)
    $env:DSH_PERMISSION_MODE = 'danger-full-access'

    $timeoutMs = [int]$Cfg.maxRuntimeMinutes * 60 * 1000
    $p = Start-Process -FilePath $Cfg.dshCmd `
        -ArgumentList @('--profile', 'headless', '-') `
        -WorkingDirectory $Cfg.workDir `
        -RedirectStandardInput $promptFile `
        -RedirectStandardOutput $outFile `
        -RedirectStandardError $errFile `
        -NoNewWindow -PassThru

    $finished = $p.WaitForExit($timeoutMs)
    if (-not $finished) {
        try { $p.Kill() } catch { }
        Write-Log 'ERROR' "$($task.id) timed out after $($Cfg.maxRuntimeMinutes) min"
        Post-Reply $task "任务超时（$($Cfg.maxRuntimeMinutes) 分钟），已中止。"
        if ($task.attempts + 1 -lt [int]$Cfg.maxAttempts) {
            $task.attempts = $task.attempts + 1
            ($task | ConvertTo-Json -Compress -Depth 4) | Add-Content -Path $QueuePath -Encoding UTF8
        }
    } else {
        $p.Refresh()
        $code = $p.ExitCode
        if ($null -eq $code) { $code = 0 }
        Write-Log 'INFO' "$($task.id) finished exit=$code"
        if ($code -ne 0) {
            $tail = ''
            try { $tail = (Get-Content $errFile -Tail 3 -ErrorAction SilentlyContinue) -join ' | ' } catch { }
            Write-Log 'ERROR' "$($task.id) failed: $tail"
            if ($task.attempts + 1 -lt [int]$Cfg.maxAttempts) {
                $task.attempts = $task.attempts + 1
                ($task | ConvertTo-Json -Compress -Depth 4) | Add-Content -Path $QueuePath -Encoding UTF8
                Write-Log 'INFO' "$($task.id) requeued for retry"
            } else {
                Write-Log 'ERROR' "$($task.id) giving up after $($task.attempts + 1) attempts"
                Post-Reply $task "任务执行失败（共尝试 $($task.attempts + 1) 次，按设定不再重试）。`n`n错误：$tail"
            }
        } else {
            $body = ''
            try { $body = (Get-Content $outFile -Raw -Encoding UTF8) } catch { }
            $body = ($body -replace '\r\n', "`n").Trim()
            if ($body.Length -gt 6000) { $body = $body.Substring($body.Length - 6000) }
            if (-not $body) { $body = '（任务已执行，但没有产生输出）' }
            Post-Reply $task $body
        }
    }
} catch {
    Write-Log 'ERROR' "worker crashed: $($_.Exception.Message)"
} finally {
    Remove-Item $LockPath -Force -ErrorAction SilentlyContinue
    Remove-Item $CurrentPath -Force -ErrorAction SilentlyContinue
}
