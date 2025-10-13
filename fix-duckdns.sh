#!/bin/bash

echo "🦆 Fixing DuckDNS configuration..."

# Get current public IP
echo "🔍 Getting current public IP..."
CURRENT_IP=$(curl -s https://api.ipify.org)
echo "Current IP: $CURRENT_IP"

# Check if DuckDNS is working
echo "🧪 Testing DuckDNS resolution..."
if nslookup multiminder.duckdns.org | grep -q "$CURRENT_IP"; then
    echo "✅ DuckDNS is working correctly"
else
    echo "❌ DuckDNS is not working"
    echo "🔧 Please update DuckDNS manually:"
    echo "1. Go to https://www.duckdns.org"
    echo "2. Login to your account"
    echo "3. Update domain 'multiminder' with IP: $CURRENT_IP"
    echo "4. Wait 2-3 minutes for DNS propagation"
fi

# Test domain resolution
echo "🔍 Testing domain resolution..."
if nslookup multiminder.duckdns.org > /dev/null 2>&1; then
    echo "✅ Domain resolves"
else
    echo "❌ Domain does not resolve"
fi

# Test HTTP access
echo "🌐 Testing HTTP access..."
if curl -s -o /dev/null -w "%{http_code}" http://multiminder.duckdns.org | grep -q "200"; then
    echo "✅ HTTP access works"
else
    echo "❌ HTTP access does not work"
fi

# Test HTTPS access
echo "🔒 Testing HTTPS access..."
if curl -s -o /dev/null -w "%{http_code}" https://multiminder.duckdns.org | grep -q "200"; then
    echo "✅ HTTPS access works"
else
    echo "❌ HTTPS access does not work"
fi
