#!/usr/bin/env node

/**
 * Test script to verify Supabase authentication with E2E credentials
 */

import dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const projectRoot = resolve(__dirname, '..');

// Load .env.test file
dotenv.config({ path: resolve(projectRoot, '.env.test') });

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_KEY;
const testEmail = process.env.E2E_USERNAME;
const testPassword = process.env.E2E_PASSWORD;

console.log('🔍 Testing Supabase Authentication\n');
console.log('Configuration:');
console.log(`  Supabase URL: ${supabaseUrl}`);
console.log(`  Test User: ${testEmail}`);
console.log('');

if (!supabaseUrl || !supabaseKey || !testEmail || !testPassword) {
  console.error('❌ Missing required environment variables');
  process.exit(1);
}

// Create Supabase client
const supabase = createClient(supabaseUrl, supabaseKey);

// Attempt to sign in
console.log('🔐 Attempting to sign in...\n');

try {
  const { data, error } = await supabase.auth.signInWithPassword({
    email: testEmail,
    password: testPassword,
  });

  if (error) {
    console.error('❌ Authentication failed!\n');
    console.error('Error details:');
    console.error(`  Message: ${error.message}`);
    console.error(`  Status: ${error.status || 'N/A'}`);
    console.error(`  Code: ${error.code || 'N/A'}\n`);

    if (error.message.includes('Invalid login credentials')) {
      console.log('💡 Possible solutions:');
      console.log('  1. User does not exist - create user in Supabase Authentication');
      console.log('  2. Password is incorrect - update E2E_PASSWORD in .env.test');
      console.log('  3. Email is incorrect - update E2E_USERNAME in .env.test');
    } else if (error.message.includes('Email not confirmed')) {
      console.log('💡 Solution:');
      console.log('  Confirm the email in Supabase Authentication dashboard');
    }

    process.exit(1);
  }

  console.log('✅ Authentication successful!\n');
  console.log('User details:');
  console.log(`  ID: ${data.user.id}`);
  console.log(`  Email: ${data.user.email}`);
  console.log(`  Email confirmed: ${data.user.email_confirmed_at ? 'Yes' : 'No'}`);
  console.log(`  Created at: ${data.user.created_at}`);
  console.log('');

  // Sign out
  await supabase.auth.signOut();
  console.log('✅ Test completed successfully!');

} catch (error) {
  console.error('❌ Unexpected error:', error.message);
  process.exit(1);
}
