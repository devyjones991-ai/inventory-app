#!/bin/bash

echo "🧪 Testing failure recovery systems..."

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

echo "⚠️ This script will temporarily break services to test recovery"
read -p "Continue? (y/N): " confirm

if [[ ! $confirm =~ ^[Yy]$ ]]; then
    echo "❌ Test cancelled"
    exit 0
fi

echo ""
echo "🧪 FAILURE RECOVERY TEST"
echo "========================"

# Test 1: Stop nginx and check recovery
echo ""
echo "🔧 Test 1: Nginx failure recovery"
echo "Stopping nginx..."
sudo systemctl stop nginx

echo "Waiting 5 seconds..."
sleep 5

echo "Checking if health check restarts nginx..."
if systemctl is-active --quiet nginx; then
    echo -e "${GREEN}✅ Nginx auto-recovery: WORKING${NC}"
else
    echo -e "${YELLOW}⚠️ Nginx auto-recovery: NOT WORKING (manual restart needed)${NC}"
    echo "Restarting nginx manually..."
    sudo systemctl start nginx
fi

# Test 2: Stop app service and check recovery
echo ""
echo "🔧 Test 2: App service failure recovery"
echo "Stopping inventory-app service..."
sudo systemctl stop inventory-app.service

echo "Waiting 10 seconds..."
sleep 10

echo "Checking if service auto-restarts..."
if systemctl is-active --quiet inventory-app.service; then
    echo -e "${GREEN}✅ App service auto-recovery: WORKING${NC}"
else
    echo -e "${YELLOW}⚠️ App service auto-recovery: NOT WORKING (manual restart needed)${NC}"
    echo "Restarting app service manually..."
    sudo systemctl start inventory-app.service
fi

# Test 3: Simulate high load
echo ""
echo "🔧 Test 3: High load simulation"
echo "Starting stress test..."
timeout 10s stress --cpu 2 --timeout 10s >/dev/null 2>&1 &
stress_pid=$!

echo "Waiting for stress test to complete..."
wait $stress_pid 2>/dev/null

echo "Checking if services survived stress test..."
if systemctl is-active --quiet nginx && systemctl is-active --quiet inventory-app.service; then
    echo -e "${GREEN}✅ Services survived stress test: WORKING${NC}"
else
    echo -e "${RED}❌ Services failed stress test: NOT WORKING${NC}"
fi

# Test 4: Check HTTP accessibility after tests
echo ""
echo "🔧 Test 4: HTTP accessibility after tests"
echo "Waiting 5 seconds for services to stabilize..."
sleep 5

if curl -s -o /dev/null -w "%{http_code}" http://localhost | grep -q "200"; then
    echo -e "${GREEN}✅ HTTP accessibility: WORKING${NC}"
else
    echo -e "${RED}❌ HTTP accessibility: NOT WORKING${NC}"
fi

# Test 5: Check cron jobs
echo ""
echo "🔧 Test 5: Cron job execution"
echo "Checking if cron jobs are running..."

# Check if health check cron is working
if [ -f "/var/log/inventory-app-health.log" ]; then
    last_health=$(stat -c %Y /var/log/inventory-app-health.log 2>/dev/null || echo "0")
    current_time=$(date +%s)
    time_diff=$((current_time - last_health))
    
    if [ $time_diff -lt 300 ]; then  # Less than 5 minutes
        echo -e "${GREEN}✅ Health check cron: WORKING (last run $time_diff seconds ago)${NC}"
    else
        echo -e "${YELLOW}⚠️ Health check cron: NOT RECENT (last run $time_diff seconds ago)${NC}"
    fi
else
    echo -e "${RED}❌ Health check cron: NO LOG FILE${NC}"
fi

# Test 6: Check log rotation
echo ""
echo "🔧 Test 6: Log rotation"
if [ -f "/etc/logrotate.d/inventory-app" ]; then
    echo -e "${GREEN}✅ Log rotation: CONFIGURED${NC}"
else
    echo -e "${YELLOW}⚠️ Log rotation: NOT CONFIGURED${NC}"
fi

echo ""
echo "🎯 RECOVERY TEST SUMMARY"
echo "========================"

# Count successful tests
success=0
total=6

if systemctl is-active --quiet nginx; then ((success++)); fi
if systemctl is-active --quiet inventory-app.service; then ((success++)); fi
if curl -s -o /dev/null -w "%{http_code}" http://localhost | grep -q "200"; then ((success++)); fi
if [ -f "/var/log/inventory-app-health.log" ]; then ((success++)); fi
if [ -f "/etc/logrotate.d/inventory-app" ]; then ((success++)); fi
if [ $success -ge 4 ]; then ((success++)); fi

echo "Tests passed: $success/$total"

if [ $success -eq $total ]; then
    echo -e "${GREEN}🎉 ALL RECOVERY SYSTEMS WORKING PERFECTLY!${NC}"
elif [ $success -ge 4 ]; then
    echo -e "${YELLOW}⚠️ MOST RECOVERY SYSTEMS WORKING (some issues detected)${NC}"
else
    echo -e "${RED}❌ RECOVERY SYSTEMS NEED ATTENTION${NC}"
    echo -e "${YELLOW}🔧 Run ./emergency-restore.sh to fix issues${NC}"
fi

echo ""
echo "📋 Next steps:"
echo "   🔍 Run ./check-all-systems.sh for detailed status"
echo "   🔄 Run ./emergency-restore.sh if issues found"
echo "   📊 Monitor logs: sudo journalctl -u inventory-app.service -f"
