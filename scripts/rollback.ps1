Write-Host "[ROLLBACK] Starting instant rollback..." -ForegroundColor Yellow
$upstreamFile = "./nginx/active-upstream.conf"
$current = Get-Content -Path $upstreamFile -Raw

if ($current -match "app_blue") {
    $rollbackTo = "app_green"
} else {
    $rollbackTo = "app_blue"
}

"server ${rollbackTo}:3000;" | Set-Content -Path $upstreamFile -NoNewline
docker compose exec -T reverse-proxy nginx -s reload
Write-Host "[SUCCESS] Traffic switched back immediately to: $rollbackTo" -ForegroundColor Green
