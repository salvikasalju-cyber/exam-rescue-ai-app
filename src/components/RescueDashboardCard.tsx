import React, { useState, useEffect } from 'react';
import { 
  Clock, 
  Circle, 
  CheckCircle2, 
  Calendar, 
  Edit3, 
  Zap, 
  BookOpen 
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
  onOpenEditExamTime,
  onStartRescueQuiz,
  onRetestTopic,
  onRescheduleTopic,
  onOpenLearnTopic,
  topicPerformanceMap = {},
  weakTopics = []
}) => {
  const [currentTime, setCurrentTime] = useState<number>(Date.now());
  const [completedTopicIds, setCompletedTopicIds] = useState<Set<string>>(new Set());

  const defaultExamSetting = getDefaultExamDateTime();
  const targetTimestamp = 
    plan.examTargetTimestamp || 
    (plan.examDateInput && plan.examTimeInput ? parseExamDateTime(plan.examDateInput, plan.examTimeInput) : defaultExamSetting.timestamp);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime(Date.now());
    }, 1000);
    return () => clearInterval(interval);
  }, []);

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

  const getTopicStatus = (topic: StudyTopic) => {
    if (completedTopicIds.has(topic.id)) return 'Completed';
    if (topic.isWeak || topic.status === 'weak') return 'Weak';
    if (topic.isRescheduled) return 'Rescheduled';
    if (topic.status === 'improving') return 'Improving';
    return 'Pending';
  };

  return (
    <section id="rescue-plan-section" className="px-4 sm:px-6 lg:px-8 pb-16">
      <div className="max-w-5xl mx-auto space-y-6">
        {/* Rescue Plan Header Card */}
        <div className="p-6 sm:p-7 rounded-2xl bg-[#12211D] border border-[#294238]">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            {/* Title & Subject */}
            <div>
              <h2 className="text-xl sm:text-2xl font-bold text-[#F2F7F3]">
                Rescue Plan: {plan.courseName}
              </h2>
              <p className="text-xs sm:text-sm text-[#AEBDB4] mt-1">
                Prioritized study sequence based on topic yield and remaining time.
              </p>
            </div>

            {/* Top Action: Start Rescue */}
            {onStartRescueQuiz && (
              <button
                id="start-rescue-btn"
                onClick={() => onStartRescueQuiz(null)}
                className="px-5 py-2.5 rounded-xl text-xs font-bold text-[#08110F] bg-[#BFE8C8] hover:bg-[#D9F3DE] flex items-center justify-center gap-2 cursor-pointer transition-colors shrink-0"
              >
                <Zap className="w-4 h-4 text-[#08110F]" />
                <span>Start Rescue</span>
              </button>
            )}
          </div>

          {/* Remaining Exam Time Section */}
          <div className="mt-6 p-4 rounded-xl bg-[#0D1916] border border-[#294238] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <div className="text-xs text-[#7F9188] font-medium mb-1">
                Remaining Exam Time
              </div>
              {isExamTimePassed ? (
                <div className="text-sm font-bold text-[#F29B9B]">
                  Exam time has passed. Please select a future time.
                </div>
              ) : (
                <div className="font-mono text-2xl sm:text-3xl font-extrabold text-[#F2F7F3] flex items-center gap-2">
                  <span>{hours.toString().padStart(2, '0')}h</span>
                  <span className="text-[#8FD3A2]">:</span>
                  <span>{minutes.toString().padStart(2, '0')}m</span>
                  <span className="text-[#8FD3A2]">:</span>
                  <span className="text-[#BFE8C8]">{seconds.toString().padStart(2, '0')}s</span>
                </div>
              )}
              <div className="text-xs text-[#AEBDB4] mt-1">
                Exam: {formatExamDate(plan.examDateInput, targetTimestamp)} at {formatExamTime(plan.examTimeInput, targetTimestamp)}
              </div>
            </div>

            {onOpenEditExamTime && (
              <button
                id="edit-exam-time-btn"
                onClick={onOpenEditExamTime}
                className="px-3 py-1.5 rounded-lg text-xs font-semibold text-[#BFE8C8] hover:text-[#F2F7F3] bg-[#12211D] hover:bg-[#172A24] border border-[#294238] flex items-center gap-1.5 cursor-pointer transition-colors self-start sm:self-auto"
              >
                <Calendar className="w-3.5 h-3.5 text-[#8FD3A2]" />
                <Edit3 className="w-3 h-3 text-[#8FD3A2]" />
                <span>Edit Exam Time</span>
              </button>
            )}
          </div>
        </div>

        {/* Weak Topics Section (if any detected from quiz) */}
        <WeakTopicsSection
          weakTopics={weakTopics}
          topicPerformanceMap={topicPerformanceMap}
          onRetestTopic={(name) => onRetestTopic?.(name)}
          onRescheduleTopic={(id) => onRescheduleTopic?.(id)}
          onOpenLearnTopic={(topic) => onOpenLearnTopic?.(topic)}
        />

        {/* Topics List */}
        <div className="space-y-3">
          <div className="flex items-center justify-between text-xs text-[#7F9188] px-1">
            <span>Study Topics ({plan.topics.length})</span>
            <span>Click 'Learn Topic' for full explanation and examples</span>
          </div>

          {plan.topics.map((topic, index) => {
            const isCompleted = completedTopicIds.has(topic.id);
            const statusLabel = getTopicStatus(topic);

            return (
              <div
                key={topic.id || index}
                id={`rescue-topic-${index}`}
                onClick={() => onTopicClick(topic)}
                className="p-4 sm:p-5 rounded-xl bg-[#12211D] border border-[#294238] hover:border-[#8FD3A2]/40 transition-colors cursor-pointer flex flex-col sm:flex-row sm:items-center justify-between gap-4"
              >
                {/* Left: Completion toggle, Name, Priority, Status */}
                <div className="flex items-start gap-3 min-w-0">
                  <button
                    type="button"
                    onClick={(e) => toggleTopicCompletion(e, topic.id)}
                    className="mt-0.5 text-[#7F9188] hover:text-[#9FE2B0] transition-colors cursor-pointer shrink-0"
                    title="Toggle topic completion"
                  >
                    {isCompleted ? (
                      <CheckCircle2 className="w-5 h-5 text-[#9FE2B0]" />
                    ) : (
                      <Circle className="w-5 h-5 text-[#7F9188]" />
                    )}
                  </button>

                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                        topic.priority === 'high'
                          ? 'bg-[#F29B9B]/15 text-[#F29B9B] border border-[#F29B9B]/30'
                          : topic.priority === 'medium'
                          ? 'bg-[#E8D58A]/15 text-[#E8D58A] border border-[#E8D58A]/30'
                          : 'bg-[#8FD3A2]/15 text-[#8FD3A2] border border-[#8FD3A2]/30'
                      }`}>
                        {topic.priority} Priority
                      </span>

                      <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-[#0D1916] text-[#AEBDB4] border border-[#294238]">
                        Status: {statusLabel}
                      </span>
                    </div>

                    <h3 className="text-base sm:text-lg font-bold text-[#F2F7F3] truncate">
                      {topic.name}
                    </h3>
                  </div>
                </div>

                {/* Right: Importance, Recommended Study Time, Learn Topic */}
                <div className="flex items-center justify-between sm:justify-end gap-4 shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-[#294238]">
                  {/* Importance */}
                  <div className="text-left sm:text-right">
                    <span className="text-[11px] text-[#7F9188] block">Importance</span>
                    <span className="text-sm font-bold font-mono text-[#F2F7F3]">
                      {topic.importance}%
                    </span>
                  </div>

                  {/* Recommended Study Time */}
                  <div className="text-left sm:text-right">
                    <span className="text-[11px] text-[#7F9188] block">Study Time</span>
                    <span className="text-sm font-bold font-mono text-[#BFE8C8] flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5 text-[#8FD3A2]" />
                      {topic.recommendedMinutes} min
                    </span>
                  </div>

                  {/* Learn Topic Button */}
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      if (onOpenLearnTopic) {
                        onOpenLearnTopic(topic);
                      } else {
                        onTopicClick(topic);
                      }
                    }}
                    className="px-3.5 py-1.5 rounded-lg text-xs font-bold text-[#08110F] bg-[#BFE8C8] hover:bg-[#D9F3DE] flex items-center gap-1.5 transition-colors cursor-pointer"
                  >
                    <BookOpen className="w-3.5 h-3.5 text-[#08110F]" />
                    <span>Learn Topic</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};
