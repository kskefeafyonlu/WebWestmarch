# WebWestmarch 🗡️

An exploration-focused, top-down 2D grid MMO built for living West Marches campaigns with deterministic procedural terrain generation, sparse handcrafted delta layers, settlement hubs, and turn-based tactical combat encounters.

---

## 🏛️ Architecture & Tech Stack

* **Frontend Client**: React + Vite + Pixi.js v8 WebGL Renderer with a Dark Fantasy Glassmorphic HUD.
* **Game Server**: Authoritative Colyseus WebSocket server with tick-based state synchronization, flat-topped hex movement validation, and room management.
* **Shared TypeScript Core (`packages/shared`)**: Deterministic Simplex noise algorithms, 6-directional flat-topped hex math (axial & cube coordinates), biome models, and sparse delta override schemas.
* **Database & Storage**: Supabase (PostgreSQL with JSONB sparse delta layers) & Upstash Redis.
* **Monorepo**: npm workspaces linking `packages/shared`, `apps/server`, and `apps/client`.

---

## 🗺️ Key Features

* **Flat-Topped Hexagonal World Exploration**: Smooth LERP movement interpolation between hex nodes, coordinate inspection, and line-of-sight metrics.
* **Procedural Base + Handcrafted Delta Layer**: Generates seamless terrain deterministically from seed while layering custom hand-crafted landmarks, dungeons, shrines, and outposts.
* **Sanctuary Encampment Hub**: Encampment resting hearth, armorer workshop, rumors/bounties board, and settlement expansion.
* **Turn-Based Tactical Battle Arena**: Dedicated combat grid for monster encounters with hero action abilities and real-time battle chronicle logs.
* **Multi-Channel Real-time Chat**: Realm, party, and chronicle event channels.

---

## 🚀 Quickstart

```powershell
# Install dependencies
npm install

# Run both Server & Client concurrently
npm run dev

# Or run individually:
npm run dev:server  # Listening on ws://localhost:2567
npm run dev:client  # Listening on http://localhost:5173
```

---

## 📜 Keybindings & Controls

* **Mouse**: Click adjacent hex to move; click and drag to pan camera; scroll wheel to zoom.
* **Keyboard Hex Navigation**:
  * `E` : East (`+1, 0`)
  * `W` : North-East (`+1, -1`)
  * `Q` : North-West (`0, -1`)
  * `A` : West (`-1, 0`)
  * `Z` : South-West (`-1, +1`)
  * `S` : South-East (`0, +1`)
  * `Spacebar` : Center camera on player party.
