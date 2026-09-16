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
        className="relative w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-3xl backdrop-blur-2xl bg-[#0c132d] border border-indigo-500/40 p-6 sm:p-8 shadow-[0_25px_80px_rgba(0,0,0,0.8)]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Glow Accent */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-600/15 blur-3xl rounded-full pointer-events-none -z-10" />

        {/* Top Header */}
        <div className="flex items-start justify-between pb-4 border-b border-slate-800">
          <div>
            <div className="flex items-center gap-2 mb-1.5 flex-wrap">
              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-black uppercase tracking-wider ${
                topic.priority === 'high' 
                  ? 'bg-red-500/20 text-red-300 border border-red-500/30'
                  : topic.priority === 'medium'
                  ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                  : 'bg-blue-500/20 text-blue-300 border border-blue-500/30'
              }`}>
                {topic.priority.toUpperCase()} PRIORITY
              </span>
              {topic.difficulty && (
                <span className="text-xs font-semibold px-2 py-0.5 rounded-md bg-slate-800 text-slate-200 border border-slate-700">
                  {topic.difficulty}
                </span>
              )}
              <span className="text-xs font-mono text-purple-300">
                {topic.importance}% importance
              </span>
              <span className="text-xs text-slate-400 font-mono">
                • {topic.recommendedMinutes} min sprint
              </span>
            </div>
            <h3 className="text-2xl font-extrabold text-white font-display">
              {topic.name}
            </h3>
            <p className="text-xs text-indigo-300 mt-0.5">
              Predicted Question: {topic.examQuestionType}
            </p>
          </div>

          <button
            id="close-topic-modal-btn"
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800/80 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="py-6 space-y-6 text-sm">
          {/* Reason for Priority / Document Evidence */}
          {topic.reason && (
            <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-1.5">
              <div className="flex items-center gap-2 text-purple-300 font-semibold text-xs uppercase tracking-wider">
                <Lightbulb className="w-4 h-4 text-purple-400" />
                <span>Document Priority Evidence</span>
              </div>
              <p className="text-slate-300 text-xs sm:text-sm leading-relaxed">
                {topic.reason}
              </p>
            </div>
          )}

          {/* Core Emergency Takeaway */}
          <div className="p-4 rounded-2xl bg-indigo-950/40 border border-indigo-500/30 space-y-1.5">
            <div className="flex items-center gap-2 text-indigo-300 font-semibold text-xs uppercase tracking-wider">
              <Zap className="w-4 h-4 text-yellow-400" />
              <span>Core Rule / Must-Know Concept</span>
            </div>
            <p className="text-slate-100 font-medium leading-relaxed">
              {topic.keyTakeaway}
            </p>
          </div>

          {/* Professor Exam Trap Warning */}
          <div className="p-4 rounded-2xl bg-red-950/30 border border-red-500/30 space-y-1.5">
            <div className="flex items-center gap-2 text-red-300 font-semibold text-xs uppercase tracking-wider">
              <AlertTriangle className="w-4 h-4 text-red-400" />
              <span>Watch Out: Common Exam Trap</span>
            </div>
            <p className="text-red-200 text-xs sm:text-sm leading-relaxed">
              {topic.flashQuestion.trapNote}
            </p>
          </div>

          {/* Rapid Active Recall Drill */}
          <div className="p-5 rounded-2xl bg-slate-900/90 border border-slate-800 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-purple-300 font-semibold text-xs uppercase tracking-wider">
                <HelpCircle className="w-4 h-4" />
                <span>3-Minute Active Recall Test</span>
              </div>
              <span className="text-[11px] text-slate-400">Say answer out loud before revealing</span>
            </div>

            <p className="text-white font-medium text-base">
              "{topic.flashQuestion.question}"
            </p>

            {showAnswer ? (
              <div className="p-3.5 rounded-xl bg-purple-950/40 border border-purple-500/40 text-purple-200 text-xs sm:text-sm leading-relaxed animate-in fade-in">
                <strong className="block text-purple-300 mb-1 font-semibold">Model Exam Answer:</strong>
                {topic.flashQuestion.answer}
              </div>
            ) : (
              <button
                onClick={() => setShowAnswer(true)}
                className="w-full py-2.5 rounded-xl text-xs font-semibold text-slate-300 hover:text-white bg-slate-800/80 hover:bg-slate-700/80 border border-slate-700 transition-colors cursor-pointer"
              >
                Reveal Model Answer
              </button>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="pt-4 border-t border-slate-800 flex items-center justify-between gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs font-medium text-slate-400 hover:text-white transition-colors cursor-pointer"
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
                ? 'bg-emerald-950/80 text-emerald-300 border border-emerald-500/40'
                : 'bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white shadow-[0_0_20px_rgba(99,102,241,0.4)]'
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
