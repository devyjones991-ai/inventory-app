#!/bin/bash

echo "🧹 Complete clean and rebuild for Inventory App..."

# Navigate to project directory
cd ~/inventory-app

# Stop any running services
echo "⏹️ Stopping services..."
sudo systemctl stop inventory-app.service 2>/dev/null || true

# Clean everything
echo "🧹 Cleaning all build artifacts..."
sudo rm -rf dist/
sudo rm -rf node_modules/
sudo rm -f package-lock.json

# Fix ownership
echo "👤 Fixing ownership..."
sudo chown -R bag:bag ~/inventory-app/

# Reinstall dependencies
echo "📦 Installing dependencies..."
npm install

# Setup environment
echo "🔧 Setting up environment..."
cat > public/env.js << 'EOF'
// Runtime environment overrides for static hosting
window.__ENV = {
  VITE_SUPABASE_URL: "https://ldbdqkbstlhugikalpin.supabase.co",
  VITE_SUPABASE_ANON_KEY: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxkYmRxa2JzdGxodWdpa2FscGluIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTM3NzA4OTIsImV4cCI6MjA2OTM0Njg5Mn0.V9V20mwbCzfWYXn2HZGyjWRhFiu6TW0uw_s-WiiipTg",
  VITE_API_BASE_URL: "https://ldbdqkbstlhugikalpin.supabase.co/functions/v1"
};
EOF

# Build project
echo "🔨 Building project..."
npm run build

# Copy to web directory
echo "📁 Copying files..."
sudo cp -r dist/* /var/www/multiminder.duckdns.org/

# Set web permissions
echo "🔐 Setting web permissions..."
sudo chown -R www-data:www-data /var/www/multiminder.duckdns.org/
sudo chmod -R 755 /var/www/multiminder.duckdns.org/

# Reload nginx
echo "🔄 Reloading nginx..."
sudo systemctl reload nginx

# Restart services
echo "🔄 Restarting services..."
sudo systemctl start inventory-app.service 2>/dev/null || true

echo "✅ Clean rebuild complete!"
echo "🌐 App available at: https://multiminder.duckdns.org"
