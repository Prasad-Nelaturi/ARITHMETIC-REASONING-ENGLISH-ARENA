/**
 * Pure AI question generator — Google Gemini 3.5 Flash-Lite.
 * No static fallbacks. Retries on failure.
 * Anti-repeat: passes previously asked questions back to the AI.
 * Robust JSON extractor handles: markdown fences, preamble text,
 * trailing commas, truncated arrays, and auto-repair.
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
   ROBUST JSON EXTRACTOR
   Handles: markdown fences, extra text before/after, truncated
   arrays, smart quotes, trailing commas, etc.
   ========================================================= */
const extractJSON = (raw, expect = 'object') => {
    if (!raw) throw new Error('Empty AI response')

    let text = String(raw).trim()

    // 1) Strip markdown fences (anywhere)
    text = text
        .replace(/```json\s*/gi, '')
        .replace(/```\s*/g, '')
        .trim()

    // 2) Remove common preamble like "Here is the JSON:"
    text = text.replace(/^[^{[]*?(?=[{\[])/, '').trim()

    const openingChar = expect === 'array' ? '[' : '{'
    const closingChar = expect === 'array' ? ']' : '}'

    // 3) First attempt: direct parse
    try {
        return JSON.parse(text)
    } catch { /* continue */ }

    // 4) Slice from first opening char to last closing char
    const firstOpen = text.indexOf(openingChar)
    const lastClose = text.lastIndexOf(closingChar)
    if (firstOpen !== -1 && lastClose !== -1 && lastClose > firstOpen) {
        let sliced = text.slice(firstOpen, lastClose + 1)

        // 4a) Remove trailing commas before ] or }
        sliced = sliced.replace(/,\s*([\]}])/g, '$1')

        try {
            return JSON.parse(sliced)
        } catch { /* continue */ }

        // 4b) Auto-close truncated arrays
        if (expect === 'array') {
            const open = (sliced.match(/\[/g) || []).length
            const close = (sliced.match(/\]/g) || []).length
            if (open > close) {
                const lastBrace = sliced.lastIndexOf('}')
                if (lastBrace !== -1) {
                    sliced = sliced.slice(0, lastBrace + 1) + ']'
                    try {
                        return JSON.parse(sliced)
                    } catch { /* continue */ }
                }
            }
        }
    }

    // 5) Fallback: attempt to find any valid JSON substring
    const match = text.match(expect === 'array' ? /\[[\s\S]*\]/ : /\{[\s\S]*\}/)
    if (match) {
        try {
            return JSON.parse(match[0].replace(/,\s*([\]}])/g, '$1'))
        } catch { /* continue */ }
    }

    throw new Error(
        `AI response could not be parsed as ${expect}. First 200 chars: ${text.slice(0, 200)}`
    )
}

/* =========================================================
   SHARED PROMPT PIECES
   ========================================================= */
const buildAvoidList = (avoidQuestions = []) => {
    if (!avoidQuestions.length) return ''
    const trimmed = avoidQuestions
        .slice(-30)
        .map((q, i) => `${i + 1}. ${String(q).slice(0, 100)}`)
        .join('\n')
    return `\n\nDO NOT REPEAT — the following questions have ALREADY been asked in this session. Do not generate any question that is the same, similar, or uses the same numbers/words:\n${trimmed}\n`
}

const STRICT_JSON_TAIL = `

ABSOLUTE REQUIREMENTS:
1. Response must START with the opening character and END with the closing character.
2. No markdown, no code fences, no triple backticks, no text before or after.
3. No trailing commas. Use standard double quotes for all strings.
4. Return the raw JSON only.

Output the raw JSON now.`

/* =========================================================
   CALL GEMINI (network layer)
   ========================================================= */
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
                        temperature: 1.1,
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

/* =========================================================
   CATEGORY BATCH (arithmetic / reasoning / english)
   ========================================================= */
