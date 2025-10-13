#!/bin/bash

echo "🚀 Updating server..."

# Navigate to project directory
cd ~/inventory-app

# Pull latest changes
echo "📥 Pulling latest changes..."
git pull origin main

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