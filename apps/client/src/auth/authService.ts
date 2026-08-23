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
        flowType: "implicit",
      },
    });

    // Check if redirect contains OAuth code or hash to exchange
    this.handleRedirectAuth();
  }

  public static getInstance(): AuthService {
    if (!AuthService.instance) {
      AuthService.instance = new AuthService();
    }
    return AuthService.instance;
  }

  private async handleRedirectAuth(): Promise<void> {
    try {
      const urlParams = new URLSearchParams(window.location.search);
      const code = urlParams.get("code");

      if (code) {
        console.log("[AuthService] Exchanging OAuth PKCE code for session...");
        await this.supabase.auth.exchangeCodeForSession(code);
        window.history.replaceState({}, document.title, window.location.pathname);
      }
    } catch (err) {
      console.warn("[AuthService] Error during redirect auth handling:", err);
    }
  }

  public extractProfile(user: User): AuthProfile {
    const meta = user.user_metadata || {};
    const username =
      meta.custom_claims?.global_name ||
      meta.global_name ||
      meta.full_name ||
      meta.name ||
      meta.user_name ||
      meta.preferred_username ||
      user.email?.split("@")[0] ||
      "Adventurer";

    const avatarUrl = meta.avatar_url || meta.picture || undefined;

    return {
      id: user.id,
      username,
      avatarUrl,
      isDiscord: true,
      isAdmin: false,
    };
  }

  /**
   * Triggers Discord OAuth Sign-In via Supabase
   */
  public async signInWithDiscord(): Promise<{ error?: string }> {
    try {
      const redirectUrl = window.location.href.split("#")[0].split("?")[0];
      console.log(`[AuthService] Signing in with Discord, redirecting to: ${redirectUrl}`);

      const { data, error } = await this.supabase.auth.signInWithOAuth({
        provider: "discord",
        options: {
          redirectTo: redirectUrl,
          scopes: "identify email",
        },
      });

      if (error) {
        console.error("[AuthService] Discord OAuth Error:", error.message);
        return { error: error.message };
      }

      if (data?.url) {
        window.location.href = data.url;
      }
      return {};
    } catch (err: any) {
      console.error("[AuthService] Exception:", err);
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
    try {
      const { data } = await this.supabase.auth.getSession();
      const user = data?.session?.user;
      if (!user) return null;
      return this.extractProfile(user);
    } catch (err) {
      console.warn("[AuthService] Failed to get session:", err);
      return null;
    }
  }

  /**
   * Subscribe to Supabase Auth state changes
   */
  public onAuthStateChange(callback: (profile: AuthProfile | null) => void): () => void {
    const { data: listener } = this.supabase.auth.onAuthStateChange(
      async (_event, session) => {
        if (session?.user) {
          callback(this.extractProfile(session.user));
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
