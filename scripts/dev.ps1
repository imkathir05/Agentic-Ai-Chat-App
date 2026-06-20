$Root = Split-Path $PSScriptRoot -Parent

Write-Host "Starting Agentic AI platform (api + websocket + web)..." -ForegroundColor Cyan

Start-Process powershell -ArgumentList "-NoExit", "-File", "$Root\scripts\start-api.ps1"
Start-Sleep -Seconds 2
Start-Process powershell -ArgumentList "-NoExit", "-File", "$Root\scripts\start-websocket.ps1"
Start-Sleep -Seconds 1
Start-Process powershell -ArgumentList "-NoExit", "-File", "$Root\scripts\start-web.ps1"

Write-Host "Open http://localhost:5173" -ForegroundColor Green
