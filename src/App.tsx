import React, { useState, useMemo } from 'react';
import { Navbar } from './components/Navbar';
import { Hero } from './components/Hero';
import { RescueDashboardCard } from './components/RescueDashboardCard';
import { HowItWorks } from './components/HowItWorks';
import { Footer } from './components/Footer';
import { UploadModal } from './components/UploadModal';
import { TopicDetailModal } from './components/TopicDetailModal';
import { EditExamTimeModal } from './components/EditExamTimeModal';
import { RescueQuizModal } from './components/RescueQuizModal';
import { CrashLessonModal } from './components/CrashLessonModal';
import { INITIAL_RESCUE_PLAN, ALTERNATIVE_PRESETS } from './data/mockData';
import { ExamRescuePlan, StudyTopic, QuestionAttempt } from './types';
import { 
  getDefaultExamDateTime, 
  formatExamDate, 
  formatExamTime, 
  calculateRemainingTime, 
  scaleTopicsForRemainingTime 
} from './utils/examTime';
import { 
  calculateTopicPerformance, 
  rescheduleTopicInPlan 
} from './utils/rescueQuiz';

export default function App() {
  const [activePlan, setActivePlan] = useState<ExamRescuePlan>(() => {
    const defaultSetting = getDefaultExamDateTime();
    const hours = Math.max(0.2, calculateRemainingTime(defaultSetting.timestamp).hoursDecimal);
    const formattedDateStr = `Exam: ${formatExamDate(defaultSetting.date, defaultSetting.timestamp)} at ${formatExamTime(defaultSetting.time, defaultSetting.timestamp)}`;
    return {
      ...INITIAL_RESCUE_PLAN,
      examDateInput: defaultSetting.date,
      examTimeInput: defaultSetting.time,
      examTargetTimestamp: defaultSetting.timestamp,
      examDate: formattedDateStr,
      totalHoursLeft: hours,
      topics: scaleTopicsForRemainingTime(INITIAL_RESCUE_PLAN.topics, hours)
    };
  });

  const [activePresetKey, setActivePresetKey] = useState<string>('cs');
  const [isUploadModalOpen, setIsUploadModalOpen] = useState<boolean>(false);
  const [isEditExamTimeModalOpen, setIsEditExamTimeModalOpen] = useState<boolean>(false);
  const [selectedTopic, setSelectedTopic] = useState<StudyTopic | null>(null);
  const [masteredTopicIds, setMasteredTopicIds] = useState<Set<string>>(new Set());
  const [activeNavSection, setActiveNavSection] = useState<string>('hero');

  // Quiz, Crash Lesson & Performance Tracking State
  const [isQuizModalOpen, setIsQuizModalOpen] = useState<boolean>(false);
  const [quizWeakTopicOnly, setQuizWeakTopicOnly] = useState<string | null>(null);
  const [isCrashLessonModalOpen, setIsCrashLessonModalOpen] = useState<boolean>(false);
  const [crashLessonTopicName, setCrashLessonTopicName] = useState<string | null>(null);

  // Performance history stored across the active session
  const [questionAttemptsHistory, setQuestionAttemptsHistory] = useState<QuestionAttempt[]>([]);
  const [rescheduledTopicIds, setRescheduledTopicIds] = useState<Set<string>>(new Set());
  const [improvedTopicIds, setImprovedTopicIds] = useState<Set<string>>(new Set());

  // Topic Performance Map
  const topicPerformanceMap = useMemo(() => {
    return calculateTopicPerformance(
      activePlan.topics, 
      questionAttemptsHistory,
      rescheduledTopicIds,
      improvedTopicIds
    );
  }, [activePlan.topics, questionAttemptsHistory, rescheduledTopicIds, improvedTopicIds]);

  // Detected Weak Topics
  const weakTopics = useMemo(() => {
    return activePlan.topics.filter(t => {
      const perf = topicPerformanceMap[t.name];
      if (t.isWeak || t.status === 'weak') return true;
      if (perf && (perf.status === 'weak' || (perf.wrongCount > 0 && perf.accuracy < 60))) return true;
      return false;
    });
  }, [activePlan.topics, topicPerformanceMap]);

  const handleNavigate = (sectionId: string) => {
    setActiveNavSection(sectionId);
    const element = document.getElementById(sectionId);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const handleSwitchPreset = (presetKey: string) => {
    setActivePresetKey(presetKey);
    if (ALTERNATIVE_PRESETS[presetKey]) {
      const targetSetting = activePlan.examDateInput && activePlan.examTimeInput && activePlan.examTargetTimestamp
        ? { date: activePlan.examDateInput, time: activePlan.examTimeInput, timestamp: activePlan.examTargetTimestamp }
        : getDefaultExamDateTime();

      const hours = Math.max(0.2, calculateRemainingTime(targetSetting.timestamp).hoursDecimal);
      const basePreset = ALTERNATIVE_PRESETS[presetKey];
      setActivePlan({
        ...basePreset,
        examDateInput: targetSetting.date,
        examTimeInput: targetSetting.time,
        examTargetTimestamp: targetSetting.timestamp,
        examDate: `Exam: ${formatExamDate(targetSetting.date, targetSetting.timestamp)} at ${formatExamTime(targetSetting.time, targetSetting.timestamp)}`,
        totalHoursLeft: hours,
        topics: scaleTopicsForRemainingTime(basePreset.topics, hours)
      });
      // Clear previous quiz history when deliberately switching course presets
      setQuestionAttemptsHistory([]);
      setRescheduledTopicIds(new Set());
      setImprovedTopicIds(new Set());
    }
  };

  const handlePlanGenerated = (newPlan: ExamRescuePlan) => {
    setActivePlan(newPlan);
    setActivePresetKey('custom');
    // Fresh session for new uploaded document
    setQuestionAttemptsHistory([]);
    setRescheduledTopicIds(new Set());
    setImprovedTopicIds(new Set());
  };

  const handleExamTimeSet = (dateInput: string, timeInput: string, timestamp: number, hoursRemaining: number) => {
    setActivePlan((prev) => {
      const formattedDateStr = `Exam: ${formatExamDate(dateInput, timestamp)} at ${formatExamTime(timeInput, timestamp)}`;
      const scaledTopics = scaleTopicsForRemainingTime(prev.topics, hoursRemaining);
      return {
        ...prev,
        examDateInput: dateInput,
        examTimeInput: timeInput,
        examTargetTimestamp: timestamp,
        examDate: formattedDateStr,
        totalHoursLeft: hoursRemaining,
        topics: scaledTopics
      };
    });
  };

  const handleToggleMastered = (topicId: string) => {
    setMasteredTopicIds((prev) => {
      const next = new Set(prev);
      if (next.has(topicId)) {
        next.delete(topicId);
      } else {
        next.add(topicId);
      }
      return next;
    });
  };

  // Launch rescue quiz (either all topics or focused re-test)
  const handleStartRescueQuiz = (weakTopicOnly?: string | null) => {
    setQuizWeakTopicOnly(weakTopicOnly || null);
    setIsQuizModalOpen(true);
  };

  // Open 3-Minute Crash Lesson
  const handleOpenCrashLesson = (topicName: string) => {
    setCrashLessonTopicName(topicName);
    setIsCrashLessonModalOpen(true);
  };

  // Launch focused re-test on specific topic
  const handleRetestTopic = (topicName: string) => {
    setQuizWeakTopicOnly(topicName);
    setIsQuizModalOpen(true);
  };

  // Reschedule topic manually from weak topics card
  const handleRescheduleTopic = (topicId: string) => {
    const { updatedPlan, rescheduledTopic } = rescheduleTopicInPlan(activePlan, topicId, 10);
    if (rescheduledTopic) {
      setRescheduledTopicIds((prev) => new Set(prev).add(rescheduledTopic.id));
      setActivePlan(updatedPlan);
    }
  };

  // Record question attempt
  const handleRecordAttempt = (attempt: QuestionAttempt) => {
    setQuestionAttemptsHistory((prev) => [...prev, attempt]);
  };

  const handleMarkRescheduled = (topicId: string) => {
    setRescheduledTopicIds((prev) => new Set(prev).add(topicId));
  };

  const handleMarkImproved = (topicId: string) => {
    setImprovedTopicIds((prev) => new Set(prev).add(topicId));
  };

  return (
    <div className="min-h-screen bg-[#070b19] text-slate-100 flex flex-col selection:bg-purple-600/30 selection:text-purple-200">
      {/* Top Fixed Glow Header */}
      <Navbar
        onUploadClick={() => setIsUploadModalOpen(true)}
        onDemoClick={() => handleNavigate('dashboard')}
        activeSection={activeNavSection}
        onNavigate={handleNavigate}
      />

      {/* Main Content Sections */}
      <main className="flex-1">
        {/* Hero Section */}
        <Hero
          onUploadClick={() => setIsUploadModalOpen(true)}
          onDemoClick={() => handleNavigate('dashboard')}
        />

        {/* Dashboard Preview Card (The Core Deliverable) */}
        <RescueDashboardCard
          plan={activePlan}
          onTopicClick={(topic) => setSelectedTopic(topic)}
          onPlanUpdate={(plan) => setActivePlan(plan)}
          onSwitchPreset={handleSwitchPreset}
          activePresetKey={activePresetKey}
          onOpenEditExamTime={() => setIsEditExamTimeModalOpen(true)}
          onStartRescueQuiz={handleStartRescueQuiz}
          onOpenCrashLesson={handleOpenCrashLesson}
          onRetestTopic={handleRetestTopic}
          onRescheduleTopic={handleRescheduleTopic}
          topicPerformanceMap={topicPerformanceMap}
          weakTopics={weakTopics}
        />

        {/* How Exam Rescue Works Section */}
        <HowItWorks
          onUploadClick={() => setIsUploadModalOpen(true)}
          onDemoClick={() => handleNavigate('dashboard')}
        />
      </main>

      {/* Footer */}
      <Footer
        onUploadClick={() => setIsUploadModalOpen(true)}
        onDemoClick={() => handleNavigate('dashboard')}
        onNavigate={handleNavigate}
      />

      {/* Upload Notes Interactive Modal */}
      <UploadModal
        isOpen={isUploadModalOpen}
        onClose={() => setIsUploadModalOpen(false)}
        onPlanGenerated={handlePlanGenerated}
        currentDateInput={activePlan.examDateInput}
        currentTimeInput={activePlan.examTimeInput}
        onExamTimeSet={handleExamTimeSet}
      />

      {/* Edit Exam Date & Time Modal */}
      <EditExamTimeModal
        isOpen={isEditExamTimeModalOpen}
        onClose={() => setIsEditExamTimeModalOpen(false)}
        currentDateInput={activePlan.examDateInput || ''}
        currentTimeInput={activePlan.examTimeInput || ''}
        onExamTimeSet={handleExamTimeSet}
      />

      {/* Topic Detail & Cheat Sheet Modal */}
      <TopicDetailModal
        topic={selectedTopic}
        onClose={() => setSelectedTopic(null)}
        onMarkMastered={handleToggleMastered}
        isMastered={selectedTopic ? masteredTopicIds.has(selectedTopic.id) : false}
      />

      {/* Adaptive Exam Rescue Quiz Modal */}
      <RescueQuizModal
        isOpen={isQuizModalOpen}
        plan={activePlan}
        weakTopicOnly={quizWeakTopicOnly}
        onClose={() => {
          setIsQuizModalOpen(false);
          setQuizWeakTopicOnly(null);
        }}
        onPlanUpdate={(updated) => setActivePlan(updated)}
        onOpenCrashLesson={(name) => {
          setIsCrashLessonModalOpen(true);
          setCrashLessonTopicName(name);
        }}
        allAttemptsHistory={questionAttemptsHistory}
        onRecordAttempt={handleRecordAttempt}
        rescheduledTopicIds={rescheduledTopicIds}
        onMarkRescheduled={handleMarkRescheduled}
        improvedTopicIds={improvedTopicIds}
        onMarkImproved={handleMarkImproved}
      />

      {/* 3-Minute Crash Lesson Modal */}
      <CrashLessonModal
        isOpen={isCrashLessonModalOpen}
        topicName={crashLessonTopicName}
        plan={activePlan}
        onClose={() => {
          setIsCrashLessonModalOpen(false);
          setCrashLessonTopicName(null);
        }}
        onStartRetest={(topicName) => {
          setIsCrashLessonModalOpen(false);
          handleRetestTopic(topicName);
        }}
      />
    </div>
  );
}

