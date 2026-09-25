/**
 * Arithmetic topic metadata only.
 * No questions, no explanations — those are AI-generated on demand.
 */

export const ARITHMETIC_TOPICS = [
    {
        id: 'simplifications',
        title: 'Simplifications',
        subtitle: 'BODMAS & Approximation',
        shortDesc: 'Solve complex expressions using BODMAS, surds, indices, and approximation techniques.',
        icon: 'Sigma',
        color: 'cyan',
        syllabus: [
            'BODMAS rule',
            'Fractions and decimals',
            'Surds and indices',
            'Square roots and cube roots',
            'Approximation',
            'Percentage in expressions',
        ],
    },
    {
        id: 'cassette',
        title: 'Cassette',
        subtitle: 'Ratio, Proportion & Partnership',
        shortDesc: 'Split a total into parts based on a given ratio — the classic partnership problem.',
        icon: 'Divide',
        color: 'violet',
        syllabus: [
            'Simple ratio problems (a:b)',
            'Dividing a quantity in a given ratio',
            'Compound ratio',
            'Proportion (mean, third, fourth)',
            'Partnership: profit sharing with capital × time',
        ],
    },
    {
        id: 'quadratic-equation',
        title: 'Quadratic Equation',
        subtitle: 'Roots, Sum & Product',
        shortDesc: 'Solve equations of the form ax² + bx + c = 0 and compare roots.',
        icon: 'SquareFunction',
        color: 'pink',
        syllabus: [
            'Standard form ax² + bx + c = 0',
            'Factorisation method',
            'Quadratic formula',
            'Discriminant and nature of roots',
            'Sum and product of roots (SBI PO style)',
        ],
    },
    {
        id: 'odd-one-out',
        title: 'Odd One Out',
        subtitle: 'Spot the different one',
        shortDesc: 'Find the number or word that does not fit the pattern.',
        icon: 'Search',
        color: 'blue',
        syllabus: [
            'Perfect squares and cubes',
            'Prime numbers and composites',
            'Multiples and factors',
            'Even / odd sets',
            'Alphabet position rules',
        ],
    },
    {
        id: 'missing-series',
        title: 'Missing Series',
        subtitle: 'Number & alphabet patterns',
        shortDesc: 'Find the next term in a sequence by identifying its rule.',
        icon: 'ListOrdered',
        color: 'emerald',
        syllabus: [
            'Arithmetic progression (add a constant)',
            'Geometric progression (multiply by a constant)',
            'Squares and cubes series',
            'Prime number series',
            'Alternating and mixed series',
            'Fibonacci-style (sum of previous two)',
        ],
    },
    {
        id: 'data-interpretation',
        title: 'Data Interpretation',
        subtitle: 'Tables, Charts & Graphs',
        shortDesc: 'Read tables, bar charts, pie charts, line graphs and answer banking-style questions.',
        icon: 'BarChart3',
        color: 'amber',
        syllabus: [
            'Table-based DI',
            'Simple Bar Chart',
            'Grouped / Stacked Bar Chart',
            'Line Graph',
            'Pie Chart',
            'Mixed / Combined Chart',
            'Caselet DI',
            'Missing Data DI',
        ],
        subtopics: [
            { id: 'table', label: 'Table', icon: 'Table' },
            { id: 'bar-simple', label: 'Simple Bar', icon: 'BarChart2' },
            { id: 'bar-grouped', label: 'Grouped Bar', icon: 'BarChart4' },
            { id: 'line', label: 'Line Graph', icon: 'LineChart' },
            { id: 'pie', label: 'Pie Chart', icon: 'PieChart' },
            { id: 'mixed', label: 'Mixed / Combined', icon: 'Layers' },
            { id: 'caselet', label: 'Caselet', icon: 'FileText' },
        ],
        levels: ['easy', 'medium', 'extreme'],
    },
]

export const getTopicById = (id) => ARITHMETIC_TOPICS.find((t) => t.id === id)

/* =========================================================
   LANGUAGE SUPPORT (English + Telugu)
   ========================================================= */
export const LANGUAGES = [
    {
        id: 'english',
        label: 'English',
        nativeLabel: 'English',
        flag: 'EN',
        aiName: 'English',
    },
    {
        id: 'telugu',
        label: 'Telugu',
        nativeLabel: 'తెలుగు',
        flag: 'TE',
        aiName: 'Telugu (తెలుగు)',
    },
]

export const getLanguageById = (id) =>
    LANGUAGES.find((l) => l.id === id) || LANGUAGES[0]

// Persist selected language across visits
const LANG_KEY = 'puzzle-topic-lang'

export const getSavedLanguage = () => {
    try {
        return localStorage.getItem(LANG_KEY) || 'english'
    } catch {
        return 'english'
    }
}

export const saveLanguage = (id) => {
    try { localStorage.setItem(LANG_KEY, id) } catch { }
}