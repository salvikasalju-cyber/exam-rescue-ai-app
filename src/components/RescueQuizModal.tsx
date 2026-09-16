import React, { useState, useEffect, useMemo } from 'react';
import { 
  CheckCircle2, 
  XCircle, 
  RefreshCw, 
  X, 
  ArrowRight,
  Clock,
  Zap
} from 'lucide-react';
import { 
  ExamRescuePlan, 
  QuizQuestion, 
  QuestionAttempt, 
  TopicPerformance 
} from '../types';
import { 
  fetchRescueQuizQuestions, 
  calculateTopicPerformance, 
  markTopicAsImproved
} from '../utils/rescueQuiz';

interface RescueQuizModalProps {
  isOpen: boolean;
  plan: ExamRescuePlan;
  weakTopicOnly?: string | null;
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
  allAttemptsHistory,
  onRecordAttempt,
  rescheduledTopicIds,
  improvedTopicIds,
  onMarkImproved
}) => {
  const [questions, setQuestions] = useState<QuizQuestion[]>([]);
  const [currentIndex, setCurrentIndex] = useState<number>(0);
  const [selectedOptionIndex, setSelectedOptionIndex] = useState<number | null>(null);
  const [isAnswerSubmitted, setIsAnswerSubmitted] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isQuizComplete, setIsQuizComplete] = useState<boolean>(false);
  const [sessionAttempts, setSessionAttempts] = useState<QuestionAttempt[]>([]);

  useEffect(() => {
    if (!isOpen) {
      setQuestions([]);
      setCurrentIndex(0);
      setSelectedOptionIndex(null);
      setIsAnswerSubmitted(false);
      setIsQuizComplete(false);
      setSessionAttempts([]);
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

  const handleSelectOption = (idx: number) => {
    if (isAnswerSubmitted) return;
    setSelectedOptionIndex(idx);
  };

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

    if (weakTopicOnly && isCorrect) {
      onMarkImproved(currentQuestion.topicId);
      const updated = markTopicAsImproved(plan, currentQuestion.topicName);
      onPlanUpdate(updated);
    }
  };

  const handleNextQuestion = () => {
    if (currentIndex + 1 < questions.length) {
      setCurrentIndex(prev => prev + 1);
      setSelectedOptionIndex(null);
      setIsAnswerSubmitted(false);
    } else {
      setIsQuizComplete(true);
    }
  };

  const topicPerformance = useMemo(() => {
    return calculateTopicPerformance(
      plan.topics, 
      [...allAttemptsHistory, ...sessionAttempts],
      rescheduledTopicIds,
      improvedTopicIds
    );
  }, [plan.topics, allAttemptsHistory, sessionAttempts, rescheduledTopicIds, improvedTopicIds]);

  const sessionStats = useMemo(() => {
    const total = sessionAttempts.length;
    const correct = sessionAttempts.filter(a => a.isCorrect).length;
    const accuracy = total > 0 ? Math.round((correct / total) * 100) : 0;

    const strongList: string[] = [];
    const weakList: string[] = [];
    const improvedList: string[] = [];

    for (const [topicName, perf] of Object.entries(topicPerformance) as [string, TopicPerformance][]) {
      if (perf.totalAttempts > 0) {
        if (perf.status === 'weak' || perf.wrongCount > 0) {
          weakList.push(topicName);
        } else if (perf.accuracy >= 75) {
          strongList.push(topicName);
        }
      }
      if (perf.status === 'improving' || improvedTopicIds.has(perf.topicId)) {
        improvedList.push(topicName);
      }
    }

    return {
      total,
      correct,
      accuracy,
      strongList,
      weakList,
      improvedList: Array.from(new Set(improvedList))
    };
  }, [sessionAttempts, topicPerformance, improvedTopicIds]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 md:p-6 overflow-y-auto">
      {/* Backdrop */}
      <div 
        onClick={onClose}
        className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm"
      />

      {/* Modal Container */}
      <div 
        onClick={(e) => e.stopPropagation()}
        className="relative w-full max-w-2xl bg-[#08110F] border border-[#294238] rounded-2xl shadow-2xl overflow-hidden z-10 my-auto text-[#F2F7F3]"
      >
        {/* Header */}
        <div className="p-5 border-b border-[#294238] flex items-center justify-between bg-[#0D1916]">
          <h2 className="text-lg font-bold text-[#F2F7F3]">
            {isQuizComplete ? 'Final Report' : `Question ${currentIndex + 1} of ${questions.length || 1}`}
          </h2>

          <button
            id="close-quiz-btn"
            onClick={onClose}
            className="p-1.5 text-[#AEBDB4] hover:text-[#F2F7F3] rounded-lg hover:bg-[#12211D] transition-colors cursor-pointer"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body: Loading, Quiz, or Final Report */}
        <div className="p-5 sm:p-6 max-h-[80vh] overflow-y-auto">
          {isLoading ? (
            <div className="py-12 text-center space-y-3">
              <RefreshCw className="w-8 h-8 text-[#8FD3A2] animate-spin mx-auto" />
              <p className="text-sm font-semibold text-[#F2F7F3]">
                Loading active recall questions...
              </p>
            </div>
          ) : isQuizComplete ? (
            /* ========================================================================= */
            /* FINAL REPORT: Show only useful results:                                    */
            /* - Accuracy                                                                */
            /* - Strong topics                                                           */
            /* - Weak topics                                                             */
            /* - Improved topics                                                         */
            /* - Final revision order                                                    */
            /* - Continue Rescue                                                         */
            /* ========================================================================= */
            <div className="space-y-5">
              {/* Accuracy */}
              <div className="p-5 rounded-xl bg-[#12211D] border border-[#294238] text-center space-y-1">
                <span className="text-xs text-[#7F9188] uppercase tracking-wider block font-semibold">
                  Accuracy
                </span>
                <div className="text-4xl font-extrabold font-mono text-[#BFE8C8]">
                  {sessionStats.accuracy}%
                </div>
                <div className="text-xs text-[#AEBDB4]">
                  {sessionStats.correct} of {sessionStats.total} answered correctly
                </div>
              </div>

              {/* Strong Topics & Weak Topics */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Strong Topics */}
                <div className="p-4 rounded-xl bg-[#0D1916] border border-[#294238] space-y-2">
                  <span className="text-xs font-bold uppercase tracking-wider text-[#9FE2B0] block">
                    Strong Topics
                  </span>
                  {sessionStats.strongList.length > 0 ? (
                    <div className="flex flex-wrap gap-1.5">
                      {sessionStats.strongList.map((t, idx) => (
                        <span key={idx} className="px-2.5 py-1 rounded bg-[#12211D] text-[#9FE2B0] border border-[#9FE2B0]/30 text-xs font-medium">
                          {t}
                        </span>
                      ))}
                    </div>
                  ) : (
                    <p className="text-xs text-[#7F9188]">None logged in this quiz.</p>
                  )}
                </div>

                {/* Weak Topics */}
                <div className="p-4 rounded-xl bg-[#0D1916] border border-[#294238] space-y-2">
                  <span className="text-xs font-bold uppercase tracking-wider text-[#F29B9B] block">
                    Weak Topics
                  </span>
                  {sessionStats.weakList.length > 0 ? (
                    <div className="flex flex-wrap gap-1.5">
                      {sessionStats.weakList.map((t, idx) => (
                        <span key={idx} className="px-2.5 py-1 rounded bg-[#12211D] text-[#F29B9B] border border-[#F29B9B]/30 text-xs font-medium">
                          {t}
                        </span>
                      ))}
                    </div>
                  ) : (
                    <p className="text-xs text-[#7F9188]">No weak spots detected.</p>
                  )}
                </div>
              </div>

              {/* Improved Topics */}
              <div className="p-4 rounded-xl bg-[#0D1916] border border-[#294238] space-y-2">
                <span className="text-xs font-bold uppercase tracking-wider text-[#BFE8C8] block">
                  Improved Topics
                </span>
                {sessionStats.improvedList.length > 0 ? (
                  <div className="flex flex-wrap gap-1.5">
                    {sessionStats.improvedList.map((t, idx) => (
                      <span key={idx} className="px-2.5 py-1 rounded bg-[#12211D] text-[#BFE8C8] border border-[#8FD3A2]/30 text-xs font-medium">
                        {t}
                      </span>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-[#7F9188]">No re-tested topics improved yet.</p>
                )}
              </div>

              {/* Final Revision Order */}
              <div className="p-4 rounded-xl bg-[#12211D] border border-[#294238] space-y-3">
                <span className="text-xs font-bold uppercase tracking-wider text-[#F2F7F3] block">
                  Final Revision Order
                </span>
                <div className="space-y-2">
                  {plan.topics.map((topic, rIdx) => (
                    <div 
                      key={topic.id || rIdx}
                      className="p-2.5 rounded-lg bg-[#0D1916] border border-[#294238] flex items-center justify-between text-xs"
                    >
                      <div className="flex items-center gap-2">
                        <span className="w-5 h-5 rounded-full bg-[#12211D] text-[#AEBDB4] flex items-center justify-center font-mono font-bold text-[10px]">
                          {rIdx + 1}
                        </span>
                        <span className="font-semibold text-[#F2F7F3]">{topic.name}</span>
                      </div>
                      <span className="text-[#AEBDB4] font-mono">{topic.recommendedMinutes} min</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Continue Rescue Button */}
              <button
                id="continue-rescue-btn"
                type="button"
                onClick={onClose}
                className="w-full py-3.5 rounded-xl text-sm font-bold text-[#08110F] bg-[#BFE8C8] hover:bg-[#D9F3DE] flex items-center justify-center gap-2 cursor-pointer transition-colors"
              >
                <span>Continue Rescue</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          ) : currentQuestion ? (
            /* ========================================================================= */
            /* QUIZ: Show only:                                                          */
            /* - Question                                                                */
            /* - Four answer choices                                                     */
            /* - Submit Answer                                                           */
            /* - Explanation                                                             */
            /* - Next Question                                                           */
            /* ========================================================================= */
            <div className="space-y-5">
              {/* Question */}
              <div className="p-4 rounded-xl bg-[#12211D] border border-[#294238]">
                <span className="text-[11px] text-[#8FD3A2] font-semibold uppercase tracking-wider block mb-1">
                  Topic: {currentQuestion.topicName}
                </span>
                <p className="text-base font-semibold text-[#F2F7F3] leading-relaxed">
                  {currentQuestion.question}
                </p>
              </div>

              {/* Four Answer Choices */}
              <div className="space-y-2.5">
                {currentQuestion.options.map((option, optIdx) => {
                  const letter = String.fromCharCode(65 + optIdx);
                  const isSelected = selectedOptionIndex === optIdx;
                  const isCorrect = optIdx === currentQuestion.correctOptionIndex;

                  let optClass = 'border-[#294238] bg-[#0D1916] text-[#AEBDB4] hover:border-[#8FD3A2]/50';
                  if (isAnswerSubmitted) {
                    if (isCorrect) {
                      optClass = 'border-[#9FE2B0] bg-[#2F6B4A]/30 text-[#9FE2B0] font-semibold';
                    } else if (isSelected && !isCorrect) {
                      optClass = 'border-[#F29B9B] bg-[#F29B9B]/15 text-[#F29B9B]';
                    } else {
                      optClass = 'border-[#294238] bg-[#08110F] text-[#7F9188] opacity-50';
                    }
                  } else if (isSelected) {
                    optClass = 'border-[#8FD3A2] bg-[#172A24] text-[#F2F7F3]';
                  }

                  return (
                    <button
                      key={optIdx}
                      id={`quiz-option-${optIdx}`}
                      type="button"
                      disabled={isAnswerSubmitted}
                      onClick={() => handleSelectOption(optIdx)}
                      className={`w-full p-3.5 rounded-xl border text-left text-sm flex items-start gap-3 transition-colors cursor-pointer ${optClass}`}
                    >
                      <span className="w-6 h-6 rounded-lg bg-[#12211D] flex items-center justify-center text-xs font-mono shrink-0">
                        {letter}
                      </span>
                      <span className="pt-0.5 flex-1">{option}</span>
                      {isAnswerSubmitted && isCorrect && <CheckCircle2 className="w-4 h-4 text-[#9FE2B0] shrink-0 mt-1" />}
                      {isAnswerSubmitted && isSelected && !isCorrect && <XCircle className="w-4 h-4 text-[#F29B9B] shrink-0 mt-1" />}
                    </button>
                  );
                })}
              </div>

              {/* Submit Answer Button (before submission) */}
              {!isAnswerSubmitted && (
                <button
                  id="submit-answer-btn"
                  type="button"
                  disabled={selectedOptionIndex === null}
                  onClick={handleSubmitAnswer}
                  className={`w-full py-3 rounded-xl text-sm font-bold transition-colors flex items-center justify-center gap-2 ${
                    selectedOptionIndex !== null
                      ? 'text-[#08110F] bg-[#BFE8C8] hover:bg-[#D9F3DE] cursor-pointer'
                      : 'text-[#7F9188] bg-[#0D1916] border border-[#294238] cursor-not-allowed'
                  }`}
                >
                  <span>Submit Answer</span>
                </button>
              )}

              {/* Explanation & Next Question (after submission) */}
              {isAnswerSubmitted && (
                <div className="space-y-4 pt-1">
                  {/* Explanation */}
                  <div className={`p-4 rounded-xl border text-xs sm:text-sm leading-relaxed ${
                    selectedOptionIndex === currentQuestion.correctOptionIndex
                      ? 'bg-[#0D1916] border-[#9FE2B0]/40 text-[#AEBDB4]'
                      : 'bg-[#0D1916] border-[#F29B9B]/40 text-[#AEBDB4]'
                  }`}>
                    <strong className="block text-[#F2F7F3] mb-1 font-semibold">
                      {selectedOptionIndex === currentQuestion.correctOptionIndex ? 'Correct' : 'Incorrect'}:
                    </strong>
                    {currentQuestion.explanation}
                  </div>

                  {/* Next Question Button */}
                  <button
                    id="next-question-btn"
                    type="button"
                    onClick={handleNextQuestion}
                    className="w-full py-3 rounded-xl text-sm font-bold text-[#08110F] bg-[#BFE8C8] hover:bg-[#D9F3DE] transition-colors flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <span>
                      {currentIndex + 1 < questions.length ? 'Next Question' : 'View Final Report'}
                    </span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              )}
            </div>
          ) : (
            <div className="p-8 text-center text-[#7F9188] text-sm">
              No questions loaded.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
