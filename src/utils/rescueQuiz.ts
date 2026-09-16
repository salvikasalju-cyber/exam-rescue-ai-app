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
    importantSteps: [
      `1. Write the formal textbook definition in the opening sentence.`,
      `2. State the primary formula, rule, or mechanism.`,
      `3. Walk through a small concrete trace or calculation.`
    ],
    formulaOrRule: matchingTopic?.difficulty ? `Rule for ${matchingTopic.difficulty}-level problems` : `Core Invariant: Verify input bounds before evaluating.`,
    smallExample: `Sample: In a typical exam prompt involving ${topicName}, evaluate the initial parameters, apply the core rule, and state the resulting invariant.`,
    examTip: matchingTopic?.flashQuestion?.trapNote || `Common Trap: Avoid mixing up ${topicName} with adjacent syllabus subtopics.`,
    commonMistake: `Skipping boundary conditions or writing generic prose instead of technical keywords.`
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

  const RETRY_DELAYS = [1000, 2000, 3000];

  for (let attempt = 0; attempt <= RETRY_DELAYS.length; attempt++) {
    try {
      if (attempt > 0) {
        const delay = RETRY_DELAYS[attempt - 1];
        console.log(`[Gemini Topic Learning Retry] Attempt ${attempt} of ${RETRY_DELAYS.length}. Retrying in ${delay}ms...`);
        await new Promise((resolve) => setTimeout(resolve, delay));
      }

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

      if (!res.ok) {
        const isRetryable = res.status === 503 || res.status === 429 || res.status === 502 || res.status === 504;
        if (isRetryable && attempt < RETRY_DELAYS.length) {
          continue;
        }
        throw new Error(`Server returned HTTP ${res.status}`);
      }

      const data = await res.json();
      if (data && (data.overview || data.simpleSummary)) {
        return data;
      }
    } catch (err: any) {
      const errMsg = typeof err?.message === 'string' ? err.message : '';
      const isRetryable = errMsg.includes('503') || errMsg.includes('429') || errMsg.includes('fetch');
      if (isRetryable && attempt < RETRY_DELAYS.length) {
        continue;
      }
      console.warn('Error in fetchTopicLearning, proceeding with resilient fallback:', err);
      break;
    }
  }

  // High-Yield Document-Grounded Fallback
  const isStaticVars = /static\s*var/i.test(topicName);
  const isCode = isStaticVars || /java|python|c\+\+|code|syntax|class|method|function|tree|stack|queue|sort|search|array|pointer|object|constructor|variable/i.test(topicName + ' ' + (plan.courseName || ''));
  const isMath = /calculus|math|formula|equation|derivative|integral|matrix|probability|algebra|physics|velocity|kinematics/i.test(topicName + ' ' + (plan.courseName || ''));
  const topicType = isCode ? 'programming' : isMath ? 'mathematics' : 'theory';

  return {
    topicName,
    topicType,
    overview: {
      topicName,
      whatItIs: isStaticVars
        ? `A static variable in Java/OOP is a variable declared with the 'static' keyword that belongs to the class itself rather than any individual object instance.`
        : `${topicName} is a central topic in ${plan.courseName || 'the syllabus'}, essential for mastering upcoming exam problems.`,
      whyImportant: isStaticVars
        ? `It enables shared memory access across all instances and eliminates redundant object allocations.`
        : `It provides the exact rules and mechanisms evaluated on academic grading rubrics.`,
      whereUsed: isStaticVars
        ? `Widely used for global constants, counters, database connection pools, and singleton patterns.`
        : `Tested in theory questions, code tracing, derivations, and application problems.`,
      quickSummary: isStaticVars
        ? `No matter how many objects you instantiate, only ONE shared copy of a static variable exists in memory across the entire program execution.`
        : `${topicName} defines clear constraints, execution invariants, and predictable outcomes across both theoretical and practical problem sets.`
    },
    completeTheory: {
      definitions: [
        isStaticVars
          ? `A static variable is a class-level variable initialized once when the JVM loads the class.`
          : `${topicName} is formally defined as the standardized structural or algorithmic principle governing operations in ${plan.courseName || 'the course'}.`
      ],
      importantConcepts: [
        isStaticVars
          ? `Shared Method Area memory allocation across all instances.`
          : `Deterministic execution order and state transitions.`
      ],
      rulesAndProperties: isStaticVars
        ? [
            `Declared using the 'static' modifier outside any method.`,
            `Accessed directly via 'ClassName.variableName' without creating an object instance.`,
            `Static methods cannot access non-static instance variables or use 'this' or 'super'.`,
            `Initialized only once when the class is loaded into memory.`
          ]
        : [
            `Always verify initial conditions and variable state.`,
            `Preserve expected return types and boundary invariants.`,
            `Handle empty or null states cleanly.`
          ],
      characteristics: [
        `Standardized academic terminology evaluated on exam rubrics.`,
        `Predictable time and space complexity characteristics.`,
        `Explicit boundary criteria that distinguish it from adjacent mechanisms.`
      ],
      typesOrClassifications: [
        { typeName: `Basic Form`, description: `Baseline configuration adhering to direct constraints.` },
        { typeName: `Extended Form`, description: `Advanced usage incorporating boundary validation and composite conditions.` }
      ],
      workingPrinciple: isStaticVars
        ? `Memory is allocated in the Method Area / Metaspace when the class is loaded by the JVM. All instances point to this exact same memory reference.`
        : `Upon evaluation under specified conditions, it validates all entry preconditions and executes verified state transformations.`,
      importantTerms: [
        { term: `Initialization`, definition: `Setting up baseline memory or variables before invocation.` },
        { term: `Invariant`, definition: `A condition that remains consistently valid throughout execution.` }
      ],
      relationships: `Connects foundational representation with runtime state transitions in ${plan.courseName || 'the syllabus'}.`
    },
    stepByStep: [
      {
        stepNumber: 1,
        title: `Identify Prerequisites & Memory Model`,
        description: `Verify initial values, scoping rules, and memory allocation requirements before execution.`,
        detail: `Inspect for null, out-of-bounds, or uninitialized state.`
      },
      {
        stepNumber: 2,
        title: `Execute Core Logic`,
        description: `Apply the formal rule or procedural operation sequentially.`,
        detail: `Track state transitions accurately on scratch paper.`
      },
      {
        stepNumber: 3,
        title: `Verify Invariants & Edge Cases`,
        description: `Confirm that boundary limits are respected and final values match expectations.`
      },
      {
        stepNumber: 4,
        title: `Formulate Final Answer`,
        description: `Present the verified outcome clearly with units or code syntax for full marks.`
      }
    ],
    examples: [
      {
        title: `Core Worked Example for ${topicName}`,
        exampleType: isCode ? 'programming' : isMath ? 'mathematics' : 'theory',
        content: isStaticVars
          ? `class Student {\n    static int studentCount = 0;\n    Student() { studentCount++; }\n}\n// Student.studentCount is shared by all instances!`
          : isCode
          ? `// Standard example\npublic void execute() {\n    // Core logic for ${topicName}\n}`
          : isMath
          ? `Formula: R = f(x) = (x * 2) + 5\nFor x = 10: R = (10 * 2) + 5 = 25`
          : `Standard application scenario demonstrating compliant state transitions.`,
        explanation: `Demonstrates clean compliance with syllabus requirements and expected output formatting.`
      }
    ],
    codeFormulaDiagram: {
      syntaxOrFormulas: isStaticVars
        ? `public static int variableName = initialValue;`
        : isCode
        ? `public returnType methodName(parameters) { ... }`
        : `Output = f(Input) \\quad \\text{under boundary conditions}`,
      codeOrEquations: isStaticVars
        ? `ClassName.variableName; // Recommended access syntax`
        : `Verified formulation`,
      pseudocodeOrDiagram: `
+-----------------------------------+
|  Class / Metaspace Memory Slot    |  <-- [Shared Single Copy]
+-----------------+-----------------+
                  |
        +---------+---------+
        |                   |
  Instance a1         Instance a2
`,
      explanation: `Illustrates how memory and logic flow deterministically through the system.`
    },
    examImportant: {
      mustRemember: [
        `Write the formal definition verbatim in your opening answer sentence.`,
        `Always check boundary and edge cases (0, null, extremes).`,
        `Draw a clear diagram if the question carries 5 or more marks.`,
        `Show step-by-step working for partial marks.`
      ],
      importantDefinitions: [
        `${topicName}: Standardized mechanism ensuring predictable transformation and correctness within ${plan.courseName || 'the course'}.`
      ],
      importantFormulas: [
        `Invariant Formula: State_{new} = Transform(State_{old}, Input)`
      ],
      importantSteps: [
        `1. Prerequisites validation`,
        `2. Sequential execution`,
        `3. Boundary verification`,
        `4. Concluding answer statement`
      ],
      importantDifferences: [
        `Do not confuse class-level shared state with instance-level private state.`
      ],
      commonlyAskedConcepts: [
        `Explain working principle with a diagram (6 marks).`,
        `Differentiate from alternative methods (4 marks).`
      ]
    },
    howToWriteInExam: {
      conceptTitle: `How to Structure Answers for ${topicName}`,
      definition: `Begin with: "${topicName} is defined as..." stating its purpose in two clean sentences.`,
      explanation: `Provide 3-4 numbered or bulleted points detailing the working principle and rules.`,
      example: `Include a concise, bug-free code snippet or solved calculation.`,
      conclusion: `Conclude: "Thus, ${topicName} ensures correctness and efficiency in ${plan.courseName || 'the syllabus'}."`
    },
    expectedExamQuestions: {
      fourMarkQuestions: [
        {
          question: `Define ${topicName} and state two key rules or properties.`,
          answer: `Definition: ${topicName} is the standardized mechanism in ${plan.courseName || 'the course'} governing state correctness.\n\nTwo Rules:\n1. Strict adherence to prerequisite declarations.\n2. Invariant preservation across all operational cycles.`,
          difficulty: 'Easy',
          marks: 4
        }
      ],
      sixMarkQuestions: [
        {
          question: `Explain the working principle of ${topicName} with a step-by-step example.`,
          answer: `Working Principle: Operates by checking preconditions, executing the procedural transformation sequentially, and verifying postconditions.\n\nExample:\nStep 1: Input setup\nStep 2: Core rule application\nStep 3: Verification of result against boundary limits.`,
          difficulty: 'Medium',
          marks: 6
        }
      ],
      tenMarkQuestions: [
        {
          question: `Provide a detailed examination of ${topicName}: include definition, working principle, code/formula representation, edge cases, and rubric-ready solution.`,
          answer: `1. Definition & Scope: Formal definition and theoretical context.\n2. Mechanism: Step-by-step execution breakdown.\n3. Formulation: Exact syntax or equation.\n4. Edge Cases: Handling null/empty/extreme states.\n5. Conclusion: Comparison with alternative approaches.`,
          difficulty: 'Difficult',
          marks: 10
        }
      ]
    },
    importantDifferences: {
      conceptA: topicName,
      conceptB: `Conventional Approach`,
      rows: [
        { parameter: `Definition`, conceptAValue: `Structured principle with strict invariants`, conceptBValue: `Ad-hoc implementation with minimal guarantees` },
        { parameter: `Purpose`, conceptAValue: `Guaranteed exam rubric compliance and safety`, conceptBValue: `Quick prototyping with high bug risk` },
        { parameter: `Working`, conceptAValue: `Sequential verification pipeline`, conceptBValue: `Direct execution without invariant checks` },
        { parameter: `Example`, conceptAValue: `Standardized, boundary-checked formulation`, conceptBValue: `Unchecked raw statements` },
        { parameter: `Advantages`, conceptAValue: `Deterministic, maintainable, full marks`, conceptBValue: `Slightly less initial boilerplate` }
      ]
    },
    commonMistakes: [
      {
        mistake: `❌ Confusing ${topicName} with closely related adjacent concepts.`,
        correctUnderstanding: `✅ Memorize the specific defining characteristics and syntax triggers that identify ${topicName}.`
      },
      {
        mistake: `❌ Skipping edge-case checks (null, zero, or boundary values).`,
        correctUnderstanding: `✅ Always write explicit boundary condition checks to secure full rubric points.`
      }
    ],
    quickRevision: {
      keyPoints: [
        `State the formal definition verbatim in your first sentence.`,
        `Follow the 4-step sequence: Prerequisites -> Transform -> Verify -> Format.`,
        `Double-check boundary limits before concluding.`,
        `Draw clean labeled diagrams for 5+ mark questions.`
      ]
    },
    memoryTricks: [
      {
        mnemonic: `P-E-V-C`,
        meaning: `Prerequisites -> Execution -> Verification -> Conclusion (The 4 keys for full marks).`
      }
    ],
    quickCheckQuestions: [
      {
        id: `qc-${Date.now()}-1`,
        type: 'mcq',
        question: `What is the primary objective of ${topicName}?`,
        options: [
          `To establish verified initialization, state integrity, and predictable execution.`,
          `To bypass validation requirements under memory pressure.`,
          `To convert all runtime variables into static constants.`,
          `To prevent external classes from ever executing.`
        ],
        correctOptionIndex: 0,
        explanation: `The primary objective is verified initialization and deterministic state transitions.`
      },
      {
        id: `qc-${Date.now()}-2`,
        type: 'true_false',
        question: `True or False: Boundary conditions (such as null or empty inputs) can be safely ignored in exam answers for ${topicName}.`,
        options: [`True`, `False`],
        correctOptionIndex: 1,
        explanation: `False! Examiners specifically allocate marks for addressing boundary conditions.`
      },
      {
        id: `qc-${Date.now()}-3`,
        type: 'mcq',
        question: `Which of the following describes a common exam trap regarding ${topicName}?`,
        options: [
          `Neglecting to check boundary values, null states, or edge constraints.`,
          `Using clear, descriptive variable names.`,
          `Showing step-by-step derivation on scratch paper.`,
          `Following standard syntax conventions.`
        ],
        correctOptionIndex: 0,
        explanation: `Examiners intentionally design questions targeting boundary and uninitialized conditions.`
      }
    ],
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
    isSimplerVersion: options.simplerMode || false,
    // Backwards compatibility wrappers
    simpleSummary: {
      whatItIs: isStaticVars
        ? `A static variable in Java/OOP is a variable declared with the 'static' keyword that belongs to the class itself rather than any individual object instance.`
        : `${topicName} is a central topic in ${plan.courseName || 'the syllabus'}, essential for mastering upcoming exam problems.`,
      whatItMeans: isStaticVars
        ? `No matter how many objects you instantiate, only ONE shared copy of a static variable exists in memory across the entire program execution.`
        : `Understanding ${topicName} means knowing its foundational rules, execution order, and memory behavior in test scenarios.`,
      whyItIsUsed: isStaticVars
        ? `It is used to store common data shared by all instances of a class without wasting heap memory.`
        : `It establishes structured logic, clean predictability, and prevents high-frequency exam errors.`,
      howItWorks: isStaticVars
        ? `Memory for a static variable is allocated in the Method Area / Class Area when the class is first loaded by the JVM.`
        : `It evaluates input parameters, verifies conditions, and executes unambiguous transformations.`,
      importantRules: isStaticVars
        ? [
            `Declared using the 'static' modifier outside any method.`,
            `Accessed directly via 'ClassName.variableName' without creating an object instance.`,
            `Static methods cannot access non-static instance variables or use 'this' or 'super'.`,
            `Initialized only once when the class is loaded into memory.`
          ]
        : [
            `Always verify initial conditions and variable state.`,
            `Preserve expected return types and boundary invariants.`,
            `Handle empty or null states cleanly.`
          ],
      syntax: isStaticVars
        ? `public class Counter {\n    public static int totalCount = 0;\n}`
        : (isCode ? `// Standard ${topicName} pattern\npublic void execute${topicName.replace(/\s+/g, '')}() {\n    // Implementation\n}` : undefined),
      documentPoints: [
        matchingTopic?.reason || `Extracted as a top-priority concept in ${plan.documentTitle || 'your document'}.`,
        matchingTopic?.keyTakeaway || `Core takeaway: Review definitions and boundary mechanics.`
      ],
      simpleExample: isStaticVars
        ? (options.simplerMode
            ? `Think of a physical scoreboard in a classroom: there is only ONE scoreboard on the wall. Every student sees the exact same updated number.`
            : `A Counter class where Counter.totalCount tracks how many User objects have registered across the application.`)
        : (options.simplerMode
            ? `Think of ${topicName} like setting up a workspace before starting a job: everything has its designated spot and must be initialized before work begins.`
            : `A standard implementation demonstrating correct parameter binding and output verification.`),
      commonExamMistakes: isStaticVars
        ? [
            `Attempting to access 'this.myStaticVar' or instance variables inside a static method.`,
            `Assuming each object instance gets its own independent copy of a static variable.`,
            `Forgetting that static initialization blocks run once upon class loading.`
          ]
        : [
            `Confusing ${topicName} with closely related adjacent syllabus concepts.`,
            `Missing edge-case condition checks (e.g. 0, null, or boundaries).`
          ],
      shortExamTip: isStaticVars
        ? `In code-tracing questions, circle static variables in red. Whenever ANY line changes that variable, update your single scratch-paper value for ALL instances!`
        : `Memorize the standard rubric definition and boundary invariants for maximum points.`
    },
    stepByStepExplanation: [
      { title: 'Prerequisites', explanation: 'Verify input conditions and boundary limits.' },
      { title: 'Transformation', explanation: 'Apply verified formula or procedural logic.' },
      { title: 'Verification', explanation: 'Confirm invariants and edge condition handling.' }
    ],
    example: {
      title: `Worked Example for ${topicName}`,
      codeOrMath: isStaticVars ? `public class Counter { public static int count = 0; }` : `Output = f(Input)`,
      walkthrough: `Follows verified step-by-step logic.`
    },
    examPoints: [
      `State definition accurately in the opening sentence.`,
      `Highlight distinguishing characteristics.`,
      `List one concrete edge-case test.`
    ]
  };
}

