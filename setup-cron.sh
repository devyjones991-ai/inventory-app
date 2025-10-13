#!/bin/bash

echo "⏰ Setting up cron job for Inventory App..."

# Navigate to project directory
cd ~/inventory-app

# Make update script executable
chmod +x update-server.sh

# Create cron job to run every 5 minutes
echo "📝 Setting up cron job..."
(crontab -l 2>/dev/null; echo "*/5 * * * * cd /home/bag/inventory-app && ./update-server.sh >> /var/log/inventory-app-update.log 2>&1") | crontab -

# Create log file
sudo touch /var/log/inventory-app-update.log
sudo chown bag:bag /var/log/inventory-app-update.log

echo "✅ Cron job configured!"
echo "⏰ App will update every 5 minutes"
echo "📋 To view logs: tail -f /var/log/inventory-app-update.log"
echo "📋 To edit cron: crontab -e"
