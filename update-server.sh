#!/bin/bash

# Quick server update script
set -e

echo "🚀 Updating server application..."

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
NC='\033[0m'

print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

# Pull latest changes
print_status "Pulling latest changes..."
git pull origin main

# Install dependencies if needed
if [ ! -d "node_modules" ]; then
    print_status "Installing dependencies..."
    npm install
fi

# Build the project
print_status "Building project..."
npm run build

# Copy files to nginx directory
print_status "Copying files to nginx directory..."
sudo cp -r dist/* /var/www/multiminder.duckdns.org/

# Set proper permissions
print_status "Setting permissions..."
sudo chown -R www-data:www-data /var/www/multiminder.duckdns.org/
sudo chmod -R 755 /var/www/multiminder.duckdns.org/

# Create favicon.ico if it doesn't exist
if [ ! -f "/var/www/multiminder.duckdns.org/favicon.ico" ]; then
    print_status "Creating favicon.ico..."
    sudo touch /var/www/multiminder.duckdns.org/favicon.ico
    sudo chown www-data:www-data /var/www/multiminder.duckdns.org/favicon.ico
fi

# Test nginx configuration
print_status "Testing nginx configuration..."
sudo nginx -t

# Reload nginx
print_status "Reloading nginx..."
sudo systemctl reload nginx

print_success "🎉 Server updated successfully!"
echo ""
echo "Check the site: https://multiminder.duckdns.org"
echo "If you still see errors, clear browser cache (Ctrl+Shift+R)"
