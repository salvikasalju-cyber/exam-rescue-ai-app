export type PriorityLevel = 'high' | 'medium' | 'low';
export type TopicStatus = 'normal' | 'weak' | 'improving' | 'mastered';

export interface StudyTopic {
  id: string;
  name: string;
  priority: PriorityLevel;
  importance: number; // percentage, e.g. 85
  recommendedMinutes: number;
  difficulty?: string;
  reason?: string;
  tags: string[];
  completed: boolean;
  scoreYieldPoints: number;
  examQuestionType: string;
  keyTakeaway: string;
  flashQuestion: {
    question: string;
    answer: string;
    trapNote: string;
  };
  // Adaptive Quiz & Weak Topic tracking
  isWeak?: boolean;
  status?: TopicStatus;
  quizAccuracy?: number;
  quizAttempts?: number;
  isRescheduled?: boolean;
  weakReason?: string;
  // Topic Learning Center & Understanding System
  understandingStatus?: 'NOT_STARTED' | 'LEARNING' | 'UNDERSTOOD' | 'WEAK';
  understandingScore?: number; // 0..100
  userMarkedUnderstood?: boolean;
}

export interface YouTubeClassItem {
  title: string;
  channelName?: string;
  description: string;
  searchQuery: string;
  watchUrl: string;
}

export interface QuickCheckQuestion {
  id: string;
  question: string;
  options: string[];
  correctOptionIndex: number;
  explanation: string;
}

export interface ProgrammingStepByStep {
  concept: string;
  codeSnippet: string;
  codeLineByLine: { line: string; explanation: string }[];
  expectedOutput: string;
  whyOutputOccurs: string;
}

export interface MathematicalStepByStep {
  formula: string;
  variableExplanations: { variable: string; meaning: string }[];
  solvedExampleSteps: { stepNumber: number; description: string; mathWork: string }[];
}

export interface TheoreticalStepByStep {
  definition: string;
  keyCharacteristics: string[];
  workingPrinciple: string;
  practicalExample: string;
  examPoints: string[];
}

export interface TopicLearningContent {
  topicName: string;
  topicType: 'programming' | 'mathematical' | 'theoretical';
  simpleSummary: {
    whatItIs: string;
    whyItIsUsed: string;
    howItWorks: string;
    importantRules: string[];
    syntax?: string;
    documentPoints: string[];
    simpleExample: string;
    commonExamMistakes: string[];
  };
  stepByStep: {
    programming?: ProgrammingStepByStep;
    mathematical?: MathematicalStepByStep;
    theoretical?: TheoreticalStepByStep;
  };
  examReadySection: {
    learningOutcomes: string[];
    mostImportantExamPoints: string[];
  };
  youtubeClasses: YouTubeClassItem[];
  quickCheckQuestions: QuickCheckQuestion[];
  isSimplerVersion?: boolean;
}

export interface TopicUnderstandingCalculation {
  score: number; // 0..100
  status: 'NOT_STARTED' | 'LEARNING' | 'UNDERSTOOD' | 'WEAK';
  statusLabel: string;
  statusColor: string;
  diagnostic: string;
  quizAccuracy?: number;
  quickCheckAccuracy?: number;
  userMarkedUnderstood: boolean;
}

export interface QuizQuestion {
  id: string;
  topicId: string;
  topicName: string;
  question: string;
  options: string[]; // 4 options
  correctOptionIndex: number; // 0..3
  explanation: string;
  conceptTested?: string;
}

export interface QuestionAttempt {
  id: string;
  questionId: string;
  topicId: string;
  topicName: string;
  question: string;
  selectedAnswerIndex: number;
  selectedAnswer: string;
  correctAnswerIndex: number;
  correctAnswer: string;
  isCorrect: boolean;
  timestamp: number;
  explanation: string;
}

export interface TopicPerformance {
  topicId: string;
  topicName: string;
  totalAttempts: number;
  correctCount: number;
  wrongCount: number;
  accuracy: number; // 0 to 100
  status: TopicStatus;
  reason?: string;
  isRescheduled?: boolean;
  recommendedMinutes?: number;
  priority?: PriorityLevel;
}

export interface CrashLesson {
  topicName: string;
  summary: string;
  keyPoints: string[];
  formulaOrRule?: string;
  smallExample: string;
  examTip: string;
}

export interface QuizSessionReport {
  totalQuestions: number;
  correctAnswers: number;
  wrongAnswers: number;
  accuracy: number;
  strongTopics: string[];
  weakTopics: string[];
  rescheduledTopics: string[];
  improvedTopics: string[];
  recommendedRevisionOrder: string[];
  hoursRemaining: number;
  examDateFormatted: string;
}

export interface ExamRescuePlan {
  courseName: string;
  examTitle: string;
  examDate: string;
  totalHoursLeft: number;
  readinessPercentage: number;
  documentTitle?: string;
  importantConcepts?: string[];
  examQuestionAreas?: string[];
  isAiGenerated?: boolean;
  topics: StudyTopic[];
  examDateInput?: string; // YYYY-MM-DD
  examTimeInput?: string; // HH:mm
  examTargetTimestamp?: number; // Epoch timestamp in ms
  rawDocumentBase64?: string;
  rawDocumentMime?: string;
}

export interface GeminiAnalysisResponse {
  documentTitle: string;
  courseName?: string;
  readinessPercentage?: number;
  topics: {
    name: string;
    priority: 'HIGH' | 'MEDIUM' | 'LOW' | string;
    importance: number;
    studyTimeMinutes: number;
    difficulty: string;
    reason: string;
    tags?: string[];
    keyTakeaway?: string;
    examQuestionType?: string;
    scoreYieldPoints?: number;
    flashQuestion?: {
      question: string;
      answer: string;
      trapNote: string;
    };
  }[];
  importantConcepts: string[];
  examQuestionAreas: string[];
}

