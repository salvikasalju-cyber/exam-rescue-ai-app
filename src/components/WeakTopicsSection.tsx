import React from 'react';
import { Clock, RefreshCw, Target, BookOpen } from 'lucide-react';
import { StudyTopic, TopicPerformance } from '../types';

interface WeakTopicsSectionProps {
  weakTopics: StudyTopic[];
  topicPerformanceMap: Record<string, TopicPerformance>;
  onRetestTopic: (topicName: string) => void;
  onRescheduleTopic?: (topicId: string) => void;
  onOpenLearnTopic?: (topic: StudyTopic) => void;
}

export const WeakTopicsSection: React.FC<WeakTopicsSectionProps> = ({
  weakTopics,
  topicPerformanceMap,
  onRetestTopic,
  onRescheduleTopic,
  onOpenLearnTopic
}) => {
  if (weakTopics.length === 0) {
    return null;
  }

  return (
    <div id="weak-topics-section" className="mb-6 p-5 sm:p-6 rounded-2xl bg-[#0D1916] border border-[#F29B9B]/30">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-bold text-[#F2F7F3]">
          Weak Topics ({weakTopics.length})
        </h3>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {weakTopics.map((topic, index) => {
          const perf = topicPerformanceMap[topic.name];
          const accuracy = perf ? `${perf.accuracy}%` : topic.quizAccuracy !== undefined ? `${topic.quizAccuracy}%` : 'Low';
          const reason = perf?.reason || topic.weakReason || 'Multiple incorrect quiz answers';

          return (
            <div
              key={topic.id || index}
              id={`weak-topic-card-${index}`}
              className="p-4 rounded-xl bg-[#12211D] border border-[#294238] flex flex-col justify-between"
            >
              <div className="space-y-2">
                {/* Topic Name & Accuracy */}
                <div className="flex items-center justify-between gap-2">
                  <h4 className="text-base font-bold text-[#F2F7F3]">
                    {topic.name}
                  </h4>
                  <span className="text-xs font-mono font-bold text-[#F29B9B] bg-[#0D1916] px-2 py-0.5 rounded border border-[#294238]">
                    Accuracy: {accuracy}
                  </span>
                </div>

                {/* Priority & Recommended Study Time */}
                <div className="flex items-center gap-3 text-xs text-[#AEBDB4]">
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-[#F29B9B]/15 text-[#F29B9B] border border-[#F29B9B]/30">
                    {topic.priority.toUpperCase()} PRIORITY
                  </span>
                  <span className="flex items-center gap-1 font-medium">
                    <Clock className="w-3.5 h-3.5 text-[#8FD3A2]" />
                    {topic.recommendedMinutes} min recommended
                  </span>
                </div>

                {/* Reason */}
                <div className="p-2.5 rounded-lg bg-[#0D1916] border border-[#294238] text-xs text-[#AEBDB4]">
                  <span className="font-semibold text-[#F29B9B]">Reason: </span>
                  <span>{reason}</span>
                </div>
              </div>

              {/* Action Buttons: Learn Topic, Reschedule, Re-test */}
              <div className="mt-4 pt-3 border-t border-[#294238] flex flex-wrap items-center gap-2">
                {onOpenLearnTopic && (
                  <button
                    id={`weak-learn-topic-btn-${index}`}
                    type="button"
                    onClick={() => onOpenLearnTopic(topic)}
                    className="px-3 py-1.5 rounded-lg text-xs font-bold text-[#08110F] bg-[#BFE8C8] hover:bg-[#D9F3DE] flex items-center gap-1.5 transition-colors cursor-pointer"
                  >
                    <BookOpen className="w-3.5 h-3.5 text-[#08110F]" />
                    <span>Learn Topic</span>
                  </button>
                )}

                {onRescheduleTopic && (
                  <button
                    id={`weak-reschedule-btn-${index}`}
                    type="button"
                    onClick={() => onRescheduleTopic(topic.id)}
                    className="px-3 py-1.5 rounded-lg text-xs font-semibold text-[#AEBDB4] hover:text-[#F2F7F3] bg-[#0D1916] hover:bg-[#172A24] border border-[#294238] flex items-center gap-1.5 transition-colors cursor-pointer"
                  >
                    <RefreshCw className="w-3.5 h-3.5 text-[#AEBDB4]" />
                    <span>Reschedule</span>
                  </button>
                )}

                <button
                  id={`weak-retest-btn-${index}`}
                  type="button"
                  onClick={() => onRetestTopic(topic.name)}
                  className="px-3 py-1.5 rounded-lg text-xs font-semibold text-[#8FD3A2] hover:text-[#BFE8C8] bg-[#0D1916] hover:bg-[#172A24] border border-[#8FD3A2]/30 flex items-center gap-1.5 transition-colors cursor-pointer ml-auto"
                >
                  <Target className="w-3.5 h-3.5 text-[#8FD3A2]" />
                  <span>Re-test</span>
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
