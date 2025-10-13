#!/bin/bash

echo "🔐 Fixing permissions for Inventory App..."

# Navigate to project directory
cd ~/inventory-app

# Fix ownership of entire project
echo "👤 Fixing project ownership..."
sudo chown -R bag:bag ~/inventory-app/

# Fix dist directory specifically
echo "📁 Fixing dist directory..."
sudo rm -rf dist/
mkdir -p dist/
chmod 755 dist/

# Fix node_modules if exists
if [ -d "node_modules" ]; then
    echo "📦 Fixing node_modules permissions..."
    sudo chown -R bag:bag node_modules/
    chmod -R 755 node_modules/
fi

# Fix package-lock.json
if [ -f "package-lock.json" ]; then
    echo "📄 Fixing package-lock.json..."
    sudo chown bag:bag package-lock.json
    chmod 644 package-lock.json
fi

# Fix .env file
if [ -f ".env" ]; then
    echo "🔑 Fixing .env permissions..."
    sudo chown bag:bag .env
    chmod 600 .env
fi

# Fix public directory
echo "🌐 Fixing public directory..."
sudo chown -R bag:bag public/
chmod -R 755 public/

echo "✅ Permissions fixed!"
echo "🚀 You can now run: npm run build"
