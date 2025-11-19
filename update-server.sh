#!/bin/bash

echo "🚀 Updating server..."

# Navigate to project directory
cd ~/inventory-app

# Pull latest changes
echo "📥 Pulling latest changes..."
git pull origin main

# Setup environment variables (используем локальный Supabase)
echo "🔧 Setting up environment variables..."
if supabase status 2>/dev/null | grep -q "API URL"; then
    ANON_KEY=$(supabase status 2>/dev/null | grep "anon key" | awk '{print $3}')
    cat > public/env.js << EOF
// Runtime environment overrides for static hosting
// Локальный Supabase через nginx proxy
window.__ENV = window.__ENV || {
  VITE_SUPABASE_URL: "http://multiminder.duckdns.org",
  VITE_SUPABASE_ANON_KEY: "$ANON_KEY",
  VITE_API_BASE_URL: "http://multiminder.duckdns.org",
};
EOF
    echo "✓ env.js создан с локальным Supabase"
else
    echo "⚠ Supabase не запущен, используйте fix-env-js.sh для создания env.js"
fi

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