#!/usr/bin/env node

/**
 * Helper script to verify test environment variables are properly configured
 */

import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const projectRoot = resolve(__dirname, '..');

// Load .env.test file
const result = dotenv.config({ path: resolve(projectRoot, '.env.test') });

if (result.error) {
  console.error('❌ Error loading .env.test:', result.error.message);
  process.exit(1);
}

console.log('✅ .env.test file loaded successfully\n');

// Check required variables
const requiredVars = [
  'SUPABASE_URL',
  'SUPABASE_KEY',
  'E2E_USERNAME',
  'E2E_PASSWORD'
];

let hasAllVars = true;

console.log('Checking required environment variables:\n');

requiredVars.forEach(varName => {
  const value = process.env[varName];
  const isSet = value && value.length > 0;

  if (isSet) {
    // Mask sensitive values but show they exist
    const maskedValue = varName.includes('KEY') || varName.includes('PASSWORD')
      ? `${value.substring(0, 5)}...${value.substring(value.length - 5)}`
      : value;
    console.log(`✅ ${varName}: ${maskedValue}`);
  } else {
    console.log(`❌ ${varName}: NOT SET`);
    hasAllVars = false;
  }
});

console.log('\n' + '='.repeat(60) + '\n');

if (hasAllVars) {
  console.log('✅ All required variables are set!');
  console.log('\nNext steps:');
  console.log('1. Verify the E2E_USERNAME user exists in Supabase Authentication');
  console.log('2. Verify the E2E_PASSWORD matches the user\'s password');
  console.log('3. Verify SUPABASE_URL and SUPABASE_KEY point to the correct project');
} else {
  console.log('❌ Some required variables are missing!');
  console.log('\nPlease add them to .env.test file:');
  requiredVars.forEach(varName => {
    if (!process.env[varName]) {
      console.log(`  ${varName}=your_value_here`);
    }
  });
}

console.log('');
process.exit(hasAllVars ? 0 : 1);
