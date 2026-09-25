/**
 * Pure AI question generator — Google Gemini.
 * No static fallbacks. Retries on failure.
 * Anti-repeat: passes previously asked questions back to the AI.
 */

const PROVIDER = import.meta.env.VITE_AI_PROVIDER || 'gemini'
const GEMINI_KEY = import.meta.env.VITE_GEMINI_API_KEY

const DIFFICULTY = {
    easy: 'Basic difficulty — suitable for beginners. Numbers under 200, common vocabulary.',
    medium: 'Intermediate — bank exam prelims level. Numbers up to 1000, moderately advanced vocabulary.',
    extreme: 'Hard — SBI PO Mains / RBI Grade B level. Multi-step problems, tricky distractors, advanced vocabulary and idioms.',
}

const CATEGORY_GUIDE = {
    arithmetic: `
Generate arithmetic word problems typical of Indian bank exams.
Rotate across these topics: percentage, average, profit & loss, simple interest, compound interest, ratio & proportion, time & work, speed-distance-time, LCM/HCF, mixtures, partnership, pipes & cisterns, trains crossing, boats & streams.
Use realistic numbers and multi-step reasoning where appropriate for the level.
`,
    reasoning: `
Generate logical reasoning questions typical of Indian bank exams.
Rotate across these topics: number series, odd-one-out, coding-decoding, blood relations, direction sense, alphabet position, syllogism, seating arrangement, inequalities, alphanumeric series.
Each question must be fully self-contained.
`,
    english: `
Generate English language questions typical of Indian bank exams.
Rotate across these topics: synonyms, antonyms, idioms, phrasal verbs, one-word substitution, spelling, fill-in-the-blanks, error spotting, sentence correction, cloze test, vocabulary-in-context.
Use words appropriate to the difficulty level.
`,
}

/* =========================================================
   NEW: build a "do not repeat" block from previous questions
   ========================================================= */
const buildAvoidList = (avoidQuestions = []) => {
    if (!avoidQuestions.length) return ''
    // Only include the first 100 chars of each to keep the prompt small
    const trimmed = avoidQuestions
        .slice(-30)                                   // keep last 30 to stay under token limits
        .map((q, i) => `${i + 1}. ${String(q).slice(0, 100)}`)
        .join('\n')
    return `\n\nDO NOT REPEAT — the following questions have ALREADY been asked in this session. Do not generate any question that is the same, similar, or uses the same numbers/words:\n${trimmed}\n`
}

const buildPrompt = (category, level, count, avoidQuestions = []) => {
    return `You are a question generator for competitive bank exams. Return ONLY valid JSON, no markdown, no explanation.

${CATEGORY_GUIDE[category]}

Difficulty: ${level.toUpperCase()}
${DIFFICULTY[level]}
${buildAvoidList(avoidQuestions)}
Generate EXACTLY ${count} unique questions as a JSON array with this exact schema:
[
  {
    "topic": "short topic label like 'Percentage' or 'Idioms'",
    "question": "the full question text",
    "correct": "the correct answer as a string",
    "options": ["option A", "option B", "option C", "option D"]
  }
]

STRICT RULES:
1. Return exactly ${count} objects.
2. Every question must have exactly 4 options.
3. All 4 options must be unique (no duplicates).
4. "correct" must match one of the 4 options exactly.
5. No two questions may repeat the same numbers, words, or structure.
6. Every question must be DIFFERENT from the ones listed in the DO NOT REPEAT section above.
7. Vary the numbers significantly — do not use the same values across questions.
8. Do not wrap the response in markdown code fences.
9. Do not add any text before or after the JSON array.
10. If a value is a number, still return it as a string in "correct" and "options".

Output the raw JSON array now.`
}

