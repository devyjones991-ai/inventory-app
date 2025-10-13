# PowerShell script to update server
Write-Host "🚀 Updating server..." -ForegroundColor Green

# Navigate to project directory
Set-Location ~/inventory-app

# Pull latest changes
Write-Host "📥 Pulling latest changes..." -ForegroundColor Yellow
git pull origin main

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