/**
 * Calculate dynamic Topic Understanding Indicator:
 * Status values:
 * 🟢 Strong Understanding
 * 🟡 Needs Revision
 * 🔴 Weak Understanding
 * Never automatically 100%.
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
  const quizWrong = quizCount - quizCorrect;
  const quizAccuracy = quizCount > 0 ? Math.round((quizCorrect / quizCount) * 100) : undefined;

  // 2. Quick check attempts
  const qcList = Object.values(quickCheckAnswers);
  const qcCount = qcList.length;
  const qcCorrect = qcList.filter(a => a.isCorrect).length;
  const qcWrong = qcCount - qcCorrect;
  const quickCheckAccuracy = qcCount > 0 ? Math.round((qcCorrect / qcCount) * 100) : undefined;

  const questionsAttempted = quizCount + qcCount;
  const correctAnswers = quizCorrect + qcCorrect;
  const wrongAnswers = quizWrong + qcWrong;

  // Compute calibrated weighted score (0 to 100):
  // Baseline without attempts: 30%
  let score = 30;

  // Quick check adds up to 35 points
  if (quickCheckAccuracy !== undefined) {
    score = 20 + Math.round((quickCheckAccuracy / 100) * 35);
  }

  // Quiz / Re-test accuracy adds up to 35 points
  if (quizAccuracy !== undefined) {
    const quizWeight = Math.min(1, quizCount / 2);
    score = Math.round(score * (1 - 0.35 * quizWeight) + (quizAccuracy * 0.35 * quizWeight));
  }

  // "I Understand" gives a modest confidence boost (+12), but never pushes to 100% without test performance
  if (userMarkedUnderstood) {
    score = Math.min(88, score + 12);
  } else if (userMarkedConfused) {
    score = Math.max(15, score - 25);
  }

  // Cap score between 10 and 92 (Do NOT automatically mark 100%)
  if (questionsAttempted >= 4 && (correctAnswers / questionsAttempted) >= 0.95 && userMarkedUnderstood) {
    score = 95; // Only near 100 if verified with multiple tests
  } else {
    score = Math.max(10, Math.min(88, score));
  }

  // Determine status and badges:
  // 🟢 Strong Understanding
  // 🟡 Needs Revision
  // 🔴 Weak Understanding
  let status: 'STRONG' | 'NEEDS_REVISION' | 'WEAK' = 'NEEDS_REVISION';
  let statusLabel = 'Needs Revision';
  let statusBadge = '🟡 Needs Revision';
  let statusColor = 'text-[#E8D58A] bg-[#E8D58A]/10 border-[#E8D58A]/40';
  let diagnostic = 'Review the 2-Minute Revision and verify with a quick re-test.';
  let recommendedRevisionTime = 15;

  const isWeakCondition = userMarkedConfused || 
    (questionsAttempted > 0 && (correctAnswers / questionsAttempted) < 0.6) || 
    wrongAnswers >= 2 || 
    score < 50;

  const isStrongCondition = !userMarkedConfused && 
    (score >= 75 || (questionsAttempted >= 2 && (correctAnswers / questionsAttempted) >= 0.8)) && 
    userMarkedUnderstood;

  if (isWeakCondition) {
    status = 'WEAK';
    statusLabel = 'Weak Understanding';
    statusBadge = '🔴 Weak Understanding';
    statusColor = 'text-[#F29B9B] bg-[#F29B9B]/10 border-[#F29B9B]/40';
    diagnostic = 'Multiple mistakes detected or marked confused. Priority increased in Rescue Plan with extra study time.';
    recommendedRevisionTime = 25;
  } else if (isStrongCondition) {
    status = 'STRONG';
    statusLabel = 'Strong Understanding';
    statusBadge = '🟢 Strong Understanding';
    statusColor = 'text-[#9FE2B0] bg-[#2F6B4A]/20 border-[#9FE2B0]/40';
    diagnostic = 'Solid grasp of core concepts, formulas, and common exam questions. Revision time reduced in Rescue Plan.';
    recommendedRevisionTime = 10;
  } else {
    status = 'NEEDS_REVISION';
    statusLabel = 'Needs Revision';
    statusBadge = '🟡 Needs Revision';
    statusColor = 'text-[#E8D58A] bg-[#E8D58A]/10 border-[#E8D58A]/40';
    diagnostic = 'Foundation is developing. Practice the expected exam questions and complete the Quick Check.';
    recommendedRevisionTime = 18;
  }

  return {
    score,
    status,
    statusLabel,
    statusBadge,
    statusColor,
    diagnostic,
    quizAccuracy,
    quickCheckAccuracy,
    questionsAttempted,
    correctAnswers,
    wrongAnswers,
    recommendedRevisionTime,
    userMarkedUnderstood,
    userMarkedConfused
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
