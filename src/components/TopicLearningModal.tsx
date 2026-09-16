import React, { useState, useEffect } from 'react';
import { 
  StudyTopic, 
  ExamRescuePlan, 
  QuestionAttempt, 
  TopicLearningContent 
} from '../types';
import { fetchTopicLearning, calculateTopicUnderstanding } from '../utils/rescueQuiz';
import { 
  X, 
  Youtube, 
  CheckCircle2, 
  RotateCcw, 
  RefreshCw,
  ExternalLink,
  Check,
  XCircle,
  BookOpen,
  Lightbulb,
  AlertTriangle,
  FileText,
  Code2,
  Clock,
  Sparkles,
  ChevronDown,
  ChevronUp,
  GraduationCap
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
  onOpenUpload?: () => void;
}

export const TopicLearningModal: React.FC<TopicLearningModalProps> = ({
  topic,
  plan,
  quizAttempts,
  isOpen,
  onClose,
  onMarkUnderstood,
  onMarkConfused,
  onStartReTest
}) => {
  const [learningContent, setLearningContent] = useState<TopicLearningContent | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [simplerMode, setSimplerMode] = useState<boolean>(false);
  const [userMarkedUnderstood, setUserMarkedUnderstood] = useState<boolean>(false);
  const [userMarkedConfused, setUserMarkedConfused] = useState<boolean>(false);
  const [expandedMarks, setExpandedMarks] = useState<{ [key: string]: boolean }>({
    four: true,
    six: true,
    ten: true
  });

  // Track quick check state: { [qId]: { selectedIndex, isCorrect } }
  const [quickCheckAnswers, setQuickCheckAnswers] = useState<{
    [qId: string]: { selectedIndex: number; isCorrect: boolean };
  }>({});

  useEffect(() => {
    if (!isOpen || !topic) return;

    setQuickCheckAnswers({});
    setSimplerMode(false);
    setUserMarkedUnderstood(topic.userMarkedUnderstood || topic.status === 'mastered');
    setUserMarkedConfused(!!topic.isWeak && topic.status === 'weak');

    setIsLoading(true);
    fetchTopicLearning(topic.name, plan, { simplerMode: false })
      .then((content) => {
        setLearningContent(content);
        setIsLoading(false);
      })
      .catch((err) => {
        console.error('Error loading topic learning:', err);
        setIsLoading(false);
      });
  }, [isOpen, topic?.name]);

  if (!isOpen || !topic) return null;

  // Calculate dynamic understanding indicator
  const understanding = calculateTopicUnderstanding(
    topic.name,
    quizAttempts,
    quickCheckAnswers,
    userMarkedUnderstood,
    userMarkedConfused
  );

  const handleSelectQuickCheck = (qId: string, optionIdx: number, correctIdx: number) => {
    if (quickCheckAnswers[qId]) return; // already answered
    setQuickCheckAnswers((prev) => ({
      ...prev,
      [qId]: { selectedIndex: optionIdx, isCorrect: optionIdx === correctIdx }
    }));
  };

  const handleToggleMode = (enableSimpler: boolean) => {
    setSimplerMode(enableSimpler);
    setIsLoading(true);
    fetchTopicLearning(topic.name, plan, { simplerMode: enableSimpler })
      .then((content) => {
        setLearningContent(content);
        setIsLoading(false);
      })
      .catch(() => setIsLoading(false));
  };

  const handleUnderstoodClick = () => {
    setUserMarkedUnderstood(true);
    setUserMarkedConfused(false);
    onMarkUnderstood(topic.id || topic.name);
  };

  const handleConfusedClick = () => {
    setUserMarkedConfused(true);
    setUserMarkedUnderstood(false);
    onMarkConfused(topic.id || topic.name);
    // Automatically switch to simpler ELI5 mode
    handleToggleMode(true);
  };

  const toggleAccordion = (key: 'four' | 'six' | 'ten') => {
    setExpandedMarks((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 md:p-6 overflow-y-auto">
      {/* Backdrop */}
      <div 
        onClick={onClose}
        className="fixed inset-0 bg-slate-950/85 backdrop-blur-sm"
      />

      {/* Modal Container */}
      <div 
        onClick={(e) => e.stopPropagation()}
        className="relative w-full max-w-4xl max-h-[92vh] flex flex-col rounded-2xl bg-[#08110F] border border-[#294238] shadow-2xl overflow-hidden z-10 text-[#F2F7F3] my-auto"
      >
        {/* Header: Title, Mode Switcher, and Close Button */}
        <div className="flex-shrink-0 p-4 sm:p-5 border-b border-[#294238] flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-[#0D1916]">
          <div className="min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-[11px] font-semibold text-[#8FD3A2] uppercase tracking-wider">
                Exam-Based Study Page
              </span>
              <span className="text-[11px] px-2 py-0.5 rounded bg-[#12211D] text-[#AEBDB4] border border-[#294238]">
                {plan.courseName || 'Document Notes'}
              </span>
            </div>
            <h2 className="text-xl sm:text-2xl font-bold text-[#F2F7F3] truncate">
              {topic.name}
            </h2>
          </div>

          <div className="flex items-center gap-2 sm:gap-3 shrink-0">
            {/* Mode Switcher: Exam Mode vs Simpler Mode (ELI5) */}
            <div className="inline-flex rounded-lg p-1 bg-[#08110F] border border-[#294238] text-xs">
              <button
                id="exam-mode-tab-btn"
                type="button"
                onClick={() => handleToggleMode(false)}
                className={`px-3 py-1.5 rounded-md font-medium transition-colors cursor-pointer ${
                  !simplerMode
                    ? 'bg-[#12211D] text-[#BFE8C8] border border-[#294238] font-bold shadow-sm'
                    : 'text-[#7F9188] hover:text-[#AEBDB4]'
                }`}
              >
                Exam Mode
              </button>
              <button
                id="simpler-mode-tab-btn"
                type="button"
                onClick={() => handleToggleMode(true)}
                className={`px-3 py-1.5 rounded-md font-medium transition-colors cursor-pointer flex items-center gap-1.5 ${
                  simplerMode
                    ? 'bg-[#12211D] text-[#E8D58A] border border-[#294238] font-bold shadow-sm'
                    : 'text-[#7F9188] hover:text-[#AEBDB4]'
                }`}
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>Simpler Mode (ELI5)</span>
              </button>
            </div>

            <button
              id="close-topic-modal-btn"
              onClick={onClose}
              className="p-2 text-[#AEBDB4] hover:text-[#F2F7F3] hover:bg-[#12211D] rounded-xl border border-[#294238] transition-colors cursor-pointer"
              aria-label="Close modal"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Dynamic Topic Understanding & Progress Bar (Sections 14, 18, 19) */}
        <div className="flex-shrink-0 bg-[#0A1411] border-b border-[#294238] px-4 sm:px-6 py-3">
          <div className="flex flex-wrap items-center justify-between gap-3 text-xs">
            {/* Status Badge */}
            <div className="flex items-center gap-2">
              <span className={`px-2.5 py-1 rounded-full font-bold border ${understanding.statusColor}`}>
                {understanding.statusBadge}
              </span>
              <span className="text-[#AEBDB4]">
                Score: <strong className="text-[#F2F7F3]">{understanding.score}%</strong>
              </span>
            </div>

            {/* Quick Metrics */}
            <div className="flex flex-wrap items-center gap-4 text-[#AEBDB4]">
              <div>
                Attempted: <strong className="text-[#F2F7F3]">{understanding.questionsAttempted}</strong>
              </div>
              <div>
                Correct: <strong className="text-[#9FE2B0]">{understanding.correctAnswers}</strong>
              </div>
              <div>
                Wrong: <strong className="text-[#F29B9B]">{understanding.wrongAnswers}</strong>
              </div>
              <div>
                Revision Time: <strong className="text-[#E8D58A]">{understanding.recommendedRevisionTime} min</strong>
              </div>
            </div>
          </div>

          {/* Rescue Plan Connection Banner (Section 19) */}
          <div className="mt-2 text-[11px] text-[#AEBDB4] flex items-center gap-1.5 pt-1.5 border-t border-[#1D332B]/50">
            <span className="text-[#8FD3A2] font-semibold">Rescue Plan Sync:</span>
            <span>{understanding.diagnostic}</span>
          </div>
        </div>

        {/* Scrollable Body: All 19 Study Sections */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6">
          {isLoading ? (
            <div className="p-16 text-center space-y-3">
              <RefreshCw className="w-8 h-8 text-[#8FD3A2] animate-spin mx-auto" />
              <p className="text-sm font-medium text-[#F2F7F3]">
                Generating full exam-based study page for {topic.name}...
              </p>
              <p className="text-xs text-[#7F9188]">
                Grounded strictly in your uploaded document material
              </p>
            </div>
          ) : learningContent ? (
            <div className="space-y-6">

              {/* SECTION 1: TOPIC OVERVIEW */}
              <div id="section-overview" className="p-5 rounded-xl bg-[#0D1916] border border-[#294238] space-y-3">
                <div className="flex items-center gap-2">
                  <BookOpen className="w-4 h-4 text-[#8FD3A2]" />
                  <h3 className="text-xs font-bold uppercase tracking-wider text-[#BFE8C8]">
                    1. Topic Overview
                  </h3>
                </div>
                
                <p className="text-sm sm:text-base text-[#F2F7F3] leading-relaxed">
                  {learningContent.overview?.whatItIs || learningContent.simpleSummary?.whatItIs}
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                  <div className="p-3 rounded-lg bg-[#12211D] border border-[#294238]/70">
                    <span className="text-xs font-semibold text-[#8FD3A2] block mb-1">Why It Is Important</span>
                    <p className="text-xs text-[#AEBDB4] leading-relaxed">
                      {learningContent.overview?.whyImportant || learningContent.simpleSummary?.whyItIsUsed}
                    </p>
                  </div>
                  <div className="p-3 rounded-lg bg-[#12211D] border border-[#294238]/70">
                    <span className="text-xs font-semibold text-[#8FD3A2] block mb-1">Where It Is Used</span>
                    <p className="text-xs text-[#AEBDB4] leading-relaxed">
                      {learningContent.overview?.whereUsed || 'Academic examinations, problem solving, and real-world system applications.'}
                    </p>
                  </div>
                </div>

                {learningContent.overview?.quickSummary && (
                  <div className="p-3 rounded-lg bg-[#12211D]/80 border-l-2 border-[#8FD3A2] text-xs text-[#F2F7F3] leading-relaxed">
                    <strong className="text-[#8FD3A2]">Quick Summary: </strong>
                    {learningContent.overview.quickSummary}
                  </div>
                )}
              </div>

              {/* SECTION 2: COMPLETE THEORY */}
              {learningContent.completeTheory && (
                <div id="section-theory" className="p-5 rounded-xl bg-[#0D1916] border border-[#294238] space-y-4">
                  <div className="flex items-center gap-2">
                    <GraduationCap className="w-4 h-4 text-[#8FD3A2]" />
                    <h3 className="text-xs font-bold uppercase tracking-wider text-[#BFE8C8]">
                      2. Complete Theory (Basics to Advanced)
                    </h3>
                  </div>

                  {/* Definitions */}
                  {learningContent.completeTheory.definitions && learningContent.completeTheory.definitions.length > 0 && (
                    <div className="space-y-2">
                      <span className="text-xs font-semibold text-[#BFE8C8] block">Definitions</span>
                      {learningContent.completeTheory.definitions.map((def, idx) => (
                        <div key={idx} className="p-3 rounded-lg bg-[#12211D] border border-[#294238] text-xs sm:text-sm text-[#F2F7F3] leading-relaxed">
                          {def}
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Important Concepts */}
                  {learningContent.completeTheory.importantConcepts && learningContent.completeTheory.importantConcepts.length > 0 && (
                    <div className="space-y-1.5">
                      <span className="text-xs font-semibold text-[#BFE8C8] block">Important Concepts</span>
                      <ul className="space-y-1.5 text-xs text-[#AEBDB4]">
                        {learningContent.completeTheory.importantConcepts.map((concept, idx) => (
                          <li key={idx} className="flex items-start gap-2">
                            <span className="w-1.5 h-1.5 rounded-full bg-[#8FD3A2] mt-1.5 shrink-0" />
                            <span>{concept}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* Rules & Properties */}
                  {learningContent.completeTheory.rulesAndProperties && learningContent.completeTheory.rulesAndProperties.length > 0 && (
                    <div className="space-y-2">
                      <span className="text-xs font-semibold text-[#BFE8C8] block">Rules & Properties</span>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        {learningContent.completeTheory.rulesAndProperties.map((rule, idx) => (
                          <div key={idx} className="p-2.5 rounded-lg bg-[#12211D] border border-[#294238] text-xs text-[#F2F7F3] flex items-start gap-2">
                            <Check className="w-3.5 h-3.5 text-[#8FD3A2] shrink-0 mt-0.5" />
                            <span>{rule}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Characteristics */}
                  {learningContent.completeTheory.characteristics && learningContent.completeTheory.characteristics.length > 0 && (
                    <div className="space-y-1.5">
                      <span className="text-xs font-semibold text-[#BFE8C8] block">Characteristics</span>
                      <div className="flex flex-wrap gap-2">
                        {learningContent.completeTheory.characteristics.map((c, idx) => (
                          <span key={idx} className="px-2.5 py-1 rounded-md bg-[#12211D] border border-[#294238] text-xs text-[#AEBDB4]">
                            • {c}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Types / Classifications */}
                  {learningContent.completeTheory.typesOrClassifications && learningContent.completeTheory.typesOrClassifications.length > 0 && (
                    <div className="space-y-2">
                      <span className="text-xs font-semibold text-[#BFE8C8] block">Types & Classifications</span>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        {learningContent.completeTheory.typesOrClassifications.map((t, idx) => (
                          <div key={idx} className="p-3 rounded-lg bg-[#12211D] border border-[#294238] text-xs">
                            <strong className="text-[#8FD3A2] block mb-0.5">{t.typeName}</strong>
                            <p className="text-[#AEBDB4]">{t.description}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Working Principle */}
                  {learningContent.completeTheory.workingPrinciple && (
                    <div className="p-3 rounded-lg bg-[#12211D] border border-[#294238] text-xs">
                      <span className="font-semibold text-[#8FD3A2] block mb-1">Working Principle</span>
                      <p className="text-[#F2F7F3] leading-relaxed">{learningContent.completeTheory.workingPrinciple}</p>
                    </div>
                  )}

                  {/* Important Terms and Their Meaning */}
                  {learningContent.completeTheory.importantTerms && learningContent.completeTheory.importantTerms.length > 0 && (
                    <div className="space-y-2">
                      <span className="text-xs font-semibold text-[#BFE8C8] block">Key Terms & Definitions</span>
                      <div className="space-y-2">
                        {learningContent.completeTheory.importantTerms.map((term, idx) => (
                          <div key={idx} className="p-2.5 rounded-lg bg-[#12211D] border border-[#294238] text-xs">
                            <strong className="text-[#8FD3A2] mr-2">{term.term}:</strong>
                            <span className="text-[#AEBDB4]">{term.definition}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Syllabus Relationships */}
                  {learningContent.completeTheory.relationships && (
                    <p className="text-xs text-[#7F9188] italic pt-1">
                      <strong className="text-[#AEBDB4] not-italic">Connection to Syllabus: </strong>
                      {learningContent.completeTheory.relationships}
                    </p>
                  )}
                </div>
              )}

              {/* SECTION 3: STEP-BY-STEP EXPLANATION */}
              {learningContent.stepByStep && learningContent.stepByStep.length > 0 && (
                <div id="section-step-by-step" className="p-5 rounded-xl bg-[#0D1916] border border-[#294238] space-y-3">
                  <div className="flex items-center gap-2">
                    <Lightbulb className="w-4 h-4 text-[#8FD3A2]" />
                    <h3 className="text-xs font-bold uppercase tracking-wider text-[#BFE8C8]">
                      3. Step-by-Step Explanation
                    </h3>
                  </div>

                  <div className="space-y-3">
                    {learningContent.stepByStep.map((step, idx) => (
                      <div key={idx} className="p-3.5 rounded-lg bg-[#12211D] border border-[#294238]">
                        <div className="flex items-center gap-2.5 mb-1">
                          <span className="w-6 h-6 rounded-full bg-[#08110F] text-[#8FD3A2] text-xs font-mono font-bold flex items-center justify-center border border-[#294238]">
                            {step.stepNumber || idx + 1}
                          </span>
                          <h4 className="text-xs sm:text-sm font-semibold text-[#F2F7F3]">
                            {step.title}
                          </h4>
                        </div>
                        <p className="text-xs text-[#AEBDB4] leading-relaxed pl-8">
                          {step.description}
                        </p>
                        {step.detail && (
                          <p className="text-xs text-[#7F9188] pl-8 mt-1 italic">
                            Tip: {step.detail}
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* SECTION 4: EXAMPLES & WALKTHROUGHS */}
              {learningContent.examples && learningContent.examples.length > 0 && (
                <div id="section-examples" className="p-5 rounded-xl bg-[#0D1916] border border-[#294238] space-y-4">
                  <div className="flex items-center gap-2">
                    <Code2 className="w-4 h-4 text-[#8FD3A2]" />
                    <h3 className="text-xs font-bold uppercase tracking-wider text-[#BFE8C8]">
                      4. Solved Examples & Walkthroughs
                    </h3>
                  </div>

                  {learningContent.examples.map((ex, idx) => (
                    <div key={idx} className="p-4 rounded-xl bg-[#12211D] border border-[#294238] space-y-3">
                      <div className="flex items-center justify-between">
                        <h4 className="text-xs sm:text-sm font-semibold text-[#F2F7F3]">
                          {ex.title}
                        </h4>
                        {ex.exampleType && (
                          <span className="text-[11px] px-2 py-0.5 rounded bg-[#08110F] text-[#8FD3A2] border border-[#294238] capitalize">
                            {ex.exampleType}
                          </span>
                        )}
                      </div>

                      {/* Code or Math Block */}
                      <div className="p-3.5 rounded-lg bg-[#08110F] border border-[#294238] font-mono text-xs text-[#BFE8C8] overflow-x-auto whitespace-pre-wrap leading-relaxed">
                        {ex.content}
                      </div>

                      <p className="text-xs text-[#AEBDB4] leading-relaxed">
                        <strong className="text-[#8FD3A2]">Walkthrough: </strong>
                        {ex.explanation}
                      </p>
                    </div>
                  ))}
                </div>
              )}

              {/* SECTION 5: CODE / FORMULA / DIAGRAM SECTION */}
              {learningContent.codeFormulaDiagram && (
                <div id="section-diagram" className="p-5 rounded-xl bg-[#0D1916] border border-[#294238] space-y-3">
                  <div className="flex items-center gap-2">
                    <FileText className="w-4 h-4 text-[#8FD3A2]" />
                    <h3 className="text-xs font-bold uppercase tracking-wider text-[#BFE8C8]">
                      5. Syntax, Formulas & Structural Flow
                    </h3>
                  </div>

                  {learningContent.codeFormulaDiagram.syntaxOrFormulas && (
                    <div className="p-3.5 rounded-lg bg-[#08110F] border border-[#294238] font-mono text-xs text-[#BFE8C8] whitespace-pre-wrap">
                      {learningContent.codeFormulaDiagram.syntaxOrFormulas}
                    </div>
                  )}

                  {learningContent.codeFormulaDiagram.pseudocodeOrDiagram && (
                    <div className="p-3.5 rounded-lg bg-[#08110F] border border-[#294238] font-mono text-xs text-[#AEBDB4] overflow-x-auto whitespace-pre-wrap">
                      {learningContent.codeFormulaDiagram.pseudocodeOrDiagram}
                    </div>
                  )}

                  {learningContent.codeFormulaDiagram.explanation && (
                    <p className="text-xs text-[#AEBDB4] leading-relaxed">
                      {learningContent.codeFormulaDiagram.explanation}
                    </p>
                  )}
                </div>
              )}

              {/* SECTION 6: EXAM-IMPORTANT POINTS */}
              {learningContent.examImportant && (
                <div id="section-exam-important" className="p-5 rounded-xl bg-[#0D1916] border border-[#294238] space-y-4">
                  <div className="flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 text-[#E8D58A]" />
                    <h3 className="text-xs font-bold uppercase tracking-wider text-[#E8D58A]">
                      6. Exam-Important Points & Rubric Keys
                    </h3>
                  </div>

                  {/* Must Remember */}
                  {learningContent.examImportant.mustRemember && (
                    <div className="space-y-1.5">
                      <span className="text-xs font-semibold text-[#F2F7F3] block">Must Remember Points</span>
                      <ul className="space-y-1.5 text-xs text-[#AEBDB4]">
                        {learningContent.examImportant.mustRemember.map((point, idx) => (
                          <li key={idx} className="flex items-start gap-2">
                            <span className="w-1.5 h-1.5 rounded-full bg-[#E8D58A] mt-1.5 shrink-0" />
                            <span>{point}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* Important Definitions to Memorize */}
                  {learningContent.examImportant.importantDefinitions && (
                    <div className="p-3 rounded-lg bg-[#12211D] border border-[#294238] text-xs space-y-1.5">
                      <span className="font-semibold text-[#8FD3A2] block">Definitions to Memorize for Full Credit</span>
                      {learningContent.examImportant.importantDefinitions.map((def, idx) => (
                        <p key={idx} className="text-[#F2F7F3]">{def}</p>
                      ))}
                    </div>
                  )}

                  {/* Frequently Asked Concepts */}
                  {learningContent.examImportant.commonlyAskedConcepts && (
                    <div className="space-y-1.5">
                      <span className="text-xs font-semibold text-[#BFE8C8] block">Frequently Tested Exam Questions</span>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        {learningContent.examImportant.commonlyAskedConcepts.map((item, idx) => (
                          <div key={idx} className="p-2.5 rounded-lg bg-[#12211D] border border-[#294238] text-xs text-[#AEBDB4]">
                            • {item}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* SECTION 7: HOW TO WRITE THIS ANSWER IN AN EXAM */}
              {learningContent.howToWriteInExam && (
                <div id="section-how-to-write" className="p-5 rounded-xl bg-[#0D1916] border border-[#294238] space-y-3">
                  <div className="flex items-center gap-2">
                    <GraduationCap className="w-4 h-4 text-[#8FD3A2]" />
                    <h3 className="text-xs font-bold uppercase tracking-wider text-[#BFE8C8]">
                      7. How to Write This Answer in an Exam (Full Marks Format)
                    </h3>
                  </div>

                  <div className="space-y-2.5">
                    <div className="p-3 rounded-lg bg-[#12211D] border border-[#294238] text-xs">
                      <span className="text-[#8FD3A2] font-semibold block mb-0.5">1. Opening Definition (1–2 lines)</span>
                      <p className="text-[#F2F7F3]">{learningContent.howToWriteInExam.definition}</p>
                    </div>

                    <div className="p-3 rounded-lg bg-[#12211D] border border-[#294238] text-xs">
                      <span className="text-[#8FD3A2] font-semibold block mb-0.5">2. Main Explanation (3–4 bullet points)</span>
                      <p className="text-[#F2F7F3] leading-relaxed">{learningContent.howToWriteInExam.explanation}</p>
                    </div>

                    {learningContent.howToWriteInExam.example && (
                      <div className="p-3 rounded-lg bg-[#12211D] border border-[#294238] text-xs">
                        <span className="text-[#8FD3A2] font-semibold block mb-0.5">3. Clean Example or Snippet</span>
                        <p className="text-[#F2F7F3]">{learningContent.howToWriteInExam.example}</p>
                      </div>
                    )}

                    <div className="p-3 rounded-lg bg-[#12211D] border border-[#294238] text-xs">
                      <span className="text-[#8FD3A2] font-semibold block mb-0.5">4. Conclusion Note (1 line)</span>
                      <p className="text-[#AEBDB4]">{learningContent.howToWriteInExam.conclusion}</p>
                    </div>
                  </div>
                </div>
              )}

              {/* SECTION 8: EXPECTED EXAM QUESTIONS & MODEL ANSWERS */}
              {learningContent.expectedExamQuestions && (
                <div id="section-expected-questions" className="p-5 rounded-xl bg-[#0D1916] border border-[#294238] space-y-4">
                  <div className="flex items-center gap-2">
                    <BookOpen className="w-4 h-4 text-[#8FD3A2]" />
                    <h3 className="text-xs font-bold uppercase tracking-wider text-[#BFE8C8]">
                      8. Expected Exam Questions & Model Answers
                    </h3>
                  </div>

                  {/* 4-Mark Questions */}
                  {learningContent.expectedExamQuestions.fourMarkQuestions?.length > 0 && (
                    <div className="space-y-2">
                      <button
                        type="button"
                        onClick={() => toggleAccordion('four')}
                        className="w-full flex items-center justify-between p-2.5 rounded-lg bg-[#12211D] border border-[#294238] text-xs font-semibold text-[#8FD3A2] cursor-pointer"
                      >
                        <span>Short Questions (2–4 Marks) — {learningContent.expectedExamQuestions.fourMarkQuestions.length} Questions</span>
                        {expandedMarks.four ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                      </button>

                      {expandedMarks.four && (
                        <div className="space-y-2.5 pl-2">
                          {learningContent.expectedExamQuestions.fourMarkQuestions.map((q, idx) => (
                            <div key={idx} className="p-3.5 rounded-lg bg-[#08110F] border border-[#294238] space-y-2 text-xs">
                              <p className="font-semibold text-[#F2F7F3]">Q: {q.question}</p>
                              <div className="p-2.5 rounded bg-[#12211D] border border-[#294238]/60 text-[#AEBDB4] whitespace-pre-wrap leading-relaxed">
                                <strong className="text-[#8FD3A2] block mb-1">Model Answer:</strong>
                                {q.answer}
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}

                  {/* 6-Mark Questions */}
                  {learningContent.expectedExamQuestions.sixMarkQuestions?.length > 0 && (
                    <div className="space-y-2">
                      <button
                        type="button"
                        onClick={() => toggleAccordion('six')}
                        className="w-full flex items-center justify-between p-2.5 rounded-lg bg-[#12211D] border border-[#294238] text-xs font-semibold text-[#E8D58A] cursor-pointer"
                      >
                        <span>Medium Questions (5–6 Marks) — {learningContent.expectedExamQuestions.sixMarkQuestions.length} Questions</span>
                        {expandedMarks.six ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                      </button>

                      {expandedMarks.six && (
                        <div className="space-y-2.5 pl-2">
                          {learningContent.expectedExamQuestions.sixMarkQuestions.map((q, idx) => (
                            <div key={idx} className="p-3.5 rounded-lg bg-[#08110F] border border-[#294238] space-y-2 text-xs">
                              <p className="font-semibold text-[#F2F7F3]">Q: {q.question}</p>
                              <div className="p-2.5 rounded bg-[#12211D] border border-[#294238]/60 text-[#AEBDB4] whitespace-pre-wrap leading-relaxed">
                                <strong className="text-[#E8D58A] block mb-1">Model Answer:</strong>
                                {q.answer}
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}

                  {/* 10-Mark Questions */}
                  {learningContent.expectedExamQuestions.tenMarkQuestions?.length > 0 && (
                    <div className="space-y-2">
                      <button
                        type="button"
                        onClick={() => toggleAccordion('ten')}
                        className="w-full flex items-center justify-between p-2.5 rounded-lg bg-[#12211D] border border-[#294238] text-xs font-semibold text-[#BFE8C8] cursor-pointer"
                      >
                        <span>Long / Detailed Questions (8–10 Marks)</span>
                        {expandedMarks.ten ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                      </button>

                      {expandedMarks.ten && (
                        <div className="space-y-2.5 pl-2">
                          {learningContent.expectedExamQuestions.tenMarkQuestions.map((q, idx) => (
                            <div key={idx} className="p-3.5 rounded-lg bg-[#08110F] border border-[#294238] space-y-2 text-xs">
                              <p className="font-semibold text-[#F2F7F3]">Q: {q.question}</p>
                              <div className="p-2.5 rounded bg-[#12211D] border border-[#294238]/60 text-[#AEBDB4] whitespace-pre-wrap leading-relaxed">
                                <strong className="text-[#BFE8C8] block mb-1">Model Answer & Rubric Outline:</strong>
                                {q.answer}
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}

              {/* SECTION 9: IMPORTANT DIFFERENCES (IF APPLICABLE) */}
              {learningContent.importantDifferences && learningContent.importantDifferences.rows?.length > 0 && (
                <div id="section-differences" className="p-5 rounded-xl bg-[#0D1916] border border-[#294238] space-y-3">
                  <div className="flex items-center gap-2">
                    <FileText className="w-4 h-4 text-[#8FD3A2]" />
                    <h3 className="text-xs font-bold uppercase tracking-wider text-[#BFE8C8]">
                      9. Important Differences: {learningContent.importantDifferences.conceptA} vs {learningContent.importantDifferences.conceptB}
                    </h3>
                  </div>

                  <div className="overflow-x-auto rounded-lg border border-[#294238]">
                    <table className="w-full text-left text-xs border-collapse">
                      <thead>
                        <tr className="bg-[#12211D] text-[#8FD3A2] border-b border-[#294238]">
                          <th className="p-2.5 font-semibold">Parameter</th>
                          <th className="p-2.5 font-semibold">{learningContent.importantDifferences.conceptA}</th>
                          <th className="p-2.5 font-semibold">{learningContent.importantDifferences.conceptB}</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[#294238]/60 bg-[#08110F]">
                        {learningContent.importantDifferences.rows.map((row, idx) => (
                          <tr key={idx} className="hover:bg-[#12211D]/50 transition-colors">
                            <td className="p-2.5 font-medium text-[#F2F7F3] whitespace-nowrap">{row.parameter}</td>
                            <td className="p-2.5 text-[#AEBDB4]">{row.conceptAValue}</td>
                            <td className="p-2.5 text-[#AEBDB4]">{row.conceptBValue}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* SECTION 10: COMMON MISTAKES & TRAPS */}
              {learningContent.commonMistakes && learningContent.commonMistakes.length > 0 && (
                <div id="section-mistakes" className="p-5 rounded-xl bg-[#0D1916] border border-[#294238] space-y-3">
                  <div className="flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 text-[#F29B9B]" />
                    <h3 className="text-xs font-bold uppercase tracking-wider text-[#F29B9B]">
                      10. Common Mistakes & Exam Traps
                    </h3>
                  </div>

                  <div className="space-y-2.5">
                    {learningContent.commonMistakes.map((item, idx) => (
                      <div key={idx} className="p-3.5 rounded-lg bg-[#12211D] border border-[#294238] space-y-1.5 text-xs">
                        <p className="text-[#F29B9B] font-medium">{item.mistake}</p>
                        <p className="text-[#9FE2B0]">{item.correctUnderstanding}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* SECTION 11: 2-MINUTE QUICK REVISION */}
              {learningContent.quickRevision?.keyPoints?.length > 0 && (
                <div id="section-quick-revision" className="p-5 rounded-xl bg-[#0D1916] border border-[#294238] space-y-3">
                  <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4 text-[#8FD3A2]" />
                    <h3 className="text-xs font-bold uppercase tracking-wider text-[#BFE8C8]">
                      11. 2-Minute Quick Revision (Before Entering Exam Hall)
                    </h3>
                  </div>

                  <div className="p-4 rounded-lg bg-[#12211D] border border-[#294238] space-y-2 text-xs">
                    {learningContent.quickRevision.keyPoints.map((pt, idx) => (
                      <div key={idx} className="flex items-start gap-2.5 text-[#F2F7F3]">
                        <span className="w-1.5 h-1.5 rounded-full bg-[#8FD3A2] mt-1.5 shrink-0" />
                        <span>{pt}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* SECTION 12: MEMORY TRICKS / MNEMONICS */}
              {learningContent.memoryTricks && learningContent.memoryTricks.length > 0 && (
                <div id="section-memory-tricks" className="p-5 rounded-xl bg-[#0D1916] border border-[#294238] space-y-3">
                  <div className="flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-[#E8D58A]" />
                    <h3 className="text-xs font-bold uppercase tracking-wider text-[#E8D58A]">
                      12. Memory Tricks & Mnemonics
                    </h3>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {learningContent.memoryTricks.map((trick, idx) => (
                      <div key={idx} className="p-3.5 rounded-lg bg-[#12211D] border border-[#294238] text-xs">
                        <span className="px-2 py-0.5 rounded bg-[#08110F] text-[#E8D58A] font-mono font-bold border border-[#294238] inline-block mb-1.5">
                          {trick.mnemonic}
                        </span>
                        <p className="text-[#AEBDB4] leading-relaxed">{trick.meaning}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* SECTION 13: QUICK CHECK (SELF TEST) */}
              {(learningContent.quickCheckQuestions?.length > 0 || learningContent.quickCheck?.length > 0) && (
                <div id="section-quick-check" className="p-5 rounded-xl bg-[#0D1916] border border-[#294238] space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-[#8FD3A2]" />
                      <h3 className="text-xs font-bold uppercase tracking-wider text-[#BFE8C8]">
                        13. Quick Check (Instant Self-Test)
                      </h3>
                    </div>
                    <span className="text-[11px] text-[#7F9188]">
                      Instant answer & explanation reveal
                    </span>
                  </div>

                  <div className="space-y-4">
                    {(learningContent.quickCheckQuestions || learningContent.quickCheck || []).map((qc: any, qIdx: number) => {
                      const qId = qc.id || `qc-${qIdx}`;
                      const ans = quickCheckAnswers[qId];
                      const correctIndex = qc.correctOptionIndex ?? qc.correctIndex ?? 0;
                      const options = qc.options || [];

                      return (
                        <div key={qId} className="p-4 rounded-lg bg-[#12211D] border border-[#294238] space-y-3">
                          <p className="text-xs sm:text-sm font-semibold text-[#F2F7F3]">
                            {qIdx + 1}. {qc.question}
                          </p>
                          <div className="space-y-2">
                            {options.map((opt: string, optIdx: number) => {
                              const isSelected = ans?.selectedIndex === optIdx;
                              const isCorrect = optIdx === correctIndex;
                              let btnClass = 'bg-[#08110F] text-[#AEBDB4] border-[#294238] hover:border-[#8FD3A2]/50';

                              if (ans) {
                                if (isCorrect) {
                                  btnClass = 'bg-[#2F6B4A]/30 text-[#9FE2B0] border-[#9FE2B0] font-semibold';
                                } else if (isSelected && !isCorrect) {
                                  btnClass = 'bg-[#F29B9B]/20 text-[#F29B9B] border-[#F29B9B]';
                                } else {
                                  btnClass = 'bg-[#08110F] text-[#7F9188] border-[#294238] opacity-50';
                                }
                              }

                              return (
                                <button
                                  key={optIdx}
                                  type="button"
                                  disabled={!!ans}
                                  onClick={() => handleSelectQuickCheck(qId, optIdx, correctIndex)}
                                  className={`w-full p-2.5 rounded-lg border text-left text-xs transition-colors flex items-center justify-between cursor-pointer ${btnClass}`}
                                >
                                  <span>{opt}</span>
                                  {ans && isCorrect && <CheckCircle2 className="w-4 h-4 text-[#9FE2B0] shrink-0" />}
                                  {ans && isSelected && !isCorrect && <XCircle className="w-4 h-4 text-[#F29B9B] shrink-0" />}
                                </button>
                              );
                            })}
                          </div>
                          {ans && (
                            <p className="text-xs text-[#AEBDB4] pt-1 leading-relaxed border-t border-[#294238]/60">
                              <strong className="text-[#8FD3A2]">Explanation: </strong>
                              {qc.explanation}
                            </p>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* SECTION 16: YOUTUBE LEARNING RECOMMENDATIONS */}
              {learningContent.youtubeClasses && learningContent.youtubeClasses.length > 0 && (
                <div id="section-youtube" className="p-5 rounded-xl bg-[#0D1916] border border-[#294238] space-y-3">
                  <div className="flex items-center gap-2">
                    <Youtube className="w-4 h-4 text-[#F29B9B]" />
                    <h3 className="text-xs font-bold uppercase tracking-wider text-[#BFE8C8]">
                      16. Recommended Video Explanations
                    </h3>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                    {learningContent.youtubeClasses.map((yt: any, idx: number) => (
                      <a
                        key={idx}
                        href={yt.watchUrl || yt.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-3.5 rounded-lg bg-[#12211D] border border-[#294238] hover:border-[#8FD3A2]/50 transition-colors flex flex-col justify-between group"
                      >
                        <div className="space-y-1.5">
                          <div className="flex items-start justify-between gap-2">
                            <p className="text-xs font-semibold text-[#F2F7F3] group-hover:text-[#BFE8C8] transition-colors line-clamp-2">
                              {yt.title}
                            </p>
                            <ExternalLink className="w-3.5 h-3.5 text-[#7F9188] group-hover:text-[#F2F7F3] shrink-0 mt-0.5" />
                          </div>
                          <p className="text-[11px] text-[#7F9188]">
                            {yt.channelName || yt.channel || 'Academic Educator'}
                          </p>
                          {yt.description && (
                            <p className="text-[11px] text-[#AEBDB4] line-clamp-2">
                              {yt.description}
                            </p>
                          )}
                        </div>
                        <div className="pt-2 flex items-center gap-1.5 text-[11px] text-[#F29B9B] font-medium">
                          <Youtube className="w-3.5 h-3.5" />
                          <span>Watch on YouTube</span>
                        </div>
                      </a>
                    ))}
                  </div>
                </div>
              )}

            </div>
          ) : (
            <div className="p-12 text-center text-[#7F9188] text-sm">
              No learning content available for this topic.
            </div>
          )}
        </div>

        {/* SECTION 15: ACTION BUTTONS (Sticky Footer) */}
        <div className="flex-shrink-0 p-4 border-t border-[#294238] bg-[#0D1916]">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <button
              id="mark-understood-btn"
              type="button"
              onClick={handleUnderstoodClick}
              className={`py-2.5 px-4 rounded-lg font-bold text-xs sm:text-sm flex items-center justify-center gap-2 transition-colors cursor-pointer ${
                userMarkedUnderstood
                  ? 'bg-[#BFE8C8] text-[#08110F] ring-2 ring-[#8FD3A2]'
                  : 'bg-[#BFE8C8] hover:bg-[#D9F3DE] text-[#08110F]'
              }`}
            >
              <Check className="w-4 h-4 text-[#08110F]" />
              <span>{userMarkedUnderstood ? '✓ Marked Understood' : 'I Understand'}</span>
            </button>

            <button
              id="still-confused-btn"
              type="button"
              onClick={handleConfusedClick}
              className={`py-2.5 px-4 rounded-lg font-bold text-xs sm:text-sm flex items-center justify-center gap-2 transition-colors border cursor-pointer ${
                userMarkedConfused || simplerMode
                  ? 'bg-[#E8D58A]/20 text-[#E8D58A] border-[#E8D58A]'
                  : 'bg-[#12211D] hover:bg-[#172A24] text-[#E8D58A] border-[#294238]'
              }`}
            >
              <Sparkles className="w-4 h-4 text-[#E8D58A]" />
              <span>{simplerMode ? 'Explaining Simpler (Active)' : 'Still Confused (Explain Simpler)'}</span>
            </button>

            <button
              id="retest-btn"
              type="button"
              onClick={() => {
                onClose();
                onStartReTest(topic.name);
              }}
              className="py-2.5 px-4 rounded-lg bg-[#12211D] hover:bg-[#172A24] text-[#8FD3A2] hover:text-[#BFE8C8] border border-[#8FD3A2]/40 text-xs sm:text-sm font-bold transition-colors flex items-center justify-center gap-2 cursor-pointer"
            >
              <RotateCcw className="w-4 h-4" />
              <span>Re-test This Topic</span>
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
