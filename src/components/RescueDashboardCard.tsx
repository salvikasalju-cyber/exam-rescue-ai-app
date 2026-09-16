import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  AlertTriangle, 
  Clock, 
  Flame, 
  Circle, 
  Play, 
  Pause, 
  RotateCcw, 
  TrendingUp, 
  BookOpen, 
  Zap, 
  ChevronRight, 
  Sparkles, 
  CheckCircle2,
  ListFilter,
  BarChart3,
  Award,
  Cpu,
  Target,
  Calendar,
  Edit3,
  ArrowRight
} from 'lucide-react';
import { ExamRescuePlan, StudyTopic, TopicPerformance } from '../types';
import { 
  calculateRemainingTime, 
  parseExamDateTime, 
  formatExamDate, 
  formatExamTime, 
  getDefaultExamDateTime 
} from '../utils/examTime';
import { WeakTopicsSection } from './WeakTopicsSection';

interface RescueDashboardCardProps {
  plan: ExamRescuePlan;
  onTopicClick: (topic: StudyTopic) => void;
  onPlanUpdate?: (updatedPlan: ExamRescuePlan) => void;
  onSwitchPreset?: (presetKey: string) => void;
  activePresetKey?: string;
  onOpenEditExamTime?: () => void;
  onStartRescueQuiz?: (weakTopicOnly?: string | null) => void;
  onOpenCrashLesson?: (topicName: string) => void;
  onRetestTopic?: (topicName: string) => void;
  onRescheduleTopic?: (topicId: string) => void;
  onOpenLearnTopic?: (topic: StudyTopic) => void;
  topicPerformanceMap?: Record<string, TopicPerformance>;
  weakTopics?: StudyTopic[];
}

