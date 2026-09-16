import { ExamRescuePlan, StudyTopic, QuizQuestion, QuestionAttempt, TopicPerformance, CrashLesson, QuizSessionReport } from '../types';

/**
 * Calculate topic-level performance metrics from question attempts
 */
export function calculateTopicPerformance(
  topics: StudyTopic[],
  attempts: QuestionAttempt[],
  rescheduledTopicIds: Set<string> = new Set(),
  improvedTopicIds: Set<string> = new Set()
): Record<string, TopicPerformance> {
  const result: Record<string, TopicPerformance> = {};

  // Initialize for all topics
  for (const topic of topics) {
    result[topic.name] = {
      topicId: topic.id,
      topicName: topic.name,
      totalAttempts: 0,
      correctCount: 0,
      wrongCount: 0,
      accuracy: 100,
      status: 'normal',
      isRescheduled: rescheduledTopicIds.has(topic.id) || !!topic.isRescheduled,
      recommendedMinutes: topic.recommendedMinutes,
      priority: topic.priority
    };
  }

  // Aggregate attempts
  for (const att of attempts) {
    if (!result[att.topicName]) {
      result[att.topicName] = {
        topicId: att.topicId || `topic-${att.topicName}`,
        topicName: att.topicName,
        totalAttempts: 0,
        correctCount: 0,
        wrongCount: 0,
        accuracy: 100,
        status: 'normal',
        isRescheduled: false
      };
    }

    const perf = result[att.topicName];
    perf.totalAttempts += 1;
    if (att.isCorrect) {
      perf.correctCount += 1;
    } else {
      perf.wrongCount += 1;
    }
    perf.accuracy = Math.round((perf.correctCount / perf.totalAttempts) * 100);

    // Detect weak topic condition:
    // User made mistake(s) and accuracy < 60%, or multiple wrong answers
    if (perf.wrongCount > 0 && perf.accuracy < 60) {
      perf.status = 'weak';
      perf.reason = perf.wrongCount > 1 
        ? 'Multiple incorrect quiz answers' 
        : `Quiz accuracy dropped to ${perf.accuracy}%`;
    } else if (improvedTopicIds.has(perf.topicId) || improvedTopicIds.has(perf.topicName)) {
      perf.status = 'improving';
      perf.reason = 'Improvement detected on re-test';
    } else if (perf.totalAttempts >= 2 && perf.accuracy >= 80) {
      perf.status = 'mastered';
      perf.reason = 'Consistently high quiz accuracy';
    } else {
      perf.status = 'normal';
    }
  }

  return result;
}

/**
 * Reschedule a topic:
 * - Moves it to the top of the study queue
 * - Sets priority to HIGH and status to WEAK
 * - Increases recommended study time (+10 min, e.g. 15 -> 25 min)
 * - Ensures total study time does NOT exceed available exam hours
 */
export function rescheduleTopicInPlan(
  plan: ExamRescuePlan,
  targetTopicIdentifier: string, // topicId or topicName
  extraMinutes: number = 10
): { updatedPlan: ExamRescuePlan; rescheduledTopic: StudyTopic | null } {
  const maxTotalMinutes = Math.max(30, Math.floor(plan.totalHoursLeft * 60 * 0.75)); // leave 25% for test-taking/rest

  const topicIndex = plan.topics.findIndex(
    t => t.id === targetTopicIdentifier || t.name.toLowerCase() === targetTopicIdentifier.toLowerCase()
  );

  if (topicIndex === -1) {
    return { updatedPlan: plan, rescheduledTopic: null };
  }

  const existingTopic = plan.topics[topicIndex];
  const newMinutes = Math.min(60, existingTopic.recommendedMinutes + extraMinutes);

  const updatedTopic: StudyTopic = {
    ...existingTopic,
    priority: 'high',
    isWeak: true,
    status: 'weak',
    isRescheduled: true,
    recommendedMinutes: newMinutes,
    weakReason: existingTopic.weakReason || 'Rescheduled higher in queue after quiz performance.'
  };

  // Re-order: Place updatedTopic at the front, followed by other high priority topics, then medium, then low
  const remainingTopics = plan.topics.filter((_, idx) => idx !== topicIndex);
  
  // Sort remaining topics: high first, then medium, then low
  const priorityRank: Record<string, number> = { high: 0, medium: 1, low: 2 };
  remainingTopics.sort((a, b) => {
    return (priorityRank[a.priority] ?? 1) - (priorityRank[b.priority] ?? 1);
  });

  const reordered = [updatedTopic, ...remainingTopics];

  // Budget validation: ensure sum of study time does not exceed available exam time
  let currentTotal = reordered.reduce((sum, t) => sum + t.recommendedMinutes, 0);
  if (currentTotal > maxTotalMinutes) {
    // Trim lower-priority topics at the tail to respect remaining exam time
    for (let i = reordered.length - 1; i > 0; i--) {
      if (currentTotal <= maxTotalMinutes) break;
      const t = reordered[i];
      const reducible = Math.max(0, t.recommendedMinutes - 10);
      const diff = Math.min(currentTotal - maxTotalMinutes, t.recommendedMinutes - 10);
      if (diff > 0) {
        t.recommendedMinutes -= diff;
        currentTotal -= diff;
      }
    }
  }

  const updatedPlan: ExamRescuePlan = {
    ...plan,
    topics: reordered
  };

  return { updatedPlan, rescheduledTopic: updatedTopic };
}

