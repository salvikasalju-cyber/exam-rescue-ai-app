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
    <section id="how-it-works" className="relative py-16 sm:py-24 px-4 sm:px-6 lg:px-8 overflow-hidden border-t border-[#294238]">
      {/* Background ambient lighting */}
      <div className="absolute top-1/2 right-0 w-[450px] h-[450px] bg-[#2F6B4A]/10 blur-[140px] rounded-full pointer-events-none -z-10" />
      <div className="absolute bottom-0 left-10 w-[450px] h-[450px] bg-[#2F6B4A]/10 blur-[140px] rounded-full pointer-events-none -z-10" />

      <div className="max-w-6xl mx-auto">
        {/* Section Header */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="text-center max-w-3xl mx-auto mb-14 sm:mb-20"
        >
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#12211D] border border-[#294238] text-[#8FD3A2] text-xs font-bold uppercase tracking-wider mb-4">
            <Sparkles className="w-3.5 h-3.5 text-[#8FD3A2]" />
            <span>The 3-Step Emergency Framework</span>
          </div>

          <h2 className="text-3xl sm:text-4xl md:text-5xl font-extrabold text-[#F2F7F3] tracking-tight font-display">
            How Exam Rescue Works
          </h2>

          <p className="mt-4 text-base sm:text-lg text-[#AEBDB4] leading-relaxed font-normal">
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
            className="relative rounded-3xl bg-[#12211D] border border-[#294238] hover:border-[#8FD3A2]/60 p-6 sm:p-7 flex flex-col justify-between transition-all duration-300 group overflow-hidden"
          >
            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-[#8FD3A2]/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />

            <div>
              <div className="flex items-center justify-between mb-5">
                <div className="w-12 h-12 rounded-2xl bg-[#2F6B4A]/25 border border-[#8FD3A2]/30 flex items-center justify-center text-[#BFE8C8] shadow-md group-hover:scale-105 transition-transform">
                  <UploadCloud className="w-6 h-6 text-[#8FD3A2]" />
                </div>
                <span className="text-xs font-mono font-bold text-[#7F9188] bg-[#0D1916] px-3 py-1 rounded-lg border border-[#294238]">
                  Step 01
                </span>
              </div>

              <h3 className="text-xl font-bold text-[#F2F7F3] mb-2 font-display">
                1. Upload your notes
              </h3>
              <p className="text-sm text-[#AEBDB4] leading-relaxed mb-6 font-normal">
                Drag and drop slide decks, PDF lecture notes, syllabi, study guides, or smartphone photos of textbook chapters.
              </p>

              {/* Realistic Mock UI Preview Card */}
              <div className="p-4 rounded-xl bg-[#0D1916] border border-[#294238] text-xs space-y-3">
                <div className="flex items-center justify-between pb-2 border-b border-[#294238]">
                  <div className="flex items-center gap-2">
                    <FileText className="w-4 h-4 text-[#8FD3A2]" />
                    <span className="font-semibold text-[#F2F7F3]">CS201_Trees_Review.pdf</span>
                  </div>
                  <span className="text-[10px] text-[#9FE2B0] bg-[#2F6B4A]/30 px-2 py-0.5 rounded border border-[#9FE2B0]/40 font-semibold">
                    Parsed
                  </span>
                </div>
                <div className="flex items-center justify-between text-[11px] text-[#AEBDB4]">
                  <span>94 Slides Indexed</span>
                  <span className="text-[#BFE8C8] font-mono font-medium">14 Formulas</span>
                </div>
                <div className="w-full bg-[#08110F] rounded-full h-2 overflow-hidden border border-[#294238]">
                  <div className="bg-gradient-to-r from-[#2F6B4A] to-[#8FD3A2] h-full w-full rounded-full" />
                </div>
              </div>
            </div>

            <div className="mt-6 pt-4 border-t border-[#294238] flex items-center justify-between text-xs text-[#7F9188]">
              <span className="flex items-center gap-1.5 font-medium text-[#AEBDB4]">
                <Check className="w-3.5 h-3.5 text-[#8FD3A2]" />
                PDF, PPTX, Doc, Images
              </span>
              <span className="text-[#8FD3A2] font-semibold">Instant OCR</span>
            </div>
          </motion.div>

          {/* STEP 2: AI creates your rescue plan */}
          <motion.div 
            initial={{ opacity: 0, y: 25 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.2 }}
            whileHover={{ y: -4 }}
            className="relative rounded-3xl bg-[#12211D] border border-[#294238] hover:border-[#8FD3A2]/60 p-6 sm:p-7 flex flex-col justify-between transition-all duration-300 group overflow-hidden"
          >
            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-[#8FD3A2] to-transparent" />

            <div>
              <div className="flex items-center justify-between mb-5">
                <div className="w-12 h-12 rounded-2xl bg-[#2F6B4A]/25 border border-[#8FD3A2]/30 flex items-center justify-center text-[#BFE8C8] shadow-md group-hover:scale-105 transition-transform">
                  <Cpu className="w-6 h-6 text-[#8FD3A2]" />
                </div>
                <span className="text-xs font-mono font-bold text-[#8FD3A2] bg-[#0D1916] px-3 py-1 rounded-lg border border-[#294238]">
                  Step 02
                </span>
              </div>

              <h3 className="text-xl font-bold text-[#F2F7F3] mb-2 font-display">
                2. AI creates your rescue plan
              </h3>
              <p className="text-sm text-[#AEBDB4] leading-relaxed mb-6 font-normal">
                Our urgency engine scores topics by expected exam points, conceptual difficulty, and your remaining countdown time.
              </p>

              {/* Realistic Mock UI Preview Card */}
              <div className="p-4 rounded-xl bg-[#0D1916] border border-[#294238] text-xs space-y-2.5">
                <div className="flex items-center justify-between text-[11px]">
                  <span className="text-[#7F9188] font-medium">Yield Optimization:</span>
                  <span className="font-mono text-[#BFE8C8] font-bold bg-[#12211D] px-2 py-0.5 rounded border border-[#294238]">
                    4.8x Point ROI
                  </span>
                </div>
                <div className="space-y-1.5 text-[11px]">
                  <div className="flex items-center justify-between p-2 rounded-lg bg-[#172A24] border border-[#F29B9B]/30">
                    <span className="text-[#F29B9B] font-semibold">Binary Search Tree</span>
                    <span className="text-[#F29B9B] font-mono font-bold">85% Imp • 20m</span>
                  </div>
                  <div className="flex items-center justify-between p-2 rounded-lg bg-[#172A24] border border-[#E8D58A]/30">
                    <span className="text-[#E8D58A] font-semibold">AVL Trees</span>
                    <span className="text-[#E8D58A] font-mono font-bold">60% Imp • 15m</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-6 pt-4 border-t border-[#294238] flex items-center justify-between text-xs text-[#7F9188]">
              <span className="flex items-center gap-1.5 font-medium text-[#AEBDB4]">
                <Check className="w-3.5 h-3.5 text-[#8FD3A2]" />
                Pareto 80/20 Rule
              </span>
              <span className="text-[#8FD3A2] font-semibold">Auto-Tuned</span>
            </div>
          </motion.div>

          {/* STEP 3: Practice and improve */}
          <motion.div 
            initial={{ opacity: 0, y: 25 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.3 }}
            whileHover={{ y: -4 }}
            className="relative rounded-3xl bg-[#12211D] border border-[#294238] hover:border-[#8FD3A2]/60 p-6 sm:p-7 flex flex-col justify-between transition-all duration-300 group overflow-hidden"
          >
            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-[#8FD3A2]/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />

            <div>
              <div className="flex items-center justify-between mb-5">
                <div className="w-12 h-12 rounded-2xl bg-[#2F6B4A]/25 border border-[#8FD3A2]/30 flex items-center justify-center text-[#BFE8C8] shadow-md group-hover:scale-105 transition-transform">
                  <Award className="w-6 h-6 text-[#8FD3A2]" />
                </div>
                <span className="text-xs font-mono font-bold text-[#7F9188] bg-[#0D1916] px-3 py-1 rounded-lg border border-[#294238]">
                  Step 03
                </span>
              </div>

              <h3 className="text-xl font-bold text-[#F2F7F3] mb-2 font-display">
                3. Practice and improve
              </h3>
              <p className="text-sm text-[#AEBDB4] leading-relaxed mb-6 font-normal">
                Test yourself on rapid active recall flash questions, avoid common professor test traps, and watch your readiness climb.
              </p>

              {/* Realistic Mock UI Preview Card */}
              <div className="p-4 rounded-xl bg-[#0D1916] border border-[#294238] text-xs space-y-2.5">
                <div className="flex items-center justify-between text-[11px] pb-1.5 border-b border-[#294238]">
                  <span className="text-[#7F9188] font-medium">Exam Readiness Score</span>
                  <span className="text-[#9FE2B0] font-extrabold font-mono flex items-center gap-1">
                    <TrendingUp className="w-3.5 h-3.5" /> 62% → 88%
                  </span>
                </div>
                <div className="p-2.5 rounded-lg bg-[#172A24] border border-[#9FE2B0]/30 text-[11px]">
                  <p className="text-[#9FE2B0] font-semibold line-clamp-1">
                    ✓ Trap avoided: BST worst case is O(n)
                  </p>
                  <p className="text-[#7F9188] text-[10px] mt-0.5">
                    Confidence locked for 20% test weight
                  </p>
                </div>
              </div>
            </div>

            <div className="mt-6 pt-4 border-t border-[#294238] flex items-center justify-between text-xs text-[#7F9188]">
              <span className="flex items-center gap-1.5 font-medium text-[#AEBDB4]">
                <Check className="w-3.5 h-3.5 text-[#8FD3A2]" />
                Active Recall Drill
              </span>
              <span className="text-[#9FE2B0] font-semibold">Exam Ready</span>
            </div>
          </motion.div>
        </div>

        {/* Bottom CTA Banner */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="mt-12 sm:mt-16 p-6 sm:p-8 rounded-3xl bg-[#12211D] border border-[#294238] flex flex-col sm:flex-row items-center justify-between gap-6 shadow-2xl relative overflow-hidden"
        >
          <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-[#8FD3A2]/40 to-transparent" />

          <div className="text-center sm:text-left z-10">
            <h4 className="text-xl sm:text-2xl font-bold text-[#F2F7F3] font-display">
              Ready to save your exam tomorrow?
            </h4>
            <p className="text-sm text-[#AEBDB4] mt-1">
              Start with the live interactive demo or drop in your course notes in seconds.
            </p>
          </div>
          <div className="flex items-center gap-3.5 w-full sm:w-auto z-10">
            <motion.button
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.98 }}
              id="howitworks-demo-btn"
              onClick={onDemoClick}
              className="flex-1 sm:flex-initial px-5 py-3.5 rounded-xl text-sm font-semibold text-[#AEBDB4] hover:text-[#F2F7F3] bg-[#0D1916] hover:bg-[#172A24] border border-[#294238] transition-all cursor-pointer shadow-sm"
            >
              Test Live Dashboard
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.98 }}
              id="howitworks-upload-btn"
              onClick={onUploadClick}
              className="flex-1 sm:flex-initial px-6 py-3.5 rounded-xl text-sm font-bold text-[#08110F] bg-[#BFE8C8] hover:bg-[#D9F3DE] shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer border border-[#8FD3A2]/40"
            >
              <Zap className="w-4 h-4 text-[#08110F] fill-[#08110F]" />
              <span>Upload Notes</span>
            </motion.button>
          </div>
        </motion.div>
      </div>
    </section>
  );
};

