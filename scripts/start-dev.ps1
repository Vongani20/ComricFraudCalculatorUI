Write-Host "Starting Comric Fraud SQL (Docker)..." -ForegroundColor Cyan
docker start comric-fraud-sql 2>$null
if ($LASTEXITCODE -ne 0) {
  Write-Host "Creating SQL container..." -ForegroundColor Yellow
  docker compose -f "$PSScriptRoot\..\..\ComricFraudCalculatorBackend\docker-compose.yml" up -d sqlserver
}

$backendRoot = Resolve-Path "$PSScriptRoot\..\..\ComricFraudCalculatorBackend"
Write-Host ""
Write-Host "Starting API on http://localhost:5267" -ForegroundColor Green
Write-Host "Dev token: Bearer dev-token" -ForegroundColor Green
Write-Host ""
Push-Location $backendRoot
try {
  dotnet run --launch-profile http
}
finally {
  Pop-Location
}