/**
 * Mark a topic as improved after a successful re-test
 */
export function markTopicAsImproved(
  plan: ExamRescuePlan,
  topicIdentifier: string
): ExamRescuePlan {
  const updatedTopics = plan.topics.map(t => {
    if (t.id === topicIdentifier || t.name.toLowerCase() === topicIdentifier.toLowerCase()) {
      return {
        ...t,
        isWeak: false,
        status: 'improving' as const,
        weakReason: 'Improvement detected during re-test'
      };
    }
    return t;
  });

  return {
    ...plan,
    topics: updatedTopics
  };
}

/**
 * Fetch rescue quiz questions from server API with automatic client fallback
 */
export async function fetchRescueQuizQuestions(
  plan: ExamRescuePlan,
  options: {
    weakTopicOnly?: string;
    numQuestions?: number;
    excludedQuestions?: string[];
  } = {}
): Promise<QuizQuestion[]> {
  try {
    const res = await fetch('/api/generate-quiz', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        documentTitle: plan.documentTitle || plan.examTitle,
        topics: plan.topics.map(t => ({
          id: t.id,
          name: t.name,
          priority: t.priority,
          keyTakeaway: t.keyTakeaway,
          reason: t.reason,
          flashQuestion: t.flashQuestion,
          difficulty: t.difficulty
        })),
        importantConcepts: plan.importantConcepts || [],
        examQuestionAreas: plan.examQuestionAreas || [],
        weakTopicOnly: options.weakTopicOnly,
        numQuestions: options.numQuestions || (options.weakTopicOnly ? 3 : 5),
        excludedQuestions: options.excludedQuestions || []
      })
    });

    if (res.ok) {
      const data = await res.json();
      if (Array.isArray(data.questions) && data.questions.length > 0) {
        return data.questions;
      }
    }
  } catch (err) {
    console.warn('Network error fetching quiz, using local fallback:', err);
  }

  // Guaranteed fallback generator from plan's active recall content
  const targetTopics = options.weakTopicOnly
    ? plan.topics.filter(t => t.name.toLowerCase() === options.weakTopicOnly?.toLowerCase())
    : plan.topics;

  const questions: QuizQuestion[] = [];
  const count = options.numQuestions || (options.weakTopicOnly ? 2 : 5);

  for (let i = 0; i < count; i++) {
    const topic = targetTopics[i % targetTopics.length] || plan.topics[0];
    const flash = topic.flashQuestion;
    const isOptionA = (i % 4) === 0;
    const isOptionB = (i % 4) === 1;
    const isOptionC = (i % 4) === 2;
    const correctIdx = (i % 4);

    const opts = [
      flash?.answer || `${topic.name}: Core exam priority concept and rule.`,
      flash?.trapNote ? `Common trap: ${flash.trapNote}` : `Only applies when memory constraints are unbounded.`,
      `Does not guarantee deterministic output or correctness across test inputs.`,
      `Deprecated and replaced entirely by baseline trivial iterations.`
    ];

    // Swap correct option to index correctIdx
    const temp = opts[0];
    opts[0] = opts[correctIdx];
    opts[correctIdx] = temp;

    questions.push({
      id: `local-q-${Date.now()}-${i}`,
      topicId: topic.id,
      topicName: topic.name,
      question: flash?.question || `What is the critical exam principle or rule for ${topic.name}?`,
      options: opts,
      correctOptionIndex: correctIdx,
      explanation: `Correct: ${flash?.answer || topic.keyTakeaway}. Be vigilant about: ${flash?.trapNote || 'standard edge conditions'}.`,
      conceptTested: topic.name
    });
  }

  return questions;
}