const callGemini = async (prompt, retries = 3) => {
    if (!GEMINI_KEY) throw new Error('Gemini API key missing — check .env')

    const url = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-3.5-flash-lite:generateContent'

    let lastError
    for (let attempt = 0; attempt < retries; attempt++) {
        try {
            const res = await fetch(url, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'x-goog-api-key': GEMINI_KEY,
                },
                body: JSON.stringify({
                    contents: [{ parts: [{ text: prompt }] }],
                    generationConfig: {
                        temperature: 1.1,               // 🔥 slightly higher = more variety
                        topP: 0.95,
                        topK: 40,
                        maxOutputTokens: 8192,
                        responseMimeType: 'application/json',
                    },
                }),
            })

            if (res.status === 429) {
                const retryAfter = Number(res.headers.get('Retry-After')) || 30
                await new Promise((r) => setTimeout(r, retryAfter * 1000))
                lastError = new Error('Rate limited (429)')
                continue
            }
            if (!res.ok) {
                const errText = await res.text()
                throw new Error(`Gemini ${res.status}: ${errText.slice(0, 200)}`)
            }

            const data = await res.json()
            const text = data?.candidates?.[0]?.content?.parts?.[0]?.text
            if (!text) throw new Error('Gemini returned empty response')
            return text
        } catch (err) {
            lastError = err
            if (attempt === retries - 1) throw err
            await new Promise((r) => setTimeout(r, 800 * (attempt + 1)))
        }
    }
    throw lastError || new Error('Gemini failed after retries')
}

const normalizeQuestion = (str) =>
    String(str || '')
        .toLowerCase()
        .replace(/\s+/g, ' ')
        .replace(/[^\w\s]/g, '')
        .trim()

const parseAIResponse = (raw) => {
    if (!raw) throw new Error('Empty AI response')
    let text = String(raw).trim()
    text = text.replace(/^```(?:json)?/i, '').replace(/```$/i, '').trim()

    let parsed
    try {
        parsed = JSON.parse(text)
    } catch {
        const s = text.indexOf('[')
        const e = text.lastIndexOf(']')
        if (s === -1 || e === -1) throw new Error('AI response has no JSON array')
        try {
            parsed = JSON.parse(text.slice(s, e + 1))
        } catch (err) {
            throw new Error('AI returned malformed JSON')
        }
    }

    if (parsed && !Array.isArray(parsed) && Array.isArray(parsed.questions)) {
        parsed = parsed.questions
    }
    if (!Array.isArray(parsed)) throw new Error('AI response is not an array')

    const out = []
    for (const q of parsed) {
        if (
            q &&
            typeof q.question === 'string' &&
            q.question.length > 5 &&
            q.correct !== undefined &&
            Array.isArray(q.options) &&
            q.options.length >= 2
        ) {
            const optsRaw = [String(q.correct), ...q.options.map(String)]
            const opts = [...new Set(optsRaw)]

            let pad = 1
            while (opts.length < 4) {
                const candidate = `Option${pad}`
                if (!opts.includes(candidate)) opts.push(candidate)
                pad++
            }

            out.push({
                topic: String(q.topic || 'General'),
                question: String(q.question),
                correct: String(q.correct),
                options: opts.slice(0, 4).sort(() => Math.random() - 0.5),
            })
        }
    }

    if (out.length === 0) throw new Error('AI returned no valid questions')
    return out
}

export const isAIConfigured = () => !!GEMINI_KEY

/* =========================================================
   NEW: sessions memory — keeps asked questions across calls
   ========================================================= */
const askedQuestions = new Set()
const askedNormalized = new Set()

export const resetAIHistory = () => {
    askedQuestions.clear()
    askedNormalized.clear()
}

/* =========================================================
   ANSWER REVIEW — generate a short explanation for wrong/skipped
   ========================================================= */
export const generateExplanation = async (category, question, correct, chosen = null) => {
    if (!GEMINI_KEY) return ''

    const prompt = `You are a helpful exam tutor. Give a SHORT explanation (2-3 sentences, no markdown) for the following bank-exam question.

Category: ${category}
Question: ${question}
Correct answer: ${correct}
${chosen ? `Student chose: ${chosen} (this is wrong)` : 'Student did not attempt this question.'}

Explain briefly:
1. Why the correct answer is right
2. (If wrong answer given) The likely mistake

Return plain text only, no JSON, no markdown, no bullet points. Maximum 3 sentences.`

    try {
        const url = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-3.5-flash-lite:generateContent'
        const res = await fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'x-goog-api-key': GEMINI_KEY,
            },
            body: JSON.stringify({
                contents: [{ parts: [{ text: prompt }] }],
                generationConfig: {
                    temperature: 0.7,
                    maxOutputTokens: 250,
                },
            }),
        })
        if (!res.ok) return ''
        const data = await res.json()
        const text = data?.candidates?.[0]?.content?.parts?.[0]?.text
        return text ? String(text).trim() : ''
    } catch {
        return ''
    }
}

