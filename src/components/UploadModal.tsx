import React, { useState, useRef, useEffect } from 'react';
import { 
  X, 
  UploadCloud, 
  FileText, 
  Calendar, 
  Clock, 
  RefreshCw,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';
import { ExamRescuePlan, StudyTopic, GeminiAnalysisResponse } from '../types';
import { 
  parseExamDateTime, 
  formatExamDate, 
  formatExamTime, 
  getDefaultExamDateTime, 
  saveExamDateTime, 
  calculateRemainingTime, 
  scaleTopicsForRemainingTime 
} from '../utils/examTime';

interface UploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onPlanGenerated: (newPlan: ExamRescuePlan) => void;
  currentDateInput?: string;
  currentTimeInput?: string;
  onExamTimeSet?: (dateInput: string, timeInput: string, timestamp: number, hoursRemaining: number) => void;
}

export const UploadModal: React.FC<UploadModalProps> = ({
  isOpen,
  onClose,
  onPlanGenerated,
  currentDateInput,
  currentTimeInput,
  onExamTimeSet
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [subjectName, setSubjectName] = useState<string>('');
  
  const defaultSetting = getDefaultExamDateTime();
  const [examDate, setExamDate] = useState<string>(currentDateInput || defaultSetting.date);
  const [examTime, setExamTime] = useState<string>(currentTimeInput || defaultSetting.time);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [isDragging, setIsDragging] = useState<boolean>(false);

  useEffect(() => {
    if (isOpen) {
      if (currentDateInput) setExamDate(currentDateInput);
      if (currentTimeInput) setExamTime(currentTimeInput);
      setErrorMessage(null);
    }
  }, [isOpen, currentDateInput, currentTimeInput]);

  if (!isOpen) return null;

  const processFile = (file: File) => {
    setSelectedFile(file);
    setErrorMessage(null);
    if (!subjectName) {
      const clean = file.name.replace(/\.[^/.]+$/, '').replace(/[_-]/g, ' ').trim();
      setSubjectName(clean);
    }
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      processFile(e.target.files[0]);
    }
  };

  const readFileAsBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        const result = reader.result as string;
        const base64 = result.includes(',') ? result.split(',')[1] : result;
        resolve(base64);
      };
      reader.onerror = (err) => reject(err);
      reader.readAsDataURL(file);
    });
  };

  const handleGenerate = async () => {
    setErrorMessage(null);

    if (!examDate || !examTime) {
      setErrorMessage('Please choose an exam date and time.');
      return;
    }

    const ts = parseExamDateTime(examDate, examTime);
    if (!ts || isNaN(ts) || ts <= Date.now()) {
      setErrorMessage('Exam time has passed. Please choose a future exam time.');
      return;
    }

    const calc = calculateRemainingTime(ts);
    const exactHoursRemaining = Math.max(0.2, calc.hoursDecimal);

    saveExamDateTime({
      date: examDate,
      time: examTime,
      timestamp: ts
    });

    if (onExamTimeSet) {
      onExamTimeSet(examDate, examTime, ts, exactHoursRemaining);
    }

    if (!selectedFile) {
      if (fileInputRef.current) {
        fileInputRef.current.click();
      }
      return;
    }

    setIsProcessing(true);

    try {
      const base64Data = await readFileAsBase64(selectedFile);
      const RETRY_DELAYS = [1000, 2000, 4000];
      let successPlan: ExamRescuePlan | null = null;

      for (let attempt = 0; attempt <= RETRY_DELAYS.length; attempt++) {
        try {
          if (attempt > 0) {
            await new Promise((resolve) => setTimeout(resolve, RETRY_DELAYS[attempt - 1]));
          }

          const response = await fetch('/api/analyze-notes', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              fileData: base64Data,
              fileName: selectedFile.name,
              mimeType: selectedFile.type || 'application/pdf',
              hoursRemaining: exactHoursRemaining,
            }),
          });

          if (!response.ok) {
            if (attempt < RETRY_DELAYS.length) continue;
            throw new Error('Failed to analyze document.');
          }

          const data: GeminiAnalysisResponse = await response.json();
          if (!data || !Array.isArray(data.topics) || data.topics.length === 0) {
            if (attempt < RETRY_DELAYS.length) continue;
            throw new Error('No topics extracted from document.');
          }

          const mappedTopics: StudyTopic[] = (data.topics || []).map((t, idx) => {
            const normPriority: 'high' | 'medium' | 'low' = 
              String(t.priority).toLowerCase() === 'high' ? 'high' :
              String(t.priority).toLowerCase() === 'low' ? 'low' : 'medium';

            const importanceNum = Math.min(100, Math.max(0, Number(t.importance) || 75));
            const studyTime = Number(t.studyTimeMinutes) || 20;

            return {
              id: `ai-topic-${idx + 1}`,
              name: t.name,
              priority: normPriority,
              importance: importanceNum,
              recommendedMinutes: studyTime,
              difficulty: t.difficulty || 'Medium',
              reason: t.reason || '',
              tags: Array.isArray(t.tags) && t.tags.length > 0 ? t.tags : ['Core', `${importanceNum}% Importance`],
              completed: false,
              scoreYieldPoints: Number(t.scoreYieldPoints) || Math.round(importanceNum * 0.2),
              examQuestionType: t.examQuestionType || 'Exam Concept',
              keyTakeaway: t.keyTakeaway || t.reason || `${t.name}: Core exam priority concept.`,
              flashQuestion: t.flashQuestion || {
                question: `What is the key principle of ${t.name}?`,
                answer: t.reason || `Essential concept extracted from ${t.name}.`,
                trapNote: `Focus on primary definitions and core applications.`
              }
            };
          });

          const scaledTopics = scaleTopicsForRemainingTime(mappedTopics, exactHoursRemaining);

          successPlan = {
            courseName: subjectName.trim() || data.courseName || selectedFile.name.replace(/\.[^/.]+$/, ''),
            examTitle: `Rescue Plan: ${selectedFile.name}`,
            examDate: `Exam: ${formatExamDate(examDate, ts)} at ${formatExamTime(examTime, ts)}`,
            totalHoursLeft: exactHoursRemaining,
            readinessPercentage: Number(data.readinessPercentage) || 60,
            documentTitle: data.documentTitle || selectedFile.name,
            importantConcepts: Array.isArray(data.importantConcepts) ? data.importantConcepts : [],
            examQuestionAreas: Array.isArray(data.examQuestionAreas) ? data.examQuestionAreas : [],
            isAiGenerated: true,
            topics: scaledTopics,
            examDateInput: examDate,
            examTimeInput: examTime,
            examTargetTimestamp: ts,
            rawDocumentBase64: base64Data,
            rawDocumentMime: selectedFile.type || 'application/pdf'
          };

          break;
        } catch (innerErr) {
          if (attempt >= RETRY_DELAYS.length) throw innerErr;
        }
      }

      if (successPlan) {
        setIsProcessing(false);
        onPlanGenerated(successPlan);
        onClose();
      } else {
        throw new Error('Analysis could not be completed.');
      }
    } catch (err: any) {
      setIsProcessing(false);
      setErrorMessage(err?.message || 'Failed to process document. Please try again.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
      <div 
        className="relative w-full max-w-lg rounded-2xl bg-[#08110F] border border-[#294238] p-6 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept=".pdf,.pptx,.docx,.txt,application/pdf"
          className="hidden"
          onChange={handleFileInputChange}
        />

        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-[#294238]">
          <h3 className="text-lg font-bold text-[#F2F7F3]">
            Upload PDF
          </h3>
          {!isProcessing && (
            <button
              onClick={onClose}
              className="p-1.5 text-[#AEBDB4] hover:text-[#F2F7F3] rounded-lg hover:bg-[#12211D] transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>

        {isProcessing ? (
          <div className="py-12 text-center space-y-3">
            <RefreshCw className="w-8 h-8 text-[#8FD3A2] animate-spin mx-auto" />
            <p className="text-sm font-semibold text-[#F2F7F3]">
              Analyzing document and generating rescue plan...
            </p>
          </div>
        ) : (
          <div className="py-4 space-y-4">
            {errorMessage && (
              <div className="p-3 rounded-lg bg-[#F29B9B]/15 border border-[#F29B9B]/30 flex items-center gap-2 text-xs text-[#F29B9B]">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{errorMessage}</span>
              </div>
            )}

            {/* 1. File Upload Box (drag and drop / browse) */}
            <div
              id="upload-dropzone-box"
              onClick={() => fileInputRef.current?.click()}
              onDragOver={(e) => {
                e.preventDefault();
                setIsDragging(true);
              }}
              onDragLeave={() => setIsDragging(false)}
              onDrop={(e) => {
                e.preventDefault();
                setIsDragging(false);
                if (e.dataTransfer.files?.[0]) {
                  processFile(e.dataTransfer.files[0]);
                }
              }}
              className={`p-6 rounded-xl border-2 border-dashed text-center cursor-pointer transition-colors ${
                isDragging
                  ? 'border-[#8FD3A2] bg-[#172A24]'
                  : selectedFile
                  ? 'border-[#8FD3A2]/50 bg-[#12211D]'
                  : 'border-[#294238] bg-[#0D1916] hover:bg-[#12211D] hover:border-[#8FD3A2]/40'
              }`}
            >
              {selectedFile ? (
                <div className="flex items-center justify-center gap-2 text-[#9FE2B0]">
                  <CheckCircle2 className="w-5 h-5 text-[#9FE2B0]" />
                  <span className="text-sm font-semibold text-[#F2F7F3] truncate max-w-xs">
                    {selectedFile.name}
                  </span>
                </div>
              ) : (
                <div className="space-y-1">
                  <UploadCloud className="w-8 h-8 text-[#8FD3A2] mx-auto mb-2" />
                  <p className="text-sm font-semibold text-[#F2F7F3]">
                    Drag and drop PDF here, or click to browse
                  </p>
                  <p className="text-xs text-[#7F9188]">
                    Supports PDF documents
                  </p>
                </div>
              )}
            </div>

            {/* 2. Subject Name Input */}
            <div>
              <label htmlFor="subject-name-input" className="block text-xs font-semibold text-[#AEBDB4] mb-1.5">
                Subject Name
              </label>
              <input
                id="subject-name-input"
                type="text"
                value={subjectName}
                onChange={(e) => setSubjectName(e.target.value)}
                placeholder="e.g. Operating Systems, Chemistry, Macroeconomics"
                className="w-full px-3.5 py-2.5 rounded-xl bg-[#0D1916] border border-[#294238] text-sm text-[#F2F7F3] placeholder-[#7F9188] focus:outline-none focus:border-[#8FD3A2]"
              />
            </div>

            {/* 3. Exam Date and Time Selector */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label htmlFor="exam-date-input" className="block text-xs font-semibold text-[#AEBDB4] mb-1.5 flex items-center gap-1">
                  <Calendar className="w-3.5 h-3.5 text-[#8FD3A2]" />
                  <span>Exam Date</span>
                </label>
                <input
                  id="exam-date-input"
                  type="date"
                  value={examDate}
                  onChange={(e) => setExamDate(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-[#0D1916] border border-[#294238] text-sm text-[#F2F7F3] focus:outline-none focus:border-[#8FD3A2] [color-scheme:dark]"
                  required
                />
              </div>

              <div>
                <label htmlFor="exam-time-input" className="block text-xs font-semibold text-[#AEBDB4] mb-1.5 flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5 text-[#8FD3A2]" />
                  <span>Exam Time</span>
                </label>
                <input
                  id="exam-time-input"
                  type="time"
                  value={examTime}
                  onChange={(e) => setExamTime(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-[#0D1916] border border-[#294238] text-sm text-[#F2F7F3] focus:outline-none focus:border-[#8FD3A2] [color-scheme:dark]"
                  required
                />
              </div>
            </div>

            {/* 4. Generate Rescue Plan Button */}
            <div className="pt-2">
              <button
                id="generate-rescue-plan-btn"
                type="button"
                onClick={handleGenerate}
                className="w-full py-3 rounded-xl text-sm font-bold text-[#08110F] bg-[#BFE8C8] hover:bg-[#D9F3DE] transition-colors flex items-center justify-center gap-2 cursor-pointer"
              >
                <span>Generate Rescue Plan</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