export const RescueDashboardCard: React.FC<RescueDashboardCardProps> = ({
  plan,
  onTopicClick,
  onPlanUpdate,
  onSwitchPreset,
  activePresetKey = 'cs',
  onOpenEditExamTime,
  onStartRescueQuiz,
  onOpenCrashLesson,
  onRetestTopic,
  onRescheduleTopic,
  onOpenLearnTopic,
  topicPerformanceMap = {},
  weakTopics = []
}) => {
  // Live dynamic clock that updates every second
  const [currentTime, setCurrentTime] = useState<number>(Date.now());
  const [isTimerRunning, setIsTimerRunning] = useState<boolean>(true);
  const [completedTopicIds, setCompletedTopicIds] = useState<Set<string>>(new Set());
  const [activeSprintTopic, setActiveSprintTopic] = useState<string | null>(null);
  const [sprintSeconds, setSprintSeconds] = useState<number>(20 * 60);

  // Derive target timestamp from plan, fallback to parsed inputs, or default
  const defaultExamSetting = getDefaultExamDateTime();
  const targetTimestamp = 
    plan.examTargetTimestamp || 
    (plan.examDateInput && plan.examTimeInput ? parseExamDateTime(plan.examDateInput, plan.examTimeInput) : defaultExamSetting.timestamp);

  // Ticking countdown effect: updates every second
  useEffect(() => {
    if (!isTimerRunning) return;
    const interval = setInterval(() => {
      setCurrentTime(Date.now());
    }, 1000);
    return () => clearInterval(interval);
  }, [isTimerRunning]);

  // Sprint timer effect
  useEffect(() => {
    if (!activeSprintTopic) return;
    const interval = setInterval(() => {
      setSprintSeconds((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(interval);
  }, [activeSprintTopic]);

  // Dynamically calculate remaining time between now and target timestamp
  const remaining = calculateRemainingTime(targetTimestamp, currentTime);
  const { hours, minutes, seconds, isPassed: isExamTimePassed } = remaining;

  const toggleTopicCompletion = (e: React.MouseEvent, topicId: string) => {
    e.stopPropagation();
    setCompletedTopicIds((prev) => {
      const next = new Set(prev);
      if (next.has(topicId)) {
        next.delete(topicId);
      } else {
        next.add(topicId);
      }
      return next;
    });
  };

  // Calculate dynamic readiness: base 62% + extra boost per completed topic
  const calculateReadiness = () => {
    const base = plan.readinessPercentage; // 62%
    const totalBoostPossible = 100 - base;
    const completedWeight = plan.topics
      .filter((t) => completedTopicIds.has(t.id))
      .reduce((acc, t) => acc + t.importance, 0);
    const totalWeight = plan.topics.reduce((acc, t) => acc + t.importance, 0);
    
    if (totalWeight === 0) return base;
    const dynamicBoost = Math.round((completedWeight / totalWeight) * totalBoostPossible);
    return Math.min(100, base + dynamicBoost);
  };

  const currentReadiness = calculateReadiness();

  const handleStartSprint = (e: React.MouseEvent, topicName: string, minutes: number) => {
    e.stopPropagation();
    if (activeSprintTopic === topicName) {
      setActiveSprintTopic(null);
    } else {
      setActiveSprintTopic(topicName);
      setSprintSeconds(minutes * 60);
    }
  };

  return (
    <section id="dashboard" className="relative px-4 sm:px-6 lg:px-8 pb-16 sm:pb-24">
      {/* Decorative ambient backdrop light */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-5xl h-[500px] bg-gradient-to-b from-indigo-900/25 via-purple-900/15 to-transparent blur-3xl pointer-events-none -z-10" />

      <div className="max-w-5xl mx-auto">
        {/* Preset switcher for demo exploration */}
        <div className="flex flex-wrap items-center justify-between gap-3 mb-4 text-xs">
          <div className="flex items-center gap-2 text-slate-400">
            <Cpu className="w-4 h-4 text-purple-400" />
            <span className="font-semibold text-slate-300">Active Syllabus Analyzer:</span>
            <span className="text-indigo-300 font-mono bg-indigo-950/70 px-2.5 py-0.5 rounded-lg border border-indigo-500/30">
              {plan.courseName}
            </span>
          </div>

          {onSwitchPreset && (
            <div className="flex items-center gap-1.5 bg-slate-900/90 p-1.5 rounded-xl border border-slate-800 shadow-inner flex-wrap">
              <span className="text-[11px] font-medium text-slate-500 px-2 hidden sm:inline">Presets:</span>
              {activePresetKey === 'custom' && (
                <span className="px-3 py-1 rounded-lg text-xs font-bold bg-gradient-to-r from-emerald-500 to-indigo-600 text-white flex items-center gap-1.5 shadow-md">
                  <Sparkles className="w-3 h-3 text-yellow-300" />
                  <span>AI Document Active</span>
                </span>
              )}
              <button
                id="preset-cs-btn"
                onClick={() => onSwitchPreset('cs')}
                className={`px-3 py-1 rounded-lg transition-all text-xs cursor-pointer ${
                  activePresetKey === 'cs'
                    ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white font-semibold shadow-md'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                }`}
              >
                CS 201 (BST)
              </button>
              <button
                id="preset-chem-btn"
                onClick={() => onSwitchPreset('chem')}
                className={`px-3 py-1 rounded-lg transition-all text-xs cursor-pointer ${
                  activePresetKey === 'chem'
                    ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white font-semibold shadow-md'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                }`}
              >
                Organic Chem
              </button>
              <button
                id="preset-bio-btn"
                onClick={() => onSwitchPreset('bio')}
                className={`px-3 py-1 rounded-lg transition-all text-xs cursor-pointer ${
                  activePresetKey === 'bio'
                    ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white font-semibold shadow-md'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                }`}
              >
                Cell Biology
              </button>
            </div>
          )}
        </div>

        {/* The Centerpiece Glassmorphism Card */}
        <motion.div 
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-50px' }}
          transition={{ duration: 0.6, ease: 'easeOut' }}
          className="relative rounded-3xl backdrop-blur-2xl bg-[#090f24]/90 border border-indigo-500/35 shadow-[0_25px_80px_rgba(0,0,0,0.7)] overflow-hidden transition-all duration-300 hover:border-indigo-400/60 group"
        >
          {/* Subtle Top Gradient Highlight Line */}
          <div className="h-1.5 w-full bg-gradient-to-r from-red-500 via-purple-500 to-blue-500 shadow-[0_0_15px_rgba(168,85,247,0.5)]" />

          {/* Card Header & Status Ribbon */}
          <div className="p-6 sm:p-8 border-b border-slate-800/80 bg-gradient-to-r from-[#0d1637]/90 via-[#0e173b]/80 to-[#101430]/90">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              {/* 🚨 EXAM RESCUE MODE */}
              <div className="flex items-center gap-3.5">
                <div className="relative flex items-center justify-center w-12 h-12 rounded-2xl bg-red-500/15 border border-red-500/40 text-red-400 shadow-[0_0_25px_rgba(239,68,68,0.3)]">
                  <span className="text-2xl animate-pulse">🚨</span>
                  <span className="absolute -top-1 -right-1 flex h-3.5 w-3.5">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-80"></span>
                    <span className="relative inline-flex rounded-full h-3.5 w-3.5 bg-red-500 shadow-[0_0_10px_rgba(239,68,68,1)]"></span>
                  </span>
                </div>
                <div>
                  <div className="flex items-center gap-2.5">
                    <span className="text-xl sm:text-2xl font-black tracking-wide text-white uppercase font-display">
                      🚨 EXAM RESCUE MODE
                    </span>
                    <span className="px-2.5 py-0.5 text-[11px] font-extrabold uppercase tracking-widest text-red-400 bg-red-950/70 border border-red-700/60 rounded-full animate-pulse shadow-[0_0_12px_rgba(239,68,68,0.3)]">
                      Emergency Live
                    </span>
                  </div>
                  <p className="text-xs sm:text-sm text-slate-300 mt-1 font-medium">
                    Neural engine calibrated for maximum score yield per remaining cram minute
                  </p>
                </div>
              </div>

              {/* Quick Actions */}
              <div className="flex items-center gap-2 self-start sm:self-auto flex-wrap">
                {onStartRescueQuiz && (
                  <button
                    id="start-rescue-header-btn"
                    onClick={() => onStartRescueQuiz(null)}
                    title="Start active recall adaptive rescue quiz"
                    className="px-4 py-2 text-xs font-black uppercase tracking-wider text-white bg-gradient-to-r from-purple-600 via-indigo-600 to-blue-600 hover:from-purple-500 hover:to-blue-500 rounded-xl flex items-center gap-2 transition-all cursor-pointer shadow-[0_0_20px_rgba(99,102,241,0.5)] border border-indigo-400/50"
                  >
                    <Zap className="w-4 h-4 text-yellow-300 fill-yellow-300 animate-pulse" />
                    <span>Start Rescue</span>
                  </button>
                )}
                <button
                  id="toggle-timer-btn"
                  onClick={() => setIsTimerRunning(!isTimerRunning)}
                  title={isTimerRunning ? 'Pause countdown' : 'Resume countdown'}
                  className="px-3.5 py-2 text-xs font-semibold text-slate-200 hover:text-white bg-slate-800/90 hover:bg-slate-700/90 border border-slate-700 rounded-xl flex items-center gap-2 transition-all cursor-pointer shadow-sm"
                >
                  {isTimerRunning ? (
                    <>
                      <Pause className="w-3.5 h-3.5 text-amber-400" />
                      <span>Pause</span>
                    </>
                  ) : (
                    <>
                      <Play className="w-3.5 h-3.5 text-emerald-400 fill-emerald-400" />
                      <span>Resume</span>
                    </>
                  )}
                </button>
                {onOpenEditExamTime && (
                  <button
                    id="reset-timer-btn"
                    onClick={onOpenEditExamTime}
                    title="Edit exam date and time"
                    className="px-3 py-2 text-xs font-semibold text-indigo-300 hover:text-white bg-indigo-950/70 hover:bg-indigo-900/80 border border-indigo-500/40 rounded-xl flex items-center gap-1.5 transition-all cursor-pointer shadow-sm"
                  >
                    <Calendar className="w-3.5 h-3.5 text-indigo-400" />
                    <span>Set Exam Time</span>
                  </button>
                )}
              </div>
            </div>

            {/* Dashboard Primary Metrics Grid: EXAM IN & READINESS */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mt-6">
              {/* EXAM IN Dynamic Countdown Card */}
              <div className="relative p-6 rounded-2xl bg-gradient-to-br from-[#121c44]/90 via-[#0e1638]/90 to-[#0a102a]/95 border border-indigo-500/30 shadow-xl overflow-hidden group hover:border-indigo-400/50 transition-all">
                <div className="absolute top-0 right-0 p-4 text-indigo-400/10 group-hover:text-indigo-400/20 transition-colors pointer-events-none">
                  <Clock className="w-24 h-24 -mr-4 -mt-4" />
                </div>
                <div className="relative z-10">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-black uppercase tracking-widest text-slate-400">
                      EXAM IN
                    </span>
                    <span className="text-[11px] font-semibold text-indigo-300 bg-indigo-950/80 px-2.5 py-0.5 rounded-full border border-indigo-500/40">
                      Live Countdown
                    </span>
                  </div>

                  {/* If exam time has passed, show required alert */}
                  {isExamTimePassed ? (
                    <div className="my-3 p-3.5 rounded-xl bg-red-950/70 border border-red-500/50 flex items-start gap-2.5 text-red-200 text-xs sm:text-sm animate-in fade-in">
                      <AlertTriangle className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
                      <div className="flex-1">
                        <p className="font-bold text-red-200">
                          Exam time has passed. Please choose a future exam time.
                        </p>
                        {onOpenEditExamTime && (
                          <button
                            type="button"
                            onClick={onOpenEditExamTime}
                            className="mt-2 px-3 py-1.5 rounded-lg text-xs font-bold text-white bg-red-600 hover:bg-red-500 border border-red-400/40 cursor-pointer flex items-center gap-1.5 transition-colors"
                          >
                            <Calendar className="w-3.5 h-3.5" />
                            <span>Edit Exam Time</span>
                          </button>
                        )}
                      </div>
                    </div>
                  ) : (
                    /* High-Tech Digital Countdown Clock Display: EXAM IN 04 : 29 : 17 */
                    <div className="my-3 flex items-center gap-2">
                      <div className="flex items-center gap-1.5 font-mono text-3xl sm:text-4xl lg:text-5xl font-extrabold text-white tracking-tight">
                        <div className="px-2.5 py-1.5 rounded-xl bg-slate-950/80 border border-indigo-500/30 shadow-inner">
                          {hours.toString().padStart(2, '0')}
                        </div>
                        <span className="text-indigo-400 animate-pulse font-light">:</span>
                        <div className="px-2.5 py-1.5 rounded-xl bg-slate-950/80 border border-indigo-500/30 shadow-inner">
                          {minutes.toString().padStart(2, '0')}
                        </div>
                        <span className="text-indigo-400 animate-pulse font-light">:</span>
                        <div className="px-2.5 py-1.5 rounded-xl bg-slate-950/80 border border-indigo-500/30 shadow-inner text-indigo-300">
                          {seconds.toString().padStart(2, '0')}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Replaced "Targeting 08:30 AM test room" with "Exam: [selected date] at [selected time]" and "Edit Exam Time" button */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between pt-3 border-t border-slate-800/80 text-xs text-slate-300 gap-2">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping shrink-0"></span>
                      <span className="font-semibold text-white">
                        Exam: {formatExamDate(plan.examDateInput, targetTimestamp)} at {formatExamTime(plan.examTimeInput, targetTimestamp)}
                      </span>
                      {onOpenEditExamTime && (
                        <button
                          id="edit-exam-time-btn"
                          type="button"
                          onClick={onOpenEditExamTime}
                          className="ml-1 px-2.5 py-1 rounded-lg text-[11px] font-bold text-indigo-300 hover:text-white bg-indigo-950/80 hover:bg-indigo-900 border border-indigo-500/40 hover:border-indigo-400 flex items-center gap-1 transition-all cursor-pointer shadow-sm"
                          title="Change your exam date or exact time"
                        >
                          <Edit3 className="w-3 h-3 text-indigo-400" />
                          <span>Edit Exam Time</span>
                        </button>
                      )}
                    </div>
                    <span className="font-mono text-slate-400 text-[11px]">
                      {remaining.hoursDecimal > 0 ? `${remaining.hoursDecimal.toFixed(1)} hrs total budget` : 'Passed'}
                    </span>
                  </div>
                </div>
              </div>

              {/* READINESS 62% */}
              <div className="relative p-6 rounded-2xl bg-gradient-to-br from-[#161d47]/90 via-[#11173d]/90 to-[#0c122e]/95 border border-purple-500/30 shadow-xl overflow-hidden group hover:border-purple-400/50 transition-all">
                <div className="absolute top-0 right-0 p-4 text-purple-400/10 group-hover:text-purple-400/20 transition-colors pointer-events-none">
                  <TrendingUp className="w-24 h-24 -mr-4 -mt-4" />
                </div>
                <div className="relative z-10 flex flex-col justify-between h-full">
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-black uppercase tracking-widest text-slate-400">
                        READINESS
                      </span>
                      <span className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full border ${
                        currentReadiness >= 80 
                          ? 'text-emerald-300 bg-emerald-950/70 border-emerald-500/40'
                          : currentReadiness > 62
                          ? 'text-blue-300 bg-blue-950/70 border-blue-500/40'
                          : 'text-amber-300 bg-amber-950/70 border-amber-500/40'
                      }`}>
                        {currentReadiness >= 80 ? 'Passing Zone' : currentReadiness > 62 ? 'Progressing' : 'High-Yield Gaps'}
                      </span>
                    </div>

                    <div className="flex items-center justify-between my-2">
                      <div className="flex items-baseline gap-3">
                        <span className="text-4xl sm:text-5xl font-black text-white tracking-tight font-display">
                          {currentReadiness}%
                        </span>
                        {currentReadiness > plan.readinessPercentage && (
                          <span className="text-xs font-bold text-emerald-400 bg-emerald-950/70 px-2 py-0.5 rounded-full border border-emerald-500/40 animate-bounce">
                            +{currentReadiness - plan.readinessPercentage}% boosted!
                          </span>
                        )}
                      </div>

                      {/* SVG Mini Radial Progress Ring */}
                      <div className="relative w-14 h-14 flex items-center justify-center">
                        <svg className="w-full h-full -rotate-90" viewBox="0 0 36 36">
                          <circle
                            cx="18"
                            cy="18"
                            r="14"
                            className="stroke-slate-800"
                            strokeWidth="3.5"
                            fill="none"
                          />
                          <circle
                            cx="18"
                            cy="18"
                            r="14"
                            className="stroke-purple-500 transition-all duration-700 ease-out"
                            strokeWidth="3.5"
                            strokeDasharray={88}
                            strokeDashoffset={88 - (88 * currentReadiness) / 100}
                            strokeLinecap="round"
                            fill="none"
                          />
                        </svg>
                        <Target className="w-4 h-4 text-purple-300 absolute" />
                      </div>
                    </div>
                  </div>

                  {/* Readiness Progress Bar & Telemetry */}
                  <div>
                    <div className="w-full bg-slate-900/90 rounded-full h-3 overflow-hidden p-0.5 border border-slate-700/60 shadow-inner">
                      <div
                        className="bg-gradient-to-r from-purple-500 via-indigo-500 to-blue-400 h-full rounded-full transition-all duration-500 shadow-[0_0_15px_rgba(139,92,246,0.7)]"
                        style={{ width: `${currentReadiness}%` }}
                      />
                    </div>
                    <div className="flex justify-between text-[11px] text-slate-400 mt-2 font-medium">
                      <span>Completed: {completedTopicIds.size} of {plan.topics.length} topics</span>
                      <span className="text-indigo-300 hover:text-indigo-200">Click topics to inspect</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Active Sprint Banner (if user started a sprint) */}
            <AnimatePresence>
              {activeSprintTopic && (
                <motion.div 
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="mt-4 p-4 rounded-xl bg-gradient-to-r from-indigo-950/90 to-purple-950/90 border border-indigo-500/50 flex items-center justify-between gap-3 text-sm shadow-[0_0_25px_rgba(99,102,241,0.3)]"
                >
                  <div className="flex items-center gap-2.5 text-indigo-200">
                    <span className="p-1.5 rounded-lg bg-indigo-600/30 text-yellow-300">
                      <Zap className="w-4 h-4 animate-bounce fill-yellow-300" />
                    </span>
                    <span>
                      Active Focus Sprint: <strong className="text-white font-semibold">{activeSprintTopic}</strong>
                    </span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="font-mono font-extrabold text-white bg-slate-950/80 px-3 py-1 rounded-lg border border-indigo-400/50 shadow-inner text-base">
                      {Math.floor(sprintSeconds / 60)}:{(sprintSeconds % 60).toString().padStart(2, '0')}
                    </span>
                    <button
                      onClick={() => setActiveSprintTopic(null)}
                      className="text-xs font-semibold text-slate-300 hover:text-white underline cursor-pointer"
                    >
                      End Sprint
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* PRIORITY TOPICS SECTION */}
          <div className="p-6 sm:p-8 space-y-5">
            {/* FEATURE 5 — WEAK TOPICS SECTION */}
            <WeakTopicsSection
              weakTopics={weakTopics}
              topicPerformanceMap={topicPerformanceMap}
              onOpenCrashLesson={(name) => onOpenCrashLesson?.(name)}
              onRetestTopic={(name) => onRetestTopic?.(name)}
              onRescheduleTopic={(id) => onRescheduleTopic?.(id)}
              onOpenLearnTopic={(topic) => onOpenLearnTopic?.(topic)}
            />

            {/* ADAPTIVE RESCUE QUIZ HERO CALLOUT BANNER */}
            {onStartRescueQuiz && (
              <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-r from-purple-950/60 via-indigo-950/60 to-blue-950/50 border border-indigo-500/40 flex flex-col sm:flex-row items-center justify-between gap-4 shadow-lg">
                <div className="flex items-center gap-3.5">
                  <div className="w-11 h-11 rounded-2xl bg-purple-500/20 border border-purple-400/40 flex items-center justify-center text-purple-300 shadow-md">
                    <Zap className="w-6 h-6 fill-yellow-300 text-yellow-300 animate-pulse" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="text-sm sm:text-base font-bold text-white font-display">
                        Adaptive Exam Rescue Quiz
                      </h4>
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-purple-500/20 text-purple-300 border border-purple-500/40">
                        Active Recall
                      </span>
                    </div>
                    <p className="text-xs text-indigo-200/80 mt-0.5">
                      Grounded in your document. Weak answers automatically trigger 3-minute crash lessons and reschedule study priorities.
                    </p>
                  </div>
                </div>

                <button
                  id="start-rescue-quiz-banner-btn"
                  onClick={() => onStartRescueQuiz(null)}
                  className="w-full sm:w-auto px-5 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider text-white bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 shadow-[0_0_25px_rgba(99,102,241,0.4)] flex items-center justify-center gap-2 transition-all cursor-pointer border border-purple-400/40 shrink-0"
                >
                  <Zap className="w-4 h-4 fill-yellow-300 text-yellow-300" />
                  <span>Start Rescue</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            )}

            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-2">
              <div>
                <h3 className="text-lg sm:text-xl font-bold text-white tracking-wide font-display">
                  Recommended Cram Priority Sequence
                </h3>
                <p className="text-xs sm:text-sm text-slate-400">
                  Ranked by guaranteed question probability and cram ROI. Click any topic to open its instant cheat sheet.
                </p>
              </div>
              <span className="self-start sm:self-auto flex items-center gap-1.5 text-xs font-medium text-slate-300 bg-slate-900/80 px-3 py-1.5 rounded-xl border border-slate-800 shadow-sm">
                <ListFilter className="w-3.5 h-3.5 text-purple-400" />
                <span>Yield Calibrated</span>
              </span>
            </div>

            {/* DYNAMIC TOPICS LIST */}
            <div className="space-y-4">
              {plan.topics.map((topic, index) => {
                const isHigh = topic.priority === 'high';
                const isMedium = topic.priority === 'medium';
                const isCompleted = completedTopicIds.has(topic.id);
                const isWeak = topic.isWeak || topic.status === 'weak';
                const isRescheduled = topic.isRescheduled;
                const isImproving = topic.status === 'improving';

                return (
                  <motion.div
                    key={topic.id || index}
                    whileHover={{ scale: 1.008 }}
                    id={`priority-${topic.priority}-card-${index}`}
                    onClick={() => onTopicClick(topic)}
                    className={`group relative p-5 sm:p-6 rounded-2xl transition-all duration-200 cursor-pointer border ${
                      isCompleted
                        ? 'bg-emerald-950/25 border-emerald-500/40 shadow-[0_0_20px_rgba(16,185,129,0.15)]'
                        : isWeak
                        ? 'bg-gradient-to-r from-red-950/50 via-[#1f173d]/90 to-[#101432]/95 border-red-500/60 hover:border-red-400 hover:shadow-[0_0_35px_rgba(239,68,68,0.3)]'
                        : isHigh
                        ? 'bg-gradient-to-r from-red-950/40 via-[#181d45]/90 to-[#101432]/95 border-red-500/40 hover:border-red-400/80 hover:shadow-[0_0_30px_rgba(239,68,68,0.25)]'
                        : isMedium
                        ? 'bg-gradient-to-r from-amber-950/30 via-[#181a3d]/90 to-[#101432]/95 border-amber-500/40 hover:border-amber-400/80 hover:shadow-[0_0_25px_rgba(245,158,11,0.2)]'
                        : 'bg-gradient-to-r from-blue-950/30 via-[#141d44]/90 to-[#101432]/95 border-blue-500/30 hover:border-blue-400/70 hover:shadow-[0_0_25px_rgba(59,130,246,0.2)]'
                    }`}
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                      <div className="flex items-start gap-3.5">
                        <button
                          onClick={(e) => toggleTopicCompletion(e, topic.id)}
                          className="mt-1 text-slate-400 hover:text-emerald-400 transition-colors cursor-pointer shrink-0"
                          title="Mark topic as completed"
                        >
                          {isCompleted ? (
                            <CheckCircle2 className="w-6 h-6 text-emerald-400 fill-emerald-400/20" />
                          ) : (
                            <Circle className={`w-6 h-6 ${
                              isHigh 
                                ? 'text-red-400 group-hover:text-red-300' 
                                : isMedium 
                                ? 'text-amber-400 group-hover:text-amber-300' 
                                : 'text-blue-400 group-hover:text-blue-300'
                            }`} />
                          )}
                        </button>
                        <div>
                          {/* Priority Tag & Badges */}
                          <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-black uppercase tracking-wider shadow-sm ${
                              isHigh
                                ? 'bg-red-500/20 text-red-300 border border-red-500/40'
                                : isMedium
                                ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                                : 'bg-blue-500/20 text-blue-300 border border-blue-500/40'
                            }`}>
                              {topic.priority.toUpperCase()} PRIORITY
                            </span>
                            {isWeak && (
                              <span className="px-2 py-0.5 rounded-md text-[10px] font-black uppercase tracking-wider bg-red-950 text-red-400 border border-red-500/60 shadow-[0_0_10px_rgba(239,68,68,0.3)]">
                                WEAK TOPIC
                              </span>
                            )}
                            {isRescheduled && (
                              <span className="px-2 py-0.5 rounded-md text-[10px] font-black uppercase tracking-wider bg-amber-950 text-amber-300 border border-amber-500/60">
                                RESCHEDULED (+10m)
                              </span>
                            )}
                            {isImproving && (
                              <span className="px-2 py-0.5 rounded-md text-[10px] font-black uppercase tracking-wider bg-emerald-950 text-emerald-300 border border-emerald-500/60">
                                IMPROVING
                              </span>
                            )}
                            {topic.difficulty && (
                              <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-slate-800/90 text-slate-300 border border-slate-700">
                                {topic.difficulty}
                              </span>
                            )}
                            <span className={`text-xs font-semibold ${
                              isHigh ? 'text-red-300' : isMedium ? 'text-amber-300' : 'text-blue-300'
                            }`}>
                              +{topic.scoreYieldPoints} pts predicted
                            </span>
                          </div>
                          <h4 className="text-lg sm:text-xl font-bold text-white transition-colors flex items-center gap-2">
                            <span>{topic.name}</span>
                          </h4>
                          <p className="text-xs sm:text-sm text-slate-300 mt-1 line-clamp-1 font-normal">
                            {topic.keyTakeaway}
                          </p>
                          {topic.reason && (
                            <p className="text-xs text-slate-400 mt-1 italic flex items-center gap-1.5">
                              <span className="text-purple-400 font-semibold not-italic">Reason:</span> {topic.reason}
                            </p>
                          )}
                        </div>
                      </div>

                      {/* Right side metrics: importance & recommended sprint */}
                      <div className="flex sm:flex-col items-center sm:items-end justify-between sm:justify-center gap-2.5 pt-3 sm:pt-0 border-t sm:border-t-0 border-slate-800/80 shrink-0">
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-slate-400 font-medium">Importance:</span>
                          <span className={`text-base sm:text-lg font-black font-mono ${
                            isHigh ? 'text-red-400' : isMedium ? 'text-amber-400' : 'text-blue-400'
                          }`}>
                            {topic.importance}% importance
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Clock className="w-4 h-4 text-indigo-400" />
                          <span className="text-xs sm:text-sm font-bold text-indigo-200">
                            {topic.recommendedMinutes} min recommended
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Sub-tags and Quick Review CTA */}
                    <div className="flex flex-wrap items-center justify-between gap-2 mt-4 pt-3 border-t border-slate-800/80 text-xs">
                      <div className="flex flex-wrap gap-1.5">
                        {topic.tags.map((tag, idx) => (
                          <span key={idx} className="px-2.5 py-0.5 rounded-md bg-slate-900/90 text-slate-300 border border-slate-800 text-[11px] font-medium">
                            {tag}
                          </span>
                        ))}
                      </div>
                      <div className="flex flex-wrap items-center gap-2 ml-auto">
                        {onOpenCrashLesson && (
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              onOpenCrashLesson(topic.name);
                            }}
                            className="px-2.5 py-1 rounded-lg bg-amber-600/30 hover:bg-amber-600/60 text-amber-200 hover:text-white border border-amber-500/40 text-xs font-semibold flex items-center gap-1 transition-colors cursor-pointer"
                          >
                            <Zap className="w-3 h-3 text-amber-300 fill-amber-300" />
                            <span>3-Min Lesson</span>
                          </button>
                        )}
                        {onRetestTopic && (
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              onRetestTopic(topic.name);
                            }}
                            className="px-2.5 py-1 rounded-lg bg-purple-600/30 hover:bg-purple-600/60 text-purple-200 hover:text-white border border-purple-500/40 text-xs font-semibold flex items-center gap-1 transition-colors cursor-pointer"
                          >
                            <Target className="w-3 h-3 text-purple-300" />
                            <span>Re-test</span>
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={(e) => handleStartSprint(e, topic.name, topic.recommendedMinutes)}
                          className="px-3 py-1 rounded-lg bg-indigo-600/30 hover:bg-indigo-600/60 text-indigo-200 hover:text-white border border-indigo-500/40 text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
                        >
                          <Clock className="w-3.5 h-3.5 text-indigo-300" />
                          {activeSprintTopic === topic.name ? 'Running' : `Sprint ${topic.recommendedMinutes}m`}
                        </button>
                        <span className="flex items-center gap-1 text-xs font-semibold text-indigo-300 group-hover:translate-x-0.5 transition-transform">
                          Quick Cheat Sheet <ChevronRight className="w-4 h-4" />
                        </span>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </div>

            {/* AI EXTRACTED IMPORTANT CONCEPTS SECTION (from Document) */}
            {plan.importantConcepts && plan.importantConcepts.length > 0 && (
              <div className="p-5 rounded-2xl bg-[#0d1637]/90 border border-indigo-500/30 space-y-3">
                <div className="flex items-center gap-2 text-indigo-300 text-xs font-bold uppercase tracking-wider">
                  <Sparkles className="w-4 h-4 text-purple-400" />
                  <span>Important Concepts Extracted from {plan.documentTitle || 'Document'}</span>
                </div>
                <div className="flex flex-wrap gap-2">
                  {plan.importantConcepts.map((concept, cIdx) => (
                    <span 
                      key={cIdx} 
                      className="px-3 py-1.5 rounded-xl bg-slate-900/90 text-slate-200 border border-indigo-500/30 text-xs font-medium flex items-center gap-2 shadow-sm"
                    >
                      <span className="w-1.5 h-1.5 rounded-full bg-purple-400" />
                      {concept}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* LIKELY EXAM QUESTION AREAS (from Document) */}
            {plan.examQuestionAreas && plan.examQuestionAreas.length > 0 && (
              <div className="p-5 rounded-2xl bg-[#0d1637]/90 border border-purple-500/30 space-y-3">
                <div className="flex items-center gap-2 text-purple-300 text-xs font-bold uppercase tracking-wider">
                  <Target className="w-4 h-4 text-red-400" />
                  <span>Likely Exam Question Areas Identified by Gemini</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {plan.examQuestionAreas.map((area, aIdx) => (
                    <div 
                      key={aIdx} 
                      className="p-3 rounded-xl bg-slate-900/90 border border-slate-800 text-xs text-slate-200 flex items-start gap-2.5"
                    >
                      <span className="text-purple-400 font-mono font-bold shrink-0">Q{aIdx + 1}</span>
                      <span>{area}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Total Cram Time Summary Footer */}
            <div className="mt-5 p-4 sm:p-5 rounded-2xl bg-indigo-950/40 border border-indigo-500/30 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs sm:text-sm text-slate-300 shadow-inner">
              <div className="flex items-center gap-2.5">
                <BarChart3 className="w-4 h-4 text-purple-400 shrink-0" />
                <span>
                  Total Emergency Study Time:{' '}
                  <strong className="text-white font-mono font-bold">
                    {plan.topics.reduce((acc, t) => acc + t.recommendedMinutes, 0)} minutes
                  </strong>{' '}
                  (leaves 4+ hours for active recall testing & rest)
                </span>
              </div>
              <div className="flex items-center gap-1.5 text-indigo-300 font-semibold bg-indigo-900/50 px-3 py-1 rounded-lg border border-indigo-500/30">
                <span>💡 Tip: Finish High Priority before moving to Medium</span>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
};

