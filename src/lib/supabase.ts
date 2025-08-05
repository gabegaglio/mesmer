import { createClient } from "@supabase/supabase-js";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

console.log("🔧 Supabase Configuration:");
console.log("  URL:", supabaseUrl);
console.log("  Key exists:", !!supabaseAnonKey);
console.log("  Environment:", import.meta.env.MODE);
console.log("  Base URL:", import.meta.env.BASE_URL);

let supabase: any;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error("❌ Missing Supabase environment variables");
  console.error("  URL:", supabaseUrl);
  console.error("  Key present:", !!supabaseAnonKey);
  console.error("  This will disable authentication features");

  // Create a mock client that doesn't crash the app
  supabase = {
    auth: {
      getSession: async () => ({ data: { session: null }, error: null }),
      onAuthStateChange: () => ({
        data: { subscription: { unsubscribe: () => {} } },
      }),
      signUp: async () => ({
        error: { message: "Authentication not available" },
      }),
      signIn: async () => ({
        error: { message: "Authentication not available" },
      }),
      signInWithOAuth: async () => ({
        error: { message: "Authentication not available" },
      }),
      signOut: async () => {},
    },
    from: () => ({
      select: () => ({
        eq: () => ({ single: async () => ({ data: null, error: null }) }),
      }),
      insert: async () => ({
        error: { message: "Authentication not available" },
      }),
      update: async () => ({
        error: { message: "Authentication not available" },
      }),
    }),
    storage: {
      from: () => ({
        upload: async () => ({
          error: { message: "Authentication not available" },
        }),
        download: async () => ({
          error: { message: "Authentication not available" },
        }),
      }),
    },
  };
} else {
  console.log("✅ Supabase client created successfully");
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
