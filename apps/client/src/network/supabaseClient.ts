import { createClient, SupabaseClient } from "@supabase/supabase-js";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || "https://napxkhcvnbrcdhvnjdro.supabase.co";
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || "";

export const supabase: SupabaseClient = createClient(supabaseUrl, supabaseAnonKey);

export async function signInWithDiscord(): Promise<void> {
  const { error } = await supabase.auth.signInWithOAuth({
    provider: "discord",
    options: {
      redirectTo: window.location.origin,
    },
  });
  if (error) {
    console.error("[SupabaseAuth] Discord OAuth error:", error.message);
  }
}

export async function signOut(): Promise<void> {
  await supabase.auth.signOut();
}
