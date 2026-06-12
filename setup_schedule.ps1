# AI晨报定时任务安装脚本
# 创建Windows计划任务：每个工作日（周一至周五）早上8:00执行

$ErrorActionPreference = "Stop"

$taskName = "AI晨间新闻报告"
$workDir = "E:\Users\zhouyang\Desktop\ai日报"
$nodePath = (Get-Command node.exe -ErrorAction SilentlyContinue).Source
if (-not $nodePath) {
    Write-Host "❌ 未找到 node.exe，请确认Node.js已安装" -ForegroundColor Red
    exit 1
}

$scriptPath = Join-Path $workDir "ai_news_fetcher.js"
$logPath = Join-Path $workDir "report_log.txt"

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  AI晨报定时任务安装向导" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "📋 任务名称: $taskName"
Write-Host "📂 工作目录: $workDir"
Write-Host "📜 执行脚本: $scriptPath"
Write-Host "🕗 执行时间: 每个工作日 08:00"
Write-Host ""

# 检查脚本文件是否存在
if (-not (Test-Path $scriptPath)) {
    Write-Host "❌ 脚本文件不存在: $scriptPath" -ForegroundColor Red
    exit 1
}

# 删除旧任务（如果存在）
$existingTask = Get-ScheduledTask -TaskName $taskName -ErrorAction SilentlyContinue
if ($existingTask) {
    Write-Host "🗑️  发现旧任务，正在移除..." -ForegroundColor Yellow
    Unregister-ScheduledTask -TaskName $taskName -Confirm:$false
    Start-Sleep -Seconds 2
    Write-Host "✅ 旧任务已移除" -ForegroundColor Green
}

# 创建任务操作
$action = New-ScheduledTaskAction `
    -Execute $nodePath `
    -Argument "`"$scriptPath`"" `
    -WorkingDirectory $workDir

# 创建触发器：每周一至周五早上8:00
$trigger = New-ScheduledTaskTrigger `
    -Weekly `
    -DaysOfWeek Monday, Tuesday, Wednesday, Thursday, Friday `
    -At "08:00"

# 任务设置
$settings = New-ScheduledTaskSettingsSet `
    -AllowStartIfOnBatteries `
    -DontStopIfGoingOnBatteries `
    -StartWhenAvailable `
    -MultipleInstances IgnoreNew `
    -ExecutionTimeLimit (New-TimeSpan -Minutes 10)

# 使用当前用户注册任务
$principal = New-ScheduledTaskPrincipal `
    -UserId $env:USERNAME `
    -LogonType Interactive `
    -RunLevel Limited

# 注册任务
try {
    Register-ScheduledTask `
        -TaskName $taskName `
        -Action $action `
        -Trigger $trigger `
        -Settings $settings `
        -Principal $principal `
        -Description "每周一至周五早上8:00自动采集AI新闻并生成晨间报告" `
        -Force

    Write-Host "✅ 定时任务创建成功！" -ForegroundColor Green
    Write-Host ""
    Write-Host "📅 下一个工作日: 周一至周五 08:00" -ForegroundColor Cyan
    Write-Host "📂 报告文件: $workDir\AI晨报.html" -ForegroundColor Cyan
    Write-Host "📝 运行日志: $logPath" -ForegroundColor Cyan
    
} catch {
    Write-Host "❌ 创建任务失败: $_" -ForegroundColor Red
    Write-Host ""
    Write-Host "💡 提示：请以管理员身份运行此脚本" -ForegroundColor Yellow
}
