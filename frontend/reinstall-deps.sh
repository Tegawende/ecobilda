#!/bin/bash
echo "========================================"
echo " Reinstalling Frontend Dependencies"
echo "========================================"
echo ""

# Remove existing node_modules and lock file
echo "Removing old dependencies..."
rm -rf node_modules
rm -f package-lock.json

# Clear Vite cache
echo "Clearing Vite cache..."
rm -rf node_modules/.vite

echo ""
echo "Installing fresh dependencies..."
npm install

echo ""
echo "========================================"
echo " Installation complete!"
echo "========================================"
echo ""
echo "You can now run: npm run dev"
