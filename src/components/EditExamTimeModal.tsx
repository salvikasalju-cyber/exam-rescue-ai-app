import React, { useState, useEffect } from 'react';
import { Clock, Calendar, AlertCircle, Sparkles, X, Check } from 'lucide-react';
import { 
  parseExamDateTime, 
  formatExamDate, 
  formatExamTime, 
  saveExamDateTime,
  calculateRemainingTime 
} from '../utils/examTime';

interface EditExamTimeModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentDateInput: string;
  currentTimeInput: string;
  onExamTimeSet: (dateInput: string, timeInput: string, timestamp: number, hoursRemaining: number) => void;
}

export const EditExamTimeModal: React.FC<EditExamTimeModalProps> = ({
  isOpen,
  onClose,
  currentDateInput,
  currentTimeInput,
  onExamTimeSet
}) => {
  const [examDate, setExamDate] = useState<string>(currentDateInput);
  const [examTime, setExamTime] = useState<string>(currentTimeInput);
  const [validationError, setValidationError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      setExamDate(currentDateInput);
      setExamTime(currentTimeInput);
      setValidationError(null);
    }
  }, [isOpen, currentDateInput, currentTimeInput]);

  if (!isOpen) return null;

  // Real-time calculation feedback
  const targetTs = parseExamDateTime(examDate, examTime);
  const remaining = targetTs ? calculateRemainingTime(targetTs) : null;
  const isPast = remaining ? remaining.isPassed : false;

  const handleSetExamTime = (e?: React.FormEvent) => {
    if (e) e.preventDefault();

    if (!examDate || !examTime) {
      setValidationError('Please select both an exam date and time.');
      return;
    }

    const ts = parseExamDateTime(examDate, examTime);
    if (!ts || isNaN(ts)) {
      setValidationError('Invalid date or time selected.');
      return;
    }

    const calc = calculateRemainingTime(ts);
    if (calc.isPassed || ts <= Date.now()) {
      setValidationError('Exam time has passed. Please choose a future exam time.');
      return;
    }

    // Save selected exam date and time
    saveExamDateTime({
      date: examDate,
      time: examTime,
      timestamp: ts
    });

    onExamTimeSet(examDate, examTime, ts, Math.max(0.2, calc.hoursDecimal));
    onClose();

    // Smooth scroll to dashboard
    const dashboardEl = document.getElementById('dashboard');
    if (dashboardEl) {
      dashboardEl.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-200">
      <div 
        className="relative w-full max-w-md rounded-3xl bg-[#0b122c] border border-indigo-500/40 p-6 sm:p-7 shadow-[0_25px_70px_rgba(0,0,0,0.8)] text-slate-100"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800/80 transition-colors cursor-pointer"
          title="Close dialog"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Section Header: WHEN IS YOUR EXAM? */}
        <div className="mb-6">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-950/80 border border-indigo-500/40 text-indigo-300 text-xs font-bold uppercase tracking-wider mb-2">
            <Clock className="w-3.5 h-3.5 text-indigo-400" />
            <span>Target Calibration</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-black text-white tracking-wide uppercase font-display">
            WHEN IS YOUR EXAM?
          </h2>
          <p className="text-xs sm:text-sm text-slate-300 mt-1">
            Choose your exact exam date and time to calibrate your live countdown and study sprints.
          </p>
        </div>

        {/* Error Notice */}
        {validationError && (
          <div className="mb-4 p-3.5 rounded-xl bg-red-950/60 border border-red-500/50 flex items-start gap-2.5 text-red-200 text-xs animate-in fade-in">
            <AlertCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
            <span className="font-medium">{validationError}</span>
          </div>
        )}

        <form onSubmit={handleSetExamTime} className="space-y-4">
          {/* Exam Date */}
          <div>
            <label 
              htmlFor="edit-exam-date-input" 
              className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-1.5 flex items-center gap-1.5"
            >
              <Calendar className="w-3.5 h-3.5 text-indigo-400" />
              <span>Exam Date</span>
            </label>
            <input
              id="edit-exam-date-input"
              type="date"
              value={examDate}
              onChange={(e) => {
                setExamDate(e.target.value);
                setValidationError(null);
              }}
              className="w-full px-4 py-3 rounded-xl bg-slate-900/90 border border-indigo-500/40 hover:border-indigo-400 text-white font-medium text-sm focus:outline-none focus:border-indigo-400 focus:ring-1 focus:ring-indigo-400 [color-scheme:dark] transition-colors cursor-pointer shadow-inner"
              required
            />
          </div>

          {/* Exam Time */}
          <div>
            <label 
              htmlFor="edit-exam-time-input" 
              className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-1.5 flex items-center gap-1.5"
            >
              <Clock className="w-3.5 h-3.5 text-indigo-400" />
              <span>Exam Time</span>
            </label>
            <input
              id="edit-exam-time-input"
              type="time"
              value={examTime}
              onChange={(e) => {
                setExamTime(e.target.value);
                setValidationError(null);
              }}
              className="w-full px-4 py-3 rounded-xl bg-slate-900/90 border border-indigo-500/40 hover:border-indigo-400 text-white font-medium text-sm focus:outline-none focus:border-indigo-400 focus:ring-1 focus:ring-indigo-400 [color-scheme:dark] transition-colors cursor-pointer shadow-inner"
              required
            />
          </div>

          {/* Dynamic Live Preview Box */}
          {examDate && examTime && (
            <div className={`p-3.5 rounded-xl border transition-all text-xs ${
              isPast
                ? 'bg-red-950/40 border-red-500/40 text-red-200'
                : 'bg-indigo-950/60 border-indigo-500/40 text-indigo-200'
            }`}>
              {isPast ? (
                <div className="flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
                  <span className="font-semibold">Exam time has passed. Please choose a future exam time.</span>
                </div>
              ) : (
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-slate-400 block text-[11px]">Selected Target:</span>
                    <strong className="text-white font-semibold">
                      {formatExamDate(examDate, targetTs)} at {formatExamTime(examTime, targetTs)}
                    </strong>
                  </div>
                  {remaining && (
                    <div className="text-right">
                      <span className="text-slate-400 block text-[11px]">Remaining:</span>
                      <strong className="text-emerald-400 font-mono font-bold">
                        {remaining.hours}h {remaining.minutes}m {remaining.seconds}s
                      </strong>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Action Buttons */}
          <div className="pt-2 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl text-xs sm:text-sm font-semibold text-slate-300 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              id="set-exam-time-submit-btn"
              type="submit"
              className="px-6 py-2.5 rounded-xl text-xs sm:text-sm font-bold text-white bg-gradient-to-r from-purple-600 via-indigo-600 to-blue-600 hover:from-purple-500 hover:to-blue-500 shadow-[0_0_20px_rgba(99,102,241,0.5)] transition-all flex items-center gap-2 cursor-pointer"
            >
              <Check className="w-4 h-4 text-emerald-300 stroke-[3]" />
              <span>Set Exam Time</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
