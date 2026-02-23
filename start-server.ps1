$port = 8080
Write-Host "Serving on http://localhost:$port"
python -m http.server $port
