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
          className="relative w-full max-w-2xl bg-[#08110F] border border-[#294238] rounded-3xl shadow-[0_20px_70px_rgba(0,0,0,0.8)] overflow-hidden z-10 my-auto text-[#F2F7F3]"
        >
          {/* Top Decorative Gradient */}
          <div className="h-1.5 w-full bg-gradient-to-r from-[#2F6B4A] via-[#8FD3A2] to-[#BFE8C8]" />

          {/* Modal Header */}
          <div className="p-5 sm:p-6 border-b border-[#294238] flex items-center justify-between bg-[#0D1916]">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-[#2F6B4A]/25 border border-[#8FD3A2]/40 flex items-center justify-center text-[#BFE8C8] shadow-sm">
                <Zap className="w-5 h-5 fill-[#8FD3A2] text-[#8FD3A2]" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-black uppercase tracking-wider text-[#8FD3A2] bg-[#12211D] px-2 py-0.5 rounded-full border border-[#294238]">
                    3-Minute Crash Lesson
                  </span>
                  <span className="text-xs text-[#7F9188] flex items-center gap-1">
                    <Clock className="w-3 h-3 text-[#8FD3A2]" /> Quick Sprint
                  </span>
                </div>
                <h3 className="text-xl sm:text-2xl font-black text-[#F2F7F3] tracking-wide mt-1 font-display">
                  {topicName}
                </h3>
              </div>
            </div>

            <button
              id="close-crash-lesson-btn"
              onClick={onClose}
              className="p-2 text-[#AEBDB4] hover:text-[#F2F7F3] bg-[#12211D] hover:bg-[#172A24] rounded-xl border border-[#294238] transition-colors cursor-pointer"
              aria-label="Close"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Modal Body */}
          <div className="p-5 sm:p-7 max-h-[70vh] overflow-y-auto space-y-6">
            {loading ? (
              <div className="py-16 text-center space-y-4">
                <RefreshCw className="w-8 h-8 text-[#8FD3A2] animate-spin mx-auto" />
                <p className="text-sm font-semibold text-[#F2F7F3]">
                  Generating high-yield crash lesson for <span className="text-[#BFE8C8]">{topicName}</span>...
                </p>
                <p className="text-xs text-[#7F9188]">
                  Synthesizing key rules, formulas, and common exam traps.
                </p>
              </div>
            ) : error ? (
              <div className="p-4 rounded-xl bg-[#0D1916] border border-[#F29B9B]/40 text-[#F29B9B] text-sm">
                {error}
              </div>
            ) : lesson ? (
              <>
                {/* 1. Simple Explanation */}
                <div className="p-4 sm:p-5 rounded-2xl bg-[#12211D] border border-[#294238] space-y-2">
                  <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[#8FD3A2]">
                    <Sparkles className="w-4 h-4 text-[#8FD3A2]" />
                    <span>Simple Explanation</span>
                  </div>
                  <p className="text-sm sm:text-base text-[#AEBDB4] leading-relaxed font-normal">
                    {lesson.summary}
                  </p>
                </div>

                {/* 2. Key Points */}
                <div className="space-y-2.5">
                  <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[#BFE8C8]">
                    <BookOpen className="w-4 h-4 text-[#8FD3A2]" />
                    <span>Key Exam Points</span>
                  </div>
                  <div className="grid grid-cols-1 gap-2">
                    {lesson.keyPoints.map((point, idx) => (
                      <div 
                        key={idx} 
                        className="p-3 rounded-xl bg-[#0D1916] border border-[#294238] text-xs sm:text-sm text-[#AEBDB4] flex items-start gap-2.5"
                      >
                        <CheckCircle2 className="w-4 h-4 text-[#9FE2B0] shrink-0 mt-0.5" />
                        <span>{point}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* 3. Important Formula / Rule / Steps */}
                {lesson.formulaOrRule && (
                  <div className="p-4 rounded-2xl bg-[#12211D] border border-[#294238] space-y-2">
                    <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[#8FD3A2]">
                      <Code2 className="w-4 h-4 text-[#8FD3A2]" />
                      <span>Important Formula / Rule</span>
                    </div>
                    <div className="font-mono text-xs sm:text-sm text-[#BFE8C8] bg-[#08110F] p-3 rounded-xl border border-[#294238] overflow-x-auto whitespace-pre-wrap">
                      {lesson.formulaOrRule}
                    </div>
                  </div>
                )}

                {/* Important Steps */}
                {lesson.importantSteps && lesson.importantSteps.length > 0 && (
                  <div className="p-4 rounded-2xl bg-[#12211D] border border-[#294238] space-y-2">
                    <span className="text-xs font-bold uppercase tracking-wider text-[#BFE8C8] block">
                      Important Steps to Follow
                    </span>
                    <div className="space-y-1.5">
                      {lesson.importantSteps.map((step, sIdx) => (
                        <div key={sIdx} className="text-xs sm:text-sm text-[#AEBDB4] flex items-start gap-2">
                          <span className="w-5 h-5 rounded-full bg-[#08110F] text-[#8FD3A2] font-mono text-[11px] font-bold flex items-center justify-center shrink-0 border border-[#294238]">
                            {sIdx + 1}
                          </span>
                          <span className="pt-0.5">{step}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* 4. One Small Example */}
                {lesson.smallExample && (
                  <div className="p-4 rounded-2xl bg-[#12211D] border border-[#294238] space-y-2">
                    <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[#BFE8C8]">
                      <Lightbulb className="w-4 h-4 text-[#E8D58A]" />
                      <span>Concrete Example</span>
                    </div>
                    <p className="text-xs sm:text-sm text-[#AEBDB4] whitespace-pre-wrap leading-relaxed">
                      {lesson.smallExample}
                    </p>
                  </div>
                )}

                {/* Common Mistake */}
                {lesson.commonMistake && (
                  <div className="p-4 rounded-2xl bg-[#0D1916] border border-[#F29B9B]/40 flex items-start gap-3">
                    <AlertTriangle className="w-5 h-5 text-[#F29B9B] shrink-0 mt-0.5" />
                    <div>
                      <span className="text-xs font-extrabold uppercase tracking-wider text-[#F29B9B] block mb-1">
                        Common Exam Mistake
                      </span>
                      <p className="text-xs sm:text-sm text-[#AEBDB4] leading-relaxed">
                        {lesson.commonMistake}
                      </p>
                    </div>
                  </div>
                )}

                {/* 5. One Exam Tip */}
                {lesson.examTip && (
                  <div className="p-4 rounded-2xl bg-[#0D1916] border border-[#E8D58A]/40 flex items-start gap-3 shadow-[0_0_20px_rgba(232,213,138,0.1)]">
                    <AlertTriangle className="w-5 h-5 text-[#E8D58A] shrink-0 mt-0.5" />
                    <div>
                      <span className="text-xs font-extrabold uppercase tracking-wider text-[#E8D58A] block mb-1">
                        High-Yield Exam Tip & Trap Warning
                      </span>
                      <p className="text-xs sm:text-sm text-[#AEBDB4] leading-relaxed font-medium">
                        {lesson.examTip}
                      </p>
                    </div>
                  </div>
                )}
              </>
            ) : null}
          </div>

          {/* Modal Footer with Re-test Button */}
          <div className="p-5 sm:p-6 border-t border-[#294238] bg-[#0D1916] flex flex-col sm:flex-row items-center justify-between gap-3">
            <button
              id="close-lesson-footer-btn"
              onClick={onClose}
              className="w-full sm:w-auto px-5 py-2.5 rounded-xl text-xs font-semibold text-[#AEBDB4] hover:text-[#F2F7F3] bg-[#12211D] hover:bg-[#172A24] border border-[#294238] transition-colors cursor-pointer"
            >
              Done Reviewing
            </button>

            <button
              id="retest-topic-btn"
              onClick={() => {
                onClose();
                onStartRetest(topicName);
              }}
              className="w-full sm:w-auto px-6 py-2.5 rounded-xl text-sm font-bold text-[#08110F] bg-[#BFE8C8] hover:bg-[#D9F3DE] shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer border border-[#8FD3A2]/40"
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
