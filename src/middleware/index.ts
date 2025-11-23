import { defineMiddleware } from "astro:middleware";

import { supabaseClient } from "../db/supabase.client.ts";

export const onRequest = defineMiddleware((context, next) => {
  // Use global supabase client (no authentication for now)
  context.locals.supabase = supabaseClient;

  return next();
});