/**
 * Fetch 3-Minute Crash Lesson for a weak topic
 */
export async function fetchCrashLesson(
  topicName: string,
  plan: ExamRescuePlan
): Promise<CrashLesson> {
  const matchingTopic = plan.topics.find(
    t => t.name.toLowerCase() === topicName.toLowerCase()
  );

  try {
    const res = await fetch('/api/generate-crash-lesson', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        topicName,
        documentTitle: plan.documentTitle || plan.examTitle,
        topicContext: {
          difficulty: matchingTopic?.difficulty,
          reason: matchingTopic?.reason,
          keyTakeaway: matchingTopic?.keyTakeaway,
          tags: matchingTopic?.tags,
          importantConcepts: plan.importantConcepts
        }
      })
    });

    if (res.ok) {
      const data = await res.json();
      if (data.summary && Array.isArray(data.keyPoints)) {
        return data;
      }
    }
  } catch (err) {
    console.warn('Network error fetching crash lesson, using local fallback:', err);
  }

  // High-yield structured fallback
  return {
    topicName,
    summary: matchingTopic?.keyTakeaway || `${topicName} is a high-yield core exam concept that must be understood thoroughly for maximum score yield.`,
    keyPoints: [
      `Review core mechanics and operational definitions for ${topicName}.`,
      `Trace standard input cases and verify expected outcomes step-by-step.`,
      matchingTopic?.reason ? `Exam relevance: ${matchingTopic.reason}` : `Watch out for boundary and edge-case exceptions.`,
      `Focus on state changes and invariant properties.`
    ],
    formulaOrRule: matchingTopic?.difficulty ? `Rule for ${matchingTopic.difficulty}-level problems` : `Core Invariant: Verify input bounds before evaluating.`,
    smallExample: `Sample: In a typical exam prompt involving ${topicName}, evaluate the initial parameters, apply the core rule, and state the resulting invariant.`,
    examTip: matchingTopic?.flashQuestion?.trapNote || `Common Trap: Avoid mixing up ${topicName} with adjacent syllabus subtopics.`
  };
}

/**
 * Fetch complete Topic Learning Center lesson from server
 */
