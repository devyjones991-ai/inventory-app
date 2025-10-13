#!/bin/bash

echo "🔄 Setting up backup access methods..."

# Get current public IP
CURRENT_IP=$(curl -s https://api.ipify.org)
echo "Current IP: $CURRENT_IP"

# Create multiple nginx configs
echo "📝 Creating multiple access configs..."

# 1. IP access
sudo tee /etc/nginx/sites-available/inventory-ip > /dev/null << EOF
server {
    listen 80;
    server_name $CURRENT_IP;
    root /var/www/multiminder.duckdns.org;
    index index.html;

    location / {
        try_files \$uri \$uri/ /index.html;
    }

    location /assets/ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
}
EOF

# 2. Localhost access
sudo tee /etc/nginx/sites-available/inventory-local > /dev/null << 'EOF'
server {
    listen 80;
    server_name localhost 127.0.0.1;
    root /var/www/multiminder.duckdns.org;
    index index.html;

    location / {
        try_files $uri $uri/ /index.html;
    }

    location /assets/ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
}
EOF

# 3. Wildcard access
sudo tee /etc/nginx/sites-available/inventory-wildcard > /dev/null << 'EOF'
server {
    listen 80 default_server;
    server_name _;
    root /var/www/multiminder.duckdns.org;
    index index.html;

    location / {
        try_files $uri $uri/ /index.html;
    }

    location /assets/ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
}
EOF

# Enable all configs
echo "🔗 Enabling all access methods..."
sudo ln -sf /etc/nginx/sites-available/inventory-ip /etc/nginx/sites-enabled/
sudo ln -sf /etc/nginx/sites-available/inventory-local /etc/nginx/sites-enabled/
sudo ln -sf /etc/nginx/sites-available/inventory-wildcard /etc/nginx/sites-enabled/

# Test and reload
echo "🧪 Testing nginx config..."
sudo nginx -t

if [ $? -eq 0 ]; then
    echo "✅ Nginx config is valid"
    sudo systemctl reload nginx
    
    echo "✅ Backup access configured!"
    echo "🌐 App available at:"
    echo "   - http://$CURRENT_IP"
    echo "   - http://localhost"
    echo "   - http://127.0.0.1"
    echo "   - Any other domain pointing to this IP"
else
    echo "❌ Nginx config is invalid"
    exit 1
fi
