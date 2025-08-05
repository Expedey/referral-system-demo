import { createClient } from "@supabase/supabase-js";

// It's best practice to use environment variables for sensitive keys
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

// Create a single supabase client for use throughout the app
export const supabase = createClient(supabaseUrl, supabaseAnonKey);