#!/bin/bash

# Deploy script for multiminder.duckdns.org
set -e

echo "🚀 Starting deployment..."

# Build the project
echo "📦 Building project..."
npm run build

# Check if all files have .js extension
echo "🔍 Checking file extensions..."
JSX_FILES=$(find dist/assets -name "*.jsx" 2>/dev/null || true)
if [ ! -z "$JSX_FILES" ]; then
    echo "⚠️  Warning: Found .jsx files in dist/assets:"
    echo "$JSX_FILES"
    echo "This may cause MIME type issues. Consider updating vite.config.js"
fi

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

# Choose nginx configuration based on SSL availability
if [ -f "/etc/letsencrypt/live/multiminder.duckdns.org/fullchain.pem" ]; then
    echo "🔒 Using HTTPS nginx configuration..."
    sudo cp nginx.conf /etc/nginx/sites-available/multiminder.duckdns.org
else
    echo "🌐 Using HTTP nginx configuration..."
    sudo cp nginx-http.conf /etc/nginx/sites-available/multiminder.duckdns.org
fi

# Enable site
sudo ln -sf /etc/nginx/sites-available/multiminder.duckdns.org /etc/nginx/sites-enabled/

# Remove default site if it exists
if [ -L "/etc/nginx/sites-enabled/default" ]; then
    echo "🗑️  Removing default nginx site..."
    sudo rm /etc/nginx/sites-enabled/default
fi

# Test nginx configuration
echo "🧪 Testing nginx configuration..."
sudo nginx -t

# Reload nginx
echo "🔄 Reloading nginx..."
sudo systemctl reload nginx

# Setup SSL with Let's Encrypt (if not already done)
if [ ! -f "/etc/letsencrypt/live/multiminder.duckdns.org/fullchain.pem" ]; then
    echo "🔒 Setting up SSL certificate..."
    echo "Please run: sudo certbot --nginx -d multiminder.duckdns.org"
fi

# Test the deployment
echo "🧪 Testing deployment..."
if curl -s -o /dev/null -w "%{http_code}" http://multiminder.duckdns.org | grep -q "200\|301\|302"; then
    echo "✅ Deployment test successful!"
else
    echo "⚠️  Deployment test failed. Check nginx logs:"
    echo "sudo tail -f /var/log/nginx/error.log"
fi

echo "✅ Deployment completed successfully!"
echo "🌐 Your app is now available at: http://multiminder.duckdns.org"
echo "🔒 For HTTPS, run: sudo certbot --nginx -d multiminder.duckdns.org"
