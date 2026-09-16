import React, { useState } from 'react';
import { 
  X, 
  Clock, 
  AlertTriangle, 
  HelpCircle, 
  CheckCircle2, 
  BookOpen, 
  Flame, 
  Zap, 
  Lightbulb, 
  ArrowRight
} from 'lucide-react';
import { StudyTopic } from '../types';

interface TopicDetailModalProps {
  topic: StudyTopic | null;
  onClose: () => void;
  onMarkMastered: (topicId: string) => void;
  isMastered: boolean;
}

export const TopicDetailModal: React.FC<TopicDetailModalProps> = ({
  topic,
  onClose,
  onMarkMastered,
  isMastered
}) => {
  const [showAnswer, setShowAnswer] = useState(false);

  if (!topic) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div 
        className="relative w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-3xl bg-[#08110F] border border-[#294238] p-6 sm:p-8 shadow-[0_25px_80px_rgba(0,0,0,0.8)] text-[#F2F7F3]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Glow Accent */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-[#2F6B4A]/15 blur-3xl rounded-full pointer-events-none -z-10" />

        {/* Top Header */}
        <div className="flex items-start justify-between pb-4 border-b border-[#294238]">
          <div>
            <div className="flex items-center gap-2 mb-1.5 flex-wrap">
              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-black uppercase tracking-wider ${
                topic.priority === 'high' 
                  ? 'bg-[#F29B9B]/20 text-[#F29B9B] border border-[#F29B9B]/40'
                  : topic.priority === 'medium'
                  ? 'bg-[#E8D58A]/20 text-[#E8D58A] border border-[#E8D58A]/40'
                  : 'bg-[#8FD3A2]/20 text-[#8FD3A2] border border-[#8FD3A2]/40'
              }`}>
                {topic.priority.toUpperCase()} PRIORITY
              </span>
              {topic.difficulty && (
                <span className="text-xs font-semibold px-2 py-0.5 rounded-md bg-[#12211D] text-[#AEBDB4] border border-[#294238]">
                  {topic.difficulty}
                </span>
              )}
              <span className="text-xs font-mono text-[#BFE8C8]">
                {topic.importance}% importance
              </span>
              <span className="text-xs text-[#7F9188] font-mono">
                • {topic.recommendedMinutes} min sprint
              </span>
            </div>
            <h3 className="text-2xl font-extrabold text-[#F2F7F3] font-display">
              {topic.name}
            </h3>
            <p className="text-xs text-[#8FD3A2] mt-0.5">
              Predicted Question: {topic.examQuestionType}
            </p>
          </div>

          <button
            id="close-topic-modal-btn"
            onClick={onClose}
            className="p-1.5 text-[#AEBDB4] hover:text-[#F2F7F3] rounded-lg hover:bg-[#12211D] transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="py-6 space-y-6 text-sm">
          {/* Reason for Priority / Document Evidence */}
          {topic.reason && (
            <div className="p-4 rounded-2xl bg-[#12211D] border border-[#294238] space-y-1.5">
              <div className="flex items-center gap-2 text-[#8FD3A2] font-semibold text-xs uppercase tracking-wider">
                <Lightbulb className="w-4 h-4 text-[#8FD3A2]" />
                <span>Document Priority Evidence</span>
              </div>
              <p className="text-[#AEBDB4] text-xs sm:text-sm leading-relaxed">
                {topic.reason}
              </p>
            </div>
          )}

          {/* Core Emergency Takeaway */}
          <div className="p-4 rounded-2xl bg-[#0D1916] border border-[#294238] space-y-1.5">
            <div className="flex items-center gap-2 text-[#BFE8C8] font-semibold text-xs uppercase tracking-wider">
              <Zap className="w-4 h-4 text-[#8FD3A2]" />
              <span>Core Rule / Must-Know Concept</span>
            </div>
            <p className="text-[#F2F7F3] font-medium leading-relaxed">
              {topic.keyTakeaway}
            </p>
          </div>

          {/* Professor Exam Trap Warning */}
          <div className="p-4 rounded-2xl bg-[#0D1916] border border-[#F29B9B]/40 space-y-1.5">
            <div className="flex items-center gap-2 text-[#F29B9B] font-semibold text-xs uppercase tracking-wider">
              <AlertTriangle className="w-4 h-4 text-[#F29B9B]" />
              <span>Watch Out: Common Exam Trap</span>
            </div>
            <p className="text-[#F29B9B]/90 text-xs sm:text-sm leading-relaxed">
              {topic.flashQuestion.trapNote}
            </p>
          </div>

          {/* Rapid Active Recall Drill */}
          <div className="p-5 rounded-2xl bg-[#12211D] border border-[#294238] space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-[#BFE8C8] font-semibold text-xs uppercase tracking-wider">
                <HelpCircle className="w-4 h-4 text-[#8FD3A2]" />
                <span>3-Minute Active Recall Test</span>
              </div>
              <span className="text-[11px] text-[#7F9188]">Say answer out loud before revealing</span>
            </div>

            <p className="text-[#F2F7F3] font-medium text-base">
              "{topic.flashQuestion.question}"
            </p>

            {showAnswer ? (
              <div className="p-3.5 rounded-xl bg-[#0D1916] border border-[#8FD3A2]/40 text-[#AEBDB4] text-xs sm:text-sm leading-relaxed animate-in fade-in">
                <strong className="block text-[#BFE8C8] mb-1 font-semibold">Model Exam Answer:</strong>
                {topic.flashQuestion.answer}
              </div>
            ) : (
              <button
                onClick={() => setShowAnswer(true)}
                className="w-full py-2.5 rounded-xl text-xs font-semibold text-[#AEBDB4] hover:text-[#F2F7F3] bg-[#0D1916] hover:bg-[#172A24] border border-[#294238] transition-colors cursor-pointer"
              >
                Reveal Model Answer
              </button>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="pt-4 border-t border-[#294238] flex items-center justify-between gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs font-medium text-[#7F9188] hover:text-[#F2F7F3] transition-colors cursor-pointer"
          >
            Close Sheet
          </button>

          <button
            id="mark-topic-mastered-btn"
            onClick={() => {
              onMarkMastered(topic.id);
              onClose();
            }}
            className={`px-5 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
              isMastered
                ? 'bg-[#2F6B4A]/30 text-[#9FE2B0] border border-[#9FE2B0]/40'
                : 'bg-[#BFE8C8] hover:bg-[#D9F3DE] text-[#08110F] shadow-md border border-[#8FD3A2]/40'
            }`}
          >
            <CheckCircle2 className="w-4 h-4" />
            <span>{isMastered ? 'Mastered (Click to Undo)' : 'Mark Topic as Mastered (+Boost Readiness)'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
