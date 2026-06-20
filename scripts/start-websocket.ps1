$Root = Split-Path $PSScriptRoot -Parent
Set-Location "$Root\apps\api-server"
& "$Root\venv\Scripts\python.exe" websocket_server.py