export async function fetchTopicLearning(
  topicName: string,
  plan: ExamRescuePlan,
  options: {
    simplerMode?: boolean;
    previousExplanation?: string;
  } = {}
): Promise<import('../types').TopicLearningContent> {
  const matchingTopic = plan.topics.find(
    t => t.name.toLowerCase() === topicName.toLowerCase()
  );

  try {
    const res = await fetch('/api/learn-topic', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        topicName,
        courseName: plan.courseName || 'Exam Syllabus',
        documentTitle: plan.documentTitle || plan.examTitle,
        fileData: plan.rawDocumentBase64,
        mimeType: plan.rawDocumentMime,
        simplerMode: options.simplerMode || false,
        previousExplanation: options.previousExplanation || '',
        topicContext: {
          priority: matchingTopic?.priority || 'high',
          difficulty: matchingTopic?.difficulty || 'Medium',
          importance: matchingTopic?.importance || 80,
          studyTimeMinutes: matchingTopic?.recommendedMinutes || 20,
          reason: matchingTopic?.reason || '',
          tags: matchingTopic?.tags || [],
          keyTakeaway: matchingTopic?.keyTakeaway || '',
          examQuestionType: matchingTopic?.examQuestionType || 'High-Yield Concept',
          flashQuestion: matchingTopic?.flashQuestion,
          importantConcepts: plan.importantConcepts || [],
          examQuestionAreas: plan.examQuestionAreas || [],
        },
      }),
    });

    if (res.ok) {
      const data = await res.json();
      if (data && data.simpleSummary && data.examReadySection) {
        return data;
      }
    }
  } catch (err) {
    console.warn('Network error in fetchTopicLearning, using high-yield fallback:', err);
  }

  // High-Yield Document-Grounded Fallback
  const isCode = /java|python|c\+\+|code|syntax|class|method|function|tree|stack|queue|sort|search|array|pointer|object|constructor/i.test(topicName + ' ' + (plan.courseName || ''));
  const isMath = /calculus|math|formula|equation|derivative|integral|matrix|probability|algebra|physics|velocity|kinematics/i.test(topicName + ' ' + (plan.courseName || ''));
  const topicType = isCode ? 'programming' : isMath ? 'mathematical' : 'theoretical';

  return {
    topicName,
    topicType,
    simpleSummary: {
      whatItIs: `${topicName} is a central topic in ${plan.courseName || 'the syllabus'}, essential for mastering upcoming exam problems.`,
      whyItIsUsed: `It establishes structured logic, clean predictability, and prevents high-frequency exam errors.`,
      howItWorks: `It evaluates input parameters, verifies conditions, and executes unambiguous transformations.`,
      importantRules: [
        `Always verify initial conditions and variable state.`,
        `Preserve expected return types and boundary invariants.`,
        `Handle empty or null states cleanly.`
      ],
      syntax: isCode ? `// Standard ${topicName} pattern\npublic void execute${topicName.replace(/\s+/g, '')}() {\n    // Implementation\n}` : undefined,
      documentPoints: [
        matchingTopic?.reason || `Extracted as a top-priority concept in ${plan.documentTitle || 'your document'}.`,
        matchingTopic?.keyTakeaway || `Core takeaway: Review definitions and boundary mechanics.`
      ],
      simpleExample: options.simplerMode
        ? `Think of ${topicName} like setting up a workspace before starting a job: everything has its designated spot and must be initialized before work begins.`
        : `A standard implementation demonstrating correct parameter binding and output verification.`,
      commonExamMistakes: [
        `Confusing ${topicName} with closely related adjacent syllabus concepts.`,
        `Missing edge-case condition checks (e.g. 0, null, or boundaries).`
      ]
    },
    stepByStep: isCode ? {
      programming: {
        concept: `How to implement ${topicName} in an exam setting.`,
        codeSnippet: `public class Example {\n    private String name;\n    public Example(String n) {\n        this.name = n;\n    }\n    public String getInfo() { return this.name; }\n}`,
        codeLineByLine: [
          { line: "public Example(String n)", explanation: "Method/constructor signature declaring parameter input." },
          { line: "this.name = n;", explanation: "Stores parameter to instance variable for predictable state." },
          { line: "return this.name;", explanation: "Accesses stored value cleanly." }
        ],
        expectedOutput: "Output reflects the initialized instance value.",
        whyOutputOccurs: "Because the parameter was assigned to the object's memory during invocation."
      }
    } : isMath ? {
      mathematical: {
        formula: `\\Delta = f(${topicName}) = \\sum_{i=1}^{n} (x_i - \\mu)^2`,
        variableExplanations: [
          { variable: "x_i", meaning: "Observed value at step i" },
          { variable: "\\mu", meaning: "Mean or reference baseline value" },
          { variable: "n", meaning: "Count of evaluated elements" }
        ],
        solvedExampleSteps: [
          { stepNumber: 1, description: "Extract given values", mathWork: "Given: inputs [3, 5, 7], mean = 5" },
          { stepNumber: 2, description: "Apply formula differences", mathWork: "(-2)^2 + (0)^2 + (2)^2 = 4 + 0 + 4" },
          { stepNumber: 3, description: "Compute final total", mathWork: "Total = 8 (verified)" }
        ]
      }
    } : {
      theoretical: {
        definition: `${topicName} is formally defined as the governing mechanism for consistent state and workflow transitions within ${plan.courseName || 'the course'}.`,
        keyCharacteristics: [
          "Deterministic state execution",
          "Standardized terminology tested on academic rubrics",
          "Explicit boundary criteria"
        ],
        workingPrinciple: `Upon invocation under specified conditions, it enforces prerequisites and executes verified transitions.`,
        practicalExample: `Commonly deployed across production systems to guarantee integrity under varying inputs.`,
        examPoints: [
          `State definition accurately in the opening sentence.`,
          `Highlight 3 distinguishing characteristics.`,
          `List one concrete edge-case test.`
        ]
      }
    },
    examReadySection: {
      learningOutcomes: [
        `Understand ${topicName} from first principles.`,
        `Explain the mechanism clearly in your own words.`,
        `Solve fundamental and medium-level exam questions.`,
        `Detect and avoid common distractor answers.`
      ],
      mostImportantExamPoints: [
        `Core Definition: Memorize exact rubric terminology.`,
        `Primary Rule: Verify prerequisites and boundaries.`,
        `High-Yield Tip: Write out intermediate steps for partial credit.`
      ]
    },
    youtubeClasses: [
      {
        title: `${topicName} Explained (Complete Beginner Guide)`,
        channelName: "Top Academic Educators",
        description: `Comprehensive video lecture explaining ${topicName} with visual aids, core mechanics, and exam tips.`,
        searchQuery: `${topicName} explained beginner class`,
        watchUrl: `https://www.youtube.com/results?search_query=${encodeURIComponent(`${topicName} explained beginner class`)}`
      },
      {
        title: `${topicName} Exam Questions & Solved Problems`,
        channelName: "Exam Prep Hub",
        description: `Step-by-step problem walkthrough showing how examiners test ${topicName} and how to secure top marks.`,
        searchQuery: `${topicName} exam preparation problems`,
        watchUrl: `https://www.youtube.com/results?search_query=${encodeURIComponent(`${topicName} exam preparation problems`)}`
      },
      {
        title: `${topicName} Crash Course (Rapid Revision)`,
        channelName: "Computer & Science Academy",
        description: `Fast-paced active recall recap highlighting formulas, syntax, and traps for ${topicName}.`,
        searchQuery: `${topicName} crash course review`,
        watchUrl: `https://www.youtube.com/results?search_query=${encodeURIComponent(`${topicName} crash course review`)}`
      }
    ],
    quickCheckQuestions: [
      {
        id: `qc-fallback-1`,
        question: `What is the primary function or purpose of ${topicName}?`,
        options: [
          `To establish verified initialization, state integrity, and predictable execution.`,
          `To bypass validation requirements under memory pressure.`,
          `To convert all runtime variables into static constants.`,
          `To prevent external classes from ever executing.`
        ],
        correctOptionIndex: 0,
        explanation: `The primary objective of ${topicName} is to establish verified initialization and dependable state transitions.`
      },
      {
        id: `qc-fallback-2`,
        question: `Which of the following is the most frequent trap in exam questions on ${topicName}?`,
        options: [
          `Neglecting to check boundary values, null states, or edge constraints.`,
          `Using clear, descriptive variable names.`,
          `Showing step-by-step derivation on scratch paper.`,
          `Following standard syntax conventions.`
        ],
        correctOptionIndex: 0,
        explanation: `Examiners intentionally design trick questions targeting boundary states and uninitialized conditions.`
      }
    ],
    isSimplerVersion: options.simplerMode || false
  };
}

