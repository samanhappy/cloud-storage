#!/bin/bash

# Health check script for the MCP server
# This script can be used to test if the server is running properly

PORT=${MCP_SERVER_PORT:-3000}
HOST=${HOST:-localhost}

echo "Checking health of MCP server at http://${HOST}:${PORT}/health"

# Make health check request
RESPONSE=$(curl -s -w "%{http_code}" -o /tmp/health_response.json "http://${HOST}:${PORT}/health" 2>/dev/null)
HTTP_CODE="${RESPONSE: -3}"

if [ "$HTTP_CODE" = "200" ]; then
    echo "✅ Server is healthy"
    echo "Response:"
    cat /tmp/health_response.json | jq . 2>/dev/null || cat /tmp/health_response.json
    exit 0
else
    echo "❌ Server health check failed (HTTP $HTTP_CODE)"
    if [ -f /tmp/health_response.json ]; then
        echo "Response:"
        cat /tmp/health_response.json
    fi
    exit 1
fi