const buildBatchPrompt = (category, level, count, avoidQuestions = []) => {
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

const parseAIResponse = (raw) => {
    const parsed = extractJSON(raw, 'array')
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

/* =========================================================
   SESSION MEMORY (prevents repeats)
   ========================================================= */
const askedQuestions = new Set()
const askedNormalized = new Set()

export const resetAIHistory = () => {
    askedQuestions.clear()
    askedNormalized.clear()
}

export const isAIConfigured = () => !!GEMINI_KEY

export const generateWithAI = async (category, level, count = 10) => {
    if (!GEMINI_KEY) {
        throw new Error('Gemini API key missing. Add VITE_GEMINI_API_KEY to .env')
    }

    const avoidList = Array.from(askedQuestions).slice(-40)
    const prompt = buildBatchPrompt(category, level, count, avoidList)
    const raw = await callGemini(prompt)
    let questions = parseAIResponse(raw)

    questions = questions.filter((q) => {
        const norm = normalizeQuestion(q.question)
        if (askedNormalized.has(norm)) return false
        askedNormalized.add(norm)
        return true
    })

    if (questions.length < count) {
        const needed = count - questions.length
        try {
            const secondPrompt = buildBatchPrompt(
                category,
                level,
                needed + 2,
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
        } catch { /* ignore */ }
    }

    const final = questions.slice(0, count)
    final.forEach((q) => { askedQuestions.add(q.question) })
    return final
}

/* =========================================================
   ANSWER REVIEW — short explanation for wrong/skipped
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
                generationConfig: { temperature: 0.7, maxOutputTokens: 250 },
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
   ARITHMETIC TOPIC CONTENT (lesson)
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
6. Return ONLY the JSON object.${STRICT_JSON_TAIL}`
}

const parseTopicResponse = (raw) => {
    const parsed = extractJSON(raw, 'object')

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
        keyPoints: (Array.isArray(parsed.keyPoints) ? parsed.keyPoints : []).slice(0, 8).map(String),
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
   TOPIC EXPLANATION — on-demand, language-aware
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
  "title": "A short title for the dataset",
  "chartType": "table" | "bar-simple" | "bar-grouped" | "line" | "pie" | "mixed" | "caselet",
  "data": {
    "rows": [["...", "..."], ["...", "..."]],
    "labels": ["A", "B", "C"],
    "series": [{ "name": "Sales", "values": [100, 200, 300] }],
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
10. Return ONLY the JSON object.${STRICT_JSON_TAIL}`
}

const parseDIResponse = (raw) => {
    const parsed = extractJSON(raw, 'object')

    if (!parsed || typeof parsed !== 'object') throw new Error('AI response not an object')
    if (!parsed.title || !parsed.chartType || !parsed.data) {
        throw new Error('AI response missing required fields')
    }
    if (!Array.isArray(parsed.questions) || parsed.questions.length === 0) {
        throw new Error('AI response has no questions')
    }

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

/* =========================================================
   TOPIC PRACTICE — 1 question per call with explanation
   ========================================================= */
const buildPracticePrompt = (topic, level, languageAiName = 'English', avoidList = []) => {
    const isTelugu = languageAiName.toLowerCase().includes('telugu')

    const difficulty = {
        easy: 'Simple arithmetic. Small numbers. Direct application of the rule.',
        medium: 'Bank exam prelims level. Two-step problems. Moderate numbers.',
        extreme: 'SBI PO Mains level. Multi-step, tricky distractors, large numbers.',
    }[level]

    const avoidBlock = avoidList.length
        ? `\nDO NOT repeat or closely resemble any of these previously asked questions:\n${avoidList.slice(-15).map((q, i) => `${i + 1}. ${String(q).slice(0, 80)}`).join('\n')}\n`
        : ''

    return `You are an Indian bank exam tutor. Generate ONE practice question.

TOPIC: ${topic.title} — ${topic.subtitle}
SYLLABUS: ${topic.syllabus.join(', ')}
DIFFICULTY: ${level.toUpperCase()} — ${difficulty}
LANGUAGE: ${languageAiName}${isTelugu ? ' (use Telugu script, keep numbers as digits)' : ''}
${avoidBlock}
Return ONLY this JSON object:

{
  "topic": "short topic label like 'Percentage'",
  "question": "the full question text",
  "options": ["opt A", "opt B", "opt C", "opt D"],
  "correct": "the exact same text as one of the 4 options above",
  "explanation": "2-3 sentence step-by-step explanation showing the calculation"
}

STRICT RULES:
1. Exactly 4 unique options.
2. "correct" must be character-for-character identical to one of the options.
3. Numbers must be clean and realistic.
4. Do NOT wrap in markdown fences.
5. Return ONLY the JSON object.${STRICT_JSON_TAIL}`
}

const parsePracticeResponse = (raw) => {
    const parsed = extractJSON(raw, 'object')

    if (!parsed || typeof parsed !== 'object') throw new Error('Not an object')
    if (!parsed.question || !Array.isArray(parsed.options) || !parsed.correct) {
        throw new Error('Missing required fields')
    }

    const opts = [...new Set([String(parsed.correct), ...parsed.options.map(String)])].slice(0, 4)
    while (opts.length < 4) opts.push(`Option ${opts.length + 1}`)

    return {
        topic: String(parsed.topic || 'General'),
        question: String(parsed.question),
        options: opts.sort(() => Math.random() - 0.5),
        correct: String(parsed.correct),
        explanation: String(parsed.explanation || ''),
    }
}

export const generatePracticeQuestion = async (
    topic,
    level,
    languageAiName = 'English',
    avoidList = []
) => {
    if (!GEMINI_KEY) throw new Error('Gemini API key missing — check .env')

    let lastErr
    for (let attempt = 0; attempt < 2; attempt++) {
        try {
            const prompt = buildPracticePrompt(topic, level, languageAiName, avoidList)
            const raw = await callGemini(prompt)
            return parsePracticeResponse(raw)
        } catch (err) {
            lastErr = err
            if (attempt === 0 && /JSON|Malformed|parse|Not an object|Missing/i.test(err.message)) {
                try {
                    const strictPrompt = buildPracticePrompt(topic, level, languageAiName, avoidList) +
                        `\n\nCRITICAL: Your previous response was not valid JSON. Return ONLY a single JSON object starting with { and ending with }. No markdown, no commentary.`
                    const raw = await callGemini(strictPrompt)
                    return parsePracticeResponse(raw)
                } catch (err2) {
                    lastErr = err2
                }
            }
        }
    }
    throw lastErr || new Error('Failed to generate question')
}

/* =========================================================
   GK / BANKING AWARENESS — practice questions
   ========================================================= */
const GK_TOPIC_GUIDE = {
    'banking-awareness': 'RBI functions, monetary policy tools (Repo, CRR, SLR), types of banks, payment systems (UPI, NEFT, RTGS, IMPS), NPA classification, SARFAESI Act, Banking Ombudsman scheme, deposit insurance.',
    'financial-awareness': 'SEBI, IRDAI, PFRDA, mutual funds, insurance products, government financial inclusion schemes (Jan Dhan, Mudra, Stand-Up India), capital markets, NBFCs.',
    'static-gk-banking': 'Headquarters of RBI, SBI, NABARD, SEBI, IRDAI; founding years; bank taglines; international financial organisations (IMF, World Bank, ADB); important financial days; currency codes.',
    'current-affairs-banking': 'Recent RBI policy announcements, banking sector appointments, mergers and acquisitions, government economic initiatives, international financial summits, awards in finance, Union Budget 2025-26 financial sector highlights.',
    'economy-banking': 'GDP, GNP, NNP, inflation (WPI vs CPI), Union Budget terminology (revenue deficit, fiscal deficit, primary deficit), Economic Survey, Balance of Payments, FDI and FPI.',
}

const buildGKPrompt = (gkTopic, level, languageAiName = 'English', avoidList = []) => {
    const isTelugu = languageAiName.toLowerCase().includes('telugu')

    const difficulty = {
        easy: 'Basic factual question — direct recall. Student must know one fact.',
        medium: 'Bank exam prelims level — requires understanding and one fact or comparison.',
        extreme: 'SBI PO Mains / RBI Grade B level — multi-statement or analytical. Include tricky distractors.',
    }[level]

    const avoidBlock = avoidList.length
        ? `\nDO NOT generate any question similar to these already-used questions:\n${avoidList.slice(-12).map((q, i) => `${i + 1}. ${String(q).slice(0, 90)}`).join('\n')}\n`
        : ''

    return `You are an expert Indian bank exam tutor. Generate exactly ONE multiple-choice GK question.

TOPIC: ${gkTopic.title} — ${gkTopic.subtitle}
SYLLABUS FOCUS: ${GK_TOPIC_GUIDE[gkTopic.id] || gkTopic.syllabus.join(', ')}
DIFFICULTY: ${level.toUpperCase()} — ${difficulty}
LANGUAGE: ${languageAiName}${isTelugu ? ' (use Telugu script for the question, options and explanation, but keep proper nouns like RBI, SBI, NEFT in English)' : ''}
${avoidBlock}
EXAMPLES OF GOOD QUESTIONS:
- "What does the abbreviation 'NPA' stand for in banking?" → Non-Performing Asset
- "Which organisation regulates the insurance sector in India?" → IRDAI
- "What is the reverse repo rate?" → rate at which RBI borrows from banks
- "The headquarters of NABARD is located in which city?" → Mumbai

Now generate a fresh, unique question.

Return ONLY this JSON structure with real content:

{
  "topic": "short label (2-4 words, e.g. 'RBI Policy' or 'Static GK')",
  "question": "A clear, complete question with proper grammar and full forms of abbreviations on first use.",
  "options": ["option 1", "option 2", "option 3", "option 4"],
  "correct": "the exact same text as one of the options above",
  "explanation": "2-3 sentences explaining the correct answer with the key fact, in ${languageAiName}."
}

STRICT RULES:
1. Exactly 4 unique options.
2. "correct" must be character-for-character identical to one of the 4 options.
3. Must be a real, factually correct question about the topic.
4. Do NOT wrap in markdown fences.
5. Return ONLY the JSON object.${STRICT_JSON_TAIL}`
}

export const generateGKQuestion = async (
    gkTopic,
    level,
    languageAiName = 'English',
    avoidList = []
) => {
    if (!GEMINI_KEY) throw new Error('Gemini API key missing — check .env')

    let lastErr
    for (let attempt = 0; attempt < 2; attempt++) {
        try {
            const prompt = buildGKPrompt(gkTopic, level, languageAiName, avoidList)
            const raw = await callGemini(prompt)
            return parsePracticeResponse(raw)
        } catch (err) {
            lastErr = err
            if (attempt === 0 && /JSON|Malformed|parse|Not an object|Missing/i.test(err.message)) {
                try {
                    const strictPrompt = buildGKPrompt(gkTopic, level, languageAiName, avoidList) +
                        `\n\nCRITICAL: Your previous response was not valid JSON. Return ONLY a single JSON object starting with { and ending with }. No markdown, no commentary.`
                    const raw = await callGemini(strictPrompt)
                    return parsePracticeResponse(raw)
                } catch (err2) {
                    lastErr = err2
                }
            }
        }
    }
    throw lastErr || new Error('Failed to generate GK question')
}