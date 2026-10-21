Write-Host "Starting live traffic monitor (Press Ctrl+C to stop)..." -ForegroundColor Cyan
$count = 0
while ($true) {
    $count++
    try {
        $start = Get-Date
        $res = Invoke-RestMethod -Uri "http://localhost/" -Method Get -TimeoutSec 1
        $elapsed = ((Get-Date) - $start).TotalMilliseconds
        $color = if ($res.environment -eq "BLUE") { "Cyan" } else { "Green" }
        Write-Host "Req #$count | Env: $($res.environment) | Ver: $($res.version) | Latency: $([math]::Round($elapsed))ms" -ForegroundColor $color
    } catch {
        Write-Host "Req #$count | FAILED / DROPPED REQUEST!" -ForegroundColor Red
    }
    Start-Sleep -Milliseconds 250
}
