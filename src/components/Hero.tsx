import React from 'react';
import { motion } from 'motion/react';
import { Upload, Play, Clock, Sparkles, CheckCircle2, Flame, ArrowRight } from 'lucide-react';

interface HeroProps {
  onUploadClick: () => void;
  onDemoClick: () => void;
}

export const Hero: React.FC<HeroProps> = ({ onUploadClick, onDemoClick }) => {
  return (
    <section id="hero" className="relative pt-6 sm:pt-12 pb-10 sm:pb-14 px-4 sm:px-6 lg:px-8 overflow-hidden">
      {/* Background Ambient Radial Glows & Grid Mesh */}
      <div className="absolute inset-0 bg-grid-pattern opacity-40 pointer-events-none -z-20" />
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] sm:w-[850px] h-[350px] sm:h-[450px] bg-gradient-to-tr from-purple-600/25 via-indigo-600/20 to-blue-500/20 blur-[130px] rounded-full pointer-events-none -z-10" />
      <div className="absolute top-12 right-12 w-80 h-80 bg-purple-600/15 blur-[100px] rounded-full pointer-events-none -z-10" />
      <div className="absolute top-28 left-8 w-80 h-80 bg-blue-600/15 blur-[100px] rounded-full pointer-events-none -z-10" />

      <div className="max-w-4xl mx-auto text-center relative z-10">
        {/* Urgency Pill Badge */}
        <motion.div
          initial={{ opacity: 0, y: -16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: 'easeOut' }}
          className="inline-flex items-center gap-2.5 px-4 py-1.5 rounded-full bg-indigo-950/80 border border-indigo-500/40 text-indigo-200 text-xs sm:text-sm font-medium mb-6 sm:mb-8 backdrop-blur-xl shadow-[0_0_25px_rgba(99,102,241,0.25)]"
        >
          <span className="flex h-2.5 w-2.5 relative">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-80"></span>
            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.9)]"></span>
          </span>
          <span className="font-bold tracking-wide uppercase text-[11px] text-red-300 bg-red-950/60 px-2 py-0.5 rounded-md border border-red-500/30">
            Exam Mode Active
          </span>
          <span className="text-slate-300">Last-Minute High-Yield Study Planner</span>
        </motion.div>

        {/* Hero Title */}
        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1, ease: 'easeOut' }}
          className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-extrabold tracking-tight text-white leading-[1.08] mb-6 font-display"
        >
          Your exam is tomorrow.{' '}
          <span className="block mt-2 bg-gradient-to-r from-purple-400 via-indigo-200 to-blue-400 bg-clip-text text-transparent text-glow-purple">
            Know exactly what to study.
          </span>
        </motion.h1>

        {/* Subtitle */}
        <motion.p
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2, ease: 'easeOut' }}
          className="text-base sm:text-lg md:text-xl text-slate-300 max-w-2xl mx-auto leading-relaxed mb-8 sm:mb-10 font-normal tracking-wide"
        >
          Upload your notes and let AI build a personalized emergency study plan based on importance, difficulty, time available, and your performance.
        </motion.p>

        {/* CTA Buttons */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.3, ease: 'easeOut' }}
          className="flex flex-col sm:flex-row items-center justify-center gap-4 sm:gap-5 max-w-md mx-auto mb-10"
        >
          <motion.button
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.98 }}
            id="hero-upload-notes-btn"
            onClick={onUploadClick}
            className="w-full sm:w-auto relative group px-8 py-4 rounded-2xl text-base font-bold text-white bg-gradient-to-r from-purple-600 via-indigo-600 to-blue-600 hover:from-purple-500 hover:via-indigo-500 hover:to-blue-500 shadow-[0_0_35px_rgba(99,102,241,0.5)] hover:shadow-[0_0_50px_rgba(139,92,246,0.7)] transition-all duration-300 flex items-center justify-center gap-3 cursor-pointer overflow-hidden border border-indigo-400/30"
          >
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
            <Upload className="w-5 h-5 text-indigo-200 group-hover:scale-110 transition-transform" />
            <span className="tracking-wide">Upload Notes</span>
            <ArrowRight className="w-4 h-4 text-indigo-200 opacity-70 group-hover:translate-x-1 transition-transform" />
          </motion.button>

          <motion.button
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.98 }}
            id="hero-try-demo-btn"
            onClick={onDemoClick}
            className="w-full sm:w-auto px-8 py-4 rounded-2xl text-base font-semibold text-slate-200 hover:text-white bg-slate-900/80 hover:bg-slate-800/90 border border-slate-700/80 hover:border-indigo-500/50 backdrop-blur-xl shadow-lg transition-all duration-200 flex items-center justify-center gap-3 cursor-pointer group"
          >
            <Play className="w-4 h-4 text-blue-400 fill-blue-400 group-hover:scale-110 transition-transform" />
            <span>Try Demo</span>
          </motion.button>
        </motion.div>

        {/* Micro Confidence Metrics */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.7, delay: 0.4 }}
          className="grid grid-cols-2 sm:grid-cols-3 gap-3 sm:gap-4 max-w-2xl mx-auto pt-2 text-xs sm:text-sm text-slate-400"
        >
          <div className="flex items-center justify-center gap-2.5 py-2.5 px-3.5 rounded-xl bg-slate-900/60 border border-slate-800/80 backdrop-blur-md hover:border-purple-500/40 transition-colors">
            <Clock className="w-4 h-4 text-purple-400 shrink-0" />
            <span className="text-slate-300 font-medium">Calibrated to exact time left</span>
          </div>
          <div className="flex items-center justify-center gap-2.5 py-2.5 px-3.5 rounded-xl bg-slate-900/60 border border-slate-800/80 backdrop-blur-md hover:border-amber-500/40 transition-colors">
            <Flame className="w-4 h-4 text-amber-400 shrink-0" />
            <span className="text-slate-300 font-medium">Top 20% highest-yield topics</span>
          </div>
          <div className="col-span-2 sm:col-span-1 flex items-center justify-center gap-2.5 py-2.5 px-3.5 rounded-xl bg-slate-900/60 border border-slate-800/80 backdrop-blur-md hover:border-blue-500/40 transition-colors">
            <CheckCircle2 className="w-4 h-4 text-blue-400 shrink-0" />
            <span className="text-slate-300 font-medium">Zero fluff, pure exam recall</span>
          </div>
        </motion.div>
      </div>
    </section>
  );
};

