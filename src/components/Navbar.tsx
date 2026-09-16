import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ShieldAlert, Menu, X, Zap, Play, Sparkles } from 'lucide-react';

interface NavbarProps {
  onUploadClick: () => void;
  onDemoClick: () => void;
  activeSection: string;
  onNavigate: (sectionId: string) => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  onUploadClick,
  onDemoClick,
  activeSection,
  onNavigate
}) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleNavClick = (sectionId: string) => {
    onNavigate(sectionId);
    setMobileMenuOpen(false);
  };

  return (
    <motion.header 
      initial={{ y: -20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.5, ease: 'easeOut' }}
      className="sticky top-0 z-50 w-full px-4 sm:px-6 lg:px-8 pt-4 pb-2"
    >
      <div className="max-w-6xl mx-auto glass-panel rounded-2xl px-4 sm:px-6 py-3 transition-all duration-300 relative overflow-hidden">
        {/* Subtle top light sheen line */}
        <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-indigo-500/50 to-transparent" />

        <div className="flex items-center justify-between">
          {/* Brand Logo */}
          <button
            id="nav-brand-btn"
            onClick={() => handleNavClick('hero')}
            className="flex items-center gap-3 text-left group focus:outline-none cursor-pointer"
          >
            <div className="relative flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-tr from-purple-600 via-indigo-600 to-blue-500 shadow-[0_0_24px_rgba(99,102,241,0.6)] group-hover:shadow-[0_0_32px_rgba(139,92,246,0.8)] transition-all duration-300">
              <ShieldAlert className="w-5 h-5 text-white" />
              <span className="absolute -top-1 -right-1 flex h-3 w-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.8)]"></span>
              </span>
            </div>
            <div>
              <div className="flex items-center gap-2.5">
                <span className="text-lg sm:text-xl font-black tracking-wider text-white uppercase font-display">
                  EXAM RESCUE <span className="bg-gradient-to-r from-purple-400 via-indigo-300 to-blue-400 bg-clip-text text-transparent">AI</span>
                </span>
                <span className="hidden sm:inline-flex items-center gap-1 px-2.5 py-0.5 text-[10px] font-bold tracking-widest uppercase text-purple-300 bg-purple-950/70 border border-purple-500/40 rounded-full shadow-[0_0_12px_rgba(168,85,247,0.3)]">
                  <span className="w-1.5 h-1.5 rounded-full bg-purple-400 animate-pulse" />
                  Rescue Protocol
                </span>
              </div>
            </div>
          </button>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-1.5 bg-slate-900/80 p-1.5 rounded-xl border border-slate-800/80 backdrop-blur-md">
            <button
              id="nav-home-btn"
              onClick={() => handleNavClick('hero')}
              className={`px-4 py-1.5 rounded-lg text-xs font-semibold uppercase tracking-wider transition-all duration-200 cursor-pointer ${
                activeSection === 'hero'
                  ? 'text-white bg-gradient-to-r from-purple-600/40 to-indigo-600/40 border border-indigo-500/50 shadow-[0_0_16px_rgba(99,102,241,0.35)]'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
              }`}
            >
              Home
            </button>
            <button
              id="nav-howitworks-btn"
              onClick={() => handleNavClick('how-it-works')}
              className={`px-4 py-1.5 rounded-lg text-xs font-semibold uppercase tracking-wider transition-all duration-200 cursor-pointer ${
                activeSection === 'how-it-works'
                  ? 'text-white bg-gradient-to-r from-purple-600/40 to-indigo-600/40 border border-indigo-500/50 shadow-[0_0_16px_rgba(99,102,241,0.35)]'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
              }`}
            >
              How It Works
            </button>
            <button
              id="nav-dashboard-btn"
              onClick={() => handleNavClick('dashboard')}
              className={`px-4 py-1.5 rounded-lg text-xs font-semibold uppercase tracking-wider transition-all duration-200 cursor-pointer ${
                activeSection === 'dashboard'
                  ? 'text-white bg-gradient-to-r from-purple-600/40 to-indigo-600/40 border border-indigo-500/50 shadow-[0_0_16px_rgba(99,102,241,0.35)]'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
              }`}
            >
              Dashboard
            </button>
          </nav>

          {/* Right Action Buttons */}
          <div className="hidden sm:flex items-center gap-3">
            <motion.button
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              id="nav-try-demo-btn"
              onClick={onDemoClick}
              className="px-4 py-2 text-xs font-semibold tracking-wide text-slate-200 hover:text-white bg-slate-900/90 hover:bg-slate-800/90 border border-slate-700/80 hover:border-indigo-500/50 rounded-xl transition-all flex items-center gap-2 cursor-pointer shadow-sm"
            >
              <Play className="w-3.5 h-3.5 text-blue-400 fill-blue-400" />
              <span>Try Demo</span>
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              id="nav-upload-notes-btn"
              onClick={onUploadClick}
              className="relative group px-4 py-2 text-xs font-bold uppercase tracking-wider text-white bg-gradient-to-r from-purple-600 via-indigo-600 to-blue-600 rounded-xl shadow-[0_0_24px_rgba(99,102,241,0.45)] hover:shadow-[0_0_32px_rgba(139,92,246,0.7)] transition-all flex items-center gap-2 cursor-pointer overflow-hidden"
            >
              <span className="absolute inset-0 bg-white/20 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
              <Zap className="w-3.5 h-3.5 text-yellow-300 fill-yellow-300 animate-bounce" />
              <span>Upload Notes</span>
            </motion.button>
          </div>

          {/* Mobile Menu Toggle Button */}
          <div className="flex md:hidden items-center gap-2">
            <button
              id="mobile-menu-toggle-btn"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 text-slate-300 hover:text-white hover:bg-slate-800 rounded-xl border border-slate-800 transition-colors"
              aria-label="Toggle navigation menu"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* Mobile Dropdown */}
        <AnimatePresence>
          {mobileMenuOpen && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="md:hidden pt-4 pb-2 mt-3 border-t border-slate-800/80 space-y-2 overflow-hidden"
            >
              <button
                id="mobile-nav-home-btn"
                onClick={() => handleNavClick('hero')}
                className="w-full text-left px-3 py-2.5 rounded-xl text-sm font-medium text-slate-200 hover:bg-slate-800/60"
              >
                Home
              </button>
              <button
                id="mobile-nav-howitworks-btn"
                onClick={() => handleNavClick('how-it-works')}
                className="w-full text-left px-3 py-2.5 rounded-xl text-sm font-medium text-slate-200 hover:bg-slate-800/60"
              >
                How It Works
              </button>
              <button
                id="mobile-nav-dashboard-btn"
                onClick={() => handleNavClick('dashboard')}
                className="w-full text-left px-3 py-2.5 rounded-xl text-sm font-medium text-slate-200 hover:bg-slate-800/60"
              >
                Dashboard
              </button>
              <div className="pt-2 flex flex-col gap-2">
                <button
                  id="mobile-try-demo-btn"
                  onClick={() => {
                    onDemoClick();
                    setMobileMenuOpen(false);
                  }}
                  className="w-full py-2.5 text-center text-sm font-medium text-slate-200 bg-slate-800 border border-slate-700 rounded-xl"
                >
                  Try Demo
                </button>
                <button
                  id="mobile-upload-btn"
                  onClick={() => {
                    onUploadClick();
                    setMobileMenuOpen(false);
                  }}
                  className="w-full py-2.5 text-center text-sm font-semibold text-white bg-gradient-to-r from-purple-600 to-blue-600 rounded-xl"
                >
                  Upload Notes
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.header>
  );
};

