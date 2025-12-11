import { createClient } from "@supabase/supabase-js";
import type { Database } from "../../src/db/database.types";

/**
 * Creates a Supabase client for test cleanup operations
 * Uses service role key for admin access to delete test data
 */
function createCleanupClient() {
  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  // Debug: log available env vars (for CI troubleshooting)
  if (process.env.CI) {
    console.log("[Cleanup Debug] SUPABASE_URL:", supabaseUrl ? "SET" : "NOT SET");
    console.log("[Cleanup Debug] SUPABASE_SERVICE_ROLE_KEY:", supabaseServiceKey ? "SET" : "NOT SET");
    console.log("[Cleanup Debug] All env keys:", Object.keys(process.env).filter(k => k.includes("SUPABASE")));
  }

  if (!supabaseUrl || !supabaseServiceKey) {
    throw new Error(
      "SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set. " +
        "Locally: add them to .env.test file. " +
        "On CI: ensure they are passed as environment variables in workflow."
    );
  }

  return createClient<Database>(supabaseUrl, supabaseServiceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}

/**
 * Gets user ID by email
 */
async function getUserIdByEmail(email: string): Promise<string> {
  const supabase = createCleanupClient();

  const { data, error } = await supabase.auth.admin.listUsers();

  if (error) {
    throw new Error(`Failed to list users: ${error.message}`);
  }

  const user = data.users.find((u) => u.email === email);

  if (!user) {
    throw new Error(`User not found with email: ${email}`);
  }

  return user.id;
}

/**
 * Cleans up all test data for a given user
 * Deletes records from: ai_recommendation_requests, ratings, user_lists
 */
export async function cleanupUserData(userId: string): Promise<void> {
  const supabase = createCleanupClient();

  console.log(`[Cleanup] Starting cleanup for user: ${userId}`);

  try {
    // Delete AI recommendation requests
    const { error: aiError } = await supabase.from("ai_recommendation_requests").delete().eq("user_id", userId);

    if (aiError) {
      console.error(`[Cleanup] Failed to delete ai_recommendation_requests:`, aiError);
      throw aiError;
    }
    console.log(`[Cleanup] ✓ Deleted ai_recommendation_requests`);

    // Delete ratings
    const { error: ratingsError } = await supabase.from("ratings").delete().eq("user_id", userId);

    if (ratingsError) {
      console.error(`[Cleanup] Failed to delete ratings:`, ratingsError);
      throw ratingsError;
    }
    console.log(`[Cleanup] ✓ Deleted ratings`);

    // Delete user lists
    const { error: listsError } = await supabase.from("user_lists").delete().eq("user_id", userId);

    if (listsError) {
      console.error(`[Cleanup] Failed to delete user_lists:`, listsError);
      throw listsError;
    }
    console.log(`[Cleanup] ✓ Deleted user_lists`);

    console.log(`[Cleanup] ✓ Cleanup completed successfully for user: ${userId}`);
  } catch (error) {
    console.error(`[Cleanup] ✗ Cleanup failed:`, error);
    throw error;
  }
}

/**
 * Cleans up test data for user identified by email
 */
export async function cleanupUserDataByEmail(email: string): Promise<void> {
  const userId = await getUserIdByEmail(email);
  await cleanupUserData(userId);
}
