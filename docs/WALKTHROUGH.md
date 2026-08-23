# WebWestmarch MMO — Architecture & Deployment Walkthrough

---

## 🚀 Cloud Services Hookup Guide (Supabase, Vercel, Fly.io, Discord OAuth)

Here is your exact step-by-step blueprint for hooking up every external service in the tech stack:

```mermaid
graph TD
    User["Player Browser"] -->|HTTPS / Next.js / Vite Static CDN| Vercel["Vercel (Client App)"]
    User -->|WSS Stateful WebSockets| Fly["Fly.io / Render (Colyseus Server)"]
    Fly -->|PostgreSQL / JSONB Delta Queries| Supabase["Supabase Database"]
    User -->|Discord OAuth 2.0| SupabaseAuth["Supabase Auth"]
    Fly -->|Fast Session Cache / PubSub| Redis["Upstash Redis"]
```

---

### 1. Supabase (Database, Auth & Sparse Map Deltas)

#### Step 1.1: Create your Supabase Project
1. Go to [database.new](https://database.new) and create a new project (e.g. `webwestmarch-db`).
2. Copy your **Project URL** and **`service_role` secret key** from **Settings > API**.

#### Step 1.2: Run the SQL Schema Migration
Open the Supabase **SQL Editor** and execute the following schema to support accounts, characters, and sparse handcrafted map overrides:

```sql
-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- 1. Profiles / Accounts
create table if not exists public.profiles (
  id uuid references auth.users on delete cascade primary key,
  discord_id text unique,
  username text not null,
  avatar_url text,
  role text default 'PLAYER' check (role in ('PLAYER', 'GM', 'ADMIN')),
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 2. Adventuring Parties / Characters
create table if not exists public.parties (
  id uuid default uuid_generate_v4() primary key,
  owner_id uuid references public.profiles(id) on delete cascade not null,
  party_name text not null,
  current_q int default 0 not null,
  current_r int default 0 not null,
  gold int default 50 not null,
  members jsonb default '[]'::jsonb not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 3. Sparse Handcrafted Map Deltas (Overrides procedural tiles)
create table if not exists public.map_tile_overrides (
  coord_key text primary key, -- Format: "q,r"
  biome text,
  custom_label text,
  is_passable boolean default true,
  landmark jsonb, -- { id, type, name, description, icon, interactionType, dangerTier }
  notes text,
  created_by uuid references public.profiles(id),
  modified_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable Row Level Security (RLS)
alter table public.profiles enable row level security;
alter table public.parties enable row level security;
alter table public.map_tile_overrides enable row level security;

-- Read policies (Anyone can read world map deltas and public profiles)
create policy "Public map overrides are viewable by all" on public.map_tile_overrides for select using (true);
create policy "Public profiles are viewable by all" on public.profiles for select using (true);
create policy "Users can modify their own parties" on public.parties for all using (auth.uid() = owner_id);
```

#### Step 1.3: Hooking Environment Variables into Server (`apps/server/.env`)
```env
PORT=2567
SUPABASE_URL=https://napxkhcvnbrcdhvnjdro.supabase.co
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5hcHhraGN2bmJyY2Rodm5qZHJvIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4NzUwMjE2NCwiZXhwIjoyMTAzMDc4MTY0fQ.WuCFdPIUvhVLWPp1SdO1PBMmRxj6Ieka19E4ZOxYLzE
```

---

### 2. Discord OAuth 2.0 (via Supabase Auth)

1. Go to the [Discord Developer Portal](https://discord.com/developers/applications) and create a **New Application** (e.g. `WebWestmarch`).
2. Navigate to **OAuth2 > General**:
   * Add Redirect URL: `https://napxkhcvnbrcdhvnjdro.supabase.co/auth/v1/callback`
   * Copy the **Client ID** and **Client Secret**.
3. In your **Supabase Dashboard**:
   * Go to **Authentication > Providers > Discord**.
   * Toggle **Enable Discord**.
   * Paste your **Client ID** and **Client Secret**, then click **Save**.

---

### 3. Vercel (Frontend & WebGL Client Deployment)

1. Push your repository to GitHub.
2. In [Vercel Dashboard](https://vercel.com/new), select your repository.
3. Configure the build settings:
   * **Framework Preset**: `Vite`
   * **Root Directory**: `.` (Root directory with `vercel.json`)
   * **Build Command**: `npm run build:shared && npm run build:client`
   * **Output Directory**: `apps/client/dist`
4. Add Environment Variables in Vercel Project Settings:
   ```env
   VITE_SERVER_URL=wss://webwestmarch-server.fly.dev
   VITE_SUPABASE_URL=https://napxkhcvnbrcdhvnjdro.supabase.co
   VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5hcHhraGN2bmJyY2Rodm5qZHJvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODc1MDIxNjQsImV4cCI6MjEwMzA3ODE2NH0.HduppgTZU_XssSV90uSiM0oqeZLN4W9CybfsYY0Ub48
   ```
5. Click **Deploy**. Vercel will build and distribute the client on its global edge CDN.

---

### 4. Fly.io / Render (Persistent Colyseus Game Server)

Because Colyseus relies on persistent stateful WebSocket connections (which serverless lambdas cannot maintain), deploy `apps/server` to **Fly.io** or **Render**:

#### Option A: Fly.io Web Dashboard & Web UI Flow (Internet Site)
If you prefer configuring and monitoring directly from the Fly.io web site ([https://fly.io](https://fly.io)):

1. **Sign Up / Log In**: Go to [https://fly.io/app/sign-in](https://fly.io/app/sign-in) and log in (supports GitHub account login).
2. **Create / View App**:
   * Navigate to your **Dashboard** at [https://fly.io/dashboard](https://fly.io/dashboard).
   * Your app `webwestmarch-server` will appear once launched.
3. **Set Secrets via Web UI**:
   * Click on your app (**`webwestmarch-server`**).
   * In the left sidebar, select **Secrets** (or go to `https://fly.io/apps/webwestmarch-server/secrets`).
   * Click **New Secret** (or **Set Secrets**):
     * **Name**: `SUPABASE_URL` | **Value**: `https://napxkhcvnbrcdhvnjdro.supabase.co`
     * **Name**: `SUPABASE_SERVICE_ROLE_KEY` | **Value**: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5hcHhraGN2bmJyY2Rodm5qZHJvIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4NzUwMjE2NCwiZXhwIjoyMTAzMDc4MTY0fQ.WuCFdPIUvhVLWPp1SdO1PBMmRxj6Ieka19E4ZOxYLzE`
   * Click **Save**. Fly.io automatically restarts your server instance with the new secrets.
4. **Live Monitoring & Logs via Web Console**:
   * Click **Live Logs** in the sidebar to stream authoritative game tick events, player connections, and room states in real-time.
   * Click **Metrics** to monitor WebSocket bandwidth, memory (512MB), and CPU utilization.
5. **Custom Domain & SSL (Optional)**:
   * In sidebar, click **Certificates**.
   * Enter your custom domain (e.g. `server.yourgame.com`) to generate free automated Let's Encrypt SSL certificates for secure WebSockets (`wss://`).

#### Option B: Deploying with Fly.io CLI:
1. In `apps/server`, run `fly launch`.
2. Ensure `fly.toml` has:
   ```toml
   app = "webwestmarch-server"
   primary_region = "iad"

   [http_service]
     internal_port = 2567
     force_https = true
     auto_stop_machines = false
     auto_start_machines = true
     min_machines_running = 1
   ```
3. Set secrets:
   ```bash
   fly secrets set SUPABASE_URL="https://napxkhcvnbrcdhvnjdro.supabase.co" SUPABASE_SERVICE_ROLE_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5hcHhraGN2bmJyY2Rodm5qZHJvIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4NzUwMjE2NCwiZXhwIjoyMTAzMDc4MTY0fQ.WuCFdPIUvhVLWPp1SdO1PBMmRxj6Ieka19E4ZOxYLzE"
   fly deploy
   ```

---

## ⚙️ Game Balancing Parameters (`packages/shared/src/config/gameConfig.ts`)

All core exploration, rendering, and movement variables are serialized in [`packages/shared/src/config/gameConfig.ts`](file:///c:/FRP/WebWestmarch/packages/shared/src/config/gameConfig.ts) so you can experiment with gameplay feel without altering engine logic:

| Config Field | Default | Purpose & Balancing Effect |
| :--- | :--- | :--- |
| `hexRadius` | `40` | Pixel radius of each flat-topped hex cell. |
| `moveStepIntervalMs` | `320` | Minimum milliseconds required between party hex-to-hex movement steps. |
| `interpolationSpeed` | `0.18` | Visual smoothing LERP factor (`0.05` = floaty, `0.35` = snappy). |
| `chunkSize` | `16` | Hex diameter per generated world chunk. |
| `worldSeed` | `42077` | Master seed for deterministic terrain elevation, moisture, and biomes. |
| `elevationScale` | `0.045` | Frequency of continental mountains vs lowlands. |
| `moistureScale` | `0.035` | Frequency of forests, grasslands, and swamps. |
| `fogOfWarRadius` | `4` | Number of hex rings visible around an active party token. |
| `minZoom` / `maxZoom` | `0.35` / `2.2`| Camera zoom bounds for overworld navigation. |

---

## 🧩 Component & System Extension Guide

### How to Add a New Biome
1. Open [`packages/shared/src/types/world.ts`](file:///c:/FRP/WebWestmarch/packages/shared/src/types/world.ts) and add your biome identifier to `BiomeType` (e.g. `CRYSTAL_CAVERNS`).
2. Open [`packages/shared/src/worldgen/biomes.ts`](file:///c:/FRP/WebWestmarch/packages/shared/src/worldgen/biomes.ts) and add its entry to `BIOMES` with `fillColor`, `movementCost`, `isPassable`, and `hazardRating`.
3. Update `determineBiome()` in `biomes.ts` to map your elevation/moisture thresholds to the new biome.

### How to Add a Handcrafted Landmark Override
1. Open [`packages/shared/src/worldgen/chunkGenerator.ts`](file:///c:/FRP/WebWestmarch/packages/shared/src/worldgen/chunkGenerator.ts).
2. Add your coordinate key to `DEFAULT_HANDCRAFTED_OVERRIDES`:
   ```typescript
   "5,-3": {
     coordKey: "5,-3",
     customLabel: "Citadel of the Frost Witch",
     landmark: {
       id: "frost_citadel",
       type: "DUNGEON_ENTRANCE",
       name: "Citadel of the Frost Witch",
       description: "Glacial fortress surrounded by howling blizzards.",
       icon: "mountain-snow",
       interactionType: "ENTER_DUNGEON",
       dangerTier: 4,
     },
   }
   ```

### How to Add New Character Roles / Abilities
1. In [`packages/shared/src/types/world.ts`](file:///c:/FRP/WebWestmarch/packages/shared/src/types/world.ts), add the role to `PartyMember['classRole']`.
2. In [`apps/client/src/components/HUD/PartyStatusWidget.tsx`](file:///c:/FRP/WebWestmarch/apps/client/src/components/HUD/PartyStatusWidget.tsx), add a corresponding Lucide icon in `CLASS_ICONS`.
3. In [`apps/client/src/components/HUD/CombatPreviewModal.tsx`](file:///c:/FRP/WebWestmarch/apps/client/src/components/HUD/CombatPreviewModal.tsx), add tactical action buttons with custom damage calculations.

---

## 🕹️ Controls & Features Verified

* **Movement**:
  * **Click-to-Move**: Click any adjacent flat-topped hex to step your party token forward.
  * **Keyboard Movement**:
    * `E` : East (`+1, 0`)
    * `W` : North-East (`+1, -1`)
    * `Q` : North-West (`0, -1`)
    * `A` : West (`-1, 0`)
    * `Z` : South-West (`-1, +1`)
    * `S` : South-East (`0, +1`)
    * `Spacebar` : Center camera on party.
* **Viewport Navigation**: Click & drag anywhere on the canvas to smoothly pan; use mouse scroll wheel to zoom in/out.
* **Inspect & Modals**: Click on any hex to view elevation, moisture, hazard level, and landmark interactions (Sanctuary Encampment & Turn-Based Combat Arena).
* **Multiplayer Chat**: Real-time Realm, Party, and Chronicle system messages.
