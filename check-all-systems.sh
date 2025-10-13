#!/bin/bash

echo "🔍 Checking all anti-failure systems..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to check status
check_status() {
    local service_name=$1
    local status=$(systemctl is-active $service_name 2>/dev/null)
    
    if [ "$status" = "active" ]; then
        echo -e "${GREEN}✅ $service_name: RUNNING${NC}"
        return 0
    else
        echo -e "${RED}❌ $service_name: NOT RUNNING${NC}"
        return 1
    fi
}

# Function to check port
check_port() {
    local port=$1
    local service_name=$2
    
    if netstat -tlnp 2>/dev/null | grep -q ":$port "; then
        echo -e "${GREEN}✅ Port $port: OPEN ($service_name)${NC}"
        return 0
    else
        echo -e "${RED}❌ Port $port: CLOSED${NC}"
        return 1
    fi
}

# Function to check HTTP response
check_http() {
    local url=$1
    local name=$2
    
    local response=$(curl -s -o /dev/null -w "%{http_code}" "$url" 2>/dev/null)
    
    if [ "$response" = "200" ]; then
        echo -e "${GREEN}✅ $name: HTTP 200 OK${NC}"
        return 0
    else
        echo -e "${RED}❌ $name: HTTP $response${NC}"
        return 1
    fi
}

echo "📊 SYSTEM STATUS CHECK"
echo "======================"

# Check systemd services
echo ""
echo "🔧 Systemd Services:"
check_status "nginx"
check_status "inventory-app.service"

# Check ports
echo ""
echo "🌐 Network Ports:"
check_port "80" "HTTP"
check_port "443" "HTTPS"

# Check HTTP accessibility
echo ""
echo "🌍 Web Accessibility:"
check_http "http://localhost" "Local HTTP"
check_http "https://multiminder.duckdns.org" "External HTTPS"
check_http "http://89.207.218.148" "IP Access"

# Check cron jobs
echo ""
echo "⏰ Cron Jobs:"
cron_count=$(crontab -l 2>/dev/null | grep -c "inventory-app" || echo "0")
if [ "$cron_count" -gt 0 ]; then
    echo -e "${GREEN}✅ Cron jobs: $cron_count configured${NC}"
    crontab -l 2>/dev/null | grep "inventory-app" | while read line; do
        echo "   📋 $line"
    done
else
    echo -e "${RED}❌ Cron jobs: None configured${NC}"
fi

# Check log files
echo ""
echo "📄 Log Files:"
if [ -f "/var/log/inventory-app-health.log" ]; then
    echo -e "${GREEN}✅ Health log: EXISTS${NC}"
    echo "   📊 Last 3 entries:"
    tail -3 /var/log/inventory-app-health.log 2>/dev/null | sed 's/^/      /'
else
    echo -e "${YELLOW}⚠️ Health log: NOT FOUND${NC}"
fi

if [ -f "/var/log/inventory-app-update.log" ]; then
    echo -e "${GREEN}✅ Update log: EXISTS${NC}"
    echo "   📊 Last 3 entries:"
    tail -3 /var/log/inventory-app-update.log 2>/dev/null | sed 's/^/      /'
else
    echo -e "${YELLOW}⚠️ Update log: NOT FOUND${NC}"
fi

# Check environment variables
echo ""
echo "🔑 Environment Variables:"
if [ -f "/var/www/multiminder.duckdns.org/env.js" ]; then
    if grep -q "VITE_SUPABASE_URL" /var/www/multiminder.duckdns.org/env.js; then
        echo -e "${GREEN}✅ Environment file: CONFIGURED${NC}"
    else
        echo -e "${RED}❌ Environment file: NOT CONFIGURED${NC}"
    fi
else
    echo -e "${RED}❌ Environment file: NOT FOUND${NC}"
fi

# Check disk space
echo ""
echo "💾 Disk Space:"
df -h / | tail -1 | awk '{if ($5+0 > 80) print "❌ Disk usage: " $5 " (HIGH)"; else print "✅ Disk usage: " $5 " (OK)"}'

# Check memory
echo ""
echo "🧠 Memory Usage:"
free -h | grep "Mem:" | awk '{used=$3; total=$2; percent=int(used/total*100); if(percent > 80) print "❌ Memory usage: " percent "% (HIGH)"; else print "✅ Memory usage: " percent "% (OK)"}'

# Check recent errors
echo ""
echo "🚨 Recent Errors (last 10):"
if [ -f "/var/log/syslog" ]; then
    grep -i "error\|failed\|denied" /var/log/syslog | tail -5 | while read line; do
        echo "   ⚠️ $line"
    done
fi

echo ""
echo "🎯 SUMMARY:"
echo "==========="

# Count issues
issues=0

# Check critical services
if ! check_status "nginx" >/dev/null; then ((issues++)); fi
if ! check_status "inventory-app.service" >/dev/null; then ((issues++)); fi

# Check critical ports
if ! check_port "80" "HTTP" >/dev/null; then ((issues++)); fi

# Check critical HTTP
if ! check_http "http://localhost" "Local" >/dev/null; then ((issues++)); fi

if [ $issues -eq 0 ]; then
    echo -e "${GREEN}🎉 ALL SYSTEMS OPERATIONAL!${NC}"
    echo -e "${GREEN}🛡️ Anti-failure systems are working correctly${NC}"
else
    echo -e "${RED}⚠️ $issues issues detected${NC}"
    echo -e "${YELLOW}🔧 Run ./emergency-restore.sh to fix issues${NC}"
fi

echo ""
echo "📋 Useful commands:"
echo "   🔄 Restart service: sudo systemctl restart inventory-app.service"
echo "   📊 View logs: sudo journalctl -u inventory-app.service -f"
echo "   🚨 Emergency fix: ./emergency-restore.sh"
echo "   🏥 Health check: ./health-check.sh"
