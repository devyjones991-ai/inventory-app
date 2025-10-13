#!/bin/bash

echo "🚑 Restoring Inventory App service..."

# Navigate to project directory
cd ~/inventory-app

# Stop any existing services
echo "⏹️ Stopping existing services..."
sudo systemctl stop inventory-app.service 2>/dev/null || true
sudo systemctl stop inventory-app-monitor.service 2>/dev/null || true

# Kill any hanging processes
echo "🔪 Killing hanging processes..."
sudo pkill -f "inventory-app" 2>/dev/null || true
sudo pkill -f "update-server" 2>/dev/null || true

# Ensure nginx is running
echo "🌐 Starting nginx..."
sudo systemctl start nginx
sudo systemctl enable nginx

# Copy and install service
echo "📝 Installing service..."
sudo cp inventory-app.service /etc/systemd/system/
sudo systemctl daemon-reload

# Enable and start service
echo "🚀 Starting service..."
sudo systemctl enable inventory-app.service
sudo systemctl start inventory-app.service

# Check status
echo "📊 Service status:"
sudo systemctl status inventory-app.service --no-pager

# Check if app is accessible
echo "🌐 Testing app accessibility..."
sleep 5
if curl -s -o /dev/null -w "%{http_code}" http://localhost | grep -q "200"; then
    echo "✅ App is accessible locally"
else
    echo "❌ App is not accessible locally"
fi

if curl -s -o /dev/null -w "%{http_code}" https://multiminder.duckdns.org | grep -q "200"; then
    echo "✅ App is accessible externally"
else
    echo "❌ App is not accessible externally"
fi

echo "🎉 Service restoration complete!"
echo "📋 To check logs: sudo journalctl -u inventory-app.service -f"
