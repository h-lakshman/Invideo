#!/bin/bash

# Change to the frontend directory
cd "$(dirname "$0")/frontend/ui"

# Install dependencies
npm install

# Build the frontend
npm run build

# Start the frontend server on port 80
npm run preview -- --host 0.0.0.0 --port 80 