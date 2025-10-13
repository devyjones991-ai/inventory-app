#!/bin/bash

echo "🌐 Setting up IP access for Inventory App..."

# Create nginx config for IP access
echo "📝 Creating nginx config for IP access..."
sudo tee /etc/nginx/sites-available/inventory-app-ip > /dev/null << 'EOF'
server {
    listen 80;
    server_name 89.207.218.148;
    root /var/www/multiminder.duckdns.org;
    index index.html;

    location / {
        try_files $uri $uri/ /index.html;
    }

    # Handle static assets
    location /assets/ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }

    # Security headers
    add_header X-Frame-Options "DENY" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header Referrer-Policy "no-referrer" always;
}
EOF

# Enable the site
echo "🔗 Enabling IP site..."
sudo ln -sf /etc/nginx/sites-available/inventory-app-ip /etc/nginx/sites-enabled/

# Test nginx config
echo "🧪 Testing nginx config..."
sudo nginx -t

if [ $? -eq 0 ]; then
    echo "✅ Nginx config is valid"
    # Reload nginx
    echo "🔄 Reloading nginx..."
    sudo systemctl reload nginx
    
    echo "✅ IP access configured!"
    echo "🌐 App available at: http://89.207.218.148"
else
    echo "❌ Nginx config is invalid"
    exit 1
fi