export const generateWithAI = async (category, level, count = 10) => {
    if (!GEMINI_KEY) {
        throw new Error('Gemini API key missing. Add VITE_GEMINI_API_KEY to .env')
    }

    // Pass the last N questions we've already returned to the AI
    const avoidList = Array.from(askedQuestions).slice(-40)

    const prompt = buildPrompt(category, level, count, avoidList)
    const raw = await callGemini(prompt)
    let questions = parseAIResponse(raw)

    // 🔍 Local dedupe against everything we've already served this session
    questions = questions.filter((q) => {
        const norm = normalizeQuestion(q.question)
        if (askedNormalized.has(norm)) return false
        askedNormalized.add(norm)
        return true
    })

    // If short, ask once more for the missing ones
    if (questions.length < count) {
        const needed = count - questions.length
        try {
            const secondPrompt = buildPrompt(
                category,
                level,
                needed + 2,   // ask for a couple more to be safe
                Array.from(askedQuestions).slice(-40)
            )
            const raw2 = await callGemini(secondPrompt)
            let more = parseAIResponse(raw2)
            more = more.filter((q) => {
                const norm = normalizeQuestion(q.question)
                if (askedNormalized.has(norm)) return false
                askedNormalized.add(norm)
                return true
            })
            questions.push(...more)
        } catch {
            // ignore
        }
    }

    const final = questions.slice(0, count)

    // Record them so the next call avoids these
    final.forEach((q) => {
        askedQuestions.add(q.question)
    })

    return final
}

/* =========================================================
   ARITHMETIC TOPIC CONTENT — language-aware
   ========================================================= */

const buildTopicPrompt = (topic, languageAiName = 'English') => {
    const isTelugu = languageAiName.toLowerCase().includes('telugu')

    return `You are an Indian bank-exam tutor (SBI PO / IBPS level). Explain the arithmetic topic below in ${languageAiName}.

TOPIC: ${topic.title}
SUBTITLE: ${topic.subtitle}
SYLLABUS FOCUS: ${topic.syllabus.join(', ')}

LANGUAGE REQUIREMENTS:
${isTelugu
            ? `- Write ALL explanations and step-by-step solutions in Telugu (తెలుగు script).
- Keep technical terms in English when they are standard (e.g. "Percentage", "Ratio").
- The QUESTION text may be in Telugu, but numeric options stay as numbers.
- Use natural, simple Telugu a Telugu-medium student would understand.`
            : `- Write everything in simple, student-friendly English.`}

Return ONLY valid JSON (no markdown, no code fences) matching this schema:

{
  "definition": "2-3 sentence plain-language definition of the topic in ${languageAiName}.",
  "keyPoints": [
    "4 to 6 short bullet points covering the rules, formulas, and tricks — in ${languageAiName}",
    "..."
  ],
  "example": {
    "question": "A clean worked example question with real numbers, written in ${languageAiName}.",
    "options": ["option A", "option B", "option C", "option D"],
    "correct": "the exact correct option text",
    "steps": [
      "Step 1 with numbers (in ${languageAiName})",
      "Step 2 with numbers",
      "Step 3 with numbers",
      "Step 4 confirming the answer"
    ]
  },
  "practice": {
    "question": "A NEW practice question (different numbers from the example) at bank-exam difficulty, written in ${languageAiName}.",
    "options": ["option A", "option B", "option C", "option D"],
    "correct": "the exact correct option text",
    "explanation": "2-3 sentence explanation in ${languageAiName} of why the correct answer is right."
  }
}

STRICT RULES:
1. All 4 options must be unique.
2. "correct" must match exactly one of the options.
3. The example and practice questions must NOT be the same or use the same numbers.
4. Use Indian exam conventions (₹ symbol, metric units).
5. Do NOT wrap the response in markdown fences.
6. Return ONLY the JSON object.

Output the raw JSON now.`
}

