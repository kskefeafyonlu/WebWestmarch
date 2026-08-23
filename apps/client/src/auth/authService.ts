import { createClient, SupabaseClient, User } from "@supabase/supabase-js";

const SUPABASE_URL =
  import.meta.env.VITE_SUPABASE_URL || "https://napxkhcvnbrcdhvnjdro.supabase.co";
const SUPABASE_ANON_KEY =
  import.meta.env.VITE_SUPABASE_ANON_KEY ||
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5hcHhraGN2bmJyY2Rodm5qZHJvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODc1MDIxNjQsImV4cCI6MjEwMzA3ODE2NH0.HduppgTZU_XssSV90uSiM0oqeZLN4W9CybfsYY0Ub48";

export interface AuthProfile {
  id: string;
  username: string;
  avatarUrl?: string;
  isDiscord: boolean;
  isAdmin: boolean;
}

export class AuthService {
  private static instance: AuthService;
  public supabase: SupabaseClient;

  private constructor() {
    this.supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
      },
    });
  }

  public static getInstance(): AuthService {
    if (!AuthService.instance) {
      AuthService.instance = new AuthService();
    }
    return AuthService.instance;
  }

  /**
   * Triggers Discord OAuth Sign-In via Supabase
   */
  public async signInWithDiscord(): Promise<{ error?: string }> {
    try {
      const redirectUrl = window.location.origin;
      const { error } = await this.supabase.auth.signInWithOAuth({
        provider: "discord",
        options: {
          redirectTo: redirectUrl,
          scopes: "identify email",
        },
      });

      if (error) {
        return { error: error.message };
      }
      return {};
    } catch (err: any) {
      return { error: err?.message || "Failed to initiate Discord OAuth." };
    }
  }

  /**
   * Signs out the current Supabase session
   */
  public async signOut(): Promise<void> {
    await this.supabase.auth.signOut();
  }

  /**
   * Fetches the current logged in user (if any)
   */
  public async getCurrentUser(): Promise<AuthProfile | null> {
    const { data } = await this.supabase.auth.getSession();
    const user = data?.session?.user;

    if (!user) return null;

    const username =
      user.user_metadata?.custom_claims?.global_name ||
      user.user_metadata?.full_name ||
      user.user_metadata?.name ||
      user.user_metadata?.user_name ||
      user.email?.split("@")[0] ||
      "Adventurer";

    const avatarUrl = user.user_metadata?.avatar_url;

    return {
      id: user.id,
      username,
      avatarUrl,
      isDiscord: true,
      isAdmin: false,
    };
  }

  /**
   * Subscribe to Supabase Auth state changes
   */
  public onAuthStateChange(callback: (profile: AuthProfile | null) => void): () => void {
    const { data: listener } = this.supabase.auth.onAuthStateChange(
      async (_event, session) => {
        if (session?.user) {
          const user = session.user;
          const username =
            user.user_metadata?.custom_claims?.global_name ||
            user.user_metadata?.full_name ||
            user.user_metadata?.name ||
            user.user_metadata?.user_name ||
            user.email?.split("@")[0] ||
            "Adventurer";

          callback({
            id: user.id,
            username,
            avatarUrl: user.user_metadata?.avatar_url,
            isDiscord: true,
            isAdmin: false,
          });
        } else {
          callback(null);
        }
      }
    );

    return () => {
      listener.subscription.unsubscribe();
    };
  }
}
