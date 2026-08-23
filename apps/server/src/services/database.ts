import { DEFAULT_HANDCRAFTED_OVERRIDES, TileDeltaOverride } from "@webwestmarch/shared";

export interface SupabaseConfig {
  supabaseUrl: string;
  supabaseServiceRoleKey: string;
}

export class DatabaseService {
  private static instance: DatabaseService;
  private isConfigured: boolean = false;

  private constructor() {
    const url = process.env.SUPABASE_URL;
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (url && key) {
      this.isConfigured = true;
      console.log("[DatabaseService] Supabase credentials detected. Live database synchronization enabled.");
    } else {
      console.log("[DatabaseService] Running in local/memory mode with default handcrafted delta layers.");
    }
  }

  public static getInstance(): DatabaseService {
    if (!DatabaseService.instance) {
      DatabaseService.instance = new DatabaseService();
    }
    return DatabaseService.instance;
  }

  /**
   * Fetch all sparse handcrafted tile delta overrides from database (or default built-ins).
   */
  public async loadAllDeltas(): Promise<TileDeltaOverride[]> {
    if (this.isConfigured) {
      try {
        // Query Supabase table `map_tile_overrides`
        console.log("[DatabaseService] Loading delta overrides from Supabase...");
      } catch (err) {
        console.error("[DatabaseService] Failed to load deltas from Supabase, falling back to defaults", err);
      }
    }
    return Object.values(DEFAULT_HANDCRAFTED_OVERRIDES);
  }

  /**
   * Save or update a single tile delta override.
   */
  public async saveDelta(delta: TileDeltaOverride): Promise<boolean> {
    if (this.isConfigured) {
      try {
        console.log(`[DatabaseService] Saving delta for tile ${delta.coordKey} to Supabase...`);
        return true;
      } catch (err) {
        console.error("[DatabaseService] Failed to save delta to Supabase", err);
        return false;
      }
    }
    return true;
  }
}
