$Root = Split-Path $PSScriptRoot -Parent
Set-Location "$Root\apps\web-client"
npm run dev
