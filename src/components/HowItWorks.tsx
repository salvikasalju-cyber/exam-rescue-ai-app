import React from 'react';
import { motion } from 'motion/react';
import { 
  UploadCloud, 
  Cpu, 
  Award, 
  FileText, 
  Check, 
  Sparkles, 
  Zap, 
  CheckCircle2, 
  ArrowRight,
  TrendingUp,
  Brain
} from 'lucide-react';

interface HowItWorksProps {
  onUploadClick: () => void;
  onDemoClick: () => void;
}

export const HowItWorks: React.FC<HowItWorksProps> = ({ onUploadClick, onDemoClick }) => {
  return (
    <section id="how-it-works" className="relative py-16 sm:py-24 px-4 sm:px-6 lg:px-8 overflow-hidden border-t border-slate-800/80">
      {/* Background ambient lighting */}
      <div className="absolute top-1/2 right-0 w-[450px] h-[450px] bg-purple-900/15 blur-[140px] rounded-full pointer-events-none -z-10" />
      <div className="absolute bottom-0 left-10 w-[450px] h-[450px] bg-blue-900/15 blur-[140px] rounded-full pointer-events-none -z-10" />

      <div className="max-w-6xl mx-auto">
        {/* Section Header */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="text-center max-w-3xl mx-auto mb-14 sm:mb-20"
        >
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-purple-950/70 border border-purple-500/40 text-purple-300 text-xs font-bold uppercase tracking-wider mb-4 shadow-[0_0_15px_rgba(168,85,247,0.25)]">
            <Sparkles className="w-3.5 h-3.5 text-purple-400" />
            <span>The 3-Step Emergency Framework</span>
          </div>

          <h2 className="text-3xl sm:text-4xl md:text-5xl font-extrabold text-white tracking-tight font-display">
            How Exam Rescue Works
          </h2>

          <p className="mt-4 text-base sm:text-lg text-slate-300 leading-relaxed font-normal">
            When you have under 12 hours before test time, reading 200 slide decks is impossible.{' '}
            Here is how Exam Rescue AI turns panic into a clinical, point-maximizing study protocol.
          </p>
        </motion.div>

        {/* The 3 Steps Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8">
          {/* STEP 1: Upload your notes */}
          <motion.div 
            initial={{ opacity: 0, y: 25 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.1 }}
            whileHover={{ y: -4 }}
            className="relative rounded-3xl backdrop-blur-xl bg-[#0a1024]/90 border border-slate-800 hover:border-purple-500/50 p-6 sm:p-7 flex flex-col justify-between transition-all duration-300 hover:shadow-[0_16px_50px_rgba(168,85,247,0.2)] group overflow-hidden"
          >
            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-purple-500/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />

            <div>
              <div className="flex items-center justify-between mb-5">
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-purple-600/30 to-indigo-600/30 border border-purple-500/40 flex items-center justify-center text-purple-300 shadow-md group-hover:scale-105 transition-transform">
                  <UploadCloud className="w-6 h-6 text-purple-400" />
                </div>
                <span className="text-xs font-mono font-bold text-slate-400 bg-slate-900/90 px-3 py-1 rounded-lg border border-slate-800 shadow-inner">
                  Step 01
                </span>
              </div>

              <h3 className="text-xl font-bold text-white mb-2 font-display">
                1. Upload your notes
              </h3>
              <p className="text-sm text-slate-300 leading-relaxed mb-6 font-normal">
                Drag and drop slide decks, PDF lecture notes, syllabi, study guides, or smartphone photos of textbook chapters.
              </p>

              {/* Realistic Mock UI Preview Card */}
              <div className="p-4 rounded-xl bg-slate-950/80 border border-slate-800/90 text-xs space-y-3 shadow-inner">
                <div className="flex items-center justify-between pb-2 border-b border-slate-800/80">
                  <div className="flex items-center gap-2">
                    <FileText className="w-4 h-4 text-purple-400" />
                    <span className="font-semibold text-slate-200">CS201_Trees_Review.pdf</span>
                  </div>
                  <span className="text-[10px] text-emerald-400 bg-emerald-950/70 px-2 py-0.5 rounded border border-emerald-500/40 font-semibold">
                    Parsed
                  </span>
                </div>
                <div className="flex items-center justify-between text-[11px] text-slate-400">
                  <span>94 Slides Indexed</span>
                  <span className="text-purple-300 font-mono font-medium">14 Formulas</span>
                </div>
                <div className="w-full bg-slate-800/90 rounded-full h-2 overflow-hidden">
                  <div className="bg-gradient-to-r from-purple-500 to-indigo-500 h-full w-full rounded-full shadow-[0_0_10px_rgba(168,85,247,0.7)]" />
                </div>
              </div>
            </div>

            <div className="mt-6 pt-4 border-t border-slate-800/80 flex items-center justify-between text-xs text-slate-400">
              <span className="flex items-center gap-1.5 font-medium text-slate-300">
                <Check className="w-3.5 h-3.5 text-purple-400" />
                PDF, PPTX, Doc, Images
              </span>
              <span className="text-indigo-400 font-semibold">Instant OCR</span>
            </div>
          </motion.div>

          {/* STEP 2: AI creates your rescue plan */}
          <motion.div 
            initial={{ opacity: 0, y: 25 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.2 }}
            whileHover={{ y: -4 }}
            className="relative rounded-3xl backdrop-blur-xl bg-[#0a1024]/90 border border-indigo-500/45 hover:border-indigo-400 p-6 sm:p-7 flex flex-col justify-between transition-all duration-300 shadow-[0_16px_50px_rgba(99,102,241,0.22)] group overflow-hidden"
          >
            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-indigo-500 to-transparent" />

            <div>
              <div className="flex items-center justify-between mb-5">
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-indigo-600/30 to-blue-600/30 border border-indigo-500/40 flex items-center justify-center text-indigo-300 shadow-md group-hover:scale-105 transition-transform">
                  <Cpu className="w-6 h-6 text-indigo-400" />
                </div>
                <span className="text-xs font-mono font-bold text-indigo-300 bg-indigo-950/80 px-3 py-1 rounded-lg border border-indigo-500/40 shadow-inner">
                  Step 02
                </span>
              </div>

              <h3 className="text-xl font-bold text-white mb-2 font-display">
                2. AI creates your rescue plan
              </h3>
              <p className="text-sm text-slate-300 leading-relaxed mb-6 font-normal">
                Our urgency engine scores topics by expected exam points, conceptual difficulty, and your remaining countdown time.
              </p>

              {/* Realistic Mock UI Preview Card */}
              <div className="p-4 rounded-xl bg-slate-950/80 border border-indigo-500/35 text-xs space-y-2.5 shadow-inner">
                <div className="flex items-center justify-between text-[11px]">
                  <span className="text-slate-400 font-medium">Yield Optimization:</span>
                  <span className="font-mono text-indigo-300 font-bold bg-indigo-950/60 px-2 py-0.5 rounded border border-indigo-500/30">
                    4.8x Point ROI
                  </span>
                </div>
                <div className="space-y-1.5 text-[11px]">
                  <div className="flex items-center justify-between p-2 rounded-lg bg-[#11193d] border border-red-500/30">
                    <span className="text-red-300 font-semibold">Binary Search Tree</span>
                    <span className="text-red-400 font-mono font-bold">85% Imp • 20m</span>
                  </div>
                  <div className="flex items-center justify-between p-2 rounded-lg bg-[#0e1634] border border-amber-500/25">
                    <span className="text-amber-300 font-semibold">AVL Trees</span>
                    <span className="text-amber-400 font-mono font-bold">60% Imp • 15m</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-6 pt-4 border-t border-slate-800/80 flex items-center justify-between text-xs text-slate-400">
              <span className="flex items-center gap-1.5 font-medium text-slate-300">
                <Check className="w-3.5 h-3.5 text-indigo-400" />
                Pareto 80/20 Rule
              </span>
              <span className="text-blue-400 font-semibold">Auto-Tuned</span>
            </div>
          </motion.div>

          {/* STEP 3: Practice and improve */}
          <motion.div 
            initial={{ opacity: 0, y: 25 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.3 }}
            whileHover={{ y: -4 }}
            className="relative rounded-3xl backdrop-blur-xl bg-[#0a1024]/90 border border-slate-800 hover:border-blue-500/50 p-6 sm:p-7 flex flex-col justify-between transition-all duration-300 hover:shadow-[0_16px_50px_rgba(59,130,246,0.2)] group overflow-hidden"
          >
            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-blue-500/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />

            <div>
              <div className="flex items-center justify-between mb-5">
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-blue-600/30 to-teal-600/30 border border-blue-500/40 flex items-center justify-center text-blue-300 shadow-md group-hover:scale-105 transition-transform">
                  <Award className="w-6 h-6 text-blue-400" />
                </div>
                <span className="text-xs font-mono font-bold text-slate-400 bg-slate-900/90 px-3 py-1 rounded-lg border border-slate-800 shadow-inner">
                  Step 03
                </span>
              </div>

              <h3 className="text-xl font-bold text-white mb-2 font-display">
                3. Practice and improve
              </h3>
              <p className="text-sm text-slate-300 leading-relaxed mb-6 font-normal">
                Test yourself on rapid active recall flash questions, avoid common professor test traps, and watch your readiness climb.
              </p>

              {/* Realistic Mock UI Preview Card */}
              <div className="p-4 rounded-xl bg-slate-950/80 border border-slate-800/90 text-xs space-y-2.5 shadow-inner">
                <div className="flex items-center justify-between text-[11px] pb-1.5 border-b border-slate-800/80">
                  <span className="text-slate-400 font-medium">Exam Readiness Score</span>
                  <span className="text-emerald-400 font-extrabold font-mono flex items-center gap-1">
                    <TrendingUp className="w-3.5 h-3.5" /> 62% → 88%
                  </span>
                </div>
                <div className="p-2.5 rounded-lg bg-emerald-950/30 border border-emerald-500/40 text-[11px]">
                  <p className="text-emerald-300 font-semibold line-clamp-1">
                    ✓ Trap avoided: BST worst case is O(n)
                  </p>
                  <p className="text-slate-400 text-[10px] mt-0.5">
                    Confidence locked for 20% test weight
                  </p>
                </div>
              </div>
            </div>

            <div className="mt-6 pt-4 border-t border-slate-800/80 flex items-center justify-between text-xs text-slate-400">
              <span className="flex items-center gap-1.5 font-medium text-slate-300">
                <Check className="w-3.5 h-3.5 text-blue-400" />
                Active Recall Drill
              </span>
              <span className="text-emerald-400 font-semibold">Exam Ready</span>
            </div>
          </motion.div>
        </div>

        {/* Bottom CTA Banner */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="mt-12 sm:mt-16 p-6 sm:p-8 rounded-3xl backdrop-blur-xl bg-gradient-to-r from-[#0d1637] via-[#141b44] to-[#0f1435] border border-indigo-500/40 flex flex-col sm:flex-row items-center justify-between gap-6 shadow-2xl relative overflow-hidden"
        >
          <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-indigo-400/50 to-transparent" />

          <div className="text-center sm:text-left z-10">
            <h4 className="text-xl sm:text-2xl font-bold text-white font-display">
              Ready to save your exam tomorrow?
            </h4>
            <p className="text-sm text-slate-300 mt-1">
              Start with the live interactive demo or drop in your course notes in seconds.
            </p>
          </div>
          <div className="flex items-center gap-3.5 w-full sm:w-auto z-10">
            <motion.button
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.98 }}
              id="howitworks-demo-btn"
              onClick={onDemoClick}
              className="flex-1 sm:flex-initial px-5 py-3.5 rounded-xl text-sm font-semibold text-slate-200 hover:text-white bg-slate-900/90 hover:bg-slate-800 border border-slate-700 hover:border-indigo-500/50 transition-all cursor-pointer shadow-sm"
            >
              Test Live Dashboard
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.98 }}
              id="howitworks-upload-btn"
              onClick={onUploadClick}
              className="flex-1 sm:flex-initial px-6 py-3.5 rounded-xl text-sm font-bold text-white bg-gradient-to-r from-purple-600 via-indigo-600 to-blue-600 hover:from-purple-500 hover:via-indigo-500 hover:to-blue-500 shadow-[0_0_25px_rgba(99,102,241,0.5)] transition-all flex items-center justify-center gap-2 cursor-pointer border border-indigo-400/30"
            >
              <Zap className="w-4 h-4 text-yellow-300 fill-yellow-300 animate-bounce" />
              <span>Upload Notes</span>
            </motion.button>
          </div>
        </motion.div>
      </div>
    </section>
  );
};

