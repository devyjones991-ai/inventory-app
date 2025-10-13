#!/bin/bash

# Deploy script for multiminder.duckdns.org
set -e

echo "🚀 Starting deployment..."

# Build the project
echo "📦 Building project..."
npm run build

# Create deployment directory
DEPLOY_DIR="/var/www/multiminder.duckdns.org"
echo "📁 Preparing deployment directory: $DEPLOY_DIR"

# Create directory if it doesn't exist
sudo mkdir -p $DEPLOY_DIR

# Copy built files
echo "📋 Copying built files..."
sudo cp -r dist/* $DEPLOY_DIR/

# Set proper permissions
echo "🔐 Setting permissions..."
sudo chown -R www-data:www-data $DEPLOY_DIR
sudo chmod -R 755 $DEPLOY_DIR

# Copy nginx configuration
echo "⚙️ Updating nginx configuration..."
sudo cp nginx.conf /etc/nginx/sites-available/multiminder.duckdns.org
sudo ln -sf /etc/nginx/sites-available/multiminder.duckdns.org /etc/nginx/sites-enabled/

# Test nginx configuration
echo "🧪 Testing nginx configuration..."
sudo nginx -t

# Reload nginx
echo "🔄 Reloading nginx..."
sudo systemctl reload nginx

# Setup SSL with Let's Encrypt (if not already done)
if [ ! -f "/etc/letsencrypt/live/multiminder.duckdns.org/fullchain.pem" ]; then
    echo "🔒 Setting up SSL certificate..."
    sudo certbot --nginx -d multiminder.duckdns.org --non-interactive --agree-tos --email your-email@example.com
fi

echo "✅ Deployment completed successfully!"
echo "🌐 Your app is now available at: https://multiminder.duckdns.org"
