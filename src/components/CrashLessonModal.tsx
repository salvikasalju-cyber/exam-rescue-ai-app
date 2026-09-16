import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  BookOpen, 
  X, 
  Sparkles, 
  Clock, 
  AlertTriangle, 
  CheckCircle2, 
  RefreshCw, 
  Lightbulb, 
  ArrowRight,
  Code2,
  Zap
} from 'lucide-react';
import { CrashLesson, ExamRescuePlan } from '../types';
import { fetchCrashLesson } from '../utils/rescueQuiz';

interface CrashLessonModalProps {
  isOpen: boolean;
  topicName: string | null;
  plan: ExamRescuePlan;
  onClose: () => void;
  onStartRetest: (topicName: string) => void;
}

export const CrashLessonModal: React.FC<CrashLessonModalProps> = ({
  isOpen,
  topicName,
  plan,
  onClose,
  onStartRetest
}) => {
  const [lesson, setLesson] = useState<CrashLesson | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen || !topicName) {
      setLesson(null);
      setError(null);
      return;
    }

    let isMounted = true;
    setLoading(true);
    setError(null);

    fetchCrashLesson(topicName, plan)
      .then((data) => {
        if (isMounted) {
          setLesson(data);
          setLoading(false);
        }
      })
      .catch((err) => {
        if (isMounted) {
          console.error('Error in crash lesson:', err);
          setError('Could not load full lesson. Please try again.');
          setLoading(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, [isOpen, topicName, plan]);

  if (!isOpen || !topicName) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 md:p-6 overflow-y-auto">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="fixed inset-0 bg-slate-950/85 backdrop-blur-md transition-opacity"
        />

        {/* Modal Container */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 15 }}
          transition={{ duration: 0.25, ease: 'easeOut' }}
          className="relative w-full max-w-2xl bg-[#0b122c] border border-indigo-500/40 rounded-3xl shadow-[0_20px_70px_rgba(0,0,0,0.8)] overflow-hidden z-10 my-auto"
        >
          {/* Top Decorative Gradient */}
          <div className="h-1.5 w-full bg-gradient-to-r from-purple-500 via-indigo-500 to-amber-400" />

          {/* Modal Header */}
          <div className="p-5 sm:p-6 border-b border-slate-800/80 flex items-center justify-between bg-slate-900/60">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-300 shadow-sm">
                <Zap className="w-5 h-5 fill-amber-300" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-black uppercase tracking-wider text-amber-400 bg-amber-950/60 px-2 py-0.5 rounded-full border border-amber-500/40">
                    3-Minute Crash Lesson
                  </span>
                  <span className="text-xs text-slate-400 flex items-center gap-1">
                    <Clock className="w-3 h-3" /> Quick Sprint
                  </span>
                </div>
                <h3 className="text-xl sm:text-2xl font-black text-white tracking-wide mt-1 font-display">
                  {topicName}
                </h3>
              </div>
            </div>

            <button
              id="close-crash-lesson-btn"
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-white bg-slate-800/80 hover:bg-slate-700/80 rounded-xl border border-slate-700/60 transition-colors cursor-pointer"
              aria-label="Close"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Modal Body */}
          <div className="p-5 sm:p-7 max-h-[70vh] overflow-y-auto space-y-6">
            {loading ? (
              <div className="py-16 text-center space-y-4">
                <RefreshCw className="w-8 h-8 text-amber-400 animate-spin mx-auto" />
                <p className="text-sm font-semibold text-white">
                  Generating high-yield crash lesson for <span className="text-amber-300">{topicName}</span>...
                </p>
                <p className="text-xs text-slate-400">
                  Synthesizing key rules, formulas, and common exam traps.
                </p>
              </div>
            ) : error ? (
              <div className="p-4 rounded-xl bg-red-950/50 border border-red-500/40 text-red-200 text-sm">
                {error}
              </div>
            ) : lesson ? (
              <>
                {/* 1. Simple Explanation */}
                <div className="p-4 sm:p-5 rounded-2xl bg-indigo-950/30 border border-indigo-500/30 space-y-2">
                  <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-indigo-300">
                    <Sparkles className="w-4 h-4 text-purple-400" />
                    <span>Simple Explanation</span>
                  </div>
                  <p className="text-sm sm:text-base text-slate-200 leading-relaxed font-normal">
                    {lesson.summary}
                  </p>
                </div>

                {/* 2. Key Points */}
                <div className="space-y-2.5">
                  <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-300">
                    <BookOpen className="w-4 h-4 text-indigo-400" />
                    <span>Key Exam Points</span>
                  </div>
                  <div className="grid grid-cols-1 gap-2">
                    {lesson.keyPoints.map((point, idx) => (
                      <div 
                        key={idx} 
                        className="p-3 rounded-xl bg-slate-900/80 border border-slate-800 text-xs sm:text-sm text-slate-300 flex items-start gap-2.5"
                      >
                        <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                        <span>{point}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* 3. Important Formula / Rule / Steps */}
                {lesson.formulaOrRule && (
                  <div className="p-4 rounded-2xl bg-purple-950/30 border border-purple-500/40 space-y-2">
                    <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-purple-300">
                      <Code2 className="w-4 h-4 text-purple-400" />
                      <span>Important Formula / Rule / Steps</span>
                    </div>
                    <div className="font-mono text-xs sm:text-sm text-amber-200 bg-slate-950/80 p-3 rounded-xl border border-purple-500/30 overflow-x-auto whitespace-pre-wrap">
                      {lesson.formulaOrRule}
                    </div>
                  </div>
                )}

                {/* 4. One Small Example */}
                {lesson.smallExample && (
                  <div className="p-4 rounded-2xl bg-slate-900/90 border border-slate-800 space-y-2">
                    <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-blue-300">
                      <Lightbulb className="w-4 h-4 text-yellow-400" />
                      <span>Concrete Example</span>
                    </div>
                    <p className="text-xs sm:text-sm text-slate-300 whitespace-pre-wrap leading-relaxed">
                      {lesson.smallExample}
                    </p>
                  </div>
                )}

                {/* 5. One Exam Tip */}
                {lesson.examTip && (
                  <div className="p-4 rounded-2xl bg-amber-950/40 border border-amber-500/50 flex items-start gap-3 shadow-[0_0_20px_rgba(245,158,11,0.15)]">
                    <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
                    <div>
                      <span className="text-xs font-extrabold uppercase tracking-wider text-amber-300 block mb-1">
                        High-Yield Exam Tip & Trap Warning
                      </span>
                      <p className="text-xs sm:text-sm text-amber-100/90 leading-relaxed font-medium">
                        {lesson.examTip}
                      </p>
                    </div>
                  </div>
                )}
              </>
            ) : null}
          </div>

          {/* Modal Footer with Re-test Button */}
          <div className="p-5 sm:p-6 border-t border-slate-800/80 bg-slate-900/80 flex flex-col sm:flex-row items-center justify-between gap-3">
            <button
              id="close-lesson-footer-btn"
              onClick={onClose}
              className="w-full sm:w-auto px-5 py-2.5 rounded-xl text-xs font-semibold text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 transition-colors cursor-pointer"
            >
              Done Reviewing
            </button>

            <button
              id="retest-topic-btn"
              onClick={() => {
                onClose();
                onStartRetest(topicName);
              }}
              className="w-full sm:w-auto px-6 py-2.5 rounded-xl text-sm font-bold text-white bg-gradient-to-r from-amber-600 via-indigo-600 to-purple-600 hover:from-amber-500 hover:to-purple-500 shadow-[0_0_25px_rgba(245,158,11,0.3)] transition-all flex items-center justify-center gap-2 cursor-pointer border border-amber-400/40"
            >
              <span>Re-test Topic</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
