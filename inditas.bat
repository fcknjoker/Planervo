@echo off
cd /d "%~dp0.."
start "" http://localhost:8090/planervo-uj/index.html
node "uj-dizajn\szerver.mjs"
