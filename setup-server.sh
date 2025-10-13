#!/bin/bash

echo "🚀 Setting up Inventory App server with auto-start..."

# Navigate to project directory
cd ~/inventory-app

# Make all scripts executable
chmod +x *.sh

# Setup nginx auto-start
echo "🌐 Setting up nginx auto-start..."
sudo systemctl enable nginx
sudo systemctl start nginx

# Setup app auto-start (choose one method)
echo "📋 Choose auto-start method:"
echo "1) Systemd service (recommended)"
echo "2) Cron job (every 5 minutes)"
echo "3) Manual only"
read -p "Enter choice (1-3): " choice

case $choice in
    1)
        echo "🔧 Setting up systemd service..."
        sudo cp inventory-app.service /etc/systemd/system/
        sudo systemctl daemon-reload
        sudo systemctl enable inventory-app.service
        sudo systemctl start inventory-app.service
        echo "✅ Systemd service configured!"
        ;;
    2)
        echo "⏰ Setting up cron job..."
        (crontab -l 2>/dev/null; echo "*/5 * * * * cd /home/bag/inventory-app && ./update-server.sh >> /var/log/inventory-app-update.log 2>&1") | crontab -
        sudo touch /var/log/inventory-app-update.log
        sudo chown bag:bag /var/log/inventory-app-update.log
        echo "✅ Cron job configured!"
        ;;
    3)
        echo "📝 Manual mode - run ./update-server.sh when needed"
        ;;
esac

# Initial deployment
echo "🚀 Running initial deployment..."
./update-server.sh

echo ""
echo "🎉 Server setup complete!"
echo "🌐 App available at: https://multiminder.duckdns.org"
echo "📋 To check status: sudo systemctl status inventory-app.service"
echo "📋 To view logs: sudo journalctl -u inventory-app.service"
