#!/bin/bash

echo "========================================"
echo "Starting Frontend Deployment Script"
echo "========================================"

# Get current local git branch
CURRENT_BRANCH=$(git branch --show-current)

echo "Local Current Branch: $CURRENT_BRANCH"
echo "Connecting to EC2 Server..."

# ssh -i "C:\Users\sta\Desktop\chataffy-imp-data\chataffy-live.pem" ubuntu@3.231.129.216 << EOF
ssh -i "Downloads/chataffy-live.pem" ubuntu@3.231.129.216<< EOF

set -e

echo ""
echo "========================================"
echo "Connected to EC2 Successfully"
echo "========================================"

echo "Current Server User:"
whoami

echo ""
echo "Moving to Frontend Project Directory..."
cd /var/www/chataffy.com/chataffy_fe

echo ""
echo "Current Directory:"
pwd

echo ""
echo "Adding Git Safe Directory..."
git config --global --add safe.directory /var/www/chataffy.com/chataffy_fe

echo ""
echo "Checking Current Git Branch on Server..."
git branch --show-current

echo ""
echo "Fetching Latest Code from GitHub..."
git fetch origin

echo ""
echo "Switching to Branch: $CURRENT_BRANCH"
git checkout $CURRENT_BRANCH

echo ""
echo "Resetting Code to Latest Origin Branch..."
git reset --hard origin/$CURRENT_BRANCH

echo ""
echo "Latest Commit Details:"
git log -1

echo ""
echo "Installing Dependencies..."
npm install

echo ""
echo "Building Next.js Application..."
npm run build

echo ""
echo "Restarting Frontend PM2 Process..."
pm2 restart frontend

echo ""
echo "Checking PM2 Status..."
pm2 status

echo ""
echo "========================================"
echo "Frontend Deployment Completed Successfully"
echo "========================================"

EOF

echo ""
echo "SSH Session Closed"
echo "Frontend Deployment Script Finished"

exit