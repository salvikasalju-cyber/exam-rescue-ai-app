import React from 'react';
import { motion } from 'motion/react';
import { 
  AlertTriangle, 
  Clock, 
  ArrowUpRight, 
  Zap, 
  RefreshCw, 
  CheckCircle2, 
  Target,
  Sparkles,
  BookOpen
} from 'lucide-react';
import { StudyTopic, TopicPerformance } from '../types';

interface WeakTopicsSectionProps {
  weakTopics: StudyTopic[];
  topicPerformanceMap: Record<string, TopicPerformance>;
  onOpenCrashLesson: (topicName: string) => void;
  onRetestTopic: (topicName: string) => void;
  onRescheduleTopic?: (topicId: string) => void;
  onOpenLearnTopic?: (topic: StudyTopic) => void;
}

export const WeakTopicsSection: React.FC<WeakTopicsSectionProps> = ({
  weakTopics,
  topicPerformanceMap,
  onOpenCrashLesson,
  onRetestTopic,
  onRescheduleTopic,
  onOpenLearnTopic
}) => {
  if (weakTopics.length === 0) {
    return null;
  }

  return (
    <div id="weak-topics-section" className="mb-6 p-5 sm:p-7 rounded-3xl bg-gradient-to-br from-red-950/40 via-[#16122d]/90 to-[#0c0f24]/95 border-2 border-red-500/50 shadow-[0_0_40px_rgba(239,68,68,0.18)] relative overflow-hidden animate-in fade-in">
      {/* Subtle top indicator */}
      <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-red-500 via-amber-500 to-red-500 shadow-[0_0_15px_rgba(239,68,68,0.6)]" />

      {/* Section Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-red-500/20 border border-red-500/50 flex items-center justify-center text-red-400 shadow-md">
            <AlertTriangle className="w-5 h-5 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-xl sm:text-2xl font-black text-white tracking-wide font-display uppercase">
                Your Weak Topics
              </h3>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-red-500/20 text-red-300 border border-red-500/40">
                {weakTopics.length} Detected
              </span>
            </div>
            <p className="text-xs sm:text-sm text-red-200/80 mt-0.5">
              Identified through active recall mistakes. Prioritized higher with extended cram sprints.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-[11px] font-semibold text-amber-300 bg-amber-950/60 px-3 py-1 rounded-xl border border-amber-500/40 flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-yellow-400" />
            <span>High-Yield Score Boost</span>
          </span>
        </div>
      </div>

      {/* Weak Topics Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {weakTopics.map((topic, index) => {
          const perf = topicPerformanceMap[topic.name];
          const accuracy = perf ? `${perf.accuracy}%` : topic.quizAccuracy !== undefined ? `${topic.quizAccuracy}%` : 'Low Accuracy';
          const reason = perf?.reason || topic.weakReason || 'Multiple incorrect quiz answers';
          const isImproving = perf?.status === 'improving' || topic.status === 'improving';

          return (
            <motion.div
              key={topic.id || index}
              whileHover={{ scale: 1.01 }}
              id={`weak-topic-card-${index}`}
              className="p-4 sm:p-5 rounded-2xl bg-slate-950/80 border border-red-500/35 hover:border-red-400/70 transition-all shadow-md flex flex-col justify-between group"
            >
              <div>
                {/* Header badges */}
                <div className="flex items-center justify-between gap-2 mb-2 flex-wrap">
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 rounded-md text-[10px] font-black uppercase tracking-wider bg-red-950 text-red-400 border border-red-500/50">
                      HIGH PRIORITY
                    </span>
                    <span className="px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider bg-red-500/20 text-red-300 border border-red-500/30">
                      STATUS: WEAK
                    </span>
                    {isImproving && (
                      <span className="px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider bg-emerald-950 text-emerald-300 border border-emerald-500/40">
                        IMPROVING
                      </span>
                    )}
                  </div>
                  <span className="text-xs font-mono font-bold text-red-400 bg-red-950/60 px-2 py-0.5 rounded border border-red-900/60">
                    Accuracy: {accuracy}
                  </span>
                </div>

                {/* Topic Name */}
                <h4 className="text-base sm:text-lg font-bold text-white group-hover:text-red-300 transition-colors">
                  {topic.name}
                </h4>

                {/* Recommended Study Time */}
                <div className="flex items-center gap-2 mt-2 text-xs sm:text-sm text-slate-300 font-medium">
                  <Clock className="w-3.5 h-3.5 text-amber-400" />
                  <span>Recommended: <strong className="text-white font-mono font-bold">{topic.recommendedMinutes} min</strong></span>
                  <span className="text-amber-400 text-xs font-semibold">(Boosted)</span>
                </div>

                {/* Reason */}
                <div className="mt-2.5 p-2.5 rounded-xl bg-slate-900/90 border border-slate-800 text-xs text-slate-300 flex items-start gap-2">
                  <span className="text-red-400 font-semibold shrink-0">Reason:</span>
                  <span className="text-slate-300 italic">{reason}</span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="mt-4 pt-3 border-t border-slate-800/80 flex flex-wrap items-center justify-between gap-2">
                <div className="flex flex-wrap items-center gap-2">
                  {onOpenLearnTopic && (
                    <button
                      id={`weak-learn-topic-btn-${index}`}
                      type="button"
                      onClick={() => onOpenLearnTopic(topic)}
                      className="px-3.5 py-1.5 rounded-xl text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-500 shadow-md shadow-indigo-900/40 flex items-center gap-1.5 transition-all cursor-pointer"
                    >
                      <BookOpen className="w-3.5 h-3.5 text-indigo-200" />
                      <span>Learn Topic</span>
                    </button>
                  )}

                  <button
                    id={`weak-crash-lesson-btn-${index}`}
                    type="button"
                    onClick={() => onOpenCrashLesson(topic.name)}
                    className="px-3 py-1.5 rounded-xl text-xs font-semibold text-amber-200 hover:text-white bg-amber-600/30 hover:bg-amber-600/60 border border-amber-500/40 shadow-sm flex items-center gap-1.5 transition-all cursor-pointer"
                  >
                    <Zap className="w-3 h-3 text-yellow-200 fill-yellow-200" />
                    <span>3-Min Lesson</span>
                  </button>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    id={`weak-retest-btn-${index}`}
                    type="button"
                    onClick={() => onRetestTopic(topic.name)}
                    className="px-3 py-1.5 rounded-xl text-xs font-semibold text-indigo-200 hover:text-white bg-indigo-950/70 hover:bg-indigo-900/80 border border-indigo-500/40 flex items-center gap-1.5 transition-all cursor-pointer"
                  >
                    <Target className="w-3.5 h-3.5 text-indigo-400" />
                    <span>Re-test</span>
                  </button>
                  {onRescheduleTopic && !topic.isRescheduled && (
                    <button
                      id={`weak-reschedule-btn-${index}`}
                      type="button"
                      onClick={() => onRescheduleTopic(topic.id)}
                      className="px-3 py-1.5 rounded-xl text-xs font-semibold text-purple-200 hover:text-white bg-purple-950/70 hover:bg-purple-900/80 border border-purple-500/40 flex items-center gap-1 transition-all cursor-pointer"
                    >
                      <RefreshCw className="w-3 h-3 text-purple-400" />
                      <span>Reschedule</span>
                    </button>
                  )}
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
};
