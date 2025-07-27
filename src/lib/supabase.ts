import { createClient } from "@supabase/supabase-js";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

console.log("Supabase URL:", supabaseUrl);
console.log("Supabase Key exists:", !!supabaseAnonKey);

let supabase: any;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error("Missing Supabase environment variables");
  console.error("URL:", supabaseUrl);
  console.error("Key present:", !!supabaseAnonKey);
  // Don't throw error, just create a mock client
  supabase = null;
} else {
  supabase = createClient(supabaseUrl, supabaseAnonKey);
}

// Utility function to clear corrupted auth data
export function clearAuthData() {
  try {
    // Clear Supabase auth data from localStorage
    const keys = Object.keys(localStorage);
    keys.forEach((key) => {
      if (key.startsWith("sb-" + supabaseUrl?.split("//")[1]?.split(".")[0])) {
        localStorage.removeItem(key);
      }
    });
    console.log("Cleared corrupted auth data from localStorage");
  } catch (error) {
    console.error("Error clearing auth data:", error);
  }
}

export { supabase };
