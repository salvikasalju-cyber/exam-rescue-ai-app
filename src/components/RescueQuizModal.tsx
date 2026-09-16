import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  CheckCircle2, 
  XCircle, 
  AlertTriangle, 
  HelpCircle, 
  ArrowRight, 
  RefreshCw, 
  Sparkles, 
  Clock, 
  Award, 
  BookOpen, 
  X, 
  Check, 
  TrendingUp, 
  Zap, 
  ListOrdered,
  ChevronRight,
  ShieldAlert
} from 'lucide-react';
import { 
  ExamRescuePlan, 
  StudyTopic, 
  QuizQuestion, 
  QuestionAttempt, 
  TopicPerformance 
} from '../types';
import { 
  fetchRescueQuizQuestions, 
  calculateTopicPerformance, 
  rescheduleTopicInPlan,
  markTopicAsImproved
} from '../utils/rescueQuiz';

interface RescueQuizModalProps {
  isOpen: boolean;
  plan: ExamRescuePlan;
  weakTopicOnly?: string | null; // Set when performing a focused re-test on a single weak topic
  onClose: () => void;
  onPlanUpdate: (updatedPlan: ExamRescuePlan) => void;
  onOpenCrashLesson: (topicName: string) => void;
  allAttemptsHistory: QuestionAttempt[];
  onRecordAttempt: (attempt: QuestionAttempt) => void;
  rescheduledTopicIds: Set<string>;
  onMarkRescheduled: (topicId: string) => void;
  improvedTopicIds: Set<string>;
  onMarkImproved: (topicId: string) => void;
}

