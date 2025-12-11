#!/usr/bin/env node
/* eslint-env node */

/**
 * Script to create test user in Supabase for E2E testing
 *
 * This script uses Supabase Admin API to create a user without email confirmation.
 * You need to have SUPABASE_SERVICE_ROLE_KEY in your .env.test file.
 */

import dotenv from "dotenv";
import { createClient } from "@supabase/supabase-js";
import { fileURLToPath } from "url";
import { dirname, resolve } from "path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const projectRoot = resolve(__dirname, "..");

// Load .env.test file
dotenv.config({ path: resolve(projectRoot, ".env.test") });

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const testEmail = process.env.E2E_USERNAME;
const testPassword = process.env.E2E_PASSWORD;

console.log("🔧 Creating Test User in Supabase\n");

if (!supabaseUrl || !supabaseServiceKey) {
  console.error("❌ Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY");
  console.error("\nPlease add SUPABASE_SERVICE_ROLE_KEY to your .env.test file.");
  console.error("You can find it in Supabase Dashboard → Settings → API → service_role key");
  process.exit(1);
}

if (!testEmail || !testPassword) {
  console.error("❌ Missing E2E_USERNAME or E2E_PASSWORD");
  process.exit(1);
}

console.log("Configuration:");
console.log(`  Supabase URL: ${supabaseUrl}`);
console.log(`  Test User Email: ${testEmail}`);
console.log("");

// Create admin client with service role key
const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

console.log("📝 Creating user...\n");

try {
  // Create user with admin API (bypasses email confirmation)
  const { data, error } = await supabase.auth.admin.createUser({
    email: testEmail,
    password: testPassword,
    email_confirm: true, // Auto-confirm email
  });

  if (error) {
    // Check if user already exists
    if (error.message.includes("already registered")) {
      console.log("⚠️  User already exists!");
      console.log("\nOptions:");
      console.log("  1. Delete the user in Supabase Dashboard and run this script again");
      console.log("  2. Update the password using reset-test-user-password.js");
      console.log("  3. Use different credentials in .env.test");
      process.exit(1);
    }

    console.error("❌ Failed to create user!\n");
    console.error("Error details:");
    console.error(`  Message: ${error.message}`);
    console.error(`  Status: ${error.status || "N/A"}`);
    process.exit(1);
  }

  console.log("✅ User created successfully!\n");
  console.log("User details:");
  console.log(`  ID: ${data.user.id}`);
  console.log(`  Email: ${data.user.email}`);
  console.log(`  Email confirmed: ${data.user.email_confirmed_at ? "Yes" : "No"}`);
  console.log("");

  // Test login
  console.log("🔐 Testing login...\n");

  const loginClient = createClient(supabaseUrl, process.env.SUPABASE_KEY);
  const { error: loginError } = await loginClient.auth.signInWithPassword({
    email: testEmail,
    password: testPassword,
  });

  if (loginError) {
    console.error("❌ Login test failed:", loginError.message);
    process.exit(1);
  }

  console.log("✅ Login test successful!");
  console.log("");
  console.log("🎉 Test user is ready for E2E tests!");

  await loginClient.auth.signOut();
} catch (error) {
  console.error("❌ Unexpected error:", error.message);
  process.exit(1);
}
