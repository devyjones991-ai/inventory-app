#!/bin/bash

echo "🏥 Health check for Inventory App..."

# Check if nginx is running
if ! systemctl is-active --quiet nginx; then
    echo "❌ Nginx is not running, starting..."
    sudo systemctl start nginx
    sleep 2
fi

# Check if app service is running
if ! systemctl is-active --quiet inventory-app.service; then
    echo "❌ App service is not running, starting..."
    sudo systemctl start inventory-app.service
    sleep 5
fi

# Check local accessibility
if ! curl -s -o /dev/null -w "%{http_code}" http://localhost | grep -q "200"; then
    echo "❌ App not accessible locally, restarting services..."
    sudo systemctl restart nginx
    sleep 3
    sudo systemctl restart inventory-app.service
    sleep 10
    
    # Check again after restart
    if ! curl -s -o /dev/null -w "%{http_code}" http://localhost | grep -q "200"; then
        echo "❌ App still not accessible after restart, running emergency fix..."
        cd /home/bag/inventory-app
        ./update-server.sh
    fi
fi

# Check external accessibility
if ! curl -s -o /dev/null -w "%{http_code}" https://multiminder.duckdns.org | grep -q "200"; then
    echo "❌ App not accessible externally, checking configuration..."
    sudo systemctl status nginx --no-pager
    sudo systemctl status inventory-app.service --no-pager
fi

echo "✅ Health check complete!"
