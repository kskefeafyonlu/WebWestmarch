import { createClient, SupabaseClient } from "@supabase/supabase-js";
import { DEFAULT_HANDCRAFTED_OVERRIDES, TileDeltaOverride } from "@webwestmarch/shared";

export class DatabaseService {
  private static instance: DatabaseService;
  private supabase: SupabaseClient | null = null;
  public isConnected: boolean = false;

  private constructor() {
    const url = process.env.SUPABASE_URL;
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (url && key) {
      try {
        this.supabase = createClient(url, key, {
          auth: {
            persistSession: false,
            autoRefreshToken: false,
          },
        });
        this.isConnected = true;
        console.log(`[DatabaseService] ✅ Connected to Supabase Project: ${url}`);
      } catch (err) {
        console.error("[DatabaseService] ❌ Failed to initialize Supabase client:", err);
      }
    } else {
      console.log("[DatabaseService] ⚠️ Running in local in-memory mode (No Supabase keys configured).");
    }
  }

  public static getInstance(): DatabaseService {
    if (!DatabaseService.instance) {
      DatabaseService.instance = new DatabaseService();
    }
    return DatabaseService.instance;
  }

  /**
   * Fetch all sparse handcrafted tile delta overrides from Supabase (or defaults).
   */
  public async loadAllDeltas(): Promise<TileDeltaOverride[]> {
    if (this.supabase && this.isConnected) {
      try {
        const { data, error } = await this.supabase
          .from("map_tile_overrides")
          .select("*");

        if (error) {
          console.warn("[DatabaseService] Notice: Could not read 'map_tile_overrides' table (running migrations may be needed). Using built-in defaults.", error.message);
          return Object.values(DEFAULT_HANDCRAFTED_OVERRIDES);
        }

        if (data && data.length > 0) {
          console.log(`[DatabaseService] Loaded ${data.length} handcrafted tile deltas from Supabase.`);
          return data.map((row: any) => ({
            coordKey: row.coord_key,
            biome: row.biome,
            customLabel: row.custom_label,
            isPassable: row.is_passable,
            landmark: row.landmark,
            notes: row.notes,
            createdBy: row.created_by,
            modifiedAt: new Date(row.modified_at).getTime(),
          }));
        }
      } catch (err) {
        console.error("[DatabaseService] Exception loading deltas from Supabase:", err);
      }
    }
    return Object.values(DEFAULT_HANDCRAFTED_OVERRIDES);
  }

  /**
   * Upsert a handcrafted tile delta override to Supabase.
   */
  public async saveDelta(delta: TileDeltaOverride): Promise<boolean> {
    if (this.supabase && this.isConnected) {
      try {
        const { error } = await this.supabase
          .from("map_tile_overrides")
          .upsert({
            coord_key: delta.coordKey,
            biome: delta.biome,
            custom_label: delta.customLabel,
            is_passable: delta.isPassable ?? true,
            landmark: delta.landmark,
            notes: delta.notes,
            modified_at: new Date().toISOString(),
          });

        if (error) {
          console.error(`[DatabaseService] Failed to upsert delta ${delta.coordKey}:`, error.message);
          return false;
        }

        console.log(`[DatabaseService] ✅ Saved delta override for hex ${delta.coordKey} to Supabase.`);
        return true;
      } catch (err) {
        console.error(`[DatabaseService] Error saving delta ${delta.coordKey}:`, err);
        return false;
      }
    }
    return true;
  }
}
