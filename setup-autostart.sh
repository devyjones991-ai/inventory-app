#!/bin/bash

echo "🚀 Setting up auto-start for Inventory App..."

# Navigate to project directory
cd ~/inventory-app

# Make update script executable
chmod +x update-server.sh

# Copy systemd service file
echo "📝 Installing systemd service..."
sudo cp inventory-app.service /etc/systemd/system/

# Reload systemd
echo "🔄 Reloading systemd..."
sudo systemctl daemon-reload

# Enable the service
echo "✅ Enabling auto-start service..."
sudo systemctl enable inventory-app.service

# Start the service once to test
echo "🧪 Testing service..."
sudo systemctl start inventory-app.service

# Check status
echo "📊 Service status:"
sudo systemctl status inventory-app.service --no-pager

echo ""
echo "✅ Auto-start configured!"
echo "🔄 The app will automatically update on server restart"
echo "📋 To check status: sudo systemctl status inventory-app.service"
echo "📋 To view logs: sudo journalctl -u inventory-app.service"
