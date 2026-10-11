/**
 * SSC-level mathematics topic metadata.
 * Lesson + practice are AI-generated on demand.
 */

export const SSC_TOPICS = [
    {
        id: 'trigonometry',
        title: 'Trigonometry',
        subtitle: 'Ratios, Identities & Heights',
        shortDesc: 'Learn trigonometric ratios, identities, and applications to heights & distances.',
        icon: 'Triangle',
        color: 'violet',
        syllabus: [
            'Trigonometric ratios (sin, cos, tan)',
            'Values at standard angles (0°, 30°, 45°, 60°, 90°)',
            'Trigonometric identities',
            'Complementary angles',
            'Heights and distances',
            'Angle of elevation and depression',
        ],
    },
    {
        id: 'geometry',
        title: 'Geometry',
        subtitle: 'Lines, Triangles & Circles',
        shortDesc: 'Master angles, triangles, circles, and quadrilateral properties.',
        icon: 'Shapes',
        color: 'blue',
        syllabus: [
            'Lines and angles',
            'Triangles (types, congruence, similarity)',
            'Pythagoras theorem',
            'Circles (tangents, chords, arcs)',
            'Quadrilaterals and polygons',
            'Coordinate geometry basics',
        ],
    },
    {
        id: 'algebra',
        title: 'Algebra',
        subtitle: 'Equations, Identities & Progressions',
        shortDesc: 'Solve linear/quadratic equations, use identities, and work with progressions.',
        icon: 'Sigma',
        color: 'pink',
        syllabus: [
            'Linear equations in one/two variables',
            'Quadratic equations',
            'Algebraic identities',
            'Polynomials',
            'Arithmetic Progression (AP)',
            'Geometric Progression (GP)',
        ],
    },
    {
        id: 'mensuration',
        title: 'Mensuration',
        subtitle: '2D & 3D Shapes',
        shortDesc: 'Area, perimeter, surface area, and volume of common 2D and 3D shapes.',
        icon: 'Box',
        color: 'emerald',
        syllabus: [
            'Area & perimeter of 2D shapes',
            'Circle, sector, and segment',
            'Surface area of cube, cuboid, cylinder',
            'Volume of 3D solids',
            'Cone, sphere, and hemisphere',
            'Combination of solids',
        ],
    },
    {
        id: 'coordinate-geometry',
        title: 'Coordinate Geometry',
        subtitle: 'Lines, Distance & Slope',
        shortDesc: 'Distance formula, midpoint, slope, and equation of a line.',
        icon: 'Grid3x3',
        color: 'amber',
        syllabus: [
            'Cartesian plane & coordinates',
            'Distance formula',
            'Midpoint formula',
            'Section formula',
            'Slope of a line',
            'Equation of a line (various forms)',
        ],
    },
    {
        id: 'statistics',
        title: 'Statistics',
        subtitle: 'Mean, Median & Mode',
        shortDesc: 'Central tendency, dispersion, and data interpretation fundamentals.',
        icon: 'BarChart2',
        color: 'rose',
        syllabus: [
            'Mean, median, mode',
            'Range and standard deviation',
            'Frequency distribution',
            'Cumulative frequency',
            'Graphical representation',
        ],
    },
]

export const getSSCTopicById = (id) => SSC_TOPICS.find((t) => t.id === id)

/* =========================================================
   LANGUAGE SUPPORT (reuses the shared LANGUAGES from arithmeticTopics)
   ========================================================= */
export {
    LANGUAGES,
    getLanguageById,
    getSavedLanguage,
    saveLanguage,
} from './arithmeticTopics.js'