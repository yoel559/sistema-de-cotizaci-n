#!/bin/bash
echo "Building frontend..."
cd frontend
npm install
npm run build
cd ..
echo "Copying frontend build to backend..."
cp -r frontend/build backend/static
echo "Build completed!"
