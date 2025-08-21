#!/bin/sh
set -e

echo "========================================="
echo "Starting Frontend Application"
echo "========================================="

# Print environment variables if they exist
if [ -n "$FRONTEND_URL" ]; then
    echo "Frontend URL: $FRONTEND_URL"
fi

if [ -n "$API_URL" ]; then
    echo "API URL: $API_URL"
fi

# Simple environment variable substitution (optional)
if [ -f /usr/share/nginx/html/index.html ]; then
    if [ -n "$API_URL" ] || [ -n "$FRONTEND_URL" ]; then
        echo "Substituting environment variables..."
        envsubst '$API_URL $FRONTEND_URL' < /usr/share/nginx/html/index.html > /tmp/index.html
        mv /tmp/index.html /usr/share/nginx/html/index.html
        echo "Environment variables substituted successfully"
    fi
fi

echo "========================================="
echo "Frontend ready! Nginx listening on port 80"
echo "========================================="

exec nginx -g 'daemon off;'