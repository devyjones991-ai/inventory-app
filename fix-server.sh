#!/bin/bash

# Quick fix script for server issues
set -e

echo "🔧 Fixing server issues..."

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

# Stop Apache if running (common conflict)
print_status "Checking for Apache conflicts..."
if systemctl is-active --quiet apache2; then
    print_warning "Apache is running, stopping it..."
    sudo systemctl stop apache2
    sudo systemctl disable apache2
    print_success "Apache stopped"
fi

# Install nginx if not installed
print_status "Checking nginx installation..."
if ! command -v nginx &> /dev/null; then
    print_status "Installing nginx..."
    sudo apt update
    sudo apt install -y nginx
    print_success "nginx installed"
else
    print_success "nginx is already installed"
fi

# Enable and start nginx
print_status "Starting nginx..."
sudo systemctl enable nginx
sudo systemctl start nginx
print_success "nginx started"

# Configure firewall
print_status "Configuring firewall..."
if command -v ufw &> /dev/null; then
    sudo ufw allow 80
    sudo ufw allow 443
    print_success "Firewall configured"
else
    print_warning "ufw not found, check other firewall"
fi

# Create site directory if it doesn't exist
print_status "Creating site directory..."
sudo mkdir -p /var/www/multiminder.duckdns.org
sudo chown -R www-data:www-data /var/www/multiminder.duckdns.org
sudo chmod -R 755 /var/www/multiminder.duckdns.org
print_success "Site directory created"

# Enable site if not enabled
print_status "Enabling site..."
if [ ! -L "/etc/nginx/sites-enabled/multiminder.duckdns.org" ]; then
    if [ -f "/etc/nginx/sites-available/multiminder.duckdns.org" ]; then
        sudo ln -s /etc/nginx/sites-available/multiminder.duckdns.org /etc/nginx/sites-enabled/
        print_success "Site enabled"
    else
        print_warning "Site configuration not found, creating basic config..."
        sudo tee /etc/nginx/sites-available/multiminder.duckdns.org > /dev/null << 'EOF'
server {
    listen 80;
    server_name multiminder.duckdns.org;
    
    root /var/www/multiminder.duckdns.org;
    index index.html;
    
    location / {
        try_files $uri $uri/ /index.html;
    }
    
    location ~* \.(js|mjs)$ {
        add_header Content-Type "application/javascript; charset=utf-8";
        add_header Cache-Control "public, max-age=31536000, immutable";
        add_header Access-Control-Allow-Origin "*";
    }
    
    location ~* \.css$ {
        add_header Content-Type "text/css; charset=utf-8";
        add_header Cache-Control "public, max-age=31536000, immutable";
    }
}
EOF
        sudo ln -s /etc/nginx/sites-available/multiminder.duckdns.org /etc/nginx/sites-enabled/
        print_success "Basic site configuration created and enabled"
    fi
else
    print_success "Site is already enabled"
fi

# Remove default site if it exists
if [ -L "/etc/nginx/sites-enabled/default" ]; then
    print_status "Removing default nginx site..."
    sudo rm /etc/nginx/sites-enabled/default
    print_success "Default site removed"
fi

# Test nginx configuration
print_status "Testing nginx configuration..."
if sudo nginx -t; then
    print_success "nginx configuration is valid"
else
    print_error "nginx configuration has errors"
    exit 1
fi

# Reload nginx
print_status "Reloading nginx..."
sudo systemctl reload nginx
print_success "nginx reloaded"

# Check nginx status
print_status "Checking nginx status..."
if systemctl is-active --quiet nginx; then
    print_success "nginx is running"
else
    print_error "nginx is not running"
    exit 1
fi

# Create a simple test page if no files exist
if [ ! -f "/var/www/multiminder.duckdns.org/index.html" ]; then
    print_status "Creating test page..."
    sudo tee /var/www/multiminder.duckdns.org/index.html > /dev/null << 'EOF'
<!DOCTYPE html>
<html>
<head>
    <title>multiminder.duckdns.org</title>
</head>
<body>
    <h1>Server is working!</h1>
    <p>nginx is running correctly.</p>
    <p>Time: <script>document.write(new Date());</script></p>
</body>
</html>
EOF
    print_success "Test page created"
fi

# Test local connectivity
print_status "Testing local connectivity..."
if curl -s -o /dev/null -w "%{http_code}" http://localhost | grep -q "200"; then
    print_success "Local HTTP test passed"
else
    print_warning "Local HTTP test failed"
fi

# Display final information
echo ""
print_success "🎉 Server fixes completed!"
echo ""
print_status "Next steps:"
echo "1. Copy your application files to /var/www/multiminder.duckdns.org/"
echo "2. Set proper permissions: sudo chown -R www-data:www-data /var/www/multiminder.duckdns.org/"
echo "3. Test the site: curl http://multiminder.duckdns.org"
echo "4. For HTTPS: sudo certbot --nginx -d multiminder.duckdns.org"
echo ""
print_status "Check logs if issues persist:"
echo "sudo tail -f /var/log/nginx/error.log"
echo "sudo systemctl status nginx"