const parseTopicResponse = (raw) => {
    if (!raw) throw new Error('Empty AI response')
    let text = String(raw).trim()
    text = text.replace(/^```(?:json)?/i, '').replace(/```$/i, '').trim()

    let parsed
    try {
        parsed = JSON.parse(text)
    } catch {
        const s = text.indexOf('{')
        const e = text.lastIndexOf('}')
        if (s === -1 || e === -1) throw new Error('AI response has no JSON object')
        try {
            parsed = JSON.parse(text.slice(s, e + 1))
        } catch {
            throw new Error('AI returned malformed JSON')
        }
    }

    if (!parsed || typeof parsed !== 'object') throw new Error('AI response is not an object')
    if (!parsed.definition || !Array.isArray(parsed.keyPoints)) {
        throw new Error('AI response missing definition / keyPoints')
    }
    if (!parsed.example || !parsed.practice) {
        throw new Error('AI response missing example / practice')
    }

    const cleanSection = (sec) => {
        if (!sec) return null
        const opts = Array.isArray(sec.options) ? sec.options.map(String) : []
        const uniqueOpts = [...new Set(opts)].slice(0, 4)
        while (uniqueOpts.length < 4) uniqueOpts.push(`Option ${uniqueOpts.length + 1}`)
        return {
            question: String(sec.question || ''),
            options: uniqueOpts,
            correct: String(sec.correct || ''),
            steps: Array.isArray(sec.steps) ? sec.steps.map(String) : [],
            explanation: String(sec.explanation || ''),
        }
    }

    return {
        definition: String(parsed.definition || ''),
        keyPoints: (Array.isArray(parsed.keyPoints) ? parsed.keyPoints : [])
            .slice(0, 8)
            .map(String),
        example: cleanSection(parsed.example),
        practice: cleanSection(parsed.practice),
    }
}

export const generateTopicContent = async (topic, languageAiName = 'English') => {
    if (!GEMINI_KEY) throw new Error('Gemini API key missing — check .env')
    const prompt = buildTopicPrompt(topic, languageAiName)
    const raw = await callGemini(prompt)
    return parseTopicResponse(raw)
}

/* =========================================================
   PRACTICE EXPLANATION — on-demand, language-aware
   ========================================================= */
export const generateTopicExplanation = async (
    topic,
    question,
    correct,
    chosen,
    languageAiName = 'English'
) => {
    if (!GEMINI_KEY) return ''

    const isTelugu = languageAiName.toLowerCase().includes('telugu')

    const prompt = `You are a bank-exam tutor. Explain in 2-3 plain sentences why the correct answer is right.

Write the explanation in ${languageAiName}.${isTelugu ? ' Use Telugu script (తెలుగు).' : ''}

Topic: ${topic.title}
Question: ${question}
Correct answer: ${correct}
Student chose: ${chosen}

Do not use markdown. Do not use bullet points. Maximum 3 sentences.`

    try {
        const url = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-3.5-flash-lite:generateContent'
        const res = await fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'x-goog-api-key': GEMINI_KEY,
            },
            body: JSON.stringify({
                contents: [{ parts: [{ text: prompt }] }],
                generationConfig: { temperature: 0.7, maxOutputTokens: 240 },
            }),
        })
        if (!res.ok) return ''
        const data = await res.json()
        const text = data?.candidates?.[0]?.content?.parts?.[0]?.text
        return text ? String(text).trim() : ''
    } catch {
        return ''
    }
}

/* =========================================================
   DATA INTERPRETATION — with chart data
   ========================================================= */

const DI_SUBTOPIC_GUIDE = {
    'table': 'A simple table with rows and columns of numeric data.',
    'bar-simple': 'A single-series bar chart with 4 to 6 categories.',
    'bar-grouped': 'A grouped bar chart with 2 series across 4 to 5 categories.',
    'line': 'A line graph showing a trend over 5 to 6 time periods, optionally with 2 lines.',
    'pie': 'A pie chart with 4 to 6 slices totalling 100%.',
    'mixed': 'A combined chart — e.g. bars for one metric and a line for another.',
    'caselet': 'A paragraph of text describing data in words, no chart. The student must extract values.',
}

