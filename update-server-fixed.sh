#!/bin/bash

echo "🚀 Updating server..."

# Navigate to project directory
cd ~/inventory-app

# Configure git to use merge strategy
echo "🔧 Configuring git merge strategy..."
git config pull.rebase false

# Pull latest changes with merge
echo "📥 Pulling latest changes..."
git pull origin main

# Setup environment variables
echo "🔧 Setting up environment variables..."
cat > public/env.js << 'EOF'
// Runtime environment overrides for static hosting
window.__ENV = {
  VITE_SUPABASE_URL: "https://ldbdqkbstlhugikalpin.supabase.co",
  VITE_SUPABASE_ANON_KEY: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxkYmRxa2JzdGxodWdpa2FscGluIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTM3NzA4OTIsImV4cCI6MjA2OTM0Njg5Mn0.V9V20mwbCzfWYXn2HZGyjWRhFiu6TW0uw_s-WiiipTg",
  VITE_API_BASE_URL: "https://ldbdqkbstlhugikalpin.supabase.co/functions/v1"
};
EOF

# Clean dist directory and fix permissions
echo "🧹 Cleaning dist directory..."
sudo rm -rf dist/
mkdir -p dist/

# Build the project
echo "🔨 Building project..."
npm run build

# Fix permissions after build
echo "🔐 Fixing build permissions..."
sudo chown -R bag:bag dist/
chmod -R 755 dist/

# Copy files to web directory
echo "📁 Copying files..."
sudo cp -r dist/* /var/www/multiminder.duckdns.org/

# Set proper permissions
echo "🔐 Setting permissions..."
sudo chown -R www-data:www-data /var/www/multiminder.duckdns.org/
sudo chmod -R 755 /var/www/multiminder.duckdns.org/

# Reload nginx
echo "🔄 Reloading nginx..."
sudo systemctl reload nginx

echo "✅ Update complete!"
echo "🌐 Check: https://multiminder.duckdns.org"
