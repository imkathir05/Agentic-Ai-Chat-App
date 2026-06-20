$Root = Split-Path $PSScriptRoot -Parent
Set-Location "$Root\apps\api-server"
& "$Root\venv\Scripts\python.exe" manage.py runserver 127.0.0.1:8000
