#!/bin/bash

# Enhanced deployment script for multiminder.duckdns.org
set -e

echo "🚀 Starting enhanced deployment..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if running as root
if [ "$EUID" -eq 0 ]; then
    print_error "Please don't run this script as root. Use sudo only when needed."
    exit 1
fi

# Check if .env file exists
if [ ! -f ".env" ]; then
    print_error ".env file not found! Please create it with required variables:"
    echo "VITE_SUPABASE_URL=https://your-project.supabase.co"
    echo "VITE_SUPABASE_ANON_KEY=your-anon-key"
    echo "VITE_API_BASE_URL=https://multiminder.duckdns.org/api"
    exit 1
fi

print_success ".env file found"

# Check if all required variables are set
print_status "Checking environment variables..."
source .env

if [ -z "$VITE_SUPABASE_URL" ]; then
    print_error "VITE_SUPABASE_URL is not set in .env"
    exit 1
fi

if [ -z "$VITE_SUPABASE_ANON_KEY" ]; then
    print_error "VITE_SUPABASE_ANON_KEY is not set in .env"
    exit 1
fi

if [ -z "$VITE_API_BASE_URL" ]; then
    print_warning "VITE_API_BASE_URL is not set in .env (optional)"
fi

print_success "Environment variables check passed"

# Install dependencies if needed
if [ ! -d "node_modules" ]; then
    print_status "Installing dependencies..."
    npm install
    print_success "Dependencies installed"
else
    print_success "Dependencies already installed"
fi

# Build the project
print_status "Building project..."
npm run build

# Check build output
if [ ! -d "dist" ]; then
    print_error "Build failed - dist directory not found"
    exit 1
fi

print_success "Build completed"

# Check for .jsx files that might cause MIME issues
print_status "Checking for potential MIME type issues..."
JSX_FILES=$(find dist/assets -name "*.jsx" 2>/dev/null || true)
if [ ! -z "$JSX_FILES" ]; then
    print_warning "Found .jsx files in dist/assets:"
    echo "$JSX_FILES"
    print_warning "This may cause MIME type issues on the server"
else
    print_success "No .jsx files found (good for MIME types)"
fi

# Check if nginx is installed
if ! command -v nginx &> /dev/null; then
    print_error "nginx is not installed. Please install it first:"
    echo "sudo apt update && sudo apt install nginx"
    exit 1
fi

print_success "nginx is installed"

# Create deployment directory
DEPLOY_DIR="/var/www/multiminder.duckdns.org"
print_status "Preparing deployment directory: $DEPLOY_DIR"

# Create directory if it doesn't exist
sudo mkdir -p $DEPLOY_DIR

# Backup existing deployment if it exists
if [ -d "$DEPLOY_DIR" ] && [ "$(ls -A $DEPLOY_DIR)" ]; then
    print_status "Backing up existing deployment..."
    sudo cp -r $DEPLOY_DIR $DEPLOY_DIR.backup.$(date +%Y%m%d_%H%M%S)
    print_success "Backup created"
fi

# Create env.js with local Supabase configuration
print_status "Creating env.js with local Supabase configuration..."
if supabase status 2>/dev/null | grep -q "API URL"; then
    API_URL=$(supabase status 2>/dev/null | grep "API URL" | awk '{print $3}')
    ANON_KEY=$(supabase status 2>/dev/null | grep "anon key" | awk '{print $3}')
    
    # Get server IP or use localhost
    SERVER_IP=$(hostname -I | awk '{print $1}' || echo "127.0.0.1")
    
    # Replace 127.0.0.1 with server IP if needed (for external access)
    # For now, keep 127.0.0.1 since nginx will proxy
    cat > dist/env.js << EOF
// Runtime environment overrides for static hosting
// Локальный Supabase конфигурация (автоматически настроено)
window.__ENV = window.__ENV || {
  VITE_SUPABASE_URL: "$API_URL",
  VITE_SUPABASE_ANON_KEY: "$ANON_KEY",
  VITE_API_BASE_URL: "$API_URL",
};
EOF
    print_success "env.js created with local Supabase configuration"
    echo "  API URL: $API_URL"
else
    print_warning "Supabase not running, using .env values for env.js"
    if [ -f ".env" ]; then
        source .env
        cat > dist/env.js << EOF
// Runtime environment overrides for static hosting
window.__ENV = window.__ENV || {
  VITE_SUPABASE_URL: "${VITE_SUPABASE_URL}",
  VITE_SUPABASE_ANON_KEY: "${VITE_SUPABASE_ANON_KEY}",
  VITE_API_BASE_URL: "${VITE_API_BASE_URL:-${VITE_SUPABASE_URL}}",
};
EOF
    else
        print_error "No .env file and Supabase not running. Cannot create env.js"
    fi
fi

# Copy built files
print_status "Copying built files..."
sudo cp -r dist/* $DEPLOY_DIR/

# Set proper permissions
print_status "Setting permissions..."
sudo chown -R www-data:www-data $DEPLOY_DIR
sudo chmod -R 755 $DEPLOY_DIR

print_success "Files copied and permissions set"

# Choose nginx configuration based on SSL availability
if [ -f "/etc/letsencrypt/live/multiminder.duckdns.org/fullchain.pem" ]; then
    print_status "Using HTTPS nginx configuration..."
    sudo cp nginx.conf /etc/nginx/sites-available/multiminder.duckdns.org
else
    print_warning "SSL certificate not found, using HTTP configuration..."
    print_warning "For HTTPS, run: sudo certbot --nginx -d multiminder.duckdns.org"
    sudo cp nginx-http.conf /etc/nginx/sites-available/multiminder.duckdns.org
fi

# Enable site
print_status "Enabling nginx site..."
sudo ln -sf /etc/nginx/sites-available/multiminder.duckdns.org /etc/nginx/sites-enabled/

# Remove default site if it exists
if [ -L "/etc/nginx/sites-enabled/default" ]; then
    print_status "Removing default nginx site..."
    sudo rm /etc/nginx/sites-enabled/default
fi

# Test nginx configuration
print_status "Testing nginx configuration..."
if sudo nginx -t; then
    print_success "nginx configuration is valid"
else
    print_error "nginx configuration test failed"
    exit 1
fi

# Reload nginx
print_status "Reloading nginx..."
sudo systemctl reload nginx

# Check nginx status
if sudo systemctl is-active --quiet nginx; then
    print_success "nginx is running"
else
    print_error "nginx is not running"
    exit 1
fi

# Test the deployment
print_status "Testing deployment..."
if curl -s -o /dev/null -w "%{http_code}" http://localhost | grep -q "200\|301\|302"; then
    print_success "Deployment test passed"
else
    print_warning "Deployment test failed - check nginx logs"
fi

# Display final information
echo ""
print_success "🎉 Deployment completed successfully!"
echo ""
echo "📋 Next steps:"
echo "1. Check the site: http://multiminder.duckdns.org"
echo "2. For HTTPS: sudo certbot --nginx -d multiminder.duckdns.org"
echo "3. Monitor logs: sudo tail -f /var/log/nginx/error.log"
echo "4. Check nginx status: sudo systemctl status nginx"
echo ""
echo "🔧 Troubleshooting:"
echo "- If you see MIME type errors, check nginx configuration"
echo "- If you see CORS errors, check Supabase settings"
echo "- If you see 404 errors, check file permissions"
echo ""
print_success "Deployment script completed!"