/**
 * Calculate dynamic Topic Understanding Indicator:
 * - quiz performance (accuracy + attempts)
 * - quick-check performance (accuracy + completion)
 * - re-test performance (improvement)
 * - user marked "I Understand" vs "Still Confused"
 */
export function calculateTopicUnderstanding(
  topicName: string,
  quizAttempts: QuestionAttempt[],
  quickCheckAnswers: { [questionId: string]: { selectedIndex: number; isCorrect: boolean } } = {},
  userMarkedUnderstood: boolean = false,
  userMarkedConfused: boolean = false
): import('../types').TopicUnderstandingCalculation {
  // 1. Topic quiz attempts
  const topicQuizAttempts = quizAttempts.filter(
    a => a.topicName.toLowerCase() === topicName.toLowerCase()
  );
  const quizCount = topicQuizAttempts.length;
  const quizCorrect = topicQuizAttempts.filter(a => a.isCorrect).length;
  const quizAccuracy = quizCount > 0 ? Math.round((quizCorrect / quizCount) * 100) : undefined;

  // 2. Quick check attempts
  const qcList = Object.values(quickCheckAnswers);
  const qcCount = qcList.length;
  const qcCorrect = qcList.filter(a => a.isCorrect).length;
  const quickCheckAccuracy = qcCount > 0 ? Math.round((qcCorrect / qcCount) * 100) : undefined;

  // Compute calibrated weighted score (0 to 100):
  // Baseline without attempts: 20%
  let score = 20;

  // Quick check adds up to 35 points
  if (quickCheckAccuracy !== undefined) {
    score = 15 + Math.round((quickCheckAccuracy / 100) * 35);
  }

  // Quiz / Re-test accuracy adds up to 40 points
  if (quizAccuracy !== undefined) {
    const quizWeight = Math.min(1, quizCount / 2); // needs 2 attempts for full weight
    score = Math.round(score * (1 - 0.4 * quizWeight) + (quizAccuracy * 0.4 * quizWeight));
  }

  // "I Understand" boosts score by +15, "Still Confused" reduces by -20
  if (userMarkedUnderstood) {
    score = Math.min(100, score + 18);
  } else if (userMarkedConfused) {
    score = Math.max(10, score - 20);
  }

  // Cap score between 5 and 100
  score = Math.max(5, Math.min(100, score));

  // Determine status and descriptive diagnosis:
  let status: 'NOT_STARTED' | 'LEARNING' | 'UNDERSTOOD' | 'WEAK' = 'NOT_STARTED';
  let statusLabel = 'Not Started';
  let statusColor = 'text-slate-400 bg-slate-800 border-slate-700';
  let diagnostic = 'Start with the simple summary and step-by-step breakdown.';

  if (userMarkedConfused || (quizAccuracy !== undefined && quizAccuracy < 60) || (quickCheckAccuracy !== undefined && quickCheckAccuracy < 50)) {
    status = 'WEAK';
    statusLabel = 'Weak Topic — Needs Cramming';
    statusColor = 'text-red-400 bg-red-950/80 border-red-500/50';
    diagnostic = 'Multiple incorrect answers or marked confused. Recommended: watch the YouTube class and try the simpler explanation.';
  } else if (score >= 85) {
    status = 'UNDERSTOOD';
    statusLabel = 'Ready for Exam';
    statusColor = 'text-emerald-300 bg-emerald-950/80 border-emerald-500/50';
    diagnostic = 'Consistently strong performance across quick checks and active recall questions.';
  } else if (score >= 65) {
    status = 'LEARNING';
    statusLabel = 'Almost Ready — Review Once More';
    statusColor = 'text-indigo-300 bg-indigo-950/80 border-indigo-500/50';
    diagnostic = 'Solid foundation established. One quick re-test will solidify this for full marks.';
  } else {
    status = 'LEARNING';
    statusLabel = 'Learning in Progress';
    statusColor = 'text-amber-300 bg-amber-950/80 border-amber-500/50';
    diagnostic = 'Review the step-by-step example and complete the quick check questions.';
  }

  return {
    score,
    status,
    statusLabel,
    statusColor,
    diagnostic,
    quizAccuracy,
    quickCheckAccuracy,
    userMarkedUnderstood
  };
}

