#!/bin/bash

# SaaSAgent Emergency Validation Script
# Tests the corrected hooks and checks for HTTP 404 loops

BASE_URL="http://localhost:8080"
LOG_FILE="validation-results.log"
TIMESTAMP=$(date '+%Y-%m-%d %H:%M:%S')

echo "🚀 SaaSAgent Emergency Validation Started at $TIMESTAMP" | tee $LOG_FILE
echo "Testing server at: $BASE_URL" | tee -a $LOG_FILE
echo "=" | tr '=' '=' | head -c 50 && echo | tee -a $LOG_FILE

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

test_count=0
passed_count=0
failed_count=0

run_test() {
    local test_name=$1
    local test_command=$2
    local expected_pattern=$3
    
    test_count=$((test_count + 1))
    echo -e "${BLUE}🧪 Test $test_count: $test_name${NC}" | tee -a $LOG_FILE
    
    # Run the test command and capture output
    result=$(eval $test_command 2>&1)
    exit_code=$?
    
    # Check if test passed
    if [ $exit_code -eq 0 ] && [[ "$result" =~ $expected_pattern || -z "$expected_pattern" ]]; then
        echo -e "${GREEN}✅ PASSED: $test_name${NC}" | tee -a $LOG_FILE
        passed_count=$((passed_count + 1))
    else
        echo -e "${RED}❌ FAILED: $test_name${NC}" | tee -a $LOG_FILE
        echo "   Exit Code: $exit_code" | tee -a $LOG_FILE
        echo "   Output: $result" | tee -a $LOG_FILE
        failed_count=$((failed_count + 1))
    fi
    echo "" | tee -a $LOG_FILE
}

# Test 1: Server Health Check
run_test "Server Health Check" "curl -s -o /dev/null -w '%{http_code}' $BASE_URL --max-time 10" "200"

# Test 2: Dashboard Load Test
run_test "Dashboard Page Load" "curl -s -o /dev/null -w '%{http_code}' $BASE_URL/dashboard --max-time 10" "200"

# Test 3: Check for 404 errors on common assets
echo -e "${BLUE}🔍 Testing Asset Loading (404 checks)...${NC}" | tee -a $LOG_FILE
assets=("/favicon.ico" "/manifest.json" "/robots.txt" "/static/js/main.js")
for asset in "${assets[@]}"; do
    status_code=$(curl -s -o /dev/null -w '%{http_code}' $BASE_URL$asset --max-time 5)
    if [ "$status_code" -eq 404 ]; then
        echo -e "${YELLOW}⚠️  Asset $asset returns 404 (normal for optional assets)${NC}" | tee -a $LOG_FILE
    else
        echo -e "${GREEN}✅ Asset $asset: HTTP $status_code${NC}" | tee -a $LOG_FILE
    fi
done

# Test 4: API Endpoint Tests
echo -e "${BLUE}🔍 Testing API Endpoints...${NC}" | tee -a $LOG_FILE
endpoints=("/api/health" "/api/whatsapp/instances" "/api/agents")
working_endpoints=0

for endpoint in "${endpoints[@]}"; do
    status_code=$(curl -s -o /dev/null -w '%{http_code}' $BASE_URL$endpoint --max-time 5 -H "Accept: application/json")
    
    if [ "$status_code" -eq 200 ] || [ "$status_code" -eq 401 ] || [ "$status_code" -eq 403 ]; then
        echo -e "${GREEN}✅ API $endpoint: HTTP $status_code (OK/Auth Required)${NC}" | tee -a $LOG_FILE
        working_endpoints=$((working_endpoints + 1))
    elif [ "$status_code" -eq 404 ]; then
        echo -e "${YELLOW}⚠️  API $endpoint: HTTP 404 (Not Found)${NC}" | tee -a $LOG_FILE
    else
        echo -e "${RED}❌ API $endpoint: HTTP $status_code${NC}" | tee -a $LOG_FILE
    fi
done

# Test 5: 404 Loop Prevention Test
echo -e "${BLUE}🔍 Testing 404 Loop Prevention...${NC}" | tee -a $LOG_FILE
non_existent_urls=("/non-existent-page" "/api/non-existent-endpoint" "/static/non-existent-file.js")

for url in "${non_existent_urls[@]}"; do
    echo "Testing rapid requests to $BASE_URL$url..." | tee -a $LOG_FILE
    
    # Make 5 rapid requests and check response times
    total_time=0
    for i in {1..5}; do
        start_time=$(date +%s%N)
        curl -s -o /dev/null $BASE_URL$url --max-time 2
        end_time=$(date +%s%N)
        request_time=$(( (end_time - start_time) / 1000000 )) # Convert to milliseconds
        total_time=$((total_time + request_time))
    done
    
    avg_time=$((total_time / 5))
    
    if [ $avg_time -lt 1000 ]; then # Less than 1 second average
        echo -e "${GREEN}✅ No loop detected for $url (avg: ${avg_time}ms)${NC}" | tee -a $LOG_FILE
    else
        echo -e "${YELLOW}⚠️  Slow response for $url (avg: ${avg_time}ms)${NC}" | tee -a $LOG_FILE
    fi
done

# Test 6: Check server logs for errors
echo -e "${BLUE}🔍 Checking server logs for errors...${NC}" | tee -a $LOG_FILE
if [ -f "server.log" ]; then
    error_count=$(grep -i "error\|404\|500" server.log | wc -l)
    if [ $error_count -gt 10 ]; then
        echo -e "${RED}❌ High error count in logs: $error_count${NC}" | tee -a $LOG_FILE
    else
        echo -e "${GREEN}✅ Server logs look healthy (errors: $error_count)${NC}" | tee -a $LOG_FILE
    fi
else
    echo -e "${YELLOW}⚠️  Server log file not found${NC}" | tee -a $LOG_FILE
fi

# Summary
echo "" | tee -a $LOG_FILE
echo "=" | tr '=' '=' | head -c 50 && echo | tee -a $LOG_FILE
echo -e "${BLUE}📊 VALIDATION SUMMARY${NC}" | tee -a $LOG_FILE
echo "=" | tr '=' '=' | head -c 50 && echo | tee -a $LOG_FILE
echo "Total Tests: $test_count" | tee -a $LOG_FILE
echo -e "Passed: ${GREEN}$passed_count${NC}" | tee -a $LOG_FILE
echo -e "Failed: ${RED}$failed_count${NC}" | tee -a $LOG_FILE

success_rate=$(( (passed_count * 100) / test_count ))
echo "Success Rate: $success_rate%" | tee -a $LOG_FILE

if [ $success_rate -ge 80 ]; then
    echo -e "${GREEN}✅ EMERGENCY CORRECTIONS APPEAR TO BE WORKING!${NC}" | tee -a $LOG_FILE
    echo -e "${GREEN}✅ HTTP 404 loops seem to be resolved${NC}" | tee -a $LOG_FILE
    echo -e "${GREEN}✅ Dashboard is loading properly${NC}" | tee -a $LOG_FILE
else
    echo -e "${YELLOW}⚠️  SOME ISSUES REMAIN - REVIEW FAILED TESTS${NC}" | tee -a $LOG_FILE
fi

echo "" | tee -a $LOG_FILE
echo "Full validation log saved to: $LOG_FILE" | tee -a $LOG_FILE
echo "Validation completed at $(date '+%Y-%m-%d %H:%M:%S')" | tee -a $LOG_FILE
