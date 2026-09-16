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

export interface TopicOverview {
  topicName: string;
  whatItIs: string;
  whyImportant: string;
  whereUsed: string;
  quickSummary: string; // 3-5 line quick summary
}

export interface CompleteTheory {
  definitions: string[];
  importantConcepts: string[];
  rulesAndProperties: string[];
  characteristics: string[];
  typesOrClassifications: { typeName: string; description: string }[];
  workingPrinciple: string;
  importantTerms: { term: string; definition: string }[];
  relationships: string;
}

export interface TopicStep {
  stepNumber: number;
  title: string;
  description: string;
  detail?: string;
}

export interface TopicExampleItem {
  title: string;
  exampleType: 'programming' | 'mathematics' | 'algorithms' | 'dataStructures' | 'theory';
  content: string;
  explanation: string;
}

export interface CodeFormulaDiagram {
  syntaxOrFormulas?: string;
  codeOrEquations?: string;
  pseudocodeOrDiagram?: string;
  explanation: string;
}

export interface ExamImportantSection {
  mustRemember: string[];
  importantDefinitions: string[];
  importantFormulas: string[];
  importantSteps: string[];
  importantDifferences: string[];
  commonlyAskedConcepts: string[];
}

export interface HowToWriteInExam {
  conceptTitle: string;
  definition: string;
  explanation: string;
  example: string;
  conclusion: string;
}

export interface ExpectedExamQuestion {
  question: string;
  answer: string;
  difficulty: 'Easy' | 'Medium' | 'Difficult';
  marks: 4 | 6 | 10;
}

export interface ExpectedExamQuestionsSection {
  fourMarkQuestions: ExpectedExamQuestion[];
  sixMarkQuestions: ExpectedExamQuestion[];
  tenMarkQuestions: ExpectedExamQuestion[];
}

export interface ComparisonRow {
  parameter: string;
  conceptAValue: string;
  conceptBValue: string;
}

export interface ImportantDifferencesTable {
  conceptA: string;
  conceptB: string;
  rows: ComparisonRow[];
}

export interface CommonMistakeItem {
  mistake: string;
  correctUnderstanding: string;
}

export interface MemoryTrickItem {
  mnemonic: string;
  meaning: string;
}

export interface QuickCheckItem {
  id: string;
  type: 'mcq' | 'true_false' | 'short_answer';
  question: string;
  options?: string[];
  correctOptionIndex?: number;
  correctText?: string;
  explanation: string;
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

export interface FullTopicLearningPage {
  topicName: string;
  topicType?: 'programming' | 'mathematics' | 'algorithms' | 'dataStructures' | 'theory';
  overview: TopicOverview;
  completeTheory: CompleteTheory;
  stepByStep: TopicStep[];
  examples: TopicExampleItem[];
  codeFormulaDiagram: CodeFormulaDiagram;
  examImportant: ExamImportantSection;
  howToWriteInExam: HowToWriteInExam;
  expectedExamQuestions: ExpectedExamQuestionsSection;
  importantDifferences?: ImportantDifferencesTable;
  commonMistakes: CommonMistakeItem[];
  quickRevision: {
    keyPoints: string[];
  };
  memoryTricks?: MemoryTrickItem[];
  quickCheckQuestions: QuickCheckItem[];
  youtubeClasses: YouTubeClassItem[];
  isSimplerVersion?: boolean;
}

export interface TopicLearningContent extends FullTopicLearningPage {
  // Backwards compatibility wrappers
  simpleSummary?: {
    whatItIs: string;
    whatItMeans?: string;
    whyItIsUsed: string;
    howItWorks: string;
    importantRules: string[];
    syntax?: string;
    documentPoints: string[];
    simpleExample: string;
    commonExamMistakes: string[];
    shortExamTip?: string;
  };
  stepByStepExplanation?: { title: string; explanation: string }[];
  example?: { title: string; codeOrMath: string; walkthrough: string };
  examPoints?: string[];
  quickCheck?: { id: string; question: string; options: string[]; correctIndex: number; explanation: string }[];
}

export interface TopicUnderstandingCalculation {
  score: number; // 0..100 (never automatically 100%)
  status: 'STRONG' | 'NEEDS_REVISION' | 'WEAK' | 'NOT_STARTED' | 'LEARNING' | 'UNDERSTOOD';
  statusLabel: string;
  statusBadge: string; // '🟢 Strong Understanding' | '🟡 Needs Revision' | '🔴 Weak Understanding'
  statusColor: string;
  diagnostic: string;
  quizAccuracy?: number;
  quickCheckAccuracy?: number;
  questionsAttempted: number;
  correctAnswers: number;
  wrongAnswers: number;
  recommendedRevisionTime: number; // in minutes
  userMarkedUnderstood: boolean;
  userMarkedConfused?: boolean;
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
  accuracyBefore?: number;
  accuracyAfter?: number;
}

export interface CrashLesson {
  topicName: string;
  summary: string;
  keyPoints: string[];
  importantSteps?: string[];
  formulaOrRule?: string;
  smallExample: string;
  examTip: string;
  commonMistake?: string;
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

