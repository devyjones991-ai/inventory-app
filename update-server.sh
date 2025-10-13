#!/bin/bash

echo "🚀 Updating server..."

# Navigate to project directory
cd ~/inventory-app

# Pull latest changes
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

# Build the project
echo "🔨 Building project..."
npm run build

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