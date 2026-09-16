import React from 'react';
import { ShieldAlert, Heart, Zap, Sparkles } from 'lucide-react';

interface FooterProps {
  onUploadClick: () => void;
  onDemoClick: () => void;
  onNavigate: (sectionId: string) => void;
}

export const Footer: React.FC<FooterProps> = ({
  onUploadClick,
  onDemoClick,
  onNavigate
}) => {
  return (
    <footer className="relative border-t border-slate-800/80 bg-[#070b1a] text-slate-400 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
        {/* Brand */}
        <div className="flex flex-col sm:flex-row items-center gap-3 text-center sm:text-left">
          <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-gradient-to-tr from-purple-600 to-indigo-600 text-white shadow-md">
            <ShieldAlert className="w-4 h-4" />
          </div>
          <div>
            <span className="text-base font-extrabold text-white tracking-wider uppercase font-display">
              EXAM RESCUE <span className="bg-gradient-to-r from-purple-400 to-blue-400 bg-clip-text text-transparent">AI</span>
            </span>
            <p className="text-xs text-slate-400">
              Emergency AI Study Planner for high-stakes examinations.
            </p>
          </div>
        </div>

        {/* Quick navigation */}
        <div className="flex items-center gap-6 text-xs sm:text-sm font-medium">
          <button
            onClick={() => onNavigate('hero')}
            className="hover:text-white transition-colors cursor-pointer"
          >
            Home
          </button>
          <button
            onClick={() => onNavigate('how-it-works')}
            className="hover:text-white transition-colors cursor-pointer"
          >
            How It Works
          </button>
          <button
            onClick={() => onNavigate('dashboard')}
            className="hover:text-white transition-colors cursor-pointer"
          >
            Dashboard
          </button>
          <button
            onClick={onUploadClick}
            className="text-indigo-400 hover:text-indigo-300 font-semibold cursor-pointer"
          >
            Upload Notes
          </button>
        </div>

        {/* Status Indicator */}
        <div className="flex items-center gap-2 text-xs">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
          <span className="text-slate-400 font-mono">Rescue Engine v2.4 • Active</span>
        </div>
      </div>

      <div className="max-w-6xl mx-auto mt-8 pt-6 border-t border-slate-900 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-400">
        <p>
          © {new Date().getFullYear()} Exam Rescue AI. Built for high-yield emergency revision.
        </p>
        <p className="flex items-center gap-1.5 text-slate-400">
          <span>🧠 Tip: Test yourself actively instead of passively re-reading slides.</span>
        </p>
      </div>
    </footer>
  );
};
