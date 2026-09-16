import { ExamRescuePlan } from '../types';

export const INITIAL_RESCUE_PLAN: ExamRescuePlan = {
  courseName: 'CS 201: Data Structures & Algorithms',
  examTitle: 'Midterm Examination',
  examDate: 'Tomorrow at 9:00 AM',
  totalHoursLeft: 4.5,
  readinessPercentage: 62,
  topics: [
    {
      id: 'topic-static-vars',
      name: 'Static Variables',
      priority: 'high',
      importance: 88,
      recommendedMinutes: 20,
      tags: ['Class-Level Scope', 'Memory Allocation', 'Common Exam Trap'],
      completed: false,
      scoreYieldPoints: 14,
      examQuestionType: 'Code Tracing & Memory Diagnostics',
      keyTakeaway: 'Static variables belong to the class itself rather than instances. All instances share a single memory copy initialized when the class is loaded.',
      flashQuestion: {
        question: 'What happens when one object instance modifies a static variable, and where is it stored?',
        answer: 'The modification is immediately visible to all instances because static variables reside in class/method memory, shared across instances.',
        trapNote: 'Do not use instance "this" keyword inside static context. Static variables can be accessed directly via ClassName.variable.'
      },
      isWeak: true,
      status: 'weak',
      quizAccuracy: 42,
      quizAttempts: 3,
      weakReason: 'Active recall mistakes: confused instance variables with shared class-level static memory'
    },
    {
      id: 'topic-bst',
      name: 'Binary Search Tree',
      priority: 'high',
      importance: 85,
      recommendedMinutes: 20,
      tags: ['Guaranteed on Exam', 'O(h) Operations', 'In-Order Traversal'],
      completed: false,
      scoreYieldPoints: 12,
      examQuestionType: 'Coding & Tree Construction (Weight: 20%)',
      keyTakeaway: 'In a valid BST, left child < node < right child. In-order traversal always yields sorted output.',
      flashQuestion: {
        question: 'What is the worst-case runtime for BST search, and when does it happen?',
        answer: 'O(n) time, which happens when keys are inserted in sorted order forming a degenerate/skewed linked list.',
        trapNote: 'Do not say O(log n) without specifying "balanced tree". Standard BST worst case is O(n).'
      }
    },
    {
      id: 'topic-avl',
      name: 'AVL Trees',
      priority: 'medium',
      importance: 60,
      recommendedMinutes: 15,
      tags: ['Balance Factor', 'LL / RR / LR / RL Rotations', 'Height O(log n)'],
      completed: false,
      scoreYieldPoints: 8,
      examQuestionType: 'Diagram / Rebalancing Steps (Weight: 15%)',
      keyTakeaway: 'Balance factor must be in {-1, 0, 1}. If |BF| > 1, apply single rotation (LL or RR) or double rotation (LR or RL).',
      flashQuestion: {
        question: 'How do you detect when a Left-Right (LR) rotation is needed?',
        answer: 'When a node has BF = +2 and its left child has BF = -1 (left-heavy parent with right-heavy child).',
        trapNote: 'Rotate the left child left first, then rotate the parent right.'
      }
    },
    {
      id: 'topic-app',
      name: 'Applications',
      priority: 'low',
      importance: 25,
      recommendedMinutes: 5,
      tags: ['Indexing', 'Symbol Tables', 'Syntax Trees'],
      completed: false,
      scoreYieldPoints: 4,
      examQuestionType: 'Multiple Choice / Concept Check (Weight: 5%)',
      keyTakeaway: 'BSTs power fast symbol tables, auto-complete prefix lookups, and database index B-tree foundations.',
      flashQuestion: {
        question: 'Name two real-world systems that rely on balanced search tree variants.',
        answer: 'Database indexing (B/B+ trees) and file systems (e.g., ext4, HFS+).',
        trapNote: 'Do not confuse memory caches (which use Hash Tables/LRU) with ordered disk indexing.'
      }
    }
  ]
};

