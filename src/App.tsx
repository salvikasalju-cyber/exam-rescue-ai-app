import React, { useState, useMemo } from 'react';
import { Navbar } from './components/Navbar';
import { Hero } from './components/Hero';
import { RescueDashboardCard } from './components/RescueDashboardCard';
import { ProgressSection } from './components/ProgressSection';
import { Footer } from './components/Footer';
import { UploadModal } from './components/UploadModal';
import { EditExamTimeModal } from './components/EditExamTimeModal';
import { RescueQuizModal } from './components/RescueQuizModal';
import { TopicLearningModal } from './components/TopicLearningModal';
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
  const [activeNavSection, setActiveNavSection] = useState<string>('home');
  const [completedTopicIds, setCompletedTopicIds] = useState<Set<string>>(new Set());

  // Quiz state
  const [isQuizModalOpen, setIsQuizModalOpen] = useState<boolean>(false);
  const [quizWeakTopicOnly, setQuizWeakTopicOnly] = useState<string | null>(null);

  // Performance history stored across the active session
  const [questionAttemptsHistory, setQuestionAttemptsHistory] = useState<QuestionAttempt[]>([]);
  const [rescheduledTopicIds, setRescheduledTopicIds] = useState<Set<string>>(new Set());
  const [improvedTopicIds, setImprovedTopicIds] = useState<Set<string>>(new Set());

  // Topic Learning Modal State
  const [isLearnTopicModalOpen, setIsLearnTopicModalOpen] = useState<boolean>(false);
  const [learnTopic, setLearnTopic] = useState<StudyTopic | null>(null);

  // Dynamic remaining time calculation
  const targetTs = activePlan.examTargetTimestamp || getDefaultExamDateTime().timestamp;
  const remaining = calculateRemainingTime(targetTs);
  const remainingTimeFormatted = remaining.isPassed 
    ? 'Exam Time Passed' 
    : `${remaining.hours}h ${remaining.minutes}m ${remaining.seconds}s`;

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

  const handleNavigate = (navId: string) => {
    setActiveNavSection(navId);

    if (navId === 'home') {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } else if (navId === 'plan') {
      const el = document.getElementById('rescue-plan-section');
      if (el) el.scrollIntoView({ behavior: 'smooth' });
    } else if (navId === 'learn') {
      const targetTopic = activePlan.topics[0] || null;
      setLearnTopic(targetTopic);
      setIsLearnTopicModalOpen(true);
    } else if (navId === 'quiz') {
      setQuizWeakTopicOnly(null);
      setIsQuizModalOpen(true);
    } else if (navId === 'progress') {
      const el = document.getElementById('progress-section');
      if (el) el.scrollIntoView({ behavior: 'smooth' });
    } else {
      const el = document.getElementById(navId);
      if (el) el.scrollIntoView({ behavior: 'smooth' });
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
      setQuestionAttemptsHistory([]);
      setRescheduledTopicIds(new Set());
      setImprovedTopicIds(new Set());
      setCompletedTopicIds(new Set());
    }
  };

  const handlePlanGenerated = (newPlan: ExamRescuePlan) => {
    setActivePlan(newPlan);
    setActivePresetKey('custom');
    setQuestionAttemptsHistory([]);
    setRescheduledTopicIds(new Set());
    setImprovedTopicIds(new Set());
    setCompletedTopicIds(new Set());
    const el = document.getElementById('rescue-plan-section');
    if (el) el.scrollIntoView({ behavior: 'smooth' });
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

  // Launch rescue quiz (either all topics or focused re-test)
  const handleStartRescueQuiz = (weakTopicOnly?: string | null) => {
    setQuizWeakTopicOnly(weakTopicOnly || null);
    setIsQuizModalOpen(true);
  };

  // Launch focused re-test on specific topic
  const handleRetestTopic = (topicName: string) => {
    setQuizWeakTopicOnly(topicName);
    setIsQuizModalOpen(true);
  };

  // Open Dedicated Topic Learning Modal
  const handleOpenLearnTopic = (topic: StudyTopic) => {
    setLearnTopic(topic);
    setIsLearnTopicModalOpen(true);
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
    <div className="min-h-screen bg-[#08110F] text-[#F2F7F3] flex flex-col selection:bg-[#2F6B4A]/40 selection:text-[#BFE8C8]">
      {/* Top Fixed Header */}
      <Navbar
        onUploadClick={() => setIsUploadModalOpen(true)}
        activeSection={activeNavSection}
        onNavigate={handleNavigate}
      />

      {/* Main Content */}
      <main className="flex-1">
        {/* 1. HOME PAGE: Exam Rescue AI, Short description, Upload PDF, Try Demo */}
        <Hero
          onUploadClick={() => setIsUploadModalOpen(true)}
          onDemoClick={() => {
            handleSwitchPreset('cs');
            const el = document.getElementById('rescue-plan-section');
            if (el) el.scrollIntoView({ behavior: 'smooth' });
          }}
        />

        {/* 2. RESCUE PLAN: Remaining exam time, Topic name, Priority, Importance, Recommended study time, Topic status, Learn Topic, Start Rescue */}
        <RescueDashboardCard
          plan={activePlan}
          onTopicClick={(topic) => handleOpenLearnTopic(topic)}
          onPlanUpdate={(plan) => setActivePlan(plan)}
          onSwitchPreset={handleSwitchPreset}
          activePresetKey={activePresetKey}
          onOpenEditExamTime={() => setIsEditExamTimeModalOpen(true)}
          onStartRescueQuiz={handleStartRescueQuiz}
          onRetestTopic={handleRetestTopic}
          onRescheduleTopic={handleRescheduleTopic}
          onOpenLearnTopic={handleOpenLearnTopic}
          topicPerformanceMap={topicPerformanceMap}
          weakTopics={weakTopics}
        />

        {/* 3. PROGRESS: Completed topics, Quiz score / accuracy, Weak topics, Time left before exam */}
        <ProgressSection
          topics={activePlan.topics}
          completedTopicIds={completedTopicIds}
          attempts={questionAttemptsHistory}
          weakTopics={weakTopics}
          topicPerformanceMap={topicPerformanceMap}
          remainingTimeFormatted={remainingTimeFormatted}
        />
      </main>

      {/* Footer */}
      <Footer
        onUploadClick={() => setIsUploadModalOpen(true)}
        onDemoClick={() => handleNavigate('rescue-plan-section')}
        onNavigate={handleNavigate}
      />

      {/* Upload PDF Modal */}
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

      {/* Quiz & Final Report Modal */}
      <RescueQuizModal
        isOpen={isQuizModalOpen}
        plan={activePlan}
        weakTopicOnly={quizWeakTopicOnly}
        onClose={() => {
          setIsQuizModalOpen(false);
          setQuizWeakTopicOnly(null);
        }}
        onPlanUpdate={(updated) => setActivePlan(updated)}
        onOpenCrashLesson={handleRetestTopic}
        allAttemptsHistory={questionAttemptsHistory}
        onRecordAttempt={handleRecordAttempt}
        rescheduledTopicIds={rescheduledTopicIds}
        onMarkRescheduled={handleMarkRescheduled}
        improvedTopicIds={improvedTopicIds}
        onMarkImproved={handleMarkImproved}
      />

      {/* Topic Learning Modal */}
      <TopicLearningModal
        isOpen={isLearnTopicModalOpen}
        topic={learnTopic}
        plan={activePlan}
        quizAttempts={questionAttemptsHistory}
        onClose={() => {
          setIsLearnTopicModalOpen(false);
          setLearnTopic(null);
        }}
        onMarkUnderstood={(topicId) => {
          setCompletedTopicIds((prev) => new Set(prev).add(topicId));
          setImprovedTopicIds((prev) => new Set(prev).add(topicId));
          setActivePlan((prev) => ({
            ...prev,
            topics: prev.topics.map((t) =>
              t.id === topicId || t.name === topicId
                ? { 
                    ...t, 
                    status: 'mastered', 
                    isWeak: false, 
                    userMarkedUnderstood: true,
                    estimatedMinutes: Math.max(5, Math.round((t.estimatedMinutes || 15) * 0.6))
                  }
                : t
            ),
          }));
        }}
        onMarkConfused={(topicId) => {
          setActivePlan((prev) => ({
            ...prev,
            topics: prev.topics.map((t) =>
              t.id === topicId || t.name === topicId
                ? { 
                    ...t, 
                    status: 'weak', 
                    isWeak: true, 
                    userMarkedUnderstood: false,
                    priority: 1, 
                    estimatedMinutes: Math.min(60, (t.estimatedMinutes || 15) + 10) 
                  }
                : t
            ),
          }));
        }}
        onStartReTest={(topicName) => {
          setIsLearnTopicModalOpen(false);
          handleRetestTopic(topicName);
        }}
        onRescheduleTopic={handleRescheduleTopic}
        onOpenUpload={() => setIsUploadModalOpen(true)}
      />
    </div>
  );
}
