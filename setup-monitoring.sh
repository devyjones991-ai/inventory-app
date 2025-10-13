#!/bin/bash

echo "📊 Setting up monitoring for Inventory App..."

# Navigate to project directory
cd ~/inventory-app

# Make scripts executable
chmod +x *.sh

# Setup health check cron job (every 2 minutes)
echo "⏰ Setting up health check cron job..."
(crontab -l 2>/dev/null; echo "*/2 * * * * cd /home/bag/inventory-app && ./health-check.sh >> /var/log/inventory-app-health.log 2>&1") | crontab -

# Setup update cron job (every 10 minutes)
echo "🔄 Setting up update cron job..."
(crontab -l 2>/dev/null; echo "*/10 * * * * cd /home/bag/inventory-app && ./update-server.sh >> /var/log/inventory-app-update.log 2>&1") | crontab -

# Create log files
sudo touch /var/log/inventory-app-health.log
sudo touch /var/log/inventory-app-update.log
sudo chown bag:bag /var/log/inventory-app-*.log

# Setup log rotation
echo "📄 Setting up log rotation..."
sudo tee /etc/logrotate.d/inventory-app > /dev/null << 'EOF'
/var/log/inventory-app-*.log {
    daily
    missingok
    rotate 7
    compress
    delaycompress
    notifempty
    create 644 bag bag
}
EOF

echo "✅ Monitoring setup complete!"
echo "📋 Health check runs every 2 minutes"
echo "📋 Updates run every 10 minutes"
echo "📋 View logs: tail -f /var/log/inventory-app-health.log"
