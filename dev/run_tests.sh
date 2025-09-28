#!/bin/bash

# Navigate to the app directory
cd app

# Install dependencies if not already installed
if [ ! -d "node_modules" ]; then
  npm install
fi

# Run the tests
npx playwright test
