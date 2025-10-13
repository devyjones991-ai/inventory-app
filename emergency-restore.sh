#!/bin/bash

echo "🚨 Emergency restore for Inventory App..."

# Navigate to project directory
cd ~/inventory-app

# Pull latest code
echo "📥 Pulling latest code..."
git pull origin main

# Make all scripts executable
chmod +x *.sh

# Kill all related processes
echo "🔪 Killing all related processes..."
sudo pkill -f "inventory-app" 2>/dev/null || true
sudo pkill -f "update-server" 2>/dev/null || true
sudo pkill -f "health-check" 2>/dev/null || true

# Stop all services
echo "⏹️ Stopping all services..."
sudo systemctl stop inventory-app.service 2>/dev/null || true
sudo systemctl stop inventory-app-monitor.service 2>/dev/null || true

# Ensure nginx is running
echo "🌐 Ensuring nginx is running..."
sudo systemctl start nginx
sudo systemctl enable nginx

# Run complete rebuild
echo "🔨 Running complete rebuild..."
./clean-rebuild.sh

# Setup and start monitoring
echo "📊 Setting up monitoring..."
./setup-monitoring.sh

# Start app service
echo "🚀 Starting app service..."
sudo systemctl daemon-reload
sudo systemctl enable inventory-app.service
sudo systemctl start inventory-app.service

# Wait and test
echo "⏳ Waiting for services to start..."
sleep 10

# Test accessibility
echo "🧪 Testing accessibility..."
if curl -s -o /dev/null -w "%{http_code}" https://multiminder.duckdns.org | grep -q "200"; then
    echo "✅ App is accessible!"
else
    echo "❌ App is not accessible, checking logs..."
    sudo systemctl status inventory-app.service --no-pager
    sudo systemctl status nginx --no-pager
fi

echo "🎉 Emergency restore complete!"
echo "📋 Check status: sudo systemctl status inventory-app.service"
echo "📋 View logs: sudo journalctl -u inventory-app.service -f"