export const RescueQuizModal: React.FC<RescueQuizModalProps> = ({
  isOpen,
  plan,
  weakTopicOnly,
  onClose,
  onPlanUpdate,
  onOpenCrashLesson,
  allAttemptsHistory,
  onRecordAttempt,
  rescheduledTopicIds,
  onMarkRescheduled,
  improvedTopicIds,
  onMarkImproved
}) => {
  const [questions, setQuestions] = useState<QuizQuestion[]>([]);
  const [currentIndex, setCurrentIndex] = useState<number>(0);
  const [selectedOptionIndex, setSelectedOptionIndex] = useState<number | null>(null);
  const [isAnswerSubmitted, setIsAnswerSubmitted] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [rescheduleToast, setRescheduleToast] = useState<string | null>(null);
  const [isQuizComplete, setIsQuizComplete] = useState<boolean>(false);

  // Session-specific attempts for the current quiz run
  const [sessionAttempts, setSessionAttempts] = useState<QuestionAttempt[]>([]);

  // Load questions when modal opens
  useEffect(() => {
    if (!isOpen) {
      setQuestions([]);
      setCurrentIndex(0);
      setSelectedOptionIndex(null);
      setIsAnswerSubmitted(false);
      setIsQuizComplete(false);
      setSessionAttempts([]);
      setRescheduleToast(null);
      return;
    }

    let isMounted = true;
    setIsLoading(true);

    const prevQuestions = allAttemptsHistory.map(a => a.question);

    fetchRescueQuizQuestions(plan, {
      weakTopicOnly: weakTopicOnly || undefined,
      numQuestions: weakTopicOnly ? 3 : Math.min(6, Math.max(3, plan.topics.length)),
      excludedQuestions: prevQuestions
    })
      .then((qs) => {
        if (isMounted) {
          setQuestions(qs);
          setIsLoading(false);
        }
      })
      .catch((err) => {
        if (isMounted) {
          console.error('Quiz loading failed:', err);
          setIsLoading(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, [isOpen, weakTopicOnly, plan]);

  const currentQuestion = questions[currentIndex] || null;

  // Handle option selection
  const handleSelectOption = (idx: number) => {
    if (isAnswerSubmitted) return;
    setSelectedOptionIndex(idx);
  };

  // Submit current answer
  const handleSubmitAnswer = () => {
    if (selectedOptionIndex === null || !currentQuestion || isAnswerSubmitted) return;

    const isCorrect = selectedOptionIndex === currentQuestion.correctOptionIndex;
    const attempt: QuestionAttempt = {
      id: `attempt-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      questionId: currentQuestion.id,
      topicId: currentQuestion.topicId,
      topicName: currentQuestion.topicName,
      question: currentQuestion.question,
      selectedAnswerIndex: selectedOptionIndex,
      selectedAnswer: currentQuestion.options[selectedOptionIndex] || '',
      correctAnswerIndex: currentQuestion.correctOptionIndex,
      correctAnswer: currentQuestion.options[currentQuestion.correctOptionIndex] || '',
      isCorrect,
      timestamp: Date.now(),
      explanation: currentQuestion.explanation
    };

    setIsAnswerSubmitted(true);
    setSessionAttempts(prev => [...prev, attempt]);
    onRecordAttempt(attempt);

    // If re-test was in progress and user got it right, mark improved
    if (weakTopicOnly && isCorrect) {
      onMarkImproved(currentQuestion.topicId);
      const updated = markTopicAsImproved(plan, currentQuestion.topicName);
      onPlanUpdate(updated);
    }
  };

  // Reschedule topic handler
  const handleRescheduleTopic = (topicName: string) => {
    const { updatedPlan, rescheduledTopic } = rescheduleTopicInPlan(plan, topicName, 10);
    if (rescheduledTopic) {
      onMarkRescheduled(rescheduledTopic.id);
      onPlanUpdate(updatedPlan);
      setRescheduleToast('Topic rescheduled based on your quiz performance.');
      setTimeout(() => {
        setRescheduleToast(null);
      }, 4000);
    }
  };

  // Move to next question or complete quiz
  const handleNextQuestion = () => {
    if (currentIndex + 1 < questions.length) {
      setCurrentIndex(prev => prev + 1);
      setSelectedOptionIndex(null);
      setIsAnswerSubmitted(false);
    } else {
      setIsQuizComplete(true);
    }
  };

  // Performance calculations
  const topicPerformance = useMemo(() => {
    return calculateTopicPerformance(
      plan.topics, 
      [...allAttemptsHistory, ...sessionAttempts],
      rescheduledTopicIds,
      improvedTopicIds
    );
  }, [plan.topics, allAttemptsHistory, sessionAttempts, rescheduledTopicIds, improvedTopicIds]);

  // Session summary statistics
  const sessionStats = useMemo(() => {
    const total = sessionAttempts.length;
    const correct = sessionAttempts.filter(a => a.isCorrect).length;
    const wrong = total - correct;
    const accuracy = total > 0 ? Math.round((correct / total) * 100) : 0;

    // Identify strong vs weak in this session
    const strongList: string[] = [];
    const weakList: string[] = [];
    const rescheduledList: string[] = [];
    const improvedList: string[] = [];

    for (const [topicName, perf] of Object.entries(topicPerformance) as [string, TopicPerformance][]) {
      if (perf.totalAttempts > 0) {
        if (perf.status === 'weak' || perf.wrongCount > 0) {
          weakList.push(topicName);
        } else if (perf.accuracy >= 75) {
          strongList.push(topicName);
        }
      }
      if (perf.isRescheduled || rescheduledTopicIds.has(perf.topicId)) {
        rescheduledList.push(topicName);
      }
      if (perf.status === 'improving' || improvedTopicIds.has(perf.topicId)) {
        improvedList.push(topicName);
      }
    }

    return {
      total,
      correct,
      wrong,
      accuracy,
      strongList,
      weakList,
      rescheduledList: Array.from(new Set(rescheduledList)),
      improvedList: Array.from(new Set(improvedList))
    };
  }, [sessionAttempts, topicPerformance, rescheduledTopicIds, improvedTopicIds]);

  if (!isOpen) return null;

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
          className="relative w-full max-w-3xl bg-[#090f26] border border-indigo-500/40 rounded-3xl shadow-[0_20px_80px_rgba(0,0,0,0.85)] overflow-hidden z-10 my-auto"
        >
          {/* Top Indicator Strip */}
          <div className="h-1.5 w-full bg-gradient-to-r from-purple-500 via-indigo-500 to-blue-500" />

          {/* Toast Alert for Reschedule confirmation */}
          <AnimatePresence>
            {rescheduleToast && (
              <motion.div 
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="absolute top-4 left-1/2 -translate-x-1/2 z-30 px-4 py-2 rounded-xl bg-emerald-500 text-slate-950 font-bold text-xs shadow-2xl flex items-center gap-2 border border-white/40"
              >
                <Check className="w-4 h-4 stroke-[3]" />
                <span>{rescheduleToast}</span>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Modal Header */}
          <div className="p-5 sm:p-6 border-b border-slate-800/80 flex items-center justify-between bg-slate-900/70">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-purple-600 to-indigo-600 flex items-center justify-center text-white shadow-md">
                <Zap className="w-5 h-5 fill-yellow-300 text-yellow-300" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-black uppercase tracking-wider text-purple-300 bg-purple-950/70 px-2.5 py-0.5 rounded-full border border-purple-500/40">
                    {weakTopicOnly ? `Re-test: ${weakTopicOnly}` : 'Adaptive Exam Rescue Quiz'}
                  </span>
                  <span className="text-xs text-slate-400">
                    {plan.documentTitle || plan.courseName}
                  </span>
                </div>
                <h3 className="text-lg sm:text-xl font-bold text-white tracking-wide mt-0.5">
                  {isQuizComplete ? 'Exam Rescue Report' : `Question ${currentIndex + 1} of ${questions.length || 5}`}
                </h3>
              </div>
            </div>

            <button
              id="close-quiz-btn"
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-white bg-slate-800/80 hover:bg-slate-700/80 rounded-xl border border-slate-700/60 transition-colors cursor-pointer"
              aria-label="Close"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Quiz Content or Final Report */}
          {isLoading ? (
            <div className="p-12 text-center space-y-4">
              <RefreshCw className="w-8 h-8 text-purple-400 animate-spin mx-auto" />
              <p className="text-sm font-semibold text-white">
                {weakTopicOnly 
                  ? `Generating focused re-test questions for ${weakTopicOnly}...` 
                  : 'Synthesizing adaptive active-recall questions from your syllabus...'}
              </p>
              <p className="text-xs text-slate-400 font-mono">
                Grounded strictly in topics and concepts extracted from your uploaded document.
              </p>
            </div>
          ) : isQuizComplete ? (
            /* ========================================================================= */
            /* FEATURE 9 — FINAL RESCUE REPORT                                           */
            /* ========================================================================= */
            <div className="p-6 sm:p-8 max-h-[75vh] overflow-y-auto space-y-6">
              {/* Header Summary Banner */}
              <div className="p-6 rounded-3xl bg-gradient-to-r from-purple-950/50 via-indigo-950/40 to-slate-900 border border-indigo-500/40 text-center space-y-3">
                <div className="w-12 h-12 rounded-2xl bg-indigo-500/20 border border-indigo-400/40 flex items-center justify-center text-indigo-300 mx-auto shadow-md">
                  <Award className="w-6 h-6 text-yellow-300" />
                </div>
                <div>
                  <h4 className="text-2xl sm:text-3xl font-black text-white font-display">
                    Exam Rescue Report
                  </h4>
                  <p className="text-xs sm:text-sm text-indigo-200 mt-1">
                    Your dynamic study plan has been recalculated based on your real quiz performance.
                  </p>
                </div>

                {/* Score Stats Grid */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-3">
                  <div className="p-3 rounded-2xl bg-slate-950/80 border border-slate-800">
                    <span className="text-slate-400 text-xs block">Questions</span>
                    <span className="text-xl font-bold font-mono text-white">{sessionStats.total}</span>
                  </div>
                  <div className="p-3 rounded-2xl bg-slate-950/80 border border-slate-800">
                    <span className="text-emerald-400 text-xs block">Correct</span>
                    <span className="text-xl font-bold font-mono text-emerald-400">{sessionStats.correct}</span>
                  </div>
                  <div className="p-3 rounded-2xl bg-slate-950/80 border border-slate-800">
                    <span className="text-red-400 text-xs block">Wrong</span>
                    <span className="text-xl font-bold font-mono text-red-400">{sessionStats.wrong}</span>
                  </div>
                  <div className="p-3 rounded-2xl bg-slate-950/80 border border-slate-800">
                    <span className="text-purple-300 text-xs block">Accuracy</span>
                    <span className={`text-xl font-bold font-mono ${sessionStats.accuracy >= 70 ? 'text-emerald-400' : 'text-amber-400'}`}>
                      {sessionStats.accuracy}%
                    </span>
                  </div>
                </div>
              </div>

              {/* Strong vs Weak Breakdown */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Strong Topics */}
                <div className="p-4 sm:p-5 rounded-2xl bg-emerald-950/20 border border-emerald-500/30 space-y-2">
                  <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-emerald-300">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                    <span>Strong Topics ({sessionStats.strongList.length})</span>
                  </div>
                  {sessionStats.strongList.length > 0 ? (
                    <div className="flex flex-wrap gap-1.5">
                      {sessionStats.strongList.map((t, idx) => (
                        <span key={idx} className="px-2.5 py-1 rounded-lg bg-emerald-950/80 text-emerald-200 border border-emerald-500/40 text-xs font-semibold">
                          {t}
                        </span>
                      ))}
                    </div>
                  ) : (
                    <p className="text-xs text-slate-400 italic">None logged with high accuracy yet.</p>
                  )}
                </div>

                {/* Weak Topics */}
                <div className="p-4 sm:p-5 rounded-2xl bg-red-950/20 border border-red-500/30 space-y-2">
                  <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-red-300">
                    <AlertTriangle className="w-4 h-4 text-red-400" />
                    <span>Weak Topics ({sessionStats.weakList.length})</span>
                  </div>
                  {sessionStats.weakList.length > 0 ? (
                    <div className="flex flex-wrap gap-1.5">
                      {sessionStats.weakList.map((t, idx) => (
                        <span key={idx} className="px-2.5 py-1 rounded-lg bg-red-950/80 text-red-200 border border-red-500/40 text-xs font-semibold">
                          {t}
                        </span>
                      ))}
                    </div>
                  ) : (
                    <p className="text-xs text-slate-400 italic">No critical weak spots detected in this quiz!</p>
                  )}
                </div>
              </div>

              {/* Topics Rescheduled & Topics Improved */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                <div className="p-3.5 rounded-xl bg-slate-900/80 border border-slate-800 flex items-center justify-between">
                  <span className="text-slate-300 font-medium">Topics Rescheduled:</span>
                  <span className="font-mono font-bold text-amber-300">
                    {sessionStats.rescheduledList.length > 0 
                      ? sessionStats.rescheduledList.join(', ') 
                      : 'None'}
                  </span>
                </div>
                <div className="p-3.5 rounded-xl bg-slate-900/80 border border-slate-800 flex items-center justify-between">
                  <span className="text-slate-300 font-medium">Topics Improved:</span>
                  <span className="font-mono font-bold text-emerald-400">
                    {sessionStats.improvedList.length > 0 
                      ? sessionStats.improvedList.join(', ') 
                      : 'None yet'}
                  </span>
                </div>
              </div>

              {/* Recommended Final Revision Order */}
              <div className="p-5 rounded-2xl bg-slate-950/90 border border-slate-800 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-indigo-300">
                    <ListOrdered className="w-4 h-4 text-indigo-400" />
                    <span>Recommended Final Revision Order</span>
                  </div>
                  <span className="text-[11px] text-slate-400 flex items-center gap-1 font-mono">
                    <Clock className="w-3 h-3" />
                    {plan.totalHoursLeft}h left before exam
                  </span>
                </div>

                <div className="space-y-2">
                  {plan.topics.map((topic, rIdx) => (
                    <div 
                      key={topic.id || rIdx}
                      className="p-2.5 rounded-xl bg-slate-900/90 border border-slate-800 flex items-center justify-between text-xs"
                    >
                      <div className="flex items-center gap-2.5">
                        <span className="w-5 h-5 rounded-full bg-slate-800 text-slate-300 flex items-center justify-center font-mono font-bold text-[10px]">
                          {rIdx + 1}
                        </span>
                        <span className="font-bold text-white">{topic.name}</span>
                        {topic.isRescheduled && (
                          <span className="px-1.5 py-0.5 rounded text-[9px] font-bold uppercase bg-amber-950 text-amber-300 border border-amber-500/40">
                            Rescheduled
                          </span>
                        )}
                        {topic.status === 'improving' && (
                          <span className="px-1.5 py-0.5 rounded text-[9px] font-bold uppercase bg-emerald-950 text-emerald-300 border border-emerald-500/40">
                            Improving
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="text-slate-400 font-mono">{topic.recommendedMinutes} min</span>
                        <span className={`px-2 py-0.5 rounded font-black uppercase text-[10px] ${
                          topic.priority === 'high' ? 'text-red-400 bg-red-950/60' : 'text-slate-300 bg-slate-800'
                        }`}>
                          {topic.priority}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Action Button: Continue Rescue */}
              <div className="pt-2">
                <button
                  id="continue-rescue-btn"
                  type="button"
                  onClick={onClose}
                  className="w-full py-4 rounded-2xl text-base font-bold text-white bg-gradient-to-r from-purple-600 via-indigo-600 to-blue-600 hover:from-purple-500 hover:to-blue-500 shadow-[0_0_30px_rgba(99,102,241,0.5)] transition-all flex items-center justify-center gap-2.5 cursor-pointer border border-indigo-400/40"
                >
                  <Zap className="w-5 h-5 text-yellow-300 fill-yellow-300" />
                  <span>Continue Rescue</span>
                  <ArrowRight className="w-5 h-5" />
                </button>
              </div>
            </div>
          ) : currentQuestion ? (
            /* ========================================================================= */
            /* FEATURE 1 & 4 — ACTIVE RESCUE QUESTION                                    */
            /* ========================================================================= */
            <div className="p-6 sm:p-8 max-h-[75vh] overflow-y-auto space-y-6">
              {/* Progress bar */}
              <div>
                <div className="flex justify-between text-xs text-slate-400 mb-2 font-medium">
                  <span>Progress</span>
                  <span className="font-mono">
                    {Math.round(((currentIndex + (isAnswerSubmitted ? 1 : 0)) / questions.length) * 100)}%
                  </span>
                </div>
                <div className="w-full bg-slate-900 rounded-full h-2 overflow-hidden border border-slate-800">
                  <div
                    className="bg-gradient-to-r from-purple-500 to-indigo-500 h-full transition-all duration-300"
                    style={{
                      width: `${((currentIndex + (isAnswerSubmitted ? 1 : 0)) / questions.length) * 100}%`
                    }}
                  />
                </div>
              </div>

              {/* Topic Badge */}
              <div className="flex items-center justify-between">
                <span className="px-3 py-1 rounded-xl text-xs font-bold uppercase tracking-wider bg-indigo-950/80 text-indigo-300 border border-indigo-500/40">
                  Topic: {currentQuestion.topicName}
                </span>
                {weakTopicOnly && (
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase bg-amber-950/70 text-amber-300 border border-amber-500/40">
                    Targeted Re-test
                  </span>
                )}
              </div>

              {/* Question Text */}
              <div className="p-5 rounded-2xl bg-slate-950/80 border border-slate-800">
                <p className="text-base sm:text-lg font-semibold text-white leading-relaxed">
                  {currentQuestion.question}
                </p>
              </div>

              {/* Four Options */}
              <div className="space-y-3">
                {currentQuestion.options.map((option, optIdx) => {
                  const letter = String.fromCharCode(65 + optIdx); // A, B, C, D
                  const isSelected = selectedOptionIndex === optIdx;
                  const isCorrect = optIdx === currentQuestion.correctOptionIndex;

                  let borderClass = 'border-slate-800 hover:border-indigo-500/50 bg-slate-900/70 text-slate-200';
                  let badgeClass = 'bg-slate-800 text-slate-300';

                  if (isAnswerSubmitted) {
                    if (isCorrect) {
                      borderClass = 'border-emerald-500/80 bg-emerald-950/40 text-emerald-100 shadow-[0_0_15px_rgba(16,185,129,0.2)]';
                      badgeClass = 'bg-emerald-500 text-slate-950 font-bold';
                    } else if (isSelected && !isCorrect) {
                      borderClass = 'border-red-500/80 bg-red-950/40 text-red-100 shadow-[0_0_15px_rgba(239,68,68,0.2)]';
                      badgeClass = 'bg-red-500 text-white font-bold';
                    } else {
                      borderClass = 'border-slate-800/60 bg-slate-950/40 text-slate-400 opacity-60';
                    }
                  } else if (isSelected) {
                    borderClass = 'border-indigo-500 bg-indigo-950/50 text-white shadow-[0_0_15px_rgba(99,102,241,0.25)]';
                    badgeClass = 'bg-indigo-600 text-white font-bold';
                  }

                  return (
                    <button
                      key={optIdx}
                      id={`quiz-option-${optIdx}`}
                      type="button"
                      disabled={isAnswerSubmitted}
                      onClick={() => handleSelectOption(optIdx)}
                      className={`w-full p-4 rounded-2xl border transition-all duration-200 flex items-start gap-3.5 text-left cursor-pointer ${borderClass}`}
                    >
                      <span className={`w-7 h-7 rounded-xl flex items-center justify-center text-xs shrink-0 font-mono transition-colors ${badgeClass}`}>
                        {letter}
                      </span>
                      <span className="text-sm sm:text-base leading-relaxed pt-0.5">
                        {option}
                      </span>
                      {isAnswerSubmitted && isCorrect && (
                        <CheckCircle2 className="w-5 h-5 text-emerald-400 ml-auto shrink-0 mt-1" />
                      )}
                      {isAnswerSubmitted && isSelected && !isCorrect && (
                        <XCircle className="w-5 h-5 text-red-400 ml-auto shrink-0 mt-1" />
                      )}
                    </button>
                  );
                })}
              </div>

              {/* Submit Answer Button (Before answering) */}
              {!isAnswerSubmitted && (
                <div className="pt-2">
                  <button
                    id="submit-answer-btn"
                    type="button"
                    disabled={selectedOptionIndex === null}
                    onClick={handleSubmitAnswer}
                    className={`w-full py-3.5 rounded-2xl text-sm font-bold transition-all flex items-center justify-center gap-2 ${
                      selectedOptionIndex !== null
                        ? 'text-white bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 shadow-[0_0_20px_rgba(99,102,241,0.4)] cursor-pointer'
                        : 'text-slate-500 bg-slate-900/60 border border-slate-800 cursor-not-allowed'
                    }`}
                  >
                    <span>Submit Answer</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              )}

              {/* Post-Answer Feedback & Weak Topic Rescheduling */}
              {isAnswerSubmitted && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="space-y-4 pt-2"
                >
                  {/* Correct vs Wrong Banner */}
                  {selectedOptionIndex === currentQuestion.correctOptionIndex ? (
                    <div className="p-4 rounded-2xl bg-emerald-950/50 border border-emerald-500/50 flex items-start gap-3 text-emerald-200 text-sm shadow-md">
                      <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
                      <div>
                        <span className="font-extrabold text-white block">
                          Correct!
                        </span>
                        <p className="text-xs sm:text-sm text-emerald-200/90 mt-1 leading-relaxed">
                          {currentQuestion.explanation}
                        </p>
                      </div>
                    </div>
                  ) : (
                    /* FEATURE 4 — WRONG ANSWER & RESCHEDULE TOPIC UI */
                    <div className="p-5 rounded-2xl bg-red-950/60 border border-red-500/60 space-y-4 shadow-lg animate-in fade-in">
                      <div className="flex items-start gap-3 text-red-200">
                        <XCircle className="w-6 h-6 text-red-400 shrink-0 mt-0.5" />
                        <div>
                          <span className="font-black text-white text-base block font-display tracking-wide uppercase">
                            Wrong Answer
                          </span>
                          <p className="text-xs sm:text-sm text-red-200/90 mt-1">
                            {currentQuestion.explanation}
                          </p>
                        </div>
                      </div>

                      {/* We found a possible weak area */}
                      <div className="p-4 rounded-xl bg-slate-950/80 border border-red-500/40 space-y-3">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-extrabold uppercase tracking-wider text-amber-300">
                            We found a possible weak area:
                          </span>
                          <span className="px-2 py-0.5 rounded text-[10px] font-black uppercase bg-red-950 text-red-300 border border-red-500/40">
                            Weak Detected
                          </span>
                        </div>
                        <h4 className="text-lg font-bold text-white">
                          {currentQuestion.topicName}
                        </h4>

                        {/* Action Buttons: [ Review Topic ] [ Reschedule Topic ] */}
                        <div className="flex flex-wrap items-center gap-3 pt-1">
                          <button
                            id="review-topic-btn"
                            type="button"
                            onClick={() => onOpenCrashLesson(currentQuestion.topicName)}
                            className="px-4 py-2 rounded-xl text-xs font-bold text-white bg-gradient-to-r from-amber-600 to-amber-500 hover:from-amber-500 hover:to-amber-400 shadow-md flex items-center gap-1.5 cursor-pointer border border-amber-400/40 transition-all"
                          >
                            <Zap className="w-3.5 h-3.5 text-yellow-200 fill-yellow-200" />
                            <span>Review Topic (3-Min Crash Lesson)</span>
                          </button>

                          <button
                            id="reschedule-topic-btn"
                            type="button"
                            onClick={() => handleRescheduleTopic(currentQuestion.topicName)}
                            className="px-4 py-2 rounded-xl text-xs font-bold text-purple-200 hover:text-white bg-purple-950/80 hover:bg-purple-900/90 border border-purple-500/40 shadow-md flex items-center gap-1.5 cursor-pointer transition-all"
                          >
                            <RefreshCw className="w-3.5 h-3.5 text-purple-400" />
                            <span>Reschedule Topic Higher</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Advance to next question or view report */}
                  <div className="pt-2">
                    <button
                      id="next-question-btn"
                      type="button"
                      onClick={handleNextQuestion}
                      className="w-full py-3.5 rounded-2xl text-sm font-bold text-white bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 shadow-[0_0_20px_rgba(99,102,241,0.4)] transition-all flex items-center justify-center gap-2 cursor-pointer"
                    >
                      <span>
                        {currentIndex + 1 < questions.length 
                          ? 'Next Question' 
                          : 'View Exam Rescue Report'}
                      </span>
                      <ArrowRight className="w-4 h-4" />
                    </button>
                  </div>
                </motion.div>
              )}
            </div>
          ) : (
            <div className="p-8 text-center text-slate-400 text-sm">
              No questions loaded. Please try again.
            </div>
          )}
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
