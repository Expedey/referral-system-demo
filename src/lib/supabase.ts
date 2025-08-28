import { createClient } from "@/utils/supabase/client";

// It's best practice to use environment variables for sensitive keys

// Create a single supabase client for use throughout the app
export const supabase = createClient();
