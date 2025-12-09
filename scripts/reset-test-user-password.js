#!/usr/bin/env node

/**
 * Script to reset password for existing test user
 *
 * This script uses Supabase Admin API to update user password.
 * You need to have SUPABASE_SERVICE_ROLE_KEY in your .env.test file.
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
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const testEmail = process.env.E2E_USERNAME;
const testPassword = process.env.E2E_PASSWORD;

console.log('🔧 Resetting Test User Password\n');

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY');
  console.error('\nPlease add SUPABASE_SERVICE_ROLE_KEY to your .env.test file.');
  console.error('You can find it in Supabase Dashboard → Settings → API → service_role key');
  process.exit(1);
}

if (!testEmail || !testPassword) {
  console.error('❌ Missing E2E_USERNAME or E2E_PASSWORD');
  process.exit(1);
}

console.log('Configuration:');
console.log(`  Supabase URL: ${supabaseUrl}`);
console.log(`  Test User Email: ${testEmail}`);
console.log('');

// Create admin client with service role key
const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

console.log('🔍 Finding user...\n');

try {
  // Find user by email
  const { data: users, error: listError } = await supabase.auth.admin.listUsers();

  if (listError) {
    console.error('❌ Failed to list users:', listError.message);
    process.exit(1);
  }

  const user = users.users.find(u => u.email === testEmail);

  if (!user) {
    console.error(`❌ User ${testEmail} not found!`);
    console.log('\nPlease create the user first using: node scripts/create-test-user.js');
    process.exit(1);
  }

  console.log(`✅ Found user: ${user.id}\n`);
  console.log('📝 Updating password...\n');

  // Update user password
  const { data, error } = await supabase.auth.admin.updateUserById(user.id, {
    password: testPassword,
  });

  if (error) {
    console.error('❌ Failed to update password:', error.message);
    process.exit(1);
  }

  console.log('✅ Password updated successfully!\n');

  // Test login
  console.log('🔐 Testing login...\n');

  const loginClient = createClient(supabaseUrl, process.env.SUPABASE_KEY);
  const { data: loginData, error: loginError } = await loginClient.auth.signInWithPassword({
    email: testEmail,
    password: testPassword,
  });

  if (loginError) {
    console.error('❌ Login test failed:', loginError.message);
    process.exit(1);
  }

  console.log('✅ Login test successful!');
  console.log('');
  console.log('🎉 Test user password has been reset and verified!');

  await loginClient.auth.signOut();

} catch (error) {
  console.error('❌ Unexpected error:', error.message);
  process.exit(1);
}