const buildDIPrompt = (subtopic, level, languageAiName = 'English') => {
    const isTelugu = languageAiName.toLowerCase().includes('telugu')
    const subtopicGuide = DI_SUBTOPIC_GUIDE[subtopic] || DI_SUBTOPIC_GUIDE['table']

    const difficulty = {
        easy: 'Simple numbers (under 500). Single-step questions: direct value read, simple % or difference.',
        medium: 'Numbers up to 2000. Two-step questions: percentage change, ratio, average, comparison.',
        extreme: 'Large numbers, 3-4 step problems, mixtures of percentage + ratio + average, missing-data inference.',
    }[level]

    return `You are an Indian bank exam tutor (SBI PO / IBPS). Create a Data Interpretation problem.

SUBTOPIC: ${subtopic}
CHART TYPE: ${subtopicGuide}
DIFFICULTY: ${level.toUpperCase()} — ${difficulty}

LANGUAGE: Write all labels, questions, and explanations in ${languageAiName}.${isTelugu ? ' Use Telugu script.' : ''}

Return ONLY valid JSON (no markdown, no code fences) matching this schema:

{
  "title": "A short title for the dataset (e.g. 'Sales of Five Companies in 2023')",
  "chartType": "table" | "bar-simple" | "bar-grouped" | "line" | "pie" | "mixed" | "caselet",
  "data": {
    // For "table": two-dimensional array with header row
    //   rows: [["Company", "Sales", "Profit"], ["A", "120", "30"], ...]
    "rows": [["...", "..."], ["...", "..."]],
    // For "bar-simple" / "bar-grouped" / "line" / "pie" / "mixed":
    //   labels: category names, series: one or more numeric series
    "labels": ["A", "B", "C"],
    "series": [{ "name": "Sales", "values": [100, 200, 300] }],
    // For "caselet": a paragraph of plain text
    "text": "..."
  },
  "unit": "₹ in lakhs" or "%" or "units",
  "questions": [
    {
      "question": "A banking-style question based on the data.",
      "options": ["opt1", "opt2", "opt3", "opt4"],
      "correct": "the exact correct option",
      "explanation": "2-3 sentence step-by-step explanation in ${languageAiName}"
    }
    // ... 4 questions total at the given difficulty
  ]
}

STRICT RULES:
1. Generate EXACTLY 4 questions.
2. All 4 options per question must be unique.
3. "correct" must match one of the 4 options exactly.
4. Every question must be answerable from the data provided.
5. Numbers must be realistic and clean.
6. For "caselet", do NOT include labels or series — only "text".
7. For "table", include "rows"; do NOT include labels or series.
8. For charts, include "labels" and "series"; do NOT include rows.
9. Do NOT wrap the response in markdown fences.
10. Return ONLY the JSON object.

Output the raw JSON now.`
}

const parseDIResponse = (raw) => {
    if (!raw) throw new Error('Empty AI response')
    let text = String(raw).trim()
    text = text.replace(/^```(?:json)?/i, '').replace(/```$/i, '').trim()

    let parsed
    try {
        parsed = JSON.parse(text)
    } catch {
        const s = text.indexOf('{')
        const e = text.lastIndexOf('}')
        if (s === -1 || e === -1) throw new Error('AI response has no JSON object')
        try { parsed = JSON.parse(text.slice(s, e + 1)) } catch {
            throw new Error('AI returned malformed JSON')
        }
    }

    if (!parsed || typeof parsed !== 'object') throw new Error('AI response not an object')
    if (!parsed.title || !parsed.chartType || !parsed.data) {
        throw new Error('AI response missing required fields')
    }
    if (!Array.isArray(parsed.questions) || parsed.questions.length === 0) {
        throw new Error('AI response has no questions')
    }

    // Validate questions
    const questions = parsed.questions.slice(0, 6).map((q) => {
        const opts = Array.isArray(q.options) ? q.options.map(String) : []
        const uniq = [...new Set(opts)]
        while (uniq.length < 4) uniq.push(`Option ${uniq.length + 1}`)
        return {
            question: String(q.question || ''),
            options: uniq.slice(0, 4),
            correct: String(q.correct || ''),
            explanation: String(q.explanation || ''),
        }
    }).filter((q) => q.question && q.correct && q.options.includes(q.correct))

    if (questions.length === 0) throw new Error('AI returned no valid questions')

    return {
        title: String(parsed.title),
        chartType: String(parsed.chartType),
        data: parsed.data,
        unit: String(parsed.unit || ''),
        questions,
    }
}

export const generateDIProblem = async (subtopic, level, languageAiName = 'English') => {
    if (!GEMINI_KEY) throw new Error('Gemini API key missing — check .env')
    const prompt = buildDIPrompt(subtopic, level, languageAiName)
    const raw = await callGemini(prompt)
    return parseDIResponse(raw)
}