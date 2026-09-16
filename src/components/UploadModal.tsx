import React, { useState, useRef, useEffect } from 'react';
import { 
  X, 
  UploadCloud, 
  FileText, 
  Check, 
  Sparkles, 
  Clock, 
  CheckCircle2, 
  FolderOpen,
  AlertCircle,
  Loader2,
  Cpu,
  RefreshCw,
  Calendar
} from 'lucide-react';
import { ExamRescuePlan, StudyTopic, GeminiAnalysisResponse } from '../types';
import { INITIAL_RESCUE_PLAN, ALTERNATIVE_PRESETS } from '../data/mockData';
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

interface SelectedFileInfo {
  name: string;
  size: number;
  formattedSize: string;
  type: string;
  typeLabel: string;
  isSample?: boolean;
  presetKey?: string;
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
  const [selectedFileInfo, setSelectedFileInfo] = useState<SelectedFileInfo | null>(null);
  const [subjectName, setSubjectName] = useState<string>('CS 201: Data Structures');
  
  // Dynamic Exam Date & Time configuration (replaces hardcoded time)
  const defaultSetting = getDefaultExamDateTime();
  const [examDate, setExamDate] = useState<string>(currentDateInput || defaultSetting.date);
  const [examTime, setExamTime] = useState<string>(currentTimeInput || defaultSetting.time);
  const [examTimeError, setExamTimeError] = useState<string | null>(null);

  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [loadingPhase, setLoadingPhase] = useState<number>(0);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [retryAttempt, setRetryAttempt] = useState<number>(0);
  const [retryStatusText, setRetryStatusText] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      if (currentDateInput) setExamDate(currentDateInput);
      if (currentTimeInput) setExamTime(currentTimeInput);
      setExamTimeError(null);
      setErrorMessage(null);
    }
  }, [isOpen, currentDateInput, currentTimeInput]);

  if (!isOpen) return null;

  const targetTs = parseExamDateTime(examDate, examTime);
  const remainingCalc = targetTs ? calculateRemainingTime(targetTs) : null;
  const isPastTime = remainingCalc ? remainingCalc.isPassed : false;

  const sampleFiles = [
    { 
      name: 'CS201_BinaryTrees_Lecture_Final.pdf', 
      size: '4.2 MB', 
      sizeBytes: 4404019, 
      pages: '78 slides', 
      subject: 'CS 201: Data Structures',
      presetKey: 'cs'
    },
    { 
      name: 'CHEM220_Reaction_Mechanisms.pdf', 
      size: '6.1 MB', 
      sizeBytes: 6396313, 
      pages: '112 slides', 
      subject: 'CHEM 220: Organic Chemistry',
      presetKey: 'chem'
    },
    { 
      name: 'BIO101_Cell_Respiration_Guide.pdf', 
      size: '3.8 MB', 
      sizeBytes: 3984588, 
      pages: '64 slides', 
      subject: 'BIO 101: Cell Biology',
      presetKey: 'bio'
    }
  ];

  const getFileTypeLabel = (file: { name: string; type?: string }): string => {
    const ext = file.name.split('.').pop()?.toLowerCase();
    if (ext === 'pdf' || file.type === 'application/pdf') return 'PDF Document';
    if (ext === 'pptx' || ext === 'ppt') return 'PowerPoint Presentation';
    if (ext === 'docx' || ext === 'doc') return 'Word Document';
    if (ext === 'txt' || file.type === 'text/plain') return 'Plain Text Document';
    if (ext === 'png' || file.type === 'image/png') return 'PNG Image';
    if (ext === 'jpg' || ext === 'jpeg' || file.type === 'image/jpeg') return 'JPEG Image';
    return file.type || (ext ? `${ext.toUpperCase()} File` : 'Document');
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 B';
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  };

  const processSelectedFile = (file: File) => {
    setSelectedFile(file);
    setSelectedFileInfo({
      name: file.name,
      size: file.size,
      formattedSize: formatFileSize(file.size),
      type: file.type || 'application/pdf',
      typeLabel: getFileTypeLabel(file),
      isSample: false
    });
    setErrorMessage(null);

    const cleanName = file.name
      .replace(/\.[^/.]+$/, '')
      .replace(/[_-]/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
    if (cleanName) {
      setSubjectName(cleanName);
    }
  };

  const handleUploadAreaClick = () => {
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
      fileInputRef.current.click();
    }
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      processSelectedFile(e.target.files[0]);
    }
  };

  const handleDragEnter = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.currentTarget.contains(e.relatedTarget as Node)) return;
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      processSelectedFile(e.dataTransfer.files[0]);
    }
  };

  const handleSelectSample = (file: typeof sampleFiles[0]) => {
    setSelectedFile(null); // Explicitly mark as sample preset
    setSelectedFileInfo({
      name: file.name,
      size: file.sizeBytes,
      formattedSize: file.size,
      type: 'application/pdf',
      typeLabel: 'PDF Document (Demo Preset)',
      isSample: true,
      presetKey: file.presetKey
    });
    setSubjectName(file.subject);
    setErrorMessage(null);
  };

  // Convert browser File to base64 string
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

  const handleSetExamTimeOnly = () => {
    setExamTimeError(null);
    setErrorMessage(null);

    if (!examDate || !examTime) {
      setExamTimeError('Please select both an exam date and time.');
      return;
    }

    const ts = parseExamDateTime(examDate, examTime);
    if (!ts || isNaN(ts) || ts <= Date.now()) {
      setExamTimeError('Exam time has passed. Please choose a future exam time.');
      return;
    }

    const calc = calculateRemainingTime(ts);
    const hrs = Math.max(0.2, calc.hoursDecimal);

    saveExamDateTime({
      date: examDate,
      time: examTime,
      timestamp: ts
    });

    if (onExamTimeSet) {
      onExamTimeSet(examDate, examTime, ts, hrs);
    }

    onClose();
    const el = document.getElementById('dashboard');
    if (el) el.scrollIntoView({ behavior: 'smooth' });
  };

  const handleGenerate = async () => {
    setExamTimeError(null);
    setErrorMessage(null);

    // Requirement 9: Do not allow the user to start Rescue Mode without selecting a valid future exam date and time.
    if (!examDate || !examTime) {
      setExamTimeError('Exam time has passed. Please choose a future exam time.');
      setErrorMessage('Exam time has passed. Please choose a future exam time.');
      return;
    }

    const ts = parseExamDateTime(examDate, examTime);
    if (!ts || isNaN(ts) || ts <= Date.now()) {
      setExamTimeError('Exam time has passed. Please choose a future exam time.');
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

    if (!selectedFileInfo) {
      handleUploadAreaClick();
      return;
    }

    setIsProcessing(true);
    setLoadingPhase(0); // Phase 0: READING YOUR PDF...
    setErrorMessage(null);
    setRetryStatusText(null);
    setRetryAttempt(0);

    // Timed progression through the initial visual loading states
    const timer1 = setTimeout(() => setLoadingPhase(1), 1000); // Finding topics...
    const timer2 = setTimeout(() => setLoadingPhase(2), 2200); // Analyzing important concepts...
    const timer3 = setTimeout(() => setLoadingPhase(3), 3500); // Building your rescue plan...

    try {
      // 1. If user selected a REAL file from their computer, send actual PDF to Gemini API!
      if (selectedFile) {
        const base64Data = await readFileAsBase64(selectedFile);
        // Exponential backoff delays:
        // attempt 1: wait 1 second (1000ms)
        // attempt 2: wait 2 seconds (2000ms)
        // attempt 3: wait 4 seconds (4000ms)
        // attempt 4: wait 8 seconds (8000ms)
        // attempt 5: wait 12 seconds (12000ms)
        const RETRY_DELAYS = [1000, 2000, 4000, 8000, 12000];
        let successPlan: ExamRescuePlan | null = null;
        let lastError: any = null;

        for (let attempt = 0; attempt <= RETRY_DELAYS.length; attempt++) {
          try {
            if (attempt > 0) {
              setRetryAttempt(attempt);
              const waitMs = RETRY_DELAYS[attempt - 1];
              console.log(`[Gemini Retry] Attempt ${attempt} of 5. Waiting ${waitMs}ms...`);
              await new Promise((resolve) => setTimeout(resolve, waitMs));
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
              const status = response.status;
              const errData = await response.json().catch(() => ({}));
              const errMsg = typeof errData?.error === 'string' ? errData.error : '';
              const isRetryable =
                status === 503 ||
                status === 429 ||
                status === 502 ||
                status === 504 ||
                status === 500 ||
                errData?.code === 503 ||
                errData?.code === 429 ||
                errData?.retryable === true ||
                errMsg.includes('503') ||
                errMsg.includes('UNAVAILABLE') ||
                errMsg.includes('temporarily busy') ||
                errMsg.includes('high demand') ||
                errMsg.includes('RESOURCE_EXHAUSTED') ||
                errMsg.includes('Resource has been exhausted') ||
                errMsg.includes('busy');

              if (isRetryable && attempt < RETRY_DELAYS.length) {
                setRetryAttempt(attempt + 1);
                continue;
              }

              throw new Error(isRetryable ? 'BUSY' : (errMsg || 'Server error during analysis.'));
            }

            const data: GeminiAnalysisResponse = await response.json();

            if (!data || !Array.isArray(data.topics) || data.topics.length === 0) {
              if (attempt < RETRY_DELAYS.length) {
                setRetryAttempt(attempt + 1);
                continue;
              }
              throw new Error('No topics extracted from document.');
            }

            // Convert Gemini structured response to ExamRescuePlan
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
                tags: Array.isArray(t.tags) && t.tags.length > 0 
                  ? t.tags 
                  : [t.difficulty || 'Core', `${importanceNum}% Importance`],
                completed: false,
                scoreYieldPoints: Number(t.scoreYieldPoints) || Math.round(importanceNum * 0.2),
                examQuestionType: t.examQuestionType || 'High-Yield Exam Concept',
                keyTakeaway: t.keyTakeaway || t.reason || `${t.name}: Core exam priority concept.`,
                flashQuestion: t.flashQuestion || {
                  question: `What is the key principle or definition of ${t.name}?`,
                  answer: t.reason || `Essential concept extracted from ${t.name}.`,
                  trapNote: `Do not confuse this with adjacent subtopics in ${data.documentTitle || selectedFile.name}.`
                }
              };
            });

            // Scale topics according to available time budget
            const scaledTopics = scaleTopicsForRemainingTime(mappedTopics, exactHoursRemaining);

            successPlan = {
              courseName: data.courseName || subjectName || selectedFile.name.replace(/\.[^/.]+$/, ''),
              examTitle: `Emergency Rescue Plan: ${selectedFile.name}`,
              examDate: `Exam: ${formatExamDate(examDate, ts)} at ${formatExamTime(examTime, ts)}`,
              totalHoursLeft: exactHoursRemaining,
              readinessPercentage: Number(data.readinessPercentage) || 58,
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

            // Analysis succeeded!
            break;
          } catch (err: any) {
            lastError = err;
            const errMsg = typeof err?.message === 'string' ? err.message : '';
            const isRetryable =
              errMsg === 'BUSY' ||
              errMsg.includes('503') ||
              errMsg.includes('UNAVAILABLE') ||
              errMsg.includes('busy') ||
              errMsg.includes('Failed to fetch') ||
              errMsg.includes('fetch failed') ||
              errMsg.includes('NetworkError') ||
              errMsg.includes('timeout') ||
              errMsg.includes('Network timeout');

            if (isRetryable && attempt < RETRY_DELAYS.length) {
              setRetryAttempt(attempt + 1);
            } else {
              break;
            }
          }
        }

        clearTimeout(timer1);
        clearTimeout(timer2);
        clearTimeout(timer3);

        if (successPlan) {
          // Brief delay to let the user see the plan finishing
          setTimeout(() => {
            setIsProcessing(false);
            setRetryStatusText(null);
            setRetryAttempt(0);
            onPlanGenerated(successPlan!);
            onClose();
            const el = document.getElementById('dashboard');
            if (el) el.scrollIntoView({ behavior: 'smooth' });
          }, 500);
        } else {
          // All retries failed - display friendly error and preserve the uploaded file for "Try Again"
          setIsProcessing(false);
          setRetryStatusText(null);
          setRetryAttempt(0);
          setErrorMessage('AI is temporarily unavailable. Please try Analyze again.');
        }

      } else {
        // 2. Demo Preset flow (ONLY used when user explicitly clicks "Try Demo")
        setTimeout(() => {
          let basePlan = INITIAL_RESCUE_PLAN;
          if (selectedFileInfo.presetKey === 'chem') {
            basePlan = ALTERNATIVE_PRESETS.chem || INITIAL_RESCUE_PLAN;
          } else if (selectedFileInfo.presetKey === 'bio') {
            basePlan = ALTERNATIVE_PRESETS.bio || INITIAL_RESCUE_PLAN;
          }

          const generatedPlan: ExamRescuePlan = {
            ...basePlan,
            courseName: subjectName || selectedFileInfo.name.replace(/\.[^/.]+$/, ''),
            examTitle: `Emergency Rescue Plan: ${selectedFileInfo.name}`,
            examDate: `Exam: ${formatExamDate(examDate, ts)} at ${formatExamTime(examTime, ts)}`,
            totalHoursLeft: exactHoursRemaining,
            documentTitle: selectedFileInfo.name,
            isAiGenerated: false,
            examDateInput: examDate,
            examTimeInput: examTime,
            examTargetTimestamp: ts,
            topics: scaleTopicsForRemainingTime(basePlan.topics, exactHoursRemaining)
          };

          setIsProcessing(false);
          onPlanGenerated(generatedPlan);
          onClose();
          const el = document.getElementById('dashboard');
          if (el) el.scrollIntoView({ behavior: 'smooth' });
        }, 1500);
      }
    } catch (err: any) {
      clearTimeout(timer1);
      clearTimeout(timer2);
      clearTimeout(timer3);
      setIsProcessing(false);
      setRetryStatusText(null);
      setRetryAttempt(0);
      // Friendly error with Try Again
      setErrorMessage('AI is temporarily unavailable. Please try Analyze again.');
      console.error('Error during AI analysis:', err);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div 
        className="relative w-full max-w-xl rounded-3xl backdrop-blur-2xl bg-[#0d142d] border border-indigo-500/40 p-6 sm:p-8 shadow-[0_25px_80px_rgba(0,0,0,0.8)] overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Glow accent */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-purple-600/15 blur-3xl rounded-full pointer-events-none -z-10" />

        {/* Real hidden file input */}
        <input
          ref={fileInputRef}
          id="lecture-notes-file-input"
          type="file"
          accept=".pdf,.pptx,.docx,.txt,.png,.jpg,.jpeg,application/pdf,application/vnd.openxmlformats-officedocument.presentationml.presentation,application/vnd.openxmlformats-officedocument.wordprocessingml.document,text/plain,image/png,image/jpeg"
          className="hidden"
          disabled={false}
          onChange={handleFileInputChange}
        />

        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-purple-500/20 border border-purple-500/40 flex items-center justify-center text-purple-300">
              <UploadCloud className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-white font-display">
                Upload Notes & Generate Rescue Plan
              </h3>
              <p className="text-xs text-slate-400">
                Gemini AI analyzes your real document and builds your personalized cram sequence.
              </p>
            </div>
          </div>
          {!isProcessing && (
            <button
              id="close-upload-modal-btn"
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800/80 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>

        {/* Analysis / Loading Screen while Gemini processes the PDF */}
        {isProcessing ? (
          <div className="py-8 space-y-6 text-center animate-in fade-in duration-300">
            {/* Pulsating Document Scanner Visual */}
            <div className="relative w-20 h-20 mx-auto">
              <div className="absolute inset-0 rounded-2xl bg-gradient-to-tr from-purple-600/30 to-indigo-600/30 blur-lg animate-pulse" />
              <div className="relative w-full h-full rounded-2xl bg-[#121c44] border-2 border-indigo-400/60 flex items-center justify-center text-indigo-300 shadow-[0_0_30px_rgba(99,102,241,0.4)]">
                <FileText className="w-9 h-9 text-indigo-300" />
                <div className="absolute bottom-2 right-2">
                  <Sparkles className="w-4 h-4 text-purple-300 animate-spin" />
                </div>
              </div>
            </div>

            {/* Primary Headline & Busy Retry Notification */}
            <div>
              <h3 className="text-xl sm:text-2xl font-black text-white tracking-wider font-display uppercase">
                {retryAttempt > 0 ? 'AI is processing your document...' : 'READING YOUR PDF...'}
              </h3>
              {retryAttempt > 0 ? (
                <div className="mt-3 flex flex-col items-center gap-1.5 animate-pulse">
                  <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/40 text-xs sm:text-sm font-semibold shadow-sm">
                    <RefreshCw className="w-3.5 h-3.5 animate-spin text-amber-400" />
                    <span>Retrying automatically if the AI service is busy.</span>
                  </div>
                  <span className="text-[11px] text-amber-300/80 font-mono">Attempt {retryAttempt} of 5</span>
                </div>
              ) : (
                <p className="text-xs sm:text-sm text-indigo-200 mt-1 font-mono">
                  {selectedFileInfo?.name}
                </p>
              )}
            </div>

            {/* Requested Sequential Progress Checklist */}
            <div className="max-w-md mx-auto space-y-3 text-left p-4 rounded-2xl bg-slate-900/80 border border-slate-800">
              {/* Step 1 */}
              <div className="flex items-center gap-3">
                {loadingPhase > 0 ? (
                  <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
                ) : (
                  <Loader2 className="w-5 h-5 text-purple-400 animate-spin shrink-0" />
                )}
                <span className={`text-xs sm:text-sm font-medium ${loadingPhase >= 0 ? 'text-white' : 'text-slate-500'}`}>
                  {loadingPhase > 0 ? 'Document parsed by Gemini AI' : 'Reading document structure & lecture content...'}
                </span>
              </div>

              {/* Step 2: Finding topics... */}
              <div className="flex items-center gap-3">
                {loadingPhase > 1 ? (
                  <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
                ) : loadingPhase === 1 ? (
                  <Loader2 className="w-5 h-5 text-purple-400 animate-spin shrink-0" />
                ) : (
                  <div className="w-5 h-5 rounded-full border border-slate-700 shrink-0" />
                )}
                <span className={`text-xs sm:text-sm font-medium ${loadingPhase >= 1 ? 'text-white' : 'text-slate-500'}`}>
                  Finding topics...
                </span>
              </div>

              {/* Step 3: Analyzing important concepts... */}
              <div className="flex items-center gap-3">
                {loadingPhase > 2 ? (
                  <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
                ) : loadingPhase === 2 ? (
                  <Loader2 className="w-5 h-5 text-purple-400 animate-spin shrink-0" />
                ) : (
                  <div className="w-5 h-5 rounded-full border border-slate-700 shrink-0" />
                )}
                <span className={`text-xs sm:text-sm font-medium ${loadingPhase >= 2 ? 'text-white' : 'text-slate-500'}`}>
                  Analyzing important concepts...
                </span>
              </div>

              {/* Step 4: Building your rescue plan... */}
              <div className="flex items-center gap-3">
                {loadingPhase >= 3 ? (
                  <Loader2 className="w-5 h-5 text-emerald-400 animate-spin shrink-0" />
                ) : (
                  <div className="w-5 h-5 rounded-full border border-slate-700 shrink-0" />
                )}
                <span className={`text-xs sm:text-sm font-medium ${loadingPhase >= 3 ? 'text-emerald-300 font-semibold' : 'text-slate-500'}`}>
                  Building your rescue plan...
                </span>
              </div>
            </div>

            <div className="flex items-center justify-center gap-2 text-[11px] text-slate-400">
              <Cpu className="w-3.5 h-3.5 text-purple-400" />
              <span>Analyzing using Google Gemini multimodal intelligence</span>
            </div>
          </div>
        ) : (
          /* Normal Upload Modal Configuration Form */
          <div className="py-5 space-y-5">
            {/* Friendly Notice / Error Banner */}
            {errorMessage && (
              <div className="p-4 rounded-2xl bg-amber-950/60 border border-amber-500/50 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-amber-200 text-sm animate-in fade-in shadow-lg">
                <div className="flex items-start gap-3">
                  <AlertCircle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-bold text-white block text-sm">{errorMessage}</span>
                    {selectedFileInfo && (
                      <span className="text-xs text-amber-300/80 mt-0.5 block">
                        File retained: <span className="font-semibold text-white">{selectedFileInfo.name}</span>
                      </span>
                    )}
                  </div>
                </div>
                <button
                  id="modal-try-again-btn"
                  type="button"
                  onClick={handleGenerate}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-white bg-gradient-to-r from-amber-600 to-amber-500 hover:from-amber-500 hover:to-amber-400 border border-amber-400/40 shadow-[0_0_15px_rgba(245,158,11,0.3)] flex items-center justify-center gap-1.5 cursor-pointer transition-all shrink-0"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  <span>Try Again</span>
                </button>
              </div>
            )}

            {/* File Upload Drop Area */}
            {!selectedFileInfo ? (
              <div
                id="upload-dropzone-area"
                onClick={handleUploadAreaClick}
                onDragEnter={handleDragEnter}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    handleUploadAreaClick();
                  }
                }}
                className={`p-6 sm:p-7 rounded-2xl border-2 border-dashed transition-all cursor-pointer group text-center select-none ${
                  isDragging
                    ? 'border-indigo-400 bg-indigo-950/60 shadow-[0_0_25px_rgba(99,102,241,0.3)] scale-[1.01]'
                    : 'border-indigo-500/40 hover:border-indigo-400/80 bg-slate-900/60 hover:bg-slate-900/90 shadow-inner'
                }`}
              >
                <div className="w-12 h-12 mx-auto mb-3 rounded-2xl bg-gradient-to-tr from-indigo-500/20 to-purple-500/20 border border-indigo-500/30 flex items-center justify-center text-indigo-300 group-hover:scale-110 transition-transform shadow-md">
                  <UploadCloud className="w-6 h-6 text-indigo-400" />
                </div>
                <p className="text-sm sm:text-base font-bold text-white font-display">
                  Drop lecture slides, syllabus, or photos here
                </p>
                <p className="text-xs text-slate-300 mt-1">
                  Supports PDF, PPTX, DOCX, TXT, PNG, JPG, or JPEG
                </p>
                <div className="mt-3.5 inline-flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-indigo-950/80 border border-indigo-500/30 text-indigo-300 text-xs font-semibold group-hover:bg-indigo-900/70 group-hover:border-indigo-400/50 transition-colors">
                  <FolderOpen className="w-3.5 h-3.5 text-indigo-400" />
                  <span>Click anywhere to browse files</span>
                </div>
              </div>
            ) : (
              <div
                id="upload-dropzone-area"
                onClick={handleUploadAreaClick}
                onDragEnter={handleDragEnter}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    handleUploadAreaClick();
                  }
                }}
                className="relative p-5 sm:p-6 rounded-2xl border-2 border-emerald-500/50 hover:border-emerald-400/80 bg-emerald-950/20 hover:bg-emerald-950/30 transition-all cursor-pointer shadow-[0_0_30px_rgba(16,185,129,0.15)] group"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="flex items-center gap-3.5 min-w-0">
                    <div className="w-11 h-11 rounded-2xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400 shrink-0 shadow-[0_0_15px_rgba(16,185,129,0.3)]">
                      <CheckCircle2 className="w-6 h-6 text-emerald-400" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-xs font-bold text-emerald-400 bg-emerald-950/80 px-2.5 py-0.5 rounded-full border border-emerald-500/30 flex items-center gap-1">
                          <Check className="w-3 h-3 stroke-[3]" /> File Selected
                        </span>
                        <span className="text-[11px] font-mono text-slate-400">
                          Ready for Analysis
                        </span>
                      </div>
                      <p className="text-sm sm:text-base font-bold text-white truncate mt-1" title={selectedFileInfo.name}>
                        {selectedFileInfo.name}
                      </p>
                      <div className="flex items-center gap-3 text-xs text-slate-300 mt-0.5">
                        <span className="flex items-center gap-1 text-slate-300 font-medium">
                          <FileText className="w-3.5 h-3.5 text-indigo-400" />
                          {selectedFileInfo.typeLabel}
                        </span>
                        <span className="text-slate-500">•</span>
                        <span className="font-mono text-purple-300 font-semibold">
                          {selectedFileInfo.formattedSize}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleUploadAreaClick();
                      }}
                      className="px-3 py-1.5 rounded-lg text-xs font-semibold text-slate-300 hover:text-white bg-slate-800/80 hover:bg-slate-700/80 border border-slate-700 transition-colors cursor-pointer"
                    >
                      Change File
                    </button>
                  </div>
                </div>

                {/* "Analyze with AI" primary trigger inside the card */}
                <div className="mt-4 pt-3.5 border-t border-emerald-500/20 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <p className="text-xs text-slate-400">
                    Click anywhere to choose another file, or analyze now:
                  </p>
                  <button
                    id="analyze-with-ai-btn"
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleGenerate();
                    }}
                    className="px-5 py-2.5 rounded-xl text-xs sm:text-sm font-bold text-white bg-gradient-to-r from-emerald-500 via-indigo-600 to-purple-600 hover:from-emerald-400 hover:to-purple-500 shadow-[0_0_20px_rgba(16,185,129,0.35)] flex items-center justify-center gap-2 transition-all cursor-pointer shrink-0"
                  >
                    <Sparkles className="w-4 h-4 text-yellow-300 fill-yellow-300" />
                    <span>Analyze with AI</span>
                  </button>
                </div>
              </div>
            )}

            {/* Quick Demo Sample Selector */}
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">
                Or explore a demo dataset:
              </label>
              <div className="space-y-2">
                {sampleFiles.map((file, idx) => {
                  const isSelected = selectedFileInfo?.name === file.name;
                  return (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => handleSelectSample(file)}
                      className={`w-full flex items-center justify-between p-2.5 rounded-xl text-left text-xs transition-all border cursor-pointer ${
                        isSelected
                          ? 'bg-indigo-950/70 border-indigo-500 text-white shadow-sm'
                          : 'bg-slate-900/60 border-slate-800 text-slate-300 hover:bg-slate-800/60 hover:text-white'
                      }`}
                    >
                      <div className="flex items-center gap-2.5">
                        <FileText className={`w-4 h-4 ${isSelected ? 'text-indigo-400' : 'text-slate-500'}`} />
                        <div>
                          <span className="font-semibold block">{file.name}</span>
                          <span className="text-[10px] text-slate-400">{file.subject} • {file.pages}</span>
                        </div>
                      </div>
                      {isSelected && (
                        <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                      )}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* "WHEN IS YOUR EXAM?" Section */}
            <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-br from-indigo-950/60 via-slate-900/80 to-slate-900/90 border border-indigo-500/40 shadow-lg">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-indigo-400" />
                  <span className="text-xs font-bold uppercase tracking-wider text-white">
                    WHEN IS YOUR EXAM?
                  </span>
                </div>
                {targetTs && !isPastTime && remainingCalc && (
                  <span className="text-xs font-mono font-bold text-emerald-300 bg-emerald-950/80 px-2.5 py-0.5 rounded-full border border-emerald-500/30">
                    {remainingCalc.hours}h {remainingCalc.minutes}m left
                  </span>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-3">
                <div>
                  <label htmlFor="modal-exam-date" className="block text-xs font-medium text-slate-300 mb-1 flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5 text-indigo-400" />
                    <span>Exam Date</span>
                  </label>
                  <input
                    id="modal-exam-date"
                    type="date"
                    value={examDate}
                    onChange={(e) => {
                      setExamDate(e.target.value);
                      setExamTimeError(null);
                    }}
                    className="w-full px-3 py-2 rounded-xl bg-slate-900/90 border border-indigo-500/40 hover:border-indigo-400 text-white text-sm focus:outline-none focus:border-indigo-400 focus:ring-1 focus:ring-indigo-400 [color-scheme:dark] transition-colors cursor-pointer"
                    required
                  />
                </div>

                <div>
                  <label htmlFor="modal-exam-time" className="block text-xs font-medium text-slate-300 mb-1 flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 text-indigo-400" />
                    <span>Exam Time</span>
                  </label>
                  <input
                    id="modal-exam-time"
                    type="time"
                    value={examTime}
                    onChange={(e) => {
                      setExamTime(e.target.value);
                      setExamTimeError(null);
                    }}
                    className="w-full px-3 py-2 rounded-xl bg-slate-900/90 border border-indigo-500/40 hover:border-indigo-400 text-white text-sm focus:outline-none focus:border-indigo-400 focus:ring-1 focus:ring-indigo-400 [color-scheme:dark] transition-colors cursor-pointer"
                    required
                  />
                </div>
              </div>

              {examTimeError && (
                <div className="mb-3 p-2.5 rounded-xl bg-red-950/70 border border-red-500/50 flex items-center gap-2 text-red-200 text-xs animate-in fade-in">
                  <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
                  <span className="font-medium">{examTimeError}</span>
                </div>
              )}

              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 pt-2.5 border-t border-slate-800/80">
                <span className="text-[11px] text-slate-400 truncate">
                  {targetTs && !isPastTime
                    ? `Exam: ${formatExamDate(examDate, targetTs)} at ${formatExamTime(examTime, targetTs)}`
                    : 'Select a future exam date and time'}
                </span>
                <button
                  id="modal-set-exam-time-btn"
                  type="button"
                  onClick={handleSetExamTimeOnly}
                  className="px-3.5 py-1.5 rounded-lg text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-500 border border-indigo-400/40 shadow-sm flex items-center justify-center gap-1.5 cursor-pointer transition-all shrink-0"
                >
                  <Clock className="w-3.5 h-3.5 text-indigo-200" />
                  <span>Set Exam Time</span>
                </button>
              </div>
            </div>

            {/* Footer Buttons */}
            <div className="pt-2 border-t border-slate-800 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2.5 rounded-xl text-sm font-medium text-slate-300 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                id="modal-generate-plan-btn"
                type="button"
                onClick={handleGenerate}
                className="px-6 py-2.5 rounded-xl text-sm font-bold text-white bg-gradient-to-r from-purple-600 via-indigo-600 to-blue-600 hover:from-purple-500 hover:to-blue-500 shadow-[0_0_20px_rgba(99,102,241,0.4)] transition-all flex items-center gap-2 cursor-pointer"
              >
                <Sparkles className="w-4 h-4 text-yellow-300" />
                <span>
                  {errorMessage && selectedFileInfo
                    ? 'Try Again'
                    : selectedFileInfo
                    ? 'Analyze with AI'
                    : 'Select File to Analyze'}
                </span>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
