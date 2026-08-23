import React from "react";
import { HexCoord, BIOMES, TileData } from "@webwestmarch/shared";
import { Compass, AlertTriangle, Mountain, Droplets, Footprints, ShieldAlert, Sparkles, MapPin } from "lucide-react";

interface TileInspectorWidgetProps {
  coord: HexCoord | null;
  tileData: TileData | null;
  onEnterEncounter?: () => void;
  onOpenEncampment?: () => void;
}

export const TileInspectorWidget: React.FC<TileInspectorWidgetProps> = ({
  coord,
  tileData,
  onEnterEncounter,
  onOpenEncampment,
}) => {
  if (!coord || !tileData) return null;

  const biomeMeta = BIOMES[tileData.biome];
  const hazardStars = Array.from({ length: 5 }, (_, i) => i < biomeMeta.hazardRating);

  return (
    <div className="glass-panel p-4 w-80 flex flex-col gap-3 pointer-events-auto">
      <div className="flex items-center justify-between border-b border-slate-700/60 pb-2">
        <div className="flex items-center gap-2">
          <MapPin className="w-4 h-4 text-amber-400" />
          <h2 className="font-cinzel text-sm font-bold text-amber-200">
            {tileData.customLabel || biomeMeta.name}
          </h2>
        </div>
        <span className="text-[11px] font-mono text-cyan-300 bg-slate-800/80 px-2 py-0.5 rounded border border-slate-700">
          HEX ({coord.q}, {coord.r})
        </span>
      </div>

      <p className="text-xs text-slate-300 italic leading-relaxed">
        {tileData.landmark?.description || biomeMeta.description}
      </p>

      {/* Terrain Metrics */}
      <div className="grid grid-cols-3 gap-2 bg-slate-900/60 p-2.5 rounded-lg border border-slate-800">
        <div className="flex flex-col items-center gap-1">
          <div className="flex items-center gap-1 text-[10px] text-slate-400">
            <Mountain className="w-3 h-3 text-slate-300" /> Elevation
          </div>
          <span className="text-xs font-mono font-medium text-slate-200">
            {Math.round(tileData.elevation * 100)}%
          </span>
        </div>

        <div className="flex flex-col items-center gap-1">
          <div className="flex items-center gap-1 text-[10px] text-slate-400">
            <Droplets className="w-3 h-3 text-blue-400" /> Moisture
          </div>
          <span className="text-xs font-mono font-medium text-blue-200">
            {Math.round(tileData.moisture * 100)}%
          </span>
        </div>

        <div className="flex flex-col items-center gap-1">
          <div className="flex items-center gap-1 text-[10px] text-slate-400">
            <Footprints className="w-3 h-3 text-emerald-400" /> Move Cost
          </div>
          <span className="text-xs font-mono font-medium text-emerald-200">
            {tileData.isPassable ? `${tileData.movementCost}x` : "Impassable"}
          </span>
        </div>
      </div>

      {/* Hazard Level */}
      <div className="flex items-center justify-between text-xs px-1">
        <span className="text-slate-400 flex items-center gap-1">
          <ShieldAlert className="w-3.5 h-3.5 text-rose-400" /> Hazard Threat
        </span>
        <div className="flex gap-1">
          {hazardStars.map((filled, idx) => (
            <span
              key={idx}
              className={`w-2 h-2 rounded-full ${
                filled ? "bg-rose-500 shadow-sm shadow-rose-500/50" : "bg-slate-700"
              }`}
            />
          ))}
        </div>
      </div>

      {/* Landmark Action Button */}
      {tileData.landmark && (
        <div className="mt-1 pt-2 border-t border-slate-700/60 flex flex-col gap-2">
          {tileData.landmark.interactionType === "REST_CAMP" && (
            <button
              onClick={onOpenEncampment}
              className="fantasy-btn w-full bg-gradient-to-r from-amber-600/80 to-amber-700/80 hover:from-amber-500 hover:to-amber-600 text-white font-medium"
            >
              <Sparkles className="w-4 h-4 text-yellow-300" /> Enter Haven Encampment
            </button>
          )}

          {tileData.landmark.interactionType === "ENTER_DUNGEON" && (
            <button
              onClick={onEnterEncounter}
              className="fantasy-btn w-full bg-gradient-to-r from-rose-700/80 to-red-800/80 hover:from-rose-600 hover:to-red-700 text-white font-medium"
            >
              <AlertTriangle className="w-4 h-4 text-red-300" /> Engage Tactical Combat
            </button>
          )}
        </div>
      )}
    </div>
  );
};
