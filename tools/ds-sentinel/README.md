# DS 哨兵（DeepSeek 自动值守）

跑在用户 Windows 电脑上的值守脚本：每 10 秒看一眼 GitHub，有人用 `/ds` 点名就开工，干完回帖。

完整的规则、边界、已知问题见 [DS.md](../../DS.md)。

## 文件

| 文件 | 作用 |
|---|---|
| `ds-sentinel.ps1` | 轮询主循环：查 issue/评论、入队、起 worker、维护 hosts |
| `ds-worker.ps1` | 取任务、启动 headless DSH、回帖、限流、中断恢复 |
| `ds-api.ps1` | GitHub API 助手（读文件、发评论、建 issue） |
| `ds-hosts.ps1` | `github.com` 的 IP 体检与自动切换 |
| `ds-shot.ps1` | 用本机 Chrome 无头渲染并截图（支持 WebGL） |
| `config.example.json` | 配置模板，复制成 `config.json` 再改 |

## 运行环境

- Windows + PowerShell 5.1（脚本用 UTF-8 **带 BOM** 保存，否则中文注释会被当 ANSI 解析导致语法错误）
- Git for Windows（`git credential` 从这里取 GitHub 令牌）
- DeepSeek Harness（headless profile 用来执行任务）
- Chrome 或 Edge（仅截图需要）

## 安装

1. 把 6 个文件放到同一个目录，例如 `C:\Users\<你>\.dsh\ds-sentinel\`
2. 复制 `config.example.json` 为 `config.json`，把路径改成机器上的实际路径
3. 把 DeepSeek API Key 单独存成 `apikey.txt`（**不要提交进仓库**），worker 只在启动子进程时读它
4. 注册计划任务，开机自启：

```powershell
$root = "C:\Users\<你>\.dsh\ds-sentinel"
$action = New-ScheduledTaskAction -Execute "powershell.exe" `
  -Argument "-NoProfile -ExecutionPolicy Bypass -WindowStyle Hidden -File `"$root\ds-sentinel.ps1`"" -WorkingDirectory $root
$t1 = New-ScheduledTaskTrigger -AtStartup
$t2 = New-ScheduledTaskTrigger -AtLogOn -User "$env:USERNAME"
$set = New-ScheduledTaskSettingsSet -AllowStartIfOnBatteries -DontStopIfGoingOnBatteries -StartWhenAvailable `
  -ExecutionTimeLimit ([TimeSpan]::Zero) -RestartCount 999 -RestartInterval (New-TimeSpan -Minutes 1) -MultipleInstances IgnoreNew
$pri = New-ScheduledTaskPrincipal -UserId "$env:USERDOMAIN\$env:USERNAME" -LogonType Interactive -RunLevel Highest
Register-ScheduledTask -TaskName "DSH-DeepSeek-Sentinel" -Action $action -Trigger @($t1,$t2) -Settings $set -Principal $pri -Force
```

## 手动排查

```powershell
# 哨兵是否在跑
Get-ScheduledTask -TaskName "DSH-DeepSeek-Sentinel"

# github.com 当前解析到哪个 IP、通不通
powershell -File ds-hosts.ps1 -Status
powershell -File ds-hosts.ps1 -Check      # 失效就自动换
powershell -File ds-hosts.ps1 -Reset      # 清掉退避标记，立刻重试

# 单独跑一次 worker（会把队列里的任务执行掉）
powershell -File ds-worker.ps1
```

## 注意

- `apikey.txt`、`config.json`、`state.json`、`*.log` 都属于运行时文件，不进仓库
- 脚本按「只推新分支、不碰 main」设计，实际约束靠 `ds-worker.ps1` 里的提示词
- 发帖有硬限流：每天 20 条、两条间隔 30 秒，超出进 `outbox.jsonl` 等补发
