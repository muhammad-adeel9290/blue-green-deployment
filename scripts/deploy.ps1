param(
    [string]$TargetVersion = "2.0.0"
)

Write-Host "================================================" -ForegroundColor Cyan
Write-Host "     BLUE-GREEN DEPLOYMENT AUTOMATION           " -ForegroundColor Cyan
Write-Host "================================================" -ForegroundColor Cyan

$upstreamFile = "./nginx/active-upstream.conf"
$currentConfig = Get-Content -Path $upstreamFile -Raw

if ($currentConfig -match "app_blue") {
    $activeColor   = "blue"
    $targetColor   = "green"
    $targetService = "app_green"
    $targetPort    = "8082"
} else {
    $activeColor   = "green"
    $targetColor   = "blue"
    $targetService = "app_blue"
    $targetPort    = "8081"
}

Write-Host "[INFO] Active Environment : $activeColor" -ForegroundColor Yellow
Write-Host "[INFO] Target Environment : $targetColor (Port: $targetPort)" -ForegroundColor Green

Write-Host "`n[STEP 1/4] Building & starting $targetColor (v$TargetVersion)..." -ForegroundColor White
$env:APP_VERSION = $TargetVersion
docker compose up -d --build $targetService

Write-Host "`n[STEP 2/4] Verifying health check on http://localhost:$targetPort/health..." -ForegroundColor White
$healthy = $false
$maxRetries = 15
$attempt = 1

while ($attempt -le $maxRetries) {
    Start-Sleep -Seconds 2
    try {
        $res = Invoke-RestMethod -Uri "http://localhost:$targetPort/health" -Method Get -TimeoutSec 2 -ErrorAction Stop
        if ($res.status -eq "HEALTHY") {
            $healthy = $true
            Write-Host "  -> Health check PASSED on attempt $attempt!" -ForegroundColor Green
            break
        }
    } catch {
        Write-Host "  -> Waiting for $targetColor ($attempt/$maxRetries)..." -ForegroundColor DarkGray
    }
    $attempt++
}

if (-not $healthy) {
    Write-Host "`n[ERROR] Health check FAILED for $targetColor! Aborting." -ForegroundColor Red
    Write-Host "[SAFETY] Traffic remains 100% on $activeColor." -ForegroundColor Yellow
    exit 1
}

Write-Host "`n[STEP 3/4] Switching Nginx traffic to $targetColor..." -ForegroundColor White
"server ${targetService}:3000;" | Set-Content -Path $upstreamFile -NoNewline
docker compose exec -T reverse-proxy nginx -s reload

Write-Host "`n[STEP 4/4] Verifying live endpoint (http://localhost/)..." -ForegroundColor White
Start-Sleep -Seconds 1
$live = Invoke-RestMethod -Uri "http://localhost/" -Method Get
Write-Host "Live traffic serving from: $($live.environment) | Version: $($live.version)" -ForegroundColor Green

Write-Host "`n================================================" -ForegroundColor Cyan
Write-Host " [SUCCESS] Blue-Green Deployment Completed!    " -ForegroundColor Green
Write-Host "================================================" -ForegroundColor Cyan
