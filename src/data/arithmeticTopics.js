/**
 * Arithmetic topic metadata only.
 * No questions, no explanations — those are AI-generated on demand.
 */

export const ARITHMETIC_TOPICS = [
    /* 1 */
    {
        id: 'simplifications',
        title: 'Simplifications',
        subtitle: 'BODMAS & Approximation',
        shortDesc: 'Solve complex expressions using BODMAS, surds, indices, and approximation techniques.',
        icon: 'Sigma',
        color: 'emerald',
        syllabus: [
            'BODMAS rule',
            'Fractions and decimals',
            'Surds and indices',
            'Square roots and cube roots',
            'Approximation',
            'Percentage in expressions',
        ],
    },

    /* 2 */
    {
        id: 'number-series',
        title: 'Number Series',
        subtitle: 'Spot the pattern',
        shortDesc: 'Find the next term in a numeric sequence by identifying its underlying rule.',
        icon: 'ListOrdered',
        color: 'blue',
        syllabus: [
            'Arithmetic series (add/subtract constant)',
            'Geometric series (multiply/divide constant)',
            'Square and cube series',
            'Prime and Fibonacci series',
            'Alternating and mixed series',
            'Double-difference series',
        ],
    },

    /* 3 */
    {
        id: 'number-system',
        title: 'Number System',
        subtitle: 'Divisibility, LCM & HCF',
        shortDesc: 'Master factors, multiples, divisibility rules, remainders, and LCM/HCF.',
        icon: 'Hash',
        color: 'violet',
        syllabus: [
            'Divisibility rules (2, 3, 4, 5, 9, 11)',
            'LCM and HCF',
            'Remainder theorem basics',
            'Prime factorisation',
            'Unit digit and cyclicity',
            'Fractions and decimals',
        ],
    },

    /* 4 */
    {
        id: 'percentage',
        title: 'Percentage',
        subtitle: 'Parts of a whole',
        shortDesc: 'Convert between fractions, decimals, and percentages to solve real-world problems.',
        icon: 'Percent',
        color: 'pink',
        syllabus: [
            'Basics of percentage',
            'Percentage increase / decrease',
            'Successive percentage change',
            'Reverse percentage',
            'Percentage in profit, loss, discount',
            'Percentage in data interpretation',
        ],
    },

    /* 5 */
    {
        id: 'profit-loss',
        title: 'Profit & Loss',
        subtitle: 'CP, SP & Discount',
        shortDesc: 'Calculate cost price, selling price, marked price, discounts, and profit margins.',
        icon: 'TrendingUp',
        color: 'emerald',
        syllabus: [
            'Profit / loss basics',
            'Percentage profit and loss',
            'Marked price and discount',
            'Successive discounts',
            'Dishonest seller problems',
            'Profit & loss with overheads',
        ],
    },

    /* 6 */
    {
        id: 'average',
        title: 'Average',
        subtitle: 'Mean and its applications',
        shortDesc: 'Find means of groups, replace elements, and solve weighted-average problems.',
        icon: 'BarChart2',
        color: 'amber',
        syllabus: [
            'Simple average',
            'Weighted average',
            'Average of consecutive numbers',
            'Age / score average problems',
            'Adding or removing a member',
            'Speed average',
        ],
    },

    /* 7 */
    {
        id: 'ages',
        title: 'Ages',
        subtitle: 'Age-related word problems',
        shortDesc: 'Solve present, past, and future age puzzles using linear equations and ratios.',
        icon: 'UserCheck',
        color: 'violet',
        syllabus: [
            'Present age problems',
            'Past / future age comparisons',
            'Age ratio problems',
            'Family age sums',
            'Twice / thrice age relations',
        ],
    },

    /* 8 */
    {
        id: 'ratio-proportion',
        title: 'Ratio & Proportion',
        subtitle: 'Divide and compare',
        shortDesc: 'Master ratios, proportions, mean/third/fourth proportional, and ratio applications.',
        icon: 'Divide',
        color: 'blue',
        syllabus: [
            'Basics of ratio (a:b)',
            'Dividing a quantity in a given ratio',
            'Compound ratio',
            'Proportion: mean, third, fourth',
            'Ratio in age, money, mixtures',
            'Ratio-based comparisons',
        ],
    },

    /* 9 */
    {
        id: 'time-work',
        title: 'Time & Work',
        subtitle: 'Efficiency, days & labour',
        shortDesc: 'Solve problems on work rates, combined efficiency, and work-days.',
        icon: 'Briefcase',
        color: 'pink',
        syllabus: [
            'One-person work problems',
            'Two / three person work',
            'Work + wages',
            'Men–days–hours formula',
            'Work leaving / joining mid-way',
            'Efficiency-based problems',
        ],
    },

    /* 10 */
    {
        id: 'pipes-cisterns',
        title: 'Pipes & Cisterns',
        subtitle: 'Fill, drain, and leaks',
        shortDesc: 'Solve tank-filling and draining problems using time & work logic.',
        icon: 'Droplet',
        color: 'emerald',
        syllabus: [
            'Two-inlet pipes',
            'Inlet + outlet combined',
            'Leak problems',
            'Pipes opened at intervals',
            'Efficiency change problems',
        ],
    },

    /* 11 */
    {
        id: 'time-distance',
        title: 'Time & Distance',
        subtitle: 'Speed, trains & boats',
        shortDesc: 'Solve speed/distance/time questions, train crossing, and boat & stream problems.',
        icon: 'Gauge',
        color: 'amber',
        syllabus: [
            'Speed = Distance / Time',
            'Average speed',
            'Relative speed',
            'Train crossing pole / platform / train',
            'Boat & stream (upstream/downstream)',
            'Speed conversion (km/h ↔ m/s)',
        ],
    },

    /* 12 */
    {
        id: 'partnership',
        title: 'Partnership',
        subtitle: 'Profit sharing by capital × time',
        shortDesc: 'Split business profits fairly based on each partner\'s capital and duration of investment.',
        icon: 'Handshake',
        color: 'violet',
        syllabus: [
            'Simple partnership',
            'Compound partnership (capital × time)',
            'Profit sharing ratio',
            'Partners joining / leaving',
            'Capital adjustment problems',
        ],
    },

    /* 13 */
    {
        id: 'simple-interest',
        title: 'Simple Interest',
        subtitle: 'SI formula and applications',
        shortDesc: 'Apply the simple interest formula to find P, R, T, or SI, including installment problems.',
        icon: 'Coins',
        color: 'blue',
        syllabus: [
            'SI = PRT / 100',
            'Find P, R, T, or SI',
            'Difference between SI and CI (1st year)',
            'Installment problems',
            'Rate-change problems',
        ],
    },

    /* 14 */
    {
        id: 'compound-interest',
        title: 'Compound Interest',
        subtitle: 'CI with compounding periods',
        shortDesc: 'Solve compound interest problems with annual, half-yearly, and quarterly compounding.',
        icon: 'TrendingUp',
        color: 'pink',
        syllabus: [
            'CI formula A = P(1 + r/n)^(nt)',
            'Annual, half-yearly, quarterly',
            'Difference between CI and SI',
            'Rate change over years',
            'Depreciation problems',
        ],
    },

    /* 15 */
    {
        id: 'permutation-combination',
        title: 'Permutation & Combination',
        subtitle: 'Arrange and select',
        shortDesc: 'Count arrangements and selections using permutations, combinations, and factorials.',
        icon: 'Shuffle',
        color: 'emerald',
        syllabus: [
            'Factorial notation',
            'Permutation (nPr)',
            'Combination (nCr)',
            'Word / digit arrangements',
            'Circular permutations',
            'Selection with restrictions',
        ],
    },

    /* 16 */
    {
        id: 'probability',
        title: 'Probability',
        subtitle: 'Chance of an event',
        shortDesc: 'Compute probabilities of simple and compound events involving dice, coins, and cards.',
        icon: 'Dices',
        color: 'amber',
        syllabus: [
            'Basic probability = favourable / total',
            'Coins, dice, cards problems',
            'Independent events',
            'Mutually exclusive events',
            'Conditional probability (basic)',
            'Complementary events',
        ],
    },

    /* 17 */
    {
        id: 'alligation-mixture',
        title: 'Alligation & Mixture',
        subtitle: 'Blending ingredients',
        shortDesc: 'Solve mixture and alligation problems to find ratios and concentrations.',
        icon: 'Beaker',
        color: 'violet',
        syllabus: [
            'Alligation rule',
            'Mixing two solutions',
            'Milk–water mixtures',
            'Replacement problems',
            'Multiple-step mixtures',
            'Cost of mixture',
        ],
    },

    /* 18 */
    {
        id: 'mensuration',
        title: 'Mensuration',
        subtitle: '2D & 3D measurements',
        shortDesc: 'Find area, perimeter, surface area, and volume of common 2D and 3D shapes.',
        icon: 'Box',
        color: 'blue',
        syllabus: [
            'Area & perimeter of 2D shapes',
            'Circle, sector, ring',
            'Surface area of cube, cuboid, cylinder',
            'Volume of 3D solids',
            'Cone, sphere, hemisphere',
            'Combination of solids',
        ],
    },

    /* 19 */
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

    /* ─────── Special: Data Interpretation (kept for subtopics flow) ─────── */
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