import React from 'react';
import { CheckCircle2, Target, AlertTriangle, Clock } from 'lucide-react';
import { StudyTopic, QuestionAttempt, TopicPerformance } from '../types';

interface ProgressSectionProps {
  topics: StudyTopic[];
  completedTopicIds: Set<string>;
  attempts: QuestionAttempt[];
  weakTopics: StudyTopic[];
  topicPerformanceMap: Record<string, TopicPerformance>;
  remainingTimeFormatted: string;
}

export const ProgressSection: React.FC<ProgressSectionProps> = ({
  topics,
  completedTopicIds,
  attempts,
  weakTopics,
  remainingTimeFormatted
}) => {
  const totalQuestions = attempts.length;
  const correctCount = attempts.filter((a) => a.isCorrect).length;
  const accuracy = totalQuestions > 0 ? Math.round((correctCount / totalQuestions) * 100) : 0;

  const completedTopicsList = topics.filter((t) => completedTopicIds.has(t.id));

  return (
    <section id="progress-section" className="px-4 sm:px-6 lg:px-8 pb-16">
      <div className="max-w-5xl mx-auto space-y-6">
        <div className="p-6 sm:p-7 rounded-2xl bg-[#12211D] border border-[#294238]">
          <h2 className="text-xl sm:text-2xl font-bold text-[#F2F7F3] mb-5">
            Your Progress
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* 1. Completed topics */}
            <div className="p-4 rounded-xl bg-[#0D1916] border border-[#294238]">
              <div className="flex items-center gap-2 text-[#9FE2B0] text-xs font-semibold uppercase tracking-wider mb-2">
                <CheckCircle2 className="w-4 h-4" />
                <span>Completed Topics</span>
              </div>
              <div className="text-2xl sm:text-3xl font-bold font-mono text-[#F2F7F3]">
                {completedTopicsList.length} <span className="text-sm text-[#7F9188]">/ {topics.length}</span>
              </div>
              <div className="text-xs text-[#AEBDB4] mt-1">
                {completedTopicsList.length > 0
                  ? `${Math.round((completedTopicsList.length / (topics.length || 1)) * 100)}% completed`
                  : 'None marked complete yet'}
              </div>
            </div>

            {/* 2. Quiz score / accuracy */}
            <div className="p-4 rounded-xl bg-[#0D1916] border border-[#294238]">
              <div className="flex items-center gap-2 text-[#BFE8C8] text-xs font-semibold uppercase tracking-wider mb-2">
                <Target className="w-4 h-4 text-[#8FD3A2]" />
                <span>Quiz Accuracy</span>
              </div>
              <div className="text-2xl sm:text-3xl font-bold font-mono text-[#BFE8C8]">
                {totalQuestions > 0 ? `${accuracy}%` : 'N/A'}
              </div>
              <div className="text-xs text-[#AEBDB4] mt-1">
                {totalQuestions > 0 ? `${correctCount} of ${totalQuestions} correct` : 'Take a quiz to calculate'}
              </div>
            </div>

            {/* 3. Weak topics */}
            <div className="p-4 rounded-xl bg-[#0D1916] border border-[#294238]">
              <div className="flex items-center gap-2 text-[#F29B9B] text-xs font-semibold uppercase tracking-wider mb-2">
                <AlertTriangle className="w-4 h-4" />
                <span>Weak Topics</span>
              </div>
              <div className="text-2xl sm:text-3xl font-bold font-mono text-[#F29B9B]">
                {weakTopics.length}
              </div>
              <div className="text-xs text-[#AEBDB4] mt-1">
                {weakTopics.length > 0 ? 'Topics needing revision' : 'No weak spots detected'}
              </div>
            </div>

            {/* 4. Time left before exam */}
            <div className="p-4 rounded-xl bg-[#0D1916] border border-[#294238]">
              <div className="flex items-center gap-2 text-[#8FD3A2] text-xs font-semibold uppercase tracking-wider mb-2">
                <Clock className="w-4 h-4" />
                <span>Time Left</span>
              </div>
              <div className="text-xl sm:text-2xl font-bold font-mono text-[#F2F7F3] truncate">
                {remainingTimeFormatted}
              </div>
              <div className="text-xs text-[#AEBDB4] mt-1">
                Before your scheduled exam
              </div>
            </div>
          </div>

          {/* Details list for Completed Topics if any */}
          {completedTopicsList.length > 0 && (
            <div className="mt-5 pt-4 border-t border-[#294238]">
              <h3 className="text-xs font-bold uppercase tracking-wider text-[#7F9188] mb-2.5">
                Completed Topics List
              </h3>
              <div className="flex flex-wrap gap-2">
                {completedTopicsList.map((t) => (
                  <span
                    key={t.id}
                    className="px-3 py-1 rounded-lg bg-[#0D1916] border border-[#9FE2B0]/30 text-xs text-[#9FE2B0] font-medium flex items-center gap-1.5"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    {t.name}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </section>
  );
};
