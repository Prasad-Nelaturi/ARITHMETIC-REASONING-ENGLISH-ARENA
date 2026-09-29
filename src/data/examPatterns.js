/**
 * Official IBPS / SBI exam patterns.
 * Kept faithful to the real syllabus.
 */

export const EXAM_TYPES = [
    { id: 'clerk', label: 'Clerk', desc: 'IBPS Clerk pattern', color: 'blue' },
    { id: 'po', label: 'PO', desc: 'IBPS / SBI PO pattern', color: 'violet' },
    { id: 'so', label: 'SO', desc: 'Specialist Officer pattern', color: 'pink' },
]

export const EXAM_STAGES = [
    { id: 'prelims', label: 'Prelims', desc: 'Qualifying stage · No sectional cutoff' },
    { id: 'mains', label: 'Mains', desc: 'Final stage · Sectional cutoffs apply' },
]

/* =========================================================
   Prelims — official IBPS pattern
   ========================================================= */
const PRELIMS_SECTIONS = [
    {
        id: 'english',
        name: 'English Language',
        icon: 'BookOpen',
        questions: 30,
        marks: 30,
        timeSec: 20 * 60,
        cutoffRange: [8, 12],
        category: 'english',
    },
    {
        id: 'quant',
        name: 'Quantitative Aptitude',
        icon: 'Calculator',
        questions: 35,
        marks: 35,
        timeSec: 20 * 60,
        cutoffRange: [11, 14],
        category: 'arithmetic',
    },
    {
        id: 'reasoning',
        name: 'Reasoning Ability',
        icon: 'Brain',
        questions: 35,
        marks: 35,
        timeSec: 20 * 60,
        cutoffRange: [11, 15],
        category: 'reasoning',
    },
]

/* =========================================================
   Mains — official IBPS PO pattern
   ========================================================= */
const MAINS_SECTIONS = [
    {
        id: 'reasoning-computer',
        name: 'Reasoning + Computer Aptitude',
        icon: 'Brain',
        questions: 45,
        marks: 60,
        timeSec: 60 * 60,
        cutoffRange: [10, 15],
        category: 'reasoning',
        description: 'Puzzles, seating, blood relations + basic computer',
    },
    {
        id: 'quant',
        name: 'Quantitative Aptitude',
        icon: 'Calculator',
        questions: 35,
        marks: 50,
        timeSec: 45 * 60,
        cutoffRange: [11, 15],
        category: 'arithmetic',
        description: 'Data interpretation, arithmetic, approximations',
    },
    {
        id: 'english',
        name: 'English Language',
        icon: 'BookOpen',
        questions: 35,
        marks: 40,
        timeSec: 40 * 60,
        cutoffRange: [9, 12],
        category: 'english',
        description: 'Reading, grammar, vocabulary, cloze',
    },
    {
        id: 'ga',
        name: 'General / Financial Awareness',
        icon: 'Landmark',
        questions: 50,
        marks: 50,
        timeSec: 35 * 60,
        cutoffRange: [10, 13],
        category: 'gk',
        description: 'Banking, financial, current affairs',
    },
]

export const getExamSections = (stage) =>
    stage === 'mains' ? MAINS_SECTIONS : PRELIMS_SECTIONS

export const getExamSummary = (stage) => {
    const sections = getExamSections(stage)
    return {
        totalQuestions: sections.reduce((a, s) => a + s.questions, 0),
        totalMarks: sections.reduce((a, s) => a + s.marks, 0),
        totalTimeMin: Math.round(sections.reduce((a, s) => a + s.timeSec, 0) / 60),
        sections,
    }
}