import React, { useState, useEffect } from 'react';
import { 
  StudyTopic, 
  ExamRescuePlan, 
  QuestionAttempt, 
  TopicLearningContent 
} from '../types';
import { 
  fetchTopicLearning, 
  calculateTopicUnderstanding 
} from '../utils/rescueQuiz';
import { 
  BookOpen, 
  Sparkles, 
  CheckCircle2, 
  AlertTriangle, 
  HelpCircle, 
  Youtube, 
  RefreshCw, 
  Clock, 
  Flame, 
  X, 
  Check, 
  RotateCcw, 
  Play, 
  ChevronRight,
  Lightbulb,
  ExternalLink,
  Brain,
  GraduationCap,
  ShieldCheck,
  Code2,
  Calculator,
  FileText
} from 'lucide-react';

interface TopicLearningModalProps {
  topic: StudyTopic | null;
  plan: ExamRescuePlan;
  quizAttempts: QuestionAttempt[];
  isOpen: boolean;
  onClose: () => void;
  onMarkUnderstood: (topicIdentifier: string) => void;
  onMarkConfused: (topicIdentifier: string) => void;
  onStartReTest: (topicName: string) => void;
  onRescheduleTopic?: (topicIdentifier: string) => void;
}

export const TopicLearningModal: React.FC<TopicLearningModalProps> = ({
  topic,
  plan,
  quizAttempts,
  isOpen,
  onClose,
  onMarkUnderstood,
  onMarkConfused,
  onStartReTest,
  onRescheduleTopic
}) => {
  const [learningContent, setLearningContent] = useState<TopicLearningContent | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Quick check state
  const [quickCheckAnswers, setQuickCheckAnswers] = useState<{
    [qId: string]: { selectedIndex: number; isCorrect: boolean };
  }>({});

  // User feedback state for this session
  const [userMarkedUnderstood, setUserMarkedUnderstood] = useState<boolean>(false);
  const [userMarkedConfused, setUserMarkedConfused] = useState<boolean>(false);
  const [isSimplerRequested, setIsSimplerRequested] = useState<boolean>(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Load learning content whenever modal opens or topic changes
  useEffect(() => {
    if (!isOpen || !topic) return;

    // Reset interaction state
    setQuickCheckAnswers({});
    setUserMarkedUnderstood(topic.userMarkedUnderstood || topic.status === 'mastered');
    setUserMarkedConfused(!!topic.isWeak && topic.status === 'weak');
    setIsSimplerRequested(false);
    setErrorMsg(null);

    loadTopicLesson(topic.name, false);
  }, [isOpen, topic?.name]);

  const loadTopicLesson = async (topicName: string, simplerMode: boolean) => {
    setIsLoading(true);
    setErrorMsg(null);

    try {
      const prevSummary = learningContent?.simpleSummary.whatItIs || '';
      const content = await fetchTopicLearning(topicName, plan, {
        simplerMode,
        previousExplanation: prevSummary
      });
      setLearningContent(content);
      if (simplerMode) {
        setIsSimplerRequested(true);
        setUserMarkedConfused(true);
        setUserMarkedUnderstood(false);
        showToast('AI re-explained using an intuitive, simpler analogy!');
      }
    } catch (err: any) {
      console.error('Error loading topic lesson:', err);
      setErrorMsg('Failed to load full lesson. Showing grounded emergency study guide.');
    } finally {
      setIsLoading(false);
    }
  };

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 4000);
  };

  if (!isOpen || !topic) return null;

  // Calculate dynamic Understanding Indicator
  const understanding = calculateTopicUnderstanding(
    topic.name,
    quizAttempts,
    quickCheckAnswers,
    userMarkedUnderstood,
    userMarkedConfused
  );

  const handleSelectQuickCheck = (qId: string, optionIdx: number, correctIdx: number) => {
    // If already answered, allow switching or lock
    const isCorrect = optionIdx === correctIdx;
    setQuickCheckAnswers(prev => ({
      ...prev,
      [qId]: { selectedIndex: optionIdx, isCorrect }
    }));
  };

  const handleUnderstoodClick = () => {
    setUserMarkedUnderstood(true);
    setUserMarkedConfused(false);
    onMarkUnderstood(topic.id);
    showToast('Topic marked as understood! Rescue Plan re-prioritized.');
  };

  const handleConfusedClick = () => {
    setUserMarkedConfused(true);
    setUserMarkedUnderstood(false);
    onMarkConfused(topic.id);
    loadTopicLesson(topic.name, true);
  };

  // Understanding indicator visual bars
  const totalBlocks = 10;
  const filledBlocks = Math.round((understanding.score / 100) * totalBlocks);

  return (
    <div 
      id="topic-learning-center-overlay"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/85 backdrop-blur-md overflow-y-auto"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div 
        id="topic-learning-center-modal"
        className="relative w-full max-w-4xl max-h-[92vh] flex flex-col bg-[#0B0F19] border border-slate-800 rounded-2xl shadow-2xl overflow-hidden my-auto text-slate-100"
      >
        {/* Toast alert */}
        {toastMessage && (
          <div 
            id="topic-toast-notification"
            className="absolute top-4 left-1/2 -translate-x-1/2 z-50 bg-emerald-500/90 text-white font-medium text-xs sm:text-sm px-4 py-2 rounded-full shadow-lg border border-emerald-400/40 backdrop-blur-sm flex items-center gap-2 animate-fade-in"
          >
            <CheckCircle2 className="w-4 h-4 text-emerald-100" />
            <span>{toastMessage}</span>
          </div>
        )}

        {/* Modal Header */}
        <div className="flex-shrink-0 px-6 py-4 bg-[#111827] border-b border-slate-800 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 min-w-0">
            <div className="p-2 rounded-xl bg-indigo-500/10 border border-indigo-500/30 text-indigo-400">
              <GraduationCap className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <span className="text-[11px] font-mono uppercase tracking-wider text-indigo-400 font-semibold">
                  Topic Learning Center
                </span>
                {learningContent?.isSimplerVersion && (
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30 font-medium">
                    Simplified Mode
                  </span>
                )}
                {topic.isWeak && (
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-red-500/20 text-red-300 border border-red-500/30 font-medium flex items-center gap-1">
                    <AlertTriangle className="w-3 h-3" /> Weak Topic
                  </span>
                )}
              </div>
              <h2 className="text-xl font-bold text-white truncate">
                {topic.name}
              </h2>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              id="close-learning-center-btn"
              onClick={onClose}
              className="p-2 rounded-lg bg-slate-800/80 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors"
              title="Close Learning Center"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Modal Scrollable Content */}
        <div className="flex-1 overflow-y-auto px-6 py-6 space-y-6">

          {/* Section 6: LEARNING ORDER & METRICS STRIP */}
          <div 
            id="learning-order-strip"
            className="p-4 rounded-xl bg-[#131B2E] border border-slate-800/80 grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs"
          >
            <div>
              <span className="text-slate-400 block mb-1">Priority Rank</span>
              <span className={`inline-flex items-center gap-1 font-semibold uppercase px-2.5 py-0.5 rounded-md ${
                topic.priority === 'high' 
                  ? 'bg-red-500/15 text-red-400 border border-red-500/30' 
                  : topic.priority === 'medium'
                  ? 'bg-amber-500/15 text-amber-400 border border-amber-500/30'
                  : 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
              }`}>
                <Flame className="w-3 h-3" />
                {topic.priority.toUpperCase()}
              </span>
            </div>

            <div>
              <span className="text-slate-400 block mb-1">Current Status</span>
              <span className={`inline-flex items-center gap-1 font-semibold uppercase px-2 py-0.5 rounded-md border text-[11px] ${understanding.statusColor}`}>
                {understanding.status}
              </span>
            </div>

            <div>
              <span className="text-slate-400 block mb-1">Recommended Time</span>
              <span className="inline-flex items-center gap-1 font-semibold text-slate-200">
                <Clock className="w-3.5 h-3.5 text-cyan-400" />
                {topic.recommendedMinutes} minutes
              </span>
            </div>

            <div>
              <span className="text-slate-400 block mb-1">Document Source</span>
              <span className="text-slate-300 font-medium truncate block max-w-[140px]" title={plan.documentTitle || 'Uploaded PDF'}>
                {plan.documentTitle || 'Uploaded Course PDF'}
              </span>
            </div>
          </div>

          {/* Loading State */}
          {isLoading && (
            <div id="learning-content-loading" className="py-16 text-center space-y-4">
              <div className="inline-flex items-center justify-center p-4 rounded-2xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 animate-pulse">
                <Sparkles className="w-8 h-8 animate-spin" />
              </div>
              <div>
                <p className="text-base font-semibold text-white">
                  AI is preparing your complete {topic.name} lesson...
                </p>
                <p className="text-xs text-slate-400 mt-1">
                  Extracting grounded rules, step-by-step example, exam traps, and YouTube classes from your document.
                </p>
              </div>
            </div>
          )}

          {/* Error / Fallback Notice */}
          {errorMsg && !isLoading && (
            <div className="p-3 bg-amber-500/10 border border-amber-500/20 rounded-xl text-xs text-amber-300 flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-400 flex-shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Main Loaded Learning Content */}
          {!isLoading && learningContent && (
            <div className="space-y-6">

              {/* Section 2: SIMPLE SUMMARY */}
              <div id="ai-simple-summary-card" className="p-5 rounded-2xl bg-[#111827] border border-slate-800 space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <BookOpen className="w-5 h-5 text-indigo-400" />
                    <h3 className="text-base font-bold text-white tracking-wide">
                      AI Summary & Core Concept
                    </h3>
                  </div>
                  <span className="text-[11px] font-mono text-slate-400 bg-slate-800/80 px-2 py-0.5 rounded border border-slate-700/60">
                    Grounded in Uploaded PDF
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                  {/* What it is */}
                  <div className="p-3.5 rounded-xl bg-[#161F36]/80 border border-slate-700/50 space-y-1">
                    <span className="text-xs font-semibold uppercase tracking-wider text-indigo-300">
                      What it is
                    </span>
                    <p className="text-slate-200 leading-relaxed text-xs sm:text-sm">
                      {learningContent.simpleSummary.whatItIs}
                    </p>
                  </div>

                  {/* Why it is used */}
                  <div className="p-3.5 rounded-xl bg-[#161F36]/80 border border-slate-700/50 space-y-1">
                    <span className="text-xs font-semibold uppercase tracking-wider text-cyan-300">
                      Why it is used
                    </span>
                    <p className="text-slate-200 leading-relaxed text-xs sm:text-sm">
                      {learningContent.simpleSummary.whyItIsUsed}
                    </p>
                  </div>
                </div>

                {/* How it works */}
                <div className="p-3.5 rounded-xl bg-[#161F36]/80 border border-slate-700/50 space-y-1">
                  <span className="text-xs font-semibold uppercase tracking-wider text-emerald-300">
                    How it works
                  </span>
                  <p className="text-slate-200 leading-relaxed text-xs sm:text-sm">
                    {learningContent.simpleSummary.howItWorks}
                  </p>
                </div>

                {/* Important Rules */}
                {learningContent.simpleSummary.importantRules && learningContent.simpleSummary.importantRules.length > 0 && (
                  <div className="space-y-2">
                    <span className="text-xs font-semibold uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
                      <ShieldCheck className="w-3.5 h-3.5 text-indigo-400" />
                      Important Rules & Constraints
                    </span>
                    <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-slate-300">
                      {learningContent.simpleSummary.importantRules.map((rule, idx) => (
                        <li key={idx} className="p-2 rounded-lg bg-slate-800/60 border border-slate-700/40 flex items-start gap-2">
                          <Check className="w-3.5 h-3.5 text-emerald-400 mt-0.5 flex-shrink-0" />
                          <span>{rule}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Syntax if applicable */}
                {learningContent.simpleSummary.syntax && (
                  <div className="p-3.5 rounded-xl bg-slate-900 border border-slate-800 space-y-1.5 font-mono text-xs">
                    <span className="text-[11px] font-sans font-semibold uppercase tracking-wider text-cyan-300 block">
                      Syntax & Structure
                    </span>
                    <pre className="p-3 rounded-lg bg-black/60 text-cyan-200 overflow-x-auto whitespace-pre leading-relaxed border border-slate-800">
                      {learningContent.simpleSummary.syntax}
                    </pre>
                  </div>
                )}

                {/* Document points & Common exam mistakes */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Points from PDF */}
                  <div className="p-3.5 rounded-xl bg-indigo-950/20 border border-indigo-500/20 space-y-2 text-xs">
                    <span className="font-semibold text-indigo-300 flex items-center gap-1.5 uppercase tracking-wider text-[11px]">
                      <FileText className="w-3.5 h-3.5 text-indigo-400" />
                      Key Points from Uploaded PDF
                    </span>
                    <ul className="space-y-1.5 text-slate-300">
                      {learningContent.simpleSummary.documentPoints.map((pt, idx) => (
                        <li key={idx} className="flex items-start gap-1.5">
                          <span className="text-indigo-400 font-bold">•</span>
                          <span>{pt}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Common Exam Mistakes */}
                  <div className="p-3.5 rounded-xl bg-red-950/20 border border-red-500/20 space-y-2 text-xs">
                    <span className="font-semibold text-red-300 flex items-center gap-1.5 uppercase tracking-wider text-[11px]">
                      <AlertTriangle className="w-3.5 h-3.5 text-red-400" />
                      Common Exam Mistakes & Traps
                    </span>
                    <ul className="space-y-1.5 text-slate-300">
                      {learningContent.simpleSummary.commonExamMistakes.map((mistake, idx) => (
                        <li key={idx} className="flex items-start gap-1.5">
                          <span className="text-red-400 font-bold">✕</span>
                          <span>{mistake}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>

                {/* Simple Example */}
                {learningContent.simpleSummary.simpleExample && (
                  <div className="p-3.5 rounded-xl bg-[#161F36]/80 border border-slate-700/50 space-y-1 text-xs">
                    <span className="font-semibold text-amber-300 flex items-center gap-1.5 uppercase tracking-wider text-[11px]">
                      <Lightbulb className="w-3.5 h-3.5 text-amber-400" />
                      Intuitive Example / Analogy
                    </span>
                    <p className="text-slate-200 leading-relaxed">
                      {learningContent.simpleSummary.simpleExample}
                    </p>
                  </div>
                )}
              </div>

              {/* Section 3: STEP-BY-STEP EXPLANATION */}
              <div id="step-by-step-card" className="p-5 rounded-2xl bg-[#111827] border border-slate-800 space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    {learningContent.topicType === 'programming' ? (
                      <Code2 className="w-5 h-5 text-cyan-400" />
                    ) : learningContent.topicType === 'mathematical' ? (
                      <Calculator className="w-5 h-5 text-emerald-400" />
                    ) : (
                      <Brain className="w-5 h-5 text-indigo-400" />
                    )}
                    <h3 className="text-base font-bold text-white tracking-wide">
                      Step-by-Step Breakdown ({learningContent.topicType})
                    </h3>
                  </div>
                  <span className="text-[11px] font-mono text-cyan-400 bg-cyan-950/40 px-2 py-0.5 rounded border border-cyan-800/40 uppercase">
                    {learningContent.topicType}
                  </span>
                </div>

                {/* Programming Breakdown */}
                {learningContent.stepByStep.programming && (
                  <div className="space-y-3.5 text-xs">
                    <p className="text-slate-300 font-medium">
                      {learningContent.stepByStep.programming.concept}
                    </p>

                    {learningContent.stepByStep.programming.codeSnippet && (
                      <div className="space-y-1.5">
                        <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                          Code Example
                        </span>
                        <pre className="p-3.5 rounded-xl bg-black/75 border border-slate-800 text-emerald-300 font-mono text-xs overflow-x-auto whitespace-pre leading-relaxed">
                          {learningContent.stepByStep.programming.codeSnippet}
                        </pre>
                      </div>
                    )}

                    {/* Line by line explanation */}
                    {learningContent.stepByStep.programming.codeLineByLine && (
                      <div className="space-y-1.5">
                        <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                          Line-by-Line Walkthrough
                        </span>
                        <div className="space-y-1.5">
                          {learningContent.stepByStep.programming.codeLineByLine.map((item, idx) => (
                            <div key={idx} className="p-2.5 rounded-lg bg-slate-900/90 border border-slate-800 flex flex-col sm:flex-row sm:items-baseline gap-1 sm:gap-3">
                              <code className="text-cyan-300 font-mono text-[11px] font-semibold flex-shrink-0">
                                {item.line}
                              </code>
                              <span className="text-slate-300 text-xs">
                                → {item.explanation}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Expected output & Why */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                      <div className="p-3 rounded-xl bg-slate-900 border border-slate-800">
                        <span className="text-[10px] font-semibold uppercase text-slate-400 block mb-1">
                          Expected Output
                        </span>
                        <code className="text-amber-300 font-mono text-xs">
                          {learningContent.stepByStep.programming.expectedOutput}
                        </code>
                      </div>
                      <div className="p-3 rounded-xl bg-slate-900 border border-slate-800">
                        <span className="text-[10px] font-semibold uppercase text-slate-400 block mb-1">
                          Why this output occurs
                        </span>
                        <p className="text-slate-300 text-xs">
                          {learningContent.stepByStep.programming.whyOutputOccurs}
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Mathematical Breakdown */}
                {learningContent.stepByStep.mathematical && (
                  <div className="space-y-4 text-xs">
                    {/* Formula */}
                    <div className="p-4 rounded-xl bg-black/60 border border-emerald-500/30 text-center">
                      <span className="text-[10px] font-semibold uppercase text-emerald-400 block mb-1">
                        Core Formula
                      </span>
                      <div className="text-base sm:text-lg font-mono font-bold text-white tracking-wide">
                        {learningContent.stepByStep.mathematical.formula}
                      </div>
                    </div>

                    {/* Variables */}
                    {learningContent.stepByStep.mathematical.variableExplanations && (
                      <div className="space-y-1.5">
                        <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                          Variable Meanings
                        </span>
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                          {learningContent.stepByStep.mathematical.variableExplanations.map((v, idx) => (
                            <div key={idx} className="p-2 rounded-lg bg-slate-900 border border-slate-800">
                              <span className="text-emerald-300 font-mono font-bold text-xs">{v.variable}</span>
                              <p className="text-slate-300 text-[11px] mt-0.5">{v.meaning}</p>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Solved Steps */}
                    {learningContent.stepByStep.mathematical.solvedExampleSteps && (
                      <div className="space-y-2">
                        <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                          Solved Exam Example Step-by-Step
                        </span>
                        <div className="space-y-2">
                          {learningContent.stepByStep.mathematical.solvedExampleSteps.map((step) => (
                            <div key={step.stepNumber} className="p-3 rounded-xl bg-slate-900 border border-slate-800 flex items-start gap-3">
                              <div className="w-6 h-6 rounded-full bg-emerald-500/20 text-emerald-300 flex items-center justify-center font-bold text-xs flex-shrink-0">
                                {step.stepNumber}
                              </div>
                              <div className="space-y-1">
                                <p className="text-white font-medium text-xs">{step.description}</p>
                                <code className="text-emerald-300 font-mono text-[11px] block">{step.mathWork}</code>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* Theoretical Breakdown */}
                {learningContent.stepByStep.theoretical && (
                  <div className="space-y-4 text-xs">
                    {/* Definition */}
                    <div className="p-3.5 rounded-xl bg-[#161F36]/80 border border-slate-700/50">
                      <span className="text-[10px] font-semibold uppercase text-indigo-300 block mb-1">
                        Exam-Ready Definition
                      </span>
                      <p className="text-slate-200 text-xs sm:text-sm leading-relaxed">
                        {learningContent.stepByStep.theoretical.definition}
                      </p>
                    </div>

                    {/* Key characteristics */}
                    {learningContent.stepByStep.theoretical.keyCharacteristics && (
                      <div className="space-y-1.5">
                        <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                          Key Characteristics
                        </span>
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                          {learningContent.stepByStep.theoretical.keyCharacteristics.map((c, idx) => (
                            <div key={idx} className="p-2.5 rounded-lg bg-slate-900 border border-slate-800 text-slate-300">
                              • {c}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Working Principle & Practical Example */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div className="p-3 rounded-xl bg-slate-900 border border-slate-800 space-y-1">
                        <span className="text-[10px] font-semibold uppercase text-cyan-400 block">
                          Working Principle
                        </span>
                        <p className="text-slate-300 text-xs">
                          {learningContent.stepByStep.theoretical.workingPrinciple}
                        </p>
                      </div>
                      <div className="p-3 rounded-xl bg-slate-900 border border-slate-800 space-y-1">
                        <span className="text-[10px] font-semibold uppercase text-amber-400 block">
                          Practical Real-World Example
                        </span>
                        <p className="text-slate-300 text-xs">
                          {learningContent.stepByStep.theoretical.practicalExample}
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Section 4: "EXAM READY" SECTION */}
              <div id="exam-ready-section" className="p-5 rounded-2xl bg-gradient-to-br from-[#111827] to-[#141B33] border border-indigo-500/30 space-y-4">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="w-5 h-5 text-indigo-400" />
                  <h3 className="text-base font-bold text-white tracking-wide">
                    "Exam Ready" Checklist & Outcomes
                  </h3>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                  {/* Learning Outcomes */}
                  <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 space-y-2">
                    <span className="font-semibold text-emerald-300 block text-xs">
                      After this lesson, you should be able to:
                    </span>
                    <ul className="space-y-1.5 text-slate-300">
                      {learningContent.examReadySection.learningOutcomes.map((outcome, idx) => (
                        <li key={idx} className="flex items-start gap-2">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 mt-0.5 flex-shrink-0" />
                          <span>{outcome}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Most Important Exam Points */}
                  <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 space-y-2">
                    <span className="font-semibold text-indigo-300 block text-xs">
                      Most Important Exam Points:
                    </span>
                    <ul className="space-y-1.5 text-slate-300">
                      {learningContent.examReadySection.mostImportantExamPoints.map((point, idx) => (
                        <li key={idx} className="flex items-start gap-2">
                          <Flame className="w-3.5 h-3.5 text-amber-400 mt-0.5 flex-shrink-0" />
                          <span>{point}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>

              {/* Section 5: RELATED YOUTUBE CLASSES */}
              <div id="youtube-classes-section" className="p-5 rounded-2xl bg-[#111827] border border-slate-800 space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Youtube className="w-5 h-5 text-red-500" />
                    <h3 className="text-base font-bold text-white tracking-wide">
                      Related YouTube Classes & Tutorials
                    </h3>
                  </div>
                  <span className="text-[11px] text-slate-400">
                    Hand-curated for {topic.name}
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  {learningContent.youtubeClasses.map((yt, idx) => (
                    <div 
                      key={idx} 
                      className="p-4 rounded-xl bg-[#161F36]/90 border border-slate-700/60 flex flex-col justify-between space-y-3 hover:border-red-500/40 transition-colors"
                    >
                      <div className="space-y-1.5">
                        <div className="flex items-center gap-1.5 text-red-400 text-xs font-semibold">
                          <Play className="w-3.5 h-3.5 fill-red-400" />
                          <span>{yt.channelName || 'Academic Educator'}</span>
                        </div>
                        <h4 className="text-xs font-bold text-white leading-snug line-clamp-2">
                          {yt.title}
                        </h4>
                        <p className="text-[11px] text-slate-300 line-clamp-2 leading-relaxed">
                          {yt.description}
                        </p>
                      </div>

                      <a
                        href={yt.watchUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center justify-center gap-1.5 w-full py-2 px-3 rounded-lg bg-red-600/20 hover:bg-red-600/30 text-red-300 border border-red-500/40 text-xs font-semibold transition-all hover:text-white"
                      >
                        <Youtube className="w-3.5 h-3.5" />
                        <span>Watch Class</span>
                        <ExternalLink className="w-3 h-3 ml-0.5" />
                      </a>
                    </div>
                  ))}
                </div>
              </div>

              {/* Section 8: MINI CHECK (2-3 quick questions) */}
              <div id="quick-check-section" className="p-5 rounded-2xl bg-[#111827] border border-slate-800 space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <HelpCircle className="w-5 h-5 text-indigo-400" />
                    <h3 className="text-base font-bold text-white tracking-wide">
                      Mini Check (Quick Recall)
                    </h3>
                  </div>
                  <span className="text-[11px] text-slate-400">
                    Test your understanding right now
                  </span>
                </div>

                <div className="space-y-4">
                  {learningContent.quickCheckQuestions.map((q, qIndex) => {
                    const ansState = quickCheckAnswers[q.id];
                    const isAnswered = !!ansState;

                    return (
                      <div 
                        key={q.id}
                        className={`p-4 rounded-xl border transition-all ${
                          isAnswered 
                            ? ansState.isCorrect 
                              ? 'bg-emerald-950/20 border-emerald-500/40' 
                              : 'bg-red-950/20 border-red-500/40'
                            : 'bg-slate-900/90 border-slate-800'
                        }`}
                      >
                        <div className="flex items-start justify-between gap-2 mb-3">
                          <span className="text-xs font-bold text-indigo-400 font-mono">
                            Question {qIndex + 1} of {learningContent.quickCheckQuestions.length}
                          </span>
                          {isAnswered && (
                            <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1 ${
                              ansState.isCorrect 
                                ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40' 
                                : 'bg-red-500/20 text-red-300 border border-red-500/40'
                            }`}>
                              {ansState.isCorrect ? (
                                <>
                                  <Check className="w-3 h-3" /> Correct
                                </>
                              ) : (
                                <>
                                  <X className="w-3 h-3" /> Incorrect
                                </>
                              )}
                            </span>
                          )}
                        </div>

                        <p className="text-xs sm:text-sm font-semibold text-white mb-3 leading-relaxed">
                          {q.question}
                        </p>

                        {/* Options */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                          {q.options.map((opt, oIdx) => {
                            const isSelected = ansState?.selectedIndex === oIdx;
                            const isCorrectOpt = oIdx === q.correctOptionIndex;

                            let optBtnStyle = 'bg-slate-800/80 hover:bg-slate-700/80 text-slate-200 border-slate-700';

                            if (isAnswered) {
                              if (isCorrectOpt) {
                                optBtnStyle = 'bg-emerald-900/50 border-emerald-500 text-emerald-200 font-semibold';
                              } else if (isSelected && !isCorrectOpt) {
                                optBtnStyle = 'bg-red-900/50 border-red-500 text-red-200';
                              } else {
                                optBtnStyle = 'bg-slate-900/60 opacity-60 border-slate-800 text-slate-400';
                              }
                            }

                            return (
                              <button
                                key={oIdx}
                                disabled={isAnswered}
                                onClick={() => handleSelectQuickCheck(q.id, oIdx, q.correctOptionIndex)}
                                className={`p-2.5 rounded-lg border text-left flex items-start gap-2 transition-all ${optBtnStyle}`}
                              >
                                <span className="w-5 h-5 rounded font-mono text-[10px] flex items-center justify-center bg-black/40 flex-shrink-0 mt-0.5">
                                  {String.fromCharCode(65 + oIdx)}
                                </span>
                                <span className="leading-snug">{opt}</span>
                              </button>
                            );
                          })}
                        </div>

                        {/* Explanation once answered */}
                        {isAnswered && (
                          <div className="mt-3 p-3 rounded-lg bg-black/50 border border-slate-800 text-xs text-slate-300 flex items-start gap-2">
                            <Lightbulb className="w-4 h-4 text-amber-400 flex-shrink-0 mt-0.5" />
                            <div>
                              <span className="font-semibold text-white">Explanation: </span>
                              <span>{q.explanation}</span>
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Section 9: TOPIC UNDERSTANDING INDICATOR */}
              <div 
                id="topic-understanding-indicator"
                className="p-5 rounded-2xl bg-[#111827] border border-slate-800 space-y-3"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-xs font-semibold uppercase tracking-wider text-slate-400 block">
                      Topic Understanding Indicator
                    </span>
                    <span className="text-sm font-bold text-white">
                      Status: {understanding.statusLabel}
                    </span>
                  </div>

                  <div className="text-right">
                    <span className="text-xl font-black text-white font-mono">
                      {understanding.score}%
                    </span>
                  </div>
                </div>

                {/* Graphical Visual Bar */}
                <div className="flex items-center gap-1.5 h-3 w-full bg-slate-900 rounded-full p-1 border border-slate-800">
                  {Array.from({ length: totalBlocks }).map((_, idx) => {
                    const isFilled = idx < filledBlocks;
                    return (
                      <div
                        key={idx}
                        className={`flex-1 h-full rounded-full transition-all duration-300 ${
                          isFilled
                            ? understanding.score >= 85
                              ? 'bg-emerald-400'
                              : understanding.score >= 65
                              ? 'bg-indigo-400'
                              : 'bg-amber-400'
                            : 'bg-slate-800'
                        }`}
                      />
                    );
                  })}
                </div>

                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-[11px] text-slate-400 pt-1">
                  <p className="italic">
                    "{understanding.diagnostic}"
                  </p>
                  <div className="flex items-center gap-3">
                    {understanding.quizAccuracy !== undefined && (
                      <span>Quiz: <b className="text-slate-200">{understanding.quizAccuracy}%</b></span>
                    )}
                    {understanding.quickCheckAccuracy !== undefined && (
                      <span>Mini Check: <b className="text-slate-200">{understanding.quickCheckAccuracy}%</b></span>
                    )}
                  </div>
                </div>
              </div>

              {/* Section 7 & 10: ACTION BUTTONS: [ I Understand ] [ Still Confused ] [ Re-test Topic ] */}
              <div 
                id="learning-action-controls"
                className="p-5 rounded-2xl bg-[#131B2E] border border-slate-800 space-y-3"
              >
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {/* [ I Understand ] Button */}
                  <button
                    id="mark-understood-btn"
                    onClick={handleUnderstoodClick}
                    className={`py-3 px-4 rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition-all shadow-md ${
                      userMarkedUnderstood
                        ? 'bg-emerald-600 text-white ring-2 ring-emerald-400/50'
                        : 'bg-emerald-600/90 hover:bg-emerald-500 text-white hover:shadow-emerald-900/30'
                    }`}
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    <span>{userMarkedUnderstood ? '✓ Understood (Plan Updated)' : 'I Understand'}</span>
                  </button>

                  {/* [ Still Confused ] Button */}
                  <button
                    id="still-confused-btn"
                    onClick={handleConfusedClick}
                    className={`py-3 px-4 rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition-all border ${
                      userMarkedConfused
                        ? 'bg-amber-500/20 text-amber-300 border-amber-500/50'
                        : 'bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white border-slate-700'
                    }`}
                  >
                    <RotateCcw className="w-4 h-4 text-amber-400" />
                    <span>Still Confused (Explain Simpler)</span>
                  </button>
                </div>

                {/* Sub row: Re-test Topic & Reschedule if weak */}
                <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2 border-t border-slate-800/80">
                  <div className="text-xs text-slate-400 text-center sm:text-left">
                    <span>Ready to verify under exam conditions?</span>
                  </div>

                  <div className="flex items-center gap-2 w-full sm:w-auto">
                    {onRescheduleTopic && (
                      <button
                        id="reschedule-topic-learning-btn"
                        onClick={() => {
                          onRescheduleTopic(topic.id);
                          showToast(`${topic.name} moved to top of study queue!`);
                        }}
                        className="py-2 px-3 rounded-lg bg-slate-800/90 hover:bg-slate-700 text-slate-300 hover:text-white text-xs font-semibold border border-slate-700 transition-colors flex-1 sm:flex-none text-center"
                      >
                        Reschedule to Top
                      </button>
                    )}

                    <button
                      id="retest-topic-learning-btn"
                      onClick={() => {
                        onClose();
                        onStartReTest(topic.name);
                      }}
                      className="py-2 px-4 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold transition-all shadow-md shadow-indigo-900/30 flex items-center justify-center gap-1.5 flex-1 sm:flex-none"
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                      <span>Re-test {topic.name}</span>
                    </button>
                  </div>
                </div>
              </div>

            </div>
          )}

        </div>

        {/* Modal Footer */}
        <div className="flex-shrink-0 px-6 py-3 bg-[#111827] border-t border-slate-800 flex items-center justify-between text-xs text-slate-400">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span>Emergency Exam Rescue Active</span>
          </div>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white transition-colors text-xs font-semibold"
          >
            Back to Dashboard
          </button>
        </div>
      </div>
    </div>
  );
};
