# WebWestmarch Fly.io Secrets Deployment Script
Write-Host "Setting Fly.io production secrets for WebWestmarch (app: webwestmarch)..." -ForegroundColor Cyan

flyctl secrets set -a webwestmarch `
  SUPABASE_URL="https://napxkhcvnbrcdhvnjdro.supabase.co" `
  SUPABASE_SERVICE_ROLE_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5hcHhraGN2bmJyY2Rodm5qZHJvIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4NzUwMjE2NCwiZXhwIjoyMTAzMDc4MTY0fQ.WuCFdPIUvhVLWPp1SdO1PBMmRxj6Ieka19E4ZOxYLzE"

Write-Host "Secrets uploaded! You can now run: flyctl deploy" -ForegroundColor Green
