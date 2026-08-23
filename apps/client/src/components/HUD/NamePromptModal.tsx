import React, { useState } from "react";
import { Sparkles, Shield, Compass, ArrowRight } from "lucide-react";

interface NamePromptModalProps {
  isOpen: boolean;
  onSubmit: (name: string) => void;
}

export const NamePromptModal: React.FC<NamePromptModalProps> = ({ isOpen, onSubmit }) => {
  const [nameInput, setNameInput] = useState("");

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const finalName = nameInput.trim() || `Adventurer #${Math.floor(100 + Math.random() * 900)}`;
    onSubmit(finalName);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4">
      <div className="glass-panel w-full max-w-md border-amber-500/40 p-6 flex flex-col gap-5 shadow-2xl animate-in fade-in zoom-in-95 duration-200">
        {/* Title & Icon */}
        <div className="flex flex-col items-center text-center gap-2">
          <div className="p-3 rounded-full bg-amber-500/20 border border-amber-500/50 text-amber-400 shadow-lg shadow-amber-500/20">
            <Compass className="w-8 h-8" />
          </div>
          <h2 className="font-cinzel text-xl font-bold gold-glow-text">
            Enter the West Marches
          </h2>
          <p className="text-xs text-slate-400 max-w-xs leading-relaxed">
            Choose your adventurer or party name before venturing into the uncharted procedural frontier.
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
              <Shield className="w-3.5 h-3.5 text-amber-400" /> Adventurer / Party Name
            </label>
            <input
              type="text"
              autoFocus
              maxLength={24}
              value={nameInput}
              onChange={(e) => setNameInput(e.target.value)}
              placeholder="e.g. Valeria of the Iron Vanguard"
              className="bg-slate-900/90 border border-slate-700 focus:border-amber-400 rounded-lg px-3.5 py-2.5 text-sm text-slate-100 placeholder-slate-500 focus:outline-none transition-colors"
            />
          </div>

          <button
            type="submit"
            className="fantasy-btn py-2.5 px-4 bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-500 hover:to-amber-600 text-white font-medium text-sm flex items-center justify-center gap-2 shadow-lg shadow-amber-900/30"
          >
            <span>Embark into the Realm</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>
      </div>
    </div>
  );
};
