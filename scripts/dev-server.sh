#!/bin/bash
# Development server startup script with proper Node.js version

# Unset npm_config_prefix to avoid nvm conflicts
unset npm_config_prefix

# Load nvm
export NVM_DIR="$HOME/.nvm"
[ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"

# Use the correct Node.js version
nvm use

# Start the development server directly
npx astro dev
