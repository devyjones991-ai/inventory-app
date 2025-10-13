#!/bin/bash

# Server diagnostic script for multiminder.duckdns.org
set -e

echo "🔍 Diagnosing server issues..."

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

# Check if nginx is installed
print_status "Checking nginx installation..."
if command -v nginx &> /dev/null; then
    print_success "nginx is installed"
    nginx -v
else
    print_error "nginx is not installed"
    echo "Install with: sudo apt update && sudo apt install nginx"
    exit 1
fi

# Check nginx status
print_status "Checking nginx status..."
if systemctl is-active --quiet nginx; then
    print_success "nginx is running"
else
    print_error "nginx is not running"
    echo "Start with: sudo systemctl start nginx"
fi

# Check nginx configuration
print_status "Testing nginx configuration..."
if nginx -t; then
    print_success "nginx configuration is valid"
else
    print_error "nginx configuration has errors"
    echo "Fix configuration errors first"
fi

# Check if nginx is listening on ports
print_status "Checking nginx ports..."
if netstat -tlnp 2>/dev/null | grep nginx | grep :80; then
    print_success "nginx is listening on port 80"
else
    print_warning "nginx is not listening on port 80"
fi

if netstat -tlnp 2>/dev/null | grep nginx | grep :443; then
    print_success "nginx is listening on port 443"
else
    print_warning "nginx is not listening on port 443"
fi

# Check if site is enabled
print_status "Checking if site is enabled..."
if [ -L "/etc/nginx/sites-enabled/multiminder.duckdns.org" ]; then
    print_success "Site is enabled"
else
    print_error "Site is not enabled"
    echo "Enable with: sudo ln -s /etc/nginx/sites-available/multiminder.duckdns.org /etc/nginx/sites-enabled/"
fi

# Check if site files exist
print_status "Checking site files..."
if [ -d "/var/www/multiminder.duckdns.org" ]; then
    print_success "Site directory exists"
    ls -la /var/www/multiminder.duckdns.org/
else
    print_error "Site directory does not exist"
    echo "Create with: sudo mkdir -p /var/www/multiminder.duckdns.org"
fi

# Check firewall
print_status "Checking firewall..."
if command -v ufw &> /dev/null; then
    ufw_status=$(ufw status | grep -E "(80|443)" || echo "No rules found")
    if [[ $ufw_status == *"80"* ]] || [[ $ufw_status == *"443"* ]]; then
        print_success "Firewall allows HTTP/HTTPS"
    else
        print_warning "Firewall may be blocking HTTP/HTTPS"
        echo "Allow with: sudo ufw allow 80 && sudo ufw allow 443"
    fi
else
    print_warning "ufw not found, check other firewall"
fi

# Check if domain resolves
print_status "Checking domain resolution..."
if nslookup multiminder.duckdns.org &> /dev/null; then
    print_success "Domain resolves"
    nslookup multiminder.duckdns.org
else
    print_warning "Domain resolution issues"
fi

# Check local connectivity
print_status "Checking local connectivity..."
if curl -s -o /dev/null -w "%{http_code}" http://localhost; then
    print_success "Local HTTP works"
else
    print_error "Local HTTP not working"
fi

# Check nginx logs
print_status "Checking nginx error logs..."
if [ -f "/var/log/nginx/error.log" ]; then
    echo "Recent errors:"
    tail -10 /var/log/nginx/error.log
else
    print_warning "No error log found"
fi

echo ""
print_status "🎯 Quick fixes to try:"
echo "1. sudo systemctl restart nginx"
echo "2. sudo systemctl enable nginx"
echo "3. sudo ufw allow 80 && sudo ufw allow 443"
echo "4. sudo ln -s /etc/nginx/sites-available/multiminder.duckdns.org /etc/nginx/sites-enabled/"
echo "5. Check if port 80/443 are not used by other services"
echo ""
print_status "🔧 Advanced troubleshooting:"
echo "1. Check nginx logs: sudo tail -f /var/log/nginx/error.log"
echo "2. Check system logs: sudo journalctl -u nginx"
echo "3. Test nginx config: sudo nginx -t"
echo "4. Check if Apache is running: sudo systemctl status apache2"
echo "5. Check port conflicts: sudo netstat -tlnp | grep -E ':(80|443)'"
