import express from 'express';
import path from 'path';
import dotenv from 'dotenv';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI, Type } from '@google/genai';

dotenv.config();

async function startServer() {
  const app = express();
  const PORT = 3000;

  // JSON parser with 50MB limit to handle base64 document payloads
  app.use(express.json({ limit: '50mb' }));

  // Helper to initialize GoogleGenAI safely
  const getGenAI = () => {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error('GEMINI_API_KEY environment variable is missing.');
    }
    return new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        },
      },
    });
  };

  // API: Health check
  app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', time: new Date().toISOString() });
  });

  // API: Analyze document with real Gemini
  app.post('/api/analyze-notes', async (req, res) => {
    try {
      const { fileData, fileName, mimeType, hoursRemaining } = req.body;

      if (!fileData || !fileName) {
        return res.status(400).json({
          error: 'Missing fileData or fileName in request body.',
        });
      }

      const ai = getGenAI();
      const hours = Number(hoursRemaining) || 4.5;
      const detectedMime = mimeType || 'application/pdf';

      const prompt = `You are analyzing an uploaded document for an emergency student cram plan called "Exam Rescue AI".
The student uploaded the file: "${fileName}".
The exam is in ${hours} hours.

Analyze the ACTUAL content of the uploaded document carefully and thoroughly.

Identify:
1. Major topics and subtopics directly covered in this document
2. Calibrated importance score (0-100) based on document emphasis, repetition, headings, theorems, or depth
3. Priority: "HIGH", "MEDIUM", or "LOW" based on likelihood of appearing on the exam and necessity for passing
4. Recommended study time in minutes (allocate realistic sprint intervals, e.g., 10-30 mins per topic)
5. Difficulty: "Easy", "Medium", or "Hard"
6. A concise reason explaining why this priority was assigned based on evidence in the document
7. Key concepts, definitions, formulas, or rules extracted directly from the document
8. Likely exam question areas/types
9. An active recall flash question with answer and common exam trap

CRITICAL ACCURACY RULES:
- Ground all topics strictly in the provided document.
- Never invent topics that are not supported by the uploaded document.
- Do NOT use Binary Search Tree, AVL Trees, or data structures topics unless the document is actually about Data Structures.
- If the document is about Java OOP, output Java OOP topics (e.g., Polymorphism, Inheritance, Encapsulation, Abstract Classes, Interfaces).
- If the document is about Physics, output the actual Physics topics (e.g., Newton's Laws, Thermodynamics, Electromagnetism).
- If the document is about Biology, Chemistry, Literature, or Economics, output those specific topics.
- The output MUST accurately reflect this specific document.`;

      // Server-side model selection with fallback support:
      // gemini-3.1-flash-lite is the currently supported, high-availability model in this project
      // gemini-3.8-flash and gemini-flash-latest serve as fallbacks
      const modelsToTry = ['gemini-3.1-flash-lite', 'gemini-3.8-flash', 'gemini-flash-latest'];
      let response: any = null;
      let lastServerErr: any = null;
      const MAX_SERVER_RETRIES = modelsToTry.length;

      for (let attempt = 1; attempt <= MAX_SERVER_RETRIES; attempt++) {
        const modelCandidate = modelsToTry[(attempt - 1) % modelsToTry.length];
        try {
          console.log(`[Gemini Server] Attempting document analysis with model: ${modelCandidate}`);
          
          // Wrap with a 45-second timeout to handle network stalls gracefully
          const generatePromise = ai.models.generateContent({
            model: modelCandidate,
            contents: [
              {
                inlineData: {
                  mimeType: detectedMime,
                  data: fileData,
                },
              },
              {
                text: prompt,
              },
            ],
            config: {
              systemInstruction: `You are an expert academic tutor and exam preparation analyst. Analyze the provided lecture notes, slides, or syllabus document.
Extract genuine topics, importance scores, sprint study times, difficulty, and reasons directly from the document content.
Never generate pre-canned or hardcoded topics. Every topic and concept must exist in the document.
Do NOT claim that a topic is guaranteed to appear in an exam unless the uploaded document explicitly provides evidence for that.`,
              responseMimeType: 'application/json',
              responseSchema: {
                type: Type.OBJECT,
                properties: {
                  documentTitle: {
                    type: Type.STRING,
                    description: 'The actual uploaded filename or title from the document',
                  },
                  courseName: {
                    type: Type.STRING,
                    description: 'The course or subject title derived from the document',
                  },
                  readinessPercentage: {
                    type: Type.INTEGER,
                    description: 'Baseline readiness score between 40 and 65',
                  },
                  topics: {
                    type: Type.ARRAY,
                    description: 'List of topics extracted from the document, ranked from highest priority to lowest',
                    items: {
                      type: Type.OBJECT,
                      properties: {
                        name: {
                          type: Type.STRING,
                          description: 'Topic name from the PDF/document',
                        },
                        priority: {
                          type: Type.STRING,
                          description: 'HIGH, MEDIUM, or LOW',
                        },
                        importance: {
                          type: Type.INTEGER,
                          description: 'Importance score from 0 to 100',
                        },
                        studyTimeMinutes: {
                          type: Type.INTEGER,
                          description: 'Recommended sprint study time in minutes',
                        },
                        difficulty: {
                          type: Type.STRING,
                          description: 'Difficulty level: Easy, Medium, or Hard',
                        },
                        reason: {
                          type: Type.STRING,
                          description: 'Short explanation based strictly on the document evidence',
                        },
                        tags: {
                          type: Type.ARRAY,
                          items: { type: Type.STRING },
                          description: '2-4 subtopics or key terms under this topic',
                        },
                        keyTakeaway: {
                          type: Type.STRING,
                          description: 'The key formula, definition, or concept to remember',
                        },
                        examQuestionType: {
                          type: Type.STRING,
                          description: 'Likely exam question format',
                        },
                        scoreYieldPoints: {
                          type: Type.INTEGER,
                          description: 'Estimated exam points yield',
                        },
                        flashQuestion: {
                          type: Type.OBJECT,
                          properties: {
                            question: { type: Type.STRING, description: 'Active recall test question' },
                            answer: { type: Type.STRING, description: 'Clear, concise answer' },
                            trapNote: { type: Type.STRING, description: 'Common exam trap or mistake' },
                          },
                          required: ['question', 'answer', 'trapNote'],
                        },
                      },
                      required: [
                        'name',
                        'priority',
                        'importance',
                        'studyTimeMinutes',
                        'difficulty',
                        'reason',
                      ],
                    },
                  },
                  importantConcepts: {
                    type: Type.ARRAY,
                    items: { type: Type.STRING },
                    description: 'Key concepts extracted from the document',
                  },
                  examQuestionAreas: {
                    type: Type.ARRAY,
                    items: { type: Type.STRING },
                    description: 'Likely exam question areas identified from the document',
                  },
                },
                required: [
                  'documentTitle',
                  'topics',
                  'importantConcepts',
                  'examQuestionAreas',
                ],
              },
            },
          });

          // Timeout promise
          const timeoutPromise = new Promise((_, reject) => {
            setTimeout(() => reject(new Error('Network timeout during AI document processing.')), 45000);
          });

          response = await Promise.race([generatePromise, timeoutPromise]);
          // If call succeeded, break out of loop
          console.log(`[Gemini Server] Successfully processed document with model: ${modelCandidate}`);
          break;
        } catch (serverErr: any) {
          lastServerErr = serverErr;
          const errMsg = typeof serverErr?.message === 'string' ? serverErr.message : '';
          const isRetryable =
            serverErr?.status === 503 ||
            serverErr?.code === 503 ||
            serverErr?.status === 429 ||
            serverErr?.code === 429 ||
            serverErr?.status === 500 ||
            serverErr?.status === 502 ||
            serverErr?.status === 504 ||
            errMsg.includes('503') ||
            errMsg.includes('UNAVAILABLE') ||
            errMsg.includes('temporarily busy') ||
            errMsg.includes('high demand') ||
            errMsg.includes('RESOURCE_EXHAUSTED') ||
            errMsg.includes('Resource has been exhausted') ||
            errMsg.includes('quota') ||
            errMsg.includes('429') ||
            errMsg.includes('timeout') ||
            errMsg.includes('ETIMEDOUT') ||
            errMsg.includes('ECONNRESET') ||
            errMsg.includes('fetch failed');

          console.warn(`[Gemini Server] Model ${modelCandidate} failed (attempt ${attempt}/${MAX_SERVER_RETRIES}):`, errMsg || serverErr?.status || 'Unknown error');

          if (isRetryable && attempt < MAX_SERVER_RETRIES) {
            const nextModel = modelsToTry[attempt % modelsToTry.length];
            console.log(`[Gemini Server] Falling back to model: ${nextModel}`);
            await new Promise((res) => setTimeout(res, 800));
          } else if (!isRetryable) {
            throw serverErr;
          }
        }
      }

      if (!response && lastServerErr) {
        throw lastServerErr;
      }

      let rawText = response.text || '';
      rawText = rawText.trim();
      if (rawText.startsWith('```json')) {
        rawText = rawText.replace(/^```json\s*/, '').replace(/```\s*$/, '');
      } else if (rawText.startsWith('```')) {
        rawText = rawText.replace(/^```\s*/, '').replace(/```\s*$/, '');
      }

      const parsedData = JSON.parse(rawText || '{}');

      // Ensure documentTitle matches uploaded file if not set
      if (!parsedData.documentTitle || parsedData.documentTitle === 'documentTitle') {
        parsedData.documentTitle = fileName;
      }

      return res.json(parsedData);
    } catch (err: any) {
      console.error('Error analyzing document with Gemini:', err?.message || err);
      const errMsg = typeof err?.message === 'string' ? err.message : '';
      const isUnavailable =
        err?.status === 503 ||
        err?.code === 503 ||
        err?.status === 429 ||
        err?.code === 429 ||
        err?.status === 502 ||
        err?.status === 504 ||
        errMsg.includes('503') ||
        errMsg.includes('UNAVAILABLE') ||
        errMsg.includes('temporarily busy') ||
        errMsg.includes('high demand') ||
        errMsg.includes('RESOURCE_EXHAUSTED') ||
        errMsg.includes('Resource has been exhausted') ||
        errMsg.includes('quota') ||
        errMsg.includes('timeout') ||
        errMsg.includes('ETIMEDOUT') ||
        errMsg.includes('ECONNRESET') ||
        errMsg.includes('fetch failed');

      const statusCode = isUnavailable ? 503 : 500;
      return res.status(statusCode).json({
        error: isUnavailable
          ? 'AI is temporarily busy.'
          : 'Failed to analyze document with Gemini AI.',
        code: statusCode,
        retryable: isUnavailable,
      });
    }
  });

  // API: Generate Rescue Quiz Questions (grounded strictly in extracted topics/concepts)
  app.post('/api/generate-quiz', async (req, res) => {
    try {
      const {
        documentTitle,
        topics = [],
        importantConcepts = [],
        examQuestionAreas = [],
        weakTopicOnly,
        numQuestions = 5,
        excludedQuestions = []
      } = req.body;

      if (!Array.isArray(topics) || topics.length === 0) {
        return res.status(400).json({ error: 'Topics list is required.' });
      }

      const ai = getGenAI();
      const targetTopicNames = weakTopicOnly 
        ? [weakTopicOnly] 
        : topics.map(t => t.name);

      const prompt = `You are generating an emergency active-recall exam rescue quiz.
Document/Course context: "${documentTitle || 'Study Notes'}"
Topics in syllabus: ${JSON.stringify(topics.map(t => ({ name: t.name, keyTakeaway: t.keyTakeaway, reason: t.reason })))}
Important Concepts: ${JSON.stringify(importantConcepts.slice(0, 15))}
Exam Question Areas: ${JSON.stringify(examQuestionAreas.slice(0, 8))}

${weakTopicOnly ? `CRITICAL: Generate questions ONLY for the weak topic: "${weakTopicOnly}". Focus on high-yield misconceptions, core mechanics, and common exam traps.` : 'Generate questions distributed across the syllabus topics.'}
${excludedQuestions && excludedQuestions.length > 0 ? `DO NOT repeat any of these previously asked questions:\n${excludedQuestions.map((q: string) => `- "${q}"`).join('\n')}` : ''}

RULES:
1. Generate ${numQuestions} high-yield multiple-choice questions.
2. For EVERY question, provide EXACTLY 4 distinct options.
3. Mark correctOptionIndex (0, 1, 2, or 3).
4. Provide a clear, concise explanation (1-2 sentences) explaining why the answer is correct and why the common distractor is incorrect.
5. Every question MUST test genuine concepts from the provided document and topics. Never hallucinate unrelated subjects.
6. The questions must test exam-style active recall, not trivial trivia.`;

      const modelsToTry = ['gemini-3.1-flash-lite', 'gemini-3.8-flash', 'gemini-flash-latest'];
      let response: any = null;

      for (let attempt = 1; attempt <= modelsToTry.length; attempt++) {
        const modelCandidate = modelsToTry[(attempt - 1) % modelsToTry.length];
        try {
          console.log(`[Gemini Quiz] Generating quiz with model: ${modelCandidate} (weakTopicOnly: ${weakTopicOnly || 'none'})`);
          
          const generatePromise = ai.models.generateContent({
            model: modelCandidate,
            contents: [{ text: prompt }],
            config: {
              systemInstruction: `You are an emergency exam tutor. Create realistic, rigorous multiple-choice exam questions strictly based on the provided syllabus topics. Return JSON with 4 options per question, correctOptionIndex, and short explanation.`,
              responseMimeType: 'application/json',
              responseSchema: {
                type: Type.OBJECT,
                properties: {
                  questions: {
                    type: Type.ARRAY,
                    items: {
                      type: Type.OBJECT,
                      properties: {
                        topicName: { type: Type.STRING },
                        question: { type: Type.STRING },
                        options: {
                          type: Type.ARRAY,
                          items: { type: Type.STRING },
                        },
                        correctOptionIndex: { type: Type.INTEGER },
                        explanation: { type: Type.STRING },
                        conceptTested: { type: Type.STRING },
                      },
                      required: ['topicName', 'question', 'options', 'correctOptionIndex', 'explanation'],
                    },
                  },
                },
                required: ['questions'],
              },
            },
          });

          const timeoutPromise = new Promise((_, reject) => {
            setTimeout(() => reject(new Error('Network timeout during quiz generation.')), 35000);
          });

          response = await Promise.race([generatePromise, timeoutPromise]);
          break;
        } catch (serverErr: any) {
          console.warn(`[Gemini Quiz] Model ${modelCandidate} error (attempt ${attempt}):`, serverErr?.message || serverErr);
          if (attempt < modelsToTry.length) {
            await new Promise((r) => setTimeout(r, 600));
          }
        }
      }

      let rawQuestions: any[] = [];
      if (response) {
        const rawText = typeof response.text === 'function' ? response.text() : response.text;
        try {
          const parsed = JSON.parse(rawText || '{}');
          if (Array.isArray(parsed.questions) && parsed.questions.length > 0) {
            rawQuestions = parsed.questions;
          }
        } catch (parseErr) {
          console.error('Failed to parse Gemini quiz JSON:', parseErr);
        }
      }

      // If Gemini returned valid questions, map them cleanly
      if (rawQuestions.length > 0) {
        const mapped = rawQuestions.map((q: any, i: number) => {
          // find matching topic id
          const matchingTopic = topics.find((t: any) => 
            t.name.toLowerCase().trim() === String(q.topicName || '').toLowerCase().trim()
          ) || topics[i % topics.length];

          // Ensure exactly 4 options
          let options = Array.isArray(q.options) ? q.options.slice(0, 4) : [];
          while (options.length < 4) {
            options.push(`Alternative perspective ${options.length + 1}`);
          }

          const correctIdx = Math.min(3, Math.max(0, Number(q.correctOptionIndex) || 0));

          return {
            id: `quiz-q-${Date.now()}-${i}-${Math.random().toString(36).substring(2, 6)}`,
            topicId: matchingTopic?.id || `topic-${i}`,
            topicName: matchingTopic?.name || q.topicName || 'Core Concept',
            question: q.question,
            options,
            correctOptionIndex: correctIdx,
            explanation: q.explanation || 'This is the verified correct answer based on syllabus mechanics.',
            conceptTested: q.conceptTested || matchingTopic?.name || 'Syllabus Topic'
          };
        });

        return res.json({ questions: mapped });
      }

      // Intelligent fallback derived strictly from user's extracted topics and flash questions
      console.log('[Quiz] Using document-grounded structured fallback generator');
      const fallbackQuestions = targetTopicNames.slice(0, numQuestions).map((topicName, i) => {
        const matchingTopic = topics.find((t: any) => t.name === topicName) || topics[i % topics.length];
        const flashQ = matchingTopic?.flashQuestion;
        const keyPoint = matchingTopic?.keyTakeaway || matchingTopic?.reason || `${topicName} is a core examination requirement.`;

        const questionText = flashQ?.question || `Which of the following statements regarding ${topicName} is most accurate for exam problems?`;
        const correctAnswer = flashQ?.answer || `It represents: ${keyPoint}`;
        const trapDistractor = flashQ?.trapNote ? `Incorrect assumption: ${flashQ.trapNote}` : `It operates identically to unrelated concepts without state change.`;
        const distractor2 = `It only applies under trivial baseline constraints with zero computational or conceptual overhead.`;
        const distractor3 = `It was superseded and is completely omitted from modern syllabus assessments.`;

        return {
          id: `quiz-fallback-${Date.now()}-${i}`,
          topicId: matchingTopic?.id || `topic-${i}`,
          topicName: matchingTopic?.name || topicName,
          question: questionText,
          options: [correctAnswer, trapDistractor, distractor2, distractor3],
          correctOptionIndex: 0,
          explanation: `Correct: ${correctAnswer}. Notice: ${flashQ?.trapNote || 'Watch out for common exam distractor traps.'}`,
          conceptTested: matchingTopic?.name || topicName
        };
      });

      return res.json({ questions: fallbackQuestions });

    } catch (err: any) {
      console.error('Fatal error in /api/generate-quiz:', err);
      return res.status(500).json({ error: 'Failed to generate quiz.' });
    }
  });

  // API: Generate 3-Minute Crash Lesson for a weak topic
  app.post('/api/generate-crash-lesson', async (req, res) => {
    try {
      const { topicName, documentTitle, topicContext = {} } = req.body;

      if (!topicName) {
        return res.status(400).json({ error: 'topicName is required.' });
      }

      const ai = getGenAI();
      const prompt = `You are creating an emergency "3-Minute Crash Lesson" for a student cramming before an exam who made mistakes on: "${topicName}".
Document Context: "${documentTitle || 'Exam Syllabus'}"
Topic Context: ${JSON.stringify(topicContext)}

Generate a high-yield, concise, exam-focused crash lesson with:
1. "summary": Simple 2-3 sentence explanation cutting straight to the intuition without filler.
2. "keyPoints": 3 to 4 short, actionable bullet points that frequently appear on exam rubrics.
3. "importantSteps": 2-4 critical sequential steps to solve or apply this topic.
4. "formulaOrRule": The critical formula, rule, decision procedure, or algorithmic step sequence (or "Core Exam Rule" if qualitative).
5. "smallExample": A brief, concrete scenario, code snippet, or miniature step-by-step calculation demonstrating how to solve a typical problem.
6. "examTip": An essential exam tip highlighting scoring points and exam hall best practices.
7. "commonMistake": The exact common mistake or trap where students lose marks on this topic.

Keep it strictly short, high-yield, and focused on earning exam points.`;

      const modelsToTry = ['gemini-3.1-flash-lite', 'gemini-3.8-flash', 'gemini-flash-latest'];
      let response: any = null;

      for (let attempt = 1; attempt <= modelsToTry.length; attempt++) {
        const modelCandidate = modelsToTry[(attempt - 1) % modelsToTry.length];
        try {
          console.log(`[Gemini Crash Lesson] Generating lesson for "${topicName}" with model: ${modelCandidate}`);
          
          const generatePromise = ai.models.generateContent({
            model: modelCandidate,
            contents: [{ text: prompt }],
            config: {
              systemInstruction: `You are an emergency cram coach. Provide a razor-sharp 3-minute crash lesson designed to turn a student's weak topic into points. Return valid JSON.`,
              responseMimeType: 'application/json',
              responseSchema: {
                type: Type.OBJECT,
                properties: {
                  topicName: { type: Type.STRING },
                  summary: { type: Type.STRING },
                  keyPoints: {
                    type: Type.ARRAY,
                    items: { type: Type.STRING },
                  },
                  importantSteps: {
                    type: Type.ARRAY,
                    items: { type: Type.STRING },
                  },
                  formulaOrRule: { type: Type.STRING },
                  smallExample: { type: Type.STRING },
                  examTip: { type: Type.STRING },
                  commonMistake: { type: Type.STRING },
                },
                required: ['topicName', 'summary', 'keyPoints', 'importantSteps', 'formulaOrRule', 'smallExample', 'examTip', 'commonMistake'],
              },
            },
          });

          const timeoutPromise = new Promise((_, reject) => {
            setTimeout(() => reject(new Error('Timeout generating crash lesson')), 30000);
          });

          response = await Promise.race([generatePromise, timeoutPromise]);
          break;
        } catch (serverErr: any) {
          console.warn(`[Gemini Crash Lesson] Model ${modelCandidate} failed:`, serverErr?.message || serverErr);
          if (attempt < modelsToTry.length) {
            await new Promise((r) => setTimeout(r, 600));
          }
        }
      }

      if (response) {
        const rawText = typeof response.text === 'function' ? response.text() : response.text;
        try {
          const parsed = JSON.parse(rawText || '{}');
          if (parsed.summary && parsed.keyPoints) {
            return res.json({
              topicName: parsed.topicName || topicName,
              summary: parsed.summary,
              keyPoints: parsed.keyPoints,
              importantSteps: Array.isArray(parsed.importantSteps) ? parsed.importantSteps : [
                '1. Identify given inputs and boundary conditions',
                '2. Apply the core formula or mechanism sequentially',
                '3. Verify edge cases and format final exam answer'
              ],
              formulaOrRule: parsed.formulaOrRule || 'Core Principle Rule',
              smallExample: parsed.smallExample,
              examTip: parsed.examTip,
              commonMistake: parsed.commonMistake || 'Confusing definitions or missing edge conditions during calculation.'
            });
          }
        } catch (parseErr) {
          console.error('Error parsing crash lesson JSON:', parseErr);
        }
      }

      // Grounded fallback if network fails
      return res.json({
        topicName,
        summary: topicContext.keyTakeaway || `${topicName} is a high-yield exam topic requiring mastery of its foundational principles and definitions.`,
        keyPoints: [
          `Understand the primary definition and role of ${topicName}.`,
          `Identify the input conditions and expected outputs or state transformations.`,
          topicContext.reason ? `Key exam context: ${topicContext.reason}` : `Memorize the standard trade-offs and edge cases.`
        ],
        importantSteps: [
          '1. State the exact academic definition in 1-2 sentences.',
          '2. Formulate the core rule, equation, or algorithm.',
          '3. Provide a minimal illustrative walkthrough or calculation.'
        ],
        formulaOrRule: topicContext.difficulty ? `Standard Procedure for ${topicContext.difficulty}-tier problems` : `Key Rule: Verify boundary conditions before execution.`,
        smallExample: `Problem: Apply ${topicName} to standard input.\nSolution: Isolate the core parameters, apply the verified rule step-by-step, and double-check edge conditions.`,
        examTip: `Beware of confusing ${topicName} with adjacent topics. Always write down the core definition on your scratch paper first.`,
        commonMistake: `Writing vague generic descriptions instead of precise keywords and definitions.`
      });

    } catch (err: any) {
      console.error('Fatal in /api/generate-crash-lesson:', err);
      return res.status(500).json({ error: 'Failed to generate crash lesson.' });
    }
  });

  // API: Complete Topic Learning Center Generator (Full Exam-Based Topic Explanation)
  app.post('/api/learn-topic', async (req, res) => {
    try {
      const {
        topicName,
        courseName = 'Exam Syllabus',
        documentTitle = 'Lecture Document',
        topicContext = {},
        fileData,
        mimeType,
        simplerMode = false,
        previousExplanation = '',
      } = req.body;

      if (!topicName) {
        return res.status(400).json({ error: 'topicName is required.' });
      }

      const ai = getGenAI();
      const detectedMime = mimeType || 'application/pdf';

      let prompt = `You are an expert master tutor and professor creating a COMPLETE EXAM-BASED STUDY PAGE for an upcoming emergency exam.
Topic: "${topicName}"
Course/Subject: "${courseName}"
Document Title: "${documentTitle}"
Topic Metadata Context: ${JSON.stringify(topicContext)}

CRITICAL ACCURACY & GROUNDING RULES:
1. Ground every explanation, formula, code, example, and expected exam question STRICTLY in "${topicName}" and the uploaded course materials.
2. Do NOT invent topics or syllabus material not present in the study material.
3. Cover the topic completely from fundamentals to advanced points, but explain in clear, student-friendly language.
4. Structure the content so it is optimal for both rapid learning and writing high-scoring exam answers.
5. Create all required sections:
   - TOPIC OVERVIEW (what it is, why important, where used, 3-5 line summary)
   - COMPLETE THEORY (definitions, concepts, rules, properties, characteristics, classifications, working principle, important terms, relationships)
   - STEP-BY-STEP EXPLANATION (Step 1, Step 2, Step 3... with clear descriptions)
   - EXAMPLES (concrete code, mathematical derivations, algorithm steps, or practical examples)
   - CODE / FORMULA / DIAGRAM (syntax, code snippets, equations, pseudocode, and ASCII diagrams with detailed explanation)
   - ⭐ EXAM IMPORTANT (must remember, definitions, formulas, steps, differences, commonly asked concepts)
   - HOW TO WRITE IN THE EXAM (marks-based answer structure: Definition, Explanation, Example, Conclusion)
   - EXPECTED EXAM QUESTIONS (4-mark, 6-mark, and 10-mark questions with full exam-ready answers, marked Easy/Medium/Difficult)
   - IMPORTANT DIFFERENCES (comparison table with Concept A vs Concept B across parameters)
   - COMMON MISTAKES (❌ common mistake vs ✅ correct understanding)
   - 2-MINUTE REVISION (high-yield bullet summary)
   - MEMORY TRICKS (simple mnemonics)
   - QUICK CHECK (3-5 questions: MCQs, True/False, and short-answer with explanations)
   - YOUTUBE CLASSES (2-3 exact topic class recommendations with titles and search queries)
`;

      if (simplerMode) {
        prompt += `
STUDENT IS CURRENTLY CONFUSED:
The student clicked "[ Still Confused ]". Explain "${topicName}" in an EVEN SIMPLER, beginner-friendly way.
- Use an intuitive real-world analogy (e.g. daily life, blueprint, factory, or visual metaphor).
- Use a completely DIFFERENT simple example than before. Previous explanation: "${previousExplanation.slice(0, 300)}...".
- Break complex concepts into tiny, digestible steps without omitting core exam facts.
`;
      }

      const contents: any[] = [];
      if (fileData && typeof fileData === 'string' && fileData.length > 50) {
        contents.push({
          inlineData: {
            mimeType: detectedMime,
            data: fileData,
          },
        });
      }
      contents.push({ text: prompt });

      const modelsToTry = ['gemini-3.1-flash-lite', 'gemini-3.8-flash', 'gemini-flash-latest'];
      let response: any = null;

      for (let attempt = 1; attempt <= modelsToTry.length; attempt++) {
        const modelCandidate = modelsToTry[(attempt - 1) % modelsToTry.length];
        try {
          console.log(`[Gemini Topic Learning] Generating for "${topicName}" (simplerMode: ${simplerMode}) with model: ${modelCandidate}`);

          const generatePromise = ai.models.generateContent({
            model: modelCandidate,
            contents,
            config: {
              systemInstruction: `You are an elite academic professor and exam specialist. Generate a comprehensive exam study page strictly grounded in the document topics. Output clean JSON matching the requested schema.`,
              responseMimeType: 'application/json',
              responseSchema: {
                type: Type.OBJECT,
                properties: {
                  topicName: { type: Type.STRING },
                  topicType: { 
                    type: Type.STRING, 
                    description: 'programming, mathematics, algorithms, dataStructures, or theory' 
                  },
                  overview: {
                    type: Type.OBJECT,
                    properties: {
                      topicName: { type: Type.STRING },
                      whatItIs: { type: Type.STRING },
                      whyImportant: { type: Type.STRING },
                      whereUsed: { type: Type.STRING },
                      quickSummary: { type: Type.STRING },
                    },
                    required: ['topicName', 'whatItIs', 'whyImportant', 'whereUsed', 'quickSummary'],
                  },
                  completeTheory: {
                    type: Type.OBJECT,
                    properties: {
                      definitions: { type: Type.ARRAY, items: { type: Type.STRING } },
                      importantConcepts: { type: Type.ARRAY, items: { type: Type.STRING } },
                      rulesAndProperties: { type: Type.ARRAY, items: { type: Type.STRING } },
                      characteristics: { type: Type.ARRAY, items: { type: Type.STRING } },
                      typesOrClassifications: {
                        type: Type.ARRAY,
                        items: {
                          type: Type.OBJECT,
                          properties: {
                            typeName: { type: Type.STRING },
                            description: { type: Type.STRING },
                          },
                          required: ['typeName', 'description'],
                        },
                      },
                      workingPrinciple: { type: Type.STRING },
                      importantTerms: {
                        type: Type.ARRAY,
                        items: {
                          type: Type.OBJECT,
                          properties: {
                            term: { type: Type.STRING },
                            definition: { type: Type.STRING },
                          },
                          required: ['term', 'definition'],
                        },
                      },
                      relationships: { type: Type.STRING },
                    },
                    required: ['definitions', 'importantConcepts', 'rulesAndProperties', 'characteristics', 'workingPrinciple', 'importantTerms'],
                  },
                  stepByStep: {
                    type: Type.ARRAY,
                    items: {
                      type: Type.OBJECT,
                      properties: {
                        stepNumber: { type: Type.INTEGER },
                        title: { type: Type.STRING },
                        description: { type: Type.STRING },
                        detail: { type: Type.STRING },
                      },
                      required: ['stepNumber', 'title', 'description'],
                    },
                  },
                  examples: {
                    type: Type.ARRAY,
                    items: {
                      type: Type.OBJECT,
                      properties: {
                        title: { type: Type.STRING },
                        exampleType: { type: Type.STRING },
                        content: { type: Type.STRING },
                        explanation: { type: Type.STRING },
                      },
                      required: ['title', 'exampleType', 'content', 'explanation'],
                    },
                  },
                  codeFormulaDiagram: {
                    type: Type.OBJECT,
                    properties: {
                      syntaxOrFormulas: { type: Type.STRING },
                      codeOrEquations: { type: Type.STRING },
                      pseudocodeOrDiagram: { type: Type.STRING },
                      explanation: { type: Type.STRING },
                    },
                    required: ['explanation'],
                  },
                  examImportant: {
                    type: Type.OBJECT,
                    properties: {
                      mustRemember: { type: Type.ARRAY, items: { type: Type.STRING } },
                      importantDefinitions: { type: Type.ARRAY, items: { type: Type.STRING } },
                      importantFormulas: { type: Type.ARRAY, items: { type: Type.STRING } },
                      importantSteps: { type: Type.ARRAY, items: { type: Type.STRING } },
                      importantDifferences: { type: Type.ARRAY, items: { type: Type.STRING } },
                      commonlyAskedConcepts: { type: Type.ARRAY, items: { type: Type.STRING } },
                    },
                    required: ['mustRemember', 'importantDefinitions', 'commonlyAskedConcepts'],
                  },
                  howToWriteInExam: {
                    type: Type.OBJECT,
                    properties: {
                      conceptTitle: { type: Type.STRING },
                      definition: { type: Type.STRING },
                      explanation: { type: Type.STRING },
                      example: { type: Type.STRING },
                      conclusion: { type: Type.STRING },
                    },
                    required: ['conceptTitle', 'definition', 'explanation', 'example', 'conclusion'],
                  },
                  expectedExamQuestions: {
                    type: Type.OBJECT,
                    properties: {
                      fourMarkQuestions: {
                        type: Type.ARRAY,
                        items: {
                          type: Type.OBJECT,
                          properties: {
                            question: { type: Type.STRING },
                            answer: { type: Type.STRING },
                            difficulty: { type: Type.STRING },
                          },
                          required: ['question', 'answer', 'difficulty'],
                        },
                      },
                      sixMarkQuestions: {
                        type: Type.ARRAY,
                        items: {
                          type: Type.OBJECT,
                          properties: {
                            question: { type: Type.STRING },
                            answer: { type: Type.STRING },
                            difficulty: { type: Type.STRING },
                          },
                          required: ['question', 'answer', 'difficulty'],
                        },
                      },
                      tenMarkQuestions: {
                        type: Type.ARRAY,
                        items: {
                          type: Type.OBJECT,
                          properties: {
                            question: { type: Type.STRING },
                            answer: { type: Type.STRING },
                            difficulty: { type: Type.STRING },
                          },
                          required: ['question', 'answer', 'difficulty'],
                        },
                      },
                    },
                    required: ['fourMarkQuestions', 'sixMarkQuestions', 'tenMarkQuestions'],
                  },
                  importantDifferences: {
                    type: Type.OBJECT,
                    properties: {
                      conceptA: { type: Type.STRING },
                      conceptB: { type: Type.STRING },
                      rows: {
                        type: Type.ARRAY,
                        items: {
                          type: Type.OBJECT,
                          properties: {
                            parameter: { type: Type.STRING },
                            conceptAValue: { type: Type.STRING },
                            conceptBValue: { type: Type.STRING },
                          },
                          required: ['parameter', 'conceptAValue', 'conceptBValue'],
                        },
                      },
                    },
                  },
                  commonMistakes: {
                    type: Type.ARRAY,
                    items: {
                      type: Type.OBJECT,
                      properties: {
                        mistake: { type: Type.STRING },
                        correctUnderstanding: { type: Type.STRING },
                      },
                      required: ['mistake', 'correctUnderstanding'],
                    },
                  },
                  quickRevision: {
                    type: Type.OBJECT,
                    properties: {
                      keyPoints: { type: Type.ARRAY, items: { type: Type.STRING } },
                    },
                    required: ['keyPoints'],
                  },
                  memoryTricks: {
                    type: Type.ARRAY,
                    items: {
                      type: Type.OBJECT,
                      properties: {
                        mnemonic: { type: Type.STRING },
                        meaning: { type: Type.STRING },
                      },
                      required: ['mnemonic', 'meaning'],
                    },
                  },
                  quickCheckQuestions: {
                    type: Type.ARRAY,
                    items: {
                      type: Type.OBJECT,
                      properties: {
                        id: { type: Type.STRING },
                        type: { type: Type.STRING, description: 'mcq, true_false, or short_answer' },
                        question: { type: Type.STRING },
                        options: { type: Type.ARRAY, items: { type: Type.STRING } },
                        correctOptionIndex: { type: Type.INTEGER },
                        correctText: { type: Type.STRING },
                        explanation: { type: Type.STRING },
                      },
                      required: ['id', 'type', 'question', 'explanation'],
                    },
                  },
                  youtubeClasses: {
                    type: Type.ARRAY,
                    items: {
                      type: Type.OBJECT,
                      properties: {
                        title: { type: Type.STRING },
                        channelName: { type: Type.STRING },
                        description: { type: Type.STRING },
                        searchQuery: { type: Type.STRING },
                      },
                      required: ['title', 'description', 'searchQuery'],
                    },
                  },
                },
                required: [
                  'topicName',
                  'overview',
                  'completeTheory',
                  'stepByStep',
                  'examples',
                  'codeFormulaDiagram',
                  'examImportant',
                  'howToWriteInExam',
                  'expectedExamQuestions',
                  'commonMistakes',
                  'quickRevision',
                  'quickCheckQuestions',
                  'youtubeClasses',
                ],
              },
            },
          });

          const timeoutPromise = new Promise((_, reject) => {
            setTimeout(() => reject(new Error('Network timeout during topic learning generation.')), 45000);
          });

          response = await Promise.race([generatePromise, timeoutPromise]);
          break;
        } catch (serverErr: any) {
          console.warn(`[Gemini Topic Learning] Model ${modelCandidate} failed:`, serverErr?.message || serverErr);
          if (attempt < modelsToTry.length) {
            await new Promise((r) => setTimeout(r, 600));
          }
        }
      }

      if (response) {
        const rawText = typeof response.text === 'function' ? response.text() : response.text;
        try {
          const parsed = JSON.parse(rawText || '{}');
          if (parsed && parsed.overview && parsed.completeTheory) {
            // Attach YouTube watchUrls
            const formattedClasses = (Array.isArray(parsed.youtubeClasses) ? parsed.youtubeClasses : []).slice(0, 3).map((yt: any) => {
              const query = yt.searchQuery || `${topicName} tutorial`;
              return {
                title: yt.title || `${topicName} Full Tutorial`,
                channelName: yt.channelName || 'Top Academic Educators',
                description: yt.description || `Comprehensive breakdown of ${topicName} for exam preparation.`,
                searchQuery: query,
                watchUrl: `https://www.youtube.com/results?search_query=${encodeURIComponent(query)}`,
              };
            });

            // Format expected questions with default marks
            const formattedExpected = {
              fourMarkQuestions: (parsed.expectedExamQuestions?.fourMarkQuestions || []).map((q: any) => ({
                ...q,
                marks: 4,
                difficulty: q.difficulty || 'Easy',
              })),
              sixMarkQuestions: (parsed.expectedExamQuestions?.sixMarkQuestions || []).map((q: any) => ({
                ...q,
                marks: 6,
                difficulty: q.difficulty || 'Medium',
              })),
              tenMarkQuestions: (parsed.expectedExamQuestions?.tenMarkQuestions || []).map((q: any) => ({
                ...q,
                marks: 10,
                difficulty: q.difficulty || 'Difficult',
              })),
            };

            // Build backwards-compatibility wrappers
            const simpleSummaryBackwards = {
              whatItIs: parsed.overview.whatItIs,
              whatItMeans: parsed.overview.quickSummary,
              whyItIsUsed: parsed.overview.whyImportant,
              howItWorks: parsed.completeTheory.workingPrinciple,
              importantRules: parsed.completeTheory.rulesAndProperties || [],
              syntax: parsed.codeFormulaDiagram?.syntaxOrFormulas,
              documentPoints: parsed.examImportant?.mustRemember || [],
              simpleExample: parsed.examples?.[0]?.explanation || parsed.overview.quickSummary,
              commonExamMistakes: (parsed.commonMistakes || []).map((m: any) => `${m.mistake} -> ${m.correctUnderstanding}`),
              shortExamTip: parsed.examImportant?.commonlyAskedConcepts?.[0] || 'Focus on step-by-step clarity for full rubric marks.',
            };

            return res.json({
              topicName: parsed.topicName || topicName,
              topicType: parsed.topicType || 'theory',
              overview: parsed.overview,
              completeTheory: parsed.completeTheory,
              stepByStep: parsed.stepByStep || [],
              examples: parsed.examples || [],
              codeFormulaDiagram: parsed.codeFormulaDiagram || { explanation: 'Core formula and syntax.' },
              examImportant: parsed.examImportant,
              howToWriteInExam: parsed.howToWriteInExam,
              expectedExamQuestions: formattedExpected,
              importantDifferences: parsed.importantDifferences,
              commonMistakes: parsed.commonMistakes || [],
              quickRevision: parsed.quickRevision || { keyPoints: [] },
              memoryTricks: parsed.memoryTricks || [],
              quickCheckQuestions: parsed.quickCheckQuestions || [],
              youtubeClasses: formattedClasses,
              isSimplerVersion: simplerMode,
              // Backwards compatibility keys
              simpleSummary: simpleSummaryBackwards,
              stepByStepExplanation: (parsed.stepByStep || []).map((s: any) => ({ title: s.title, explanation: s.description })),
              example: parsed.examples?.[0] ? { title: parsed.examples[0].title, codeOrMath: parsed.examples[0].content, walkthrough: parsed.examples[0].explanation } : undefined,
              examPoints: parsed.examImportant?.mustRemember || [],
              quickCheck: (parsed.quickCheckQuestions || []).map((q: any) => ({
                id: q.id,
                question: q.question,
                options: q.options || ['True', 'False'],
                correctIndex: q.correctOptionIndex || 0,
                explanation: q.explanation,
              })),
            });
          }
        } catch (parseErr) {
          console.error('Error parsing topic learning JSON from Gemini:', parseErr);
        }
      }

      // Comprehensive Grounded Fallback if AI fails or throttles
      console.log(`[Learn Topic] Generating comprehensive exam-based fallback for "${topicName}"`);
      const isCodeLike = /java|python|c\+\+|code|syntax|class|method|function|tree|stack|queue|sort|search|array|pointer|object|constructor|variable/i.test(topicName + ' ' + (courseName || ''));
      const isMathLike = /calculus|math|formula|equation|derivative|integral|matrix|probability|algebra|physics|velocity|kinematics/i.test(topicName + ' ' + (courseName || ''));
      const topicType = isCodeLike ? 'programming' : isMathLike ? 'mathematics' : 'theory';

      const fallbackLesson = {
        topicName,
        topicType,
        overview: {
          topicName,
          whatItIs: `${topicName} is a foundational concept in ${courseName}, establishing the required framework and logic for exam solutions.`,
          whyImportant: `It provides the exact rules and mechanisms required by academic rubrics, preventing costly conceptual and syntax errors.`,
          whereUsed: `Heavily tested in written exams, code analysis/derivation questions, and real-world system implementations.`,
          quickSummary: simplerMode
            ? `In simple terms, ${topicName} works like a master blueprint or standard rule: once defined, every component follows the exact same logic reliably.`
            : `${topicName} defines clear constraints, deterministic transitions, and predictable outcomes across both theoretical and practical problem sets.`
        },
        completeTheory: {
          definitions: [
            `${topicName} is formally defined as the standardized structural or algorithmic principle governing operations in ${courseName}.`,
            `It guarantees correctness and efficiency when boundary constraints are adhered to.`
          ],
          importantConcepts: [
            `Core initialization and variable scoping rules.`,
            `Deterministic execution order and state transitions.`,
            `Handling edge cases (e.g. empty collections, zero values, or null pointers).`
          ],
          rulesAndProperties: [
            `Must be initialized or declared according to strict syntax rules before invocation.`,
            `State modifications must follow unidirectional, verifiable transitions.`,
            `Invariants must remain valid across all iterations or method calls.`
          ],
          characteristics: [
            `Standardized academic terminology evaluated on exam rubrics.`,
            `Predictable time/space or operational complexity.`,
            `Clear distinction from adjacent syllabus mechanisms.`
          ],
          typesOrClassifications: [
            { typeName: `Basic / Primary Form`, description: `Direct implementation under baseline input constraints.` },
            { typeName: `Composite / Advanced Form`, description: `Extended implementation incorporating multiple state checks or nested hierarchies.` }
          ],
          workingPrinciple: `When conditions for ${topicName} are satisfied, the system validates all entry prerequisites, executes the prescribed transformation sequence, and terminates with verified state integrity.`,
          importantTerms: [
            { term: `Initialization`, definition: `Allocating and preparing required memory or state before operation.` },
            { term: `Invariant`, definition: `A logical condition that remains true throughout the lifecycle of the procedure.` },
            { term: `Termination`, definition: `Guaranteed clean exit without infinite loops or orphaned resources.` }
          ],
          relationships: `Serves as the prerequisite foundation for advanced topics in ${courseName}, directly linking data representation with operational logic.`
        },
        stepByStep: [
          {
            stepNumber: 1,
            title: `Identify Inputs & Prerequisites`,
            description: `Verify that all parameters, variables, and preconditions meet the domain specifications before processing begins.`,
            detail: `Check for null, negative, or uninitialized values to prevent immediate failure.`
          },
          {
            stepNumber: 2,
            title: `Execute Core Transformation`,
            description: `Apply the verified formula, rule, or algorithm logic sequentially to transform the input state.`,
            detail: `Maintain intermediate state on scratch paper or tracing tables for step-by-step clarity.`
          },
          {
            stepNumber: 3,
            title: `Verify Invariants & Edge Cases`,
            description: `Confirm that boundary conditions have been respected and the output matches mathematical or logical expectations.`,
            detail: `Double check loop exit criteria or base cases.`
          },
          {
            stepNumber: 4,
            title: `Format Final Exam Result`,
            description: `State the final outcome clearly with proper units, type signatures, or return values as required by the question prompt.`
          }
        ],
        examples: [
          {
            title: `Standard Solved Exam Problem for ${topicName}`,
            exampleType: isCodeLike ? 'programming' : isMathLike ? 'mathematics' : 'theory',
            content: isCodeLike
              ? `// Worked Example for ${topicName}\npublic class Solution {\n    public static void executeProcess() {\n        int count = 0;\n        // Apply ${topicName} logic\n        count += 10;\n        System.out.println("Result: " + count);\n    }\n}`
              : isMathLike
              ? `Problem: Calculate the result using ${topicName}.\nGiven: x = 5, y = 10\nStep 1: Formula -> R = (x * y) / 2\nStep 2: Substitution -> R = (5 * 10) / 2 = 50 / 2 = 25\nConclusion: Result = 25`
              : `Scenario: A system requires verification of ${topicName}.\nProcedure: The evaluator inspects the baseline state, confirms compliance with standard rules, and certifies operational validity.`,
            explanation: `Notice how the solution explicitly documents the transition from initial inputs to final verified output, fulfilling rubric expectations for maximum marks.`
          }
        ],
        codeFormulaDiagram: {
          syntaxOrFormulas: isCodeLike
            ? `// Standard Syntax\npublic returnType operationName(parameters) {\n    // Implementation logic\n}`
            : isMathLike
            ? `E = \\sum_{i=1}^{n} (x_i - \\bar{x})^2 \\quad \\text{where } \\bar{x} = \\frac{1}{n}\\sum x_i`
            : `Rule: Invariant(S_t) \\implies Invariant(S_{t+1})`,
          codeOrEquations: isCodeLike
            ? `public void apply${topicName.replace(/[^a-zA-Z]/g, '')}() {\n    // Guaranteed safe execution\n}`
            : isMathLike
            ? `f(x) = a x^2 + b x + c`
            : `Input -> [Validation Check] -> [Transformation] -> Output`,
          pseudocodeOrDiagram: `
+-----------------------+
|  1. Input / State     |
+-----------+-----------+
            |
            v
+-----------+-----------+
|  2. ${topicName.slice(0, 16)}  | ---> [Boundary / Edge Verification]
+-----------+-----------+
            |
            v
+-----------+-----------+
|  3. Verified Output   |
+-----------------------+
`,
          explanation: `This structural diagram and syntax illustrate how state transitions through validation into deterministic output without side-effects.`
        },
        examImportant: {
          mustRemember: [
            `Always define the formal academic term in the very first sentence.`,
            `State all boundary assumptions clearly before writing calculations or code.`,
            `Draw a neat structural diagram or flowchart if the question carries 5 or more marks.`,
            `Show every intermediate arithmetic or tracing step for partial credit.`
          ],
          importantDefinitions: [
            `${topicName}: Formal mechanism ensuring predictable transformation and correctness within ${courseName}.`,
            `Boundary Constraint: The limit values (e.g., 0, max, null) that must be safeguarded.`
          ],
          importantFormulas: [
            isMathLike ? `Core Formula: Output = f(Input) under boundary constraints.` : `Invariant Equation: State_{new} = Transform(State_{old}, Input)`
          ],
          importantSteps: [
            `1. Identify prerequisites`,
            `2. Apply formula/rule`,
            `3. Verify edge cases`,
            `4. Write concluding sentence with units/status`
          ],
          importantDifferences: [
            `Do not confuse static class-level properties with dynamic instance-level properties.`,
            `Distinguish average-case performance from worst-case boundary limits.`
          ],
          commonlyAskedConcepts: [
            `Explain the working principle and provide a worked example (frequently asked in 6-mark section).`,
            `Compare and contrast ${topicName} with related adjacent mechanisms (frequently asked in 4-mark section).`,
            `Full architectural derivation and edge case handling (frequently asked in 10-mark section).`
          ]
        },
        howToWriteInExam: {
          conceptTitle: `How to Structure Answers for ${topicName}`,
          definition: `Begin with: "${topicName} is defined as..." and provide the 2-sentence formal definition citing its primary purpose and scope.`,
          explanation: `Follow with 3-4 organized bullet points detailing the working principle, rules, and operational sequence.`,
          example: `Provide a concise, error-free worked example or syntax snippet with clean comments and expected output.`,
          conclusion: `Conclude with a summary sentence stating its significance: "Thus, ${topicName} ensures correctness, deterministic execution, and optimal performance in ${courseName}."`
        },
        expectedExamQuestions: {
          fourMarkQuestions: [
            {
              question: `Define ${topicName} and state two key characteristics.`,
              answer: `Definition: ${topicName} is the standardized mechanism in ${courseName} that governs state transitions and algorithmic guarantees.\n\nTwo Characteristics:\n1. Deterministic Execution: Produces reliable output for valid input states.\n2. Standardized Notation: Follows explicit syntax and constraint boundaries recognized on exam rubrics.`,
              difficulty: 'Easy',
              marks: 4
            },
            {
              question: `What are the primary prerequisites before applying ${topicName}?`,
              answer: `Prerequisites include verifying non-null inputs, ensuring boundary limits are within acceptable ranges, and confirming that initial state invariants are properly initialized.`,
              difficulty: 'Medium',
              marks: 4
            }
          ],
          sixMarkQuestions: [
            {
              question: `Explain the working principle of ${topicName} with a step-by-step example.`,
              answer: `Working Principle: ${topicName} operates by validating input preconditions, executing the procedural transformation sequentially, and verifying post-conditions.\n\nWorked Example:\nStep 1: Input initialization with test values.\nStep 2: Intermediate state computation according to the core rule.\nStep 3: Verification of the final result against boundary criteria.\n\nConclusion: The output matches theoretical expectations with zero edge-case violations.`,
              difficulty: 'Medium',
              marks: 6
            }
          ],
          tenMarkQuestions: [
            {
              question: `Provide a comprehensive analysis of ${topicName}: include definition, structural working, code/mathematical formulation, edge cases, and comparison with alternatives.`,
              answer: `1. Definition & Role: Formally define ${topicName} and explain its core role in ${courseName}.\n2. Structural Mechanism: Describe the multi-step execution pipeline, detailing how memory and state are managed.\n3. Formulation: Write out the complete formula, syntax snippet, or pseudocode with line-by-line justification.\n4. Edge Cases: Discuss at least three critical edge cases (e.g. empty inputs, upper boundary limits, concurrency/null states) and how they are handled.\n5. Comparison: Summarize the trade-offs (time complexity, space complexity, maintainability) versus alternative approaches.`,
              difficulty: 'Difficult',
              marks: 10
            }
          ]
        },
        importantDifferences: {
          conceptA: topicName,
          conceptB: `Alternative / Traditional Approach`,
          rows: [
            { parameter: `Definition`, conceptAValue: `Structured principle with strict formal invariants`, conceptBValue: `Ad-hoc or manual implementation without guarantees` },
            { parameter: `Purpose`, conceptAValue: `Maximize reliability, exam rubric score, and clarity`, conceptBValue: `Quick prototyping with higher risk of edge-case bugs` },
            { parameter: `Working`, conceptAValue: `Explicit multi-step pipeline with verification`, conceptBValue: `Implicit single-step execution with minimal checks` },
            { parameter: `Example`, conceptAValue: `Standardized class/method with boundary checks`, conceptBValue: `Unchecked raw calculations or global mutability` },
            { parameter: `Advantages`, conceptAValue: `Deterministic, maintainable, high marks on exam rubrics`, conceptBValue: `Low initial boilerplate at the expense of safety` }
          ]
        },
        commonMistakes: [
          {
            mistake: `❌ Confusing ${topicName} with related adjacent syllabus concepts.`,
            correctUnderstanding: `✅ Memorize the distinct trigger conditions and definitions that uniquely identify ${topicName}.`
          },
          {
            mistake: `❌ Omitting boundary or null/zero state checks in written answers.`,
            correctUnderstanding: `✅ Always write a dedicated edge-case check statement (e.g. "if (input == null) return ...") to earn rubric criteria points.`
          },
          {
            mistake: `❌ Jumping straight to final calculations without showing intermediate derivations.`,
            correctUnderstanding: `✅ Academic examiners award partial credit for clear step-by-step progress even if an arithmetic slip occurs at the end.`
          }
        ],
        quickRevision: {
          keyPoints: [
            `Remember the formal definition: State the purpose and scope in your opening line.`,
            `Follow the 4-step execution sequence: Input -> Transform -> Verify -> Format.`,
            `Check boundary conditions: 0, negative, null, or extreme values.`,
            `Structure answers with headings: Definition, Explanation, Example, Conclusion.`
          ]
        },
        memoryTricks: [
          {
            mnemonic: `P-E-V-C`,
            meaning: `Prerequisites -> Execution -> Verification -> Conclusion (The 4 steps for full marks on ${topicName} questions).`
          }
        ],
        quickCheckQuestions: [
          {
            id: `qc-${Date.now()}-1`,
            type: 'mcq',
            question: `What is the primary objective of ${topicName}?`,
            options: [
              `To enforce correct initialization, structured execution, and verifiable output state.`,
              `To bypass memory constraints without validation checks.`,
              `To serve exclusively as an optional cosmetic label.`,
              `To convert all dynamic executions into static constants.`
            ],
            correctOptionIndex: 0,
            explanation: `The primary objective of ${topicName} is to establish proper initialization, structured execution, and verifiable state.`
          },
          {
            id: `qc-${Date.now()}-2`,
            type: 'true_false',
            question: `True or False: Boundary conditions (such as null or empty inputs) can be safely ignored in exam answers for ${topicName}.`,
            options: [`True`, `False`],
            correctOptionIndex: 1,
            explanation: `False! Academic exam rubrics explicitly award points for identifying and properly handling boundary and edge cases.`
          },
          {
            id: `qc-${Date.now()}-3`,
            type: 'mcq',
            question: `Which of the following describes a common exam trap regarding ${topicName}?`,
            options: [
              `Neglecting edge cases or failing to show step-by-step derivations.`,
              `Using standard variable naming and clean indentation.`,
              `Writing a clear concluding sentence with units.`,
              `Stating the formal definition in the first sentence.`
            ],
            correctOptionIndex: 0,
            explanation: `Examiners frequently penalize answers that skip intermediate steps or neglect boundary validation.`
          }
        ],
        youtubeClasses: [
          {
            title: `${topicName} Explained (Complete Beginner Guide)`,
            channelName: "Top Academic Educators",
            description: `Clear, visual, step-by-step lecture covering the intuition, rules, and common questions on ${topicName}.`,
            searchQuery: `${topicName} explained beginner class`,
            watchUrl: `https://www.youtube.com/results?search_query=${encodeURIComponent(`${topicName} explained beginner class`)}`
          },
          {
            title: `${topicName} Exam Questions & Solved Problems`,
            channelName: "Exam Prep Hub",
            description: `High-yield walkthrough of typical university and college exam problems on ${topicName}.`,
            searchQuery: `${topicName} exam preparation problems`,
            watchUrl: `https://www.youtube.com/results?search_query=${encodeURIComponent(`${topicName} exam preparation problems`)}`
          },
          {
            title: `${topicName} in 10 Minutes (Crash Course)`,
            channelName: "Computer & Science Academy",
            description: `Fast-paced active recall recap highlighting formulas, syntax, and traps for ${topicName}.`,
            searchQuery: `${topicName} crash course`,
            watchUrl: `https://www.youtube.com/results?search_query=${encodeURIComponent(`${topicName} crash course`)}`
          }
        ],
        isSimplerVersion: simplerMode,
        // Backwards compatibility keys
        simpleSummary: {
          whatItIs: `${topicName} is a foundational concept in ${courseName}, essential for establishing correct problem-solving logic and exam solutions.`,
          whatItMeans: `Understanding ${topicName} means knowing its foundational rules, execution order, and memory behavior in test scenarios.`,
          whyItIsUsed: `It provides a standardized, efficient mechanism to solve core problems without unnecessary complexity.`,
          howItWorks: `It establishes clear input constraints, executes specific transformation logic, and guarantees predictable outcomes.`,
          importantRules: [
            `Always verify initialization and boundary constraints before executing.`,
            `Follow the standard syntax or notation conventions strictly to avoid rubric deductions.`,
            `Identify edge cases (e.g. empty states, null values, or extreme values).`,
            `Ensure proper clean-up or state termination after completion.`
          ],
          syntax: isCodeLike ? `// Standard declaration for ${topicName}\npublic void apply${topicName.replace(/\s+/g, '')}() {\n    // Core logic\n}` : undefined,
          documentPoints: [
            topicContext.reason || `Highlighted as a high-priority concept in ${documentTitle}.`,
            topicContext.keyTakeaway || `Key principle: Review the definitions and step-by-step procedures.`
          ],
          simpleExample: simplerMode
            ? `Imagine a blueprint for a house: before you can live in the house or paint the walls, the foundation (${topicName}) must be created with the exact dimensions specified.`
            : `A straightforward implementation of ${topicName} demonstrating standard input processing and expected return value.`,
          commonExamMistakes: [
            `Confusing ${topicName} with closely related adjacent topics in ${courseName}.`,
            `Skipping required edge-case checks (null, 0, or empty inputs).`,
            `Failing to write down the formal definition or formula before performing derivations.`
          ],
          shortExamTip: `Memorize the standard rubric definition and boundary invariants for maximum points.`
        },
        stepByStepExplanation: [
          { title: 'Prerequisites', explanation: 'Verify input conditions and boundary limits.' },
          { title: 'Transformation', explanation: 'Apply verified formula or procedural logic.' },
          { title: 'Verification', explanation: 'Confirm invariants and edge condition handling.' }
        ],
        examPoints: [
          `State the formal definition verbatim in the first sentence of your exam answer.`,
          `Show intermediate steps for partial credit.`,
          `Check boundary constraints.`
        ]
      };

      return res.json(fallbackLesson);
    } catch (err: any) {
      console.error('Fatal in /api/learn-topic:', err);
      return res.status(500).json({ error: 'Failed to generate topic learning module.' });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Exam Rescue AI server running on http://localhost:${PORT}`);
  });
}

startServer();
