#!/bin/bash

echo "🌐 Setting up nginx auto-start..."

# Enable nginx to start on boot
echo "✅ Enabling nginx auto-start..."
sudo systemctl enable nginx

# Start nginx if not running
echo "🔄 Starting nginx..."
sudo systemctl start nginx

# Check status
echo "📊 Nginx status:"
sudo systemctl status nginx --no-pager

echo ""
echo "✅ Nginx auto-start configured!"
echo "🌐 Nginx will start automatically on server restart"