export const ALTERNATIVE_PRESETS: { [key: string]: ExamRescuePlan } = {
  cs: INITIAL_RESCUE_PLAN,
  chem: {
    courseName: 'CHEM 220: Organic Chemistry II',
    examTitle: 'Final Comprehensive Exam',
    examDate: 'Tomorrow at 8:30 AM',
    totalHoursLeft: 5.2,
    readinessPercentage: 54,
    topics: [
      {
        id: 'chem-sn1',
        name: 'SN1 vs SN2 Mechanisms & Stereochemistry',
        priority: 'high',
        importance: 90,
        recommendedMinutes: 25,
        tags: ['Walden Inversion', 'Carbocation Stability', 'Solvent Effects'],
        completed: false,
        scoreYieldPoints: 16,
        examQuestionType: 'Mechanism Arrow Pushing',
        keyTakeaway: 'SN2 involves backside attack with 100% stereochemical inversion. SN1 proceeds through carbocation intermediate yielding racemization.',
        flashQuestion: {
          question: 'What type of solvent favors SN2 reactions and why?',
          answer: 'Polar aprotic solvents (like DMSO, Acetone, DMF) because they solvate cations without encasing the nucleophile anion.',
          trapNote: 'Protic solvents like water/ethanol form hydrogen-bond cages that slow down SN2 nucleophiles.'
        }
      },
      {
        id: 'chem-aldol',
        name: 'Aldol Condensation & Enolates',
        priority: 'medium',
        importance: 65,
        recommendedMinutes: 15,
        tags: ['Alpha Hydrogens', 'Enol Intermediates', 'Dehydration'],
        completed: false,
        scoreYieldPoints: 10,
        examQuestionType: 'Synthesis Pathway',
        keyTakeaway: 'Base deprotonates alpha-carbon to form resonance-stabilized enolate, attacking another carbonyl.',
        flashQuestion: {
          question: 'What is the final product of an aldol condensation after heating?',
          answer: 'An α,β-unsaturated aldehyde or ketone (conjugated enone).',
          trapNote: 'Heating drives elimination of water (dehydration) via E1cb mechanism.'
        }
      },
      {
        id: 'chem-nmr',
        name: '1H-NMR Chemical Shifts & Splitting',
        priority: 'low',
        importance: 30,
        recommendedMinutes: 10,
        tags: ['Spin-Spin Coupling', 'Integration', 'TMS Reference'],
        completed: false,
        scoreYieldPoints: 5,
        examQuestionType: 'Spectrum Identification',
        keyTakeaway: 'Apply n+1 rule for peak splitting. Carbonyl neighbors shift protons downfield (2.0 - 2.5 ppm).',
        flashQuestion: {
          question: 'What is the multiplicity of a CH3 group adjacent to a CH2 group?',
          answer: 'A triplet (n = 2 adjacent protons + 1 = 3 peaks, ratio 1:2:1).',
          trapNote: 'Always count neighboring hydrogens, not the protons on the carbon itself.'
        }
      }
    ]
  },
  bio: {
    courseName: 'BIO 101: Molecular & Cell Biology',
    examTitle: 'Unit 3 Exam',
    examDate: 'Tomorrow at 1:00 PM',
    totalHoursLeft: 6.0,
    readinessPercentage: 70,
    topics: [
      {
        id: 'bio-respiration',
        name: 'Cellular Respiration & ATP Synthase',
        priority: 'high',
        importance: 88,
        recommendedMinutes: 20,
        tags: ['Electron Transport Chain', 'Proton Gradient', 'Chemiosmosis'],
        completed: false,
        scoreYieldPoints: 14,
        examQuestionType: 'Flow Diagram & Energy Yield',
        keyTakeaway: 'H+ gradient across inner mitochondrial membrane powers rotary ATP synthase mechanism.',
        flashQuestion: {
          question: 'What is the final electron acceptor in the aerobic electron transport chain?',
          answer: 'Oxygen (O2), which gets reduced to form water (H2O).',
          trapNote: 'Without oxygen, electrons back up and the entire oxidative phosphorylation stalls.'
        }
      },
      {
        id: 'bio-dna',
        name: 'DNA Replication Enzymes (Helicase, Polymerase III)',
        priority: 'medium',
        importance: 62,
        recommendedMinutes: 15,
        tags: ['Lagging Strand', 'Okazaki Fragments', 'Leading Strand'],
        completed: false,
        scoreYieldPoints: 9,
        examQuestionType: 'Enzyme Function Matching',
        keyTakeaway: 'DNA Poly III synthesizes 5\' to 3\'. Lagging strand requires RNA primers and DNA ligase.',
        flashQuestion: {
          question: 'Why does the lagging strand synthesize discontinuously?',
          answer: 'Because DNA polymerase can only elongate in the 5\' -> 3\' direction and the replication fork opens antiparallel.',
          trapNote: 'Okazaki fragments are joined by DNA ligase, not DNA Polymerase I.'
        }
      },
      {
        id: 'bio-cellcycle',
        name: 'Cell Cycle Checkpoints & Cyclin-CDKs',
        priority: 'low',
        importance: 28,
        recommendedMinutes: 8,
        tags: ['G1/S Checkpoint', 'p53', 'M Checkpoint'],
        completed: false,
        scoreYieldPoints: 4,
        examQuestionType: 'Definition & Regulation',
        keyTakeaway: 'G1 checkpoint ensures cell size and DNA integrity before S-phase DNA synthesis begins.',
        flashQuestion: {
          question: 'What is often termed the "guardian of the genome" at cell cycle checkpoints?',
          answer: 'p53 tumor suppressor protein.',
          trapNote: 'p53 arrests the cell cycle to allow DNA repair or triggers apoptosis if damage is irreparable.'
        }
      }
    ]
  }
};
