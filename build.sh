#!/bin/bash
set -e

echo "Building MusicStream web app..."

# Navigate to the web app directory
cd apps/web

# Install dependencies
echo "Installing dependencies..."
npm install

# Build the app
echo "Building the app..."
npm run build

echo "Build completed successfully!" 