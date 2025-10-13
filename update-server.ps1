# PowerShell script to update server
Write-Host "🚀 Updating server..." -ForegroundColor Green

# Navigate to project directory
Set-Location ~/inventory-app

# Pull latest changes
Write-Host "📥 Pulling latest changes..." -ForegroundColor Yellow
git pull origin main

# Setup environment variables
Write-Host "🔧 Setting up environment variables..." -ForegroundColor Yellow
@"
// Runtime environment overrides for static hosting
window.__ENV = {
  VITE_SUPABASE_URL: "https://ldbdqkbstlhugikalpin.supabase.co",
  VITE_SUPABASE_ANON_KEY: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxkYmRxa2JzdGxodWdpa2FscGluIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTM3NzA4OTIsImV4cCI6MjA2OTM0Njg5Mn0.V9V20mwbCzfWYXn2HZGyjWRhFiu6TW0uw_s-WiiipTg",
  VITE_API_BASE_URL: "https://ldbdqkbstlhugikalpin.supabase.co/functions/v1"
};
"@ | Out-File -FilePath "public/env.js" -Encoding UTF8

# Build the project
Write-Host "🔨 Building project..." -ForegroundColor Yellow
npm run build

# Copy files to web directory
Write-Host "📁 Copying files..." -ForegroundColor Yellow
sudo cp -r dist/* /var/www/multiminder.duckdns.org/

# Set proper permissions
Write-Host "🔐 Setting permissions..." -ForegroundColor Yellow
sudo chown -R www-data:www-data /var/www/multiminder.duckdns.org/
sudo chmod -R 755 /var/www/multiminder.duckdns.org/

# Reload nginx
Write-Host "🔄 Reloading nginx..." -ForegroundColor Yellow
sudo systemctl reload nginx

Write-Host "✅ Update complete!" -ForegroundColor Green
Write-Host "🌐 Check: https://multiminder.duckdns.org" -ForegroundColor Cyan
