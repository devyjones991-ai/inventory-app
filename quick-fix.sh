#!/bin/bash

echo "🚑 Quick fix for Inventory App..."

# Navigate to project directory
cd ~/inventory-app

# Make all scripts executable
chmod +x *.sh

# Stop any hanging processes
echo "🔪 Killing hanging processes..."
sudo pkill -f "inventory-app" 2>/dev/null || true
sudo pkill -f "update-server" 2>/dev/null || true

# Stop services
echo "⏹️ Stopping services..."
sudo systemctl stop inventory-app.service 2>/dev/null || true

# Ensure nginx is running
echo "🌐 Ensuring nginx is running..."
sudo systemctl start nginx
sudo systemctl enable nginx

# Fix the service file
echo "📝 Fixing service file..."
sudo tee /etc/systemd/system/inventory-app.service > /dev/null << 'EOF'
[Unit]
Description=Inventory App Service
After=network.target nginx.service
Wants=nginx.service

[Service]
Type=simple
User=bag
Group=bag
WorkingDirectory=/home/bag/inventory-app
ExecStart=/bin/bash -c 'cd /home/bag/inventory-app && ./update-server.sh && while true; do sleep 300; ./update-server.sh; done'
Restart=always
RestartSec=10
StandardOutput=journal
StandardError=journal
Environment=NODE_ENV=production

[Install]
WantedBy=multi-user.target
EOF

# Reload systemd
echo "🔄 Reloading systemd..."
sudo systemctl daemon-reload

# Enable and start service
echo "🚀 Starting service..."
sudo systemctl enable inventory-app.service
sudo systemctl start inventory-app.service

# Wait a bit
echo "⏳ Waiting for service to start..."
sleep 10

# Check status
echo "📊 Service status:"
sudo systemctl status inventory-app.service --no-pager

# Test accessibility
echo "🧪 Testing accessibility..."
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

echo "🎉 Quick fix complete!"
