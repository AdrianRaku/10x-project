#!/usr/bin/env node
/* eslint-env node */

/**
 * Check test user's data in database
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

if (!supabaseUrl || !supabaseServiceKey) {
  console.error("❌ Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

console.log(`\n🔍 Checking data for user: ${testEmail}\n`);

// Get user ID
const { data: users, error: usersError } = await supabase.auth.admin.listUsers();

if (usersError) {
  console.error("❌ Failed to list users:", usersError);
  process.exit(1);
}

const user = users.users.find((u) => u.email === testEmail);

if (!user) {
  console.error(`❌ User not found: ${testEmail}`);
  process.exit(1);
}

console.log(`✅ User ID: ${user.id}\n`);

// Check ratings
const { data: ratings, error: ratingsError } = await supabase.from("ratings").select("*").eq("user_id", user.id);

if (ratingsError) {
  console.error("❌ Failed to fetch ratings:", ratingsError);
} else {
  console.log(`📊 Ratings: ${ratings.length} records`);
}

// Check user_lists
const { data: lists, error: listsError } = await supabase.from("user_lists").select("*").eq("user_id", user.id);

if (listsError) {
  console.error("❌ Failed to fetch user_lists:", listsError);
} else {
  console.log(`📋 User lists: ${lists.length} records`);
}

// Check ai_recommendation_requests
const { data: requests, error: requestsError } = await supabase
  .from("ai_recommendation_requests")
  .select("*")
  .eq("user_id", user.id);

if (requestsError) {
  console.error("❌ Failed to fetch ai_recommendation_requests:", requestsError);
} else {
  console.log(`🤖 AI requests: ${requests.length} records`);
}

console.log("");