/**
 * When user marks "I Understand":
 * - Marks topic as understood
 * - Promotes or deprioritizes in queue appropriately
 * - Shifts focus to weaker topics
 */
export function markTopicAsUnderstoodInPlan(
  plan: ExamRescuePlan,
  topicIdentifier: string
): ExamRescuePlan {
  const targetIdx = plan.topics.findIndex(
    t => t.id === topicIdentifier || t.name.toLowerCase() === topicIdentifier.toLowerCase()
  );

  if (targetIdx === -1) return plan;

  const target = plan.topics[targetIdx];
  const updatedTopic: StudyTopic = {
    ...target,
    completed: true,
    isWeak: false,
    status: 'mastered',
    userMarkedUnderstood: true,
    understandingStatus: 'UNDERSTOOD',
    understandingScore: 90,
    // Reduce recommended study time since student already grasps it
    recommendedMinutes: Math.max(10, Math.round(target.recommendedMinutes * 0.7))
  };

  // Move mastered/understood topic down the queue so priority shifts to weaker topics
  const remaining = plan.topics.filter((_, idx) => idx !== targetIdx);
  const reordered = [...remaining, updatedTopic];

  return {
    ...plan,
    topics: reordered
  };
}

/**
 * When user marks "Still Confused":
 * - Marks topic as weak
 * - Elevates topic higher in the queue
 * - Sets understanding status to WEAK
 */
export function markTopicAsConfusedInPlan(
  plan: ExamRescuePlan,
  topicIdentifier: string
): ExamRescuePlan {
  const targetIdx = plan.topics.findIndex(
    t => t.id === topicIdentifier || t.name.toLowerCase() === topicIdentifier.toLowerCase()
  );

  if (targetIdx === -1) return plan;

  const target = plan.topics[targetIdx];
  const updatedTopic: StudyTopic = {
    ...target,
    completed: false,
    isWeak: true,
    status: 'weak',
    userMarkedUnderstood: false,
    understandingStatus: 'WEAK',
    understandingScore: 30,
    priority: 'high',
    recommendedMinutes: Math.min(60, target.recommendedMinutes + 10),
    weakReason: 'Student indicated confusion during Topic Learning.'
  };

  // Move to front of queue
  const remaining = plan.topics.filter((_, idx) => idx !== targetIdx);
  const reordered = [updatedTopic, ...remaining];

  return {
    ...plan,
    topics: reordered
  };
}
