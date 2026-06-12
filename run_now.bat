@echo off
chcp 65001 >nul
echo.
echo ╔════════════════════════════════╗
echo ║   🤖 AI晨报 - 立即运行        ║
echo ╚════════════════════════════════╝
echo.
echo 正在采集AI新闻...
echo.
node "%~dp0ai_news_fetcher.js"
echo.
echo 按任意键关闭...
pause >nul
