/**
 * Pure AI question generator — Google Gemini 3.5 Flash-Lite.
 * No static fallbacks. Retries on failure.
 * Anti-repeat: passes previously asked questions back to the AI.
 * Robust JSON extractor handles: markdown fences, preamble text,
 * trailing commas, truncated arrays, and auto-repair.
 * Serial queue ensures we stay under the free-tier rate limit.
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
        .slice(-15)
        .map((q, i) => `${i + 1}. ${String(q).slice(0, 70)}`)
        .join('\n')
    return `\n\nDO NOT REPEAT:\n${trimmed}\n`
}

const STRICT_JSON_TAIL = `

ABSOLUTE REQUIREMENTS:
1. Response must START with the opening character and END with the closing character.
2. No markdown, no code fences, no triple backticks, no text before or after.
3. No trailing commas. Standard double quotes only.
4. Return the raw JSON only.

Output the raw JSON now.`

/* =========================================================
   SERIAL REQUEST QUEUE
   One request at a time + minimum gap between requests.
   Guarantees we stay under 15 req/min (free tier limit).
   ========================================================= */
const MIN_GAP_MS = 4500   // ~13 req/min — safe under 15
let queueTail = Promise.resolve()
let lastFireAt = 0

const enqueue = (fn) => {
    const next = queueTail.then(async () => {
        const elapsed = Date.now() - lastFireAt
        const wait = Math.max(0, MIN_GAP_MS - elapsed)
        if (wait > 0) {
            console.log(`[AI Queue] waiting ${Math.round(wait / 1000)}s`)
            await new Promise((r) => setTimeout(r, wait))
        }
        lastFireAt = Date.now()
        return fn()
    })
    queueTail = next.catch(() => { })
    return next
}

/* =========================================================
   GEMINI CALL (goes through the serial queue)
   ========================================================= */
const callGeminiInner = async (prompt, retries = 4) => {
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
                        temperature: 1.0,
                        topP: 0.95,
                        maxOutputTokens: 2048,
                        responseMimeType: 'application/json',
                    },
                }),
            })

            if (res.status === 429) {
                let waitMs = 30000
                try {
                    const clone = res.clone()
                    const body = await clone.json()
                    const msg = body?.error?.message || ''
                    const m = msg.match(/retry in ([\d.]+)s/i)
                    if (m) waitMs = (Math.ceil(parseFloat(m[1])) + 1) * 1000
                } catch { /* ignore */ }
                const headerVal = Number(res.headers.get('Retry-After'))
                if (!isNaN(headerVal) && headerVal > 0) waitMs = headerVal * 1000

                console.warn(`[AI] 429 — waiting ${Math.round(waitMs / 1000)}s (attempt ${attempt + 1}/${retries})`)
                await new Promise((r) => setTimeout(r, waitMs))
                lastError = new Error('Rate limited')
                continue
            }

            if (res.status === 503) {
                await new Promise((r) => setTimeout(r, 2500))
                lastError = new Error('Service busy')
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
            await new Promise((r) => setTimeout(r, 1500 * (attempt + 1)))
        }
    }
    throw lastError || new Error('Gemini failed after retries')
}

const callGemini = (prompt, retries = 4) => enqueue(() => callGeminiInner(prompt, retries))

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
    return `Generate ${count} unique bank-exam MCQs for the ${category} section.

Difficulty: ${level}
${CATEGORY_GUIDE[category] || ''}
${buildAvoidList(avoidQuestions)}
Format: JSON array only.
[
  {"topic":"...","question":"...","correct":"...","options":["A","B","C","D"]}
]

Rules:
- ${count} questions exactly.
- 4 unique options each, correct is one of them.
- No repeats.
- No markdown.

Output JSON:`
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

    // 🔥 Cap batch to 5 for faster responses
    const batchSize = Math.min(count, 5)
    const avoidList = Array.from(askedQuestions).slice(-15)
    const prompt = buildBatchPrompt(category, level, batchSize, avoidList)
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
                Math.min(needed + 2, 5),
                Array.from(askedQuestions).slice(-15)
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

    const prompt = `Give a SHORT explanation (2-3 sentences, plain text) for this bank-exam question.

Category: ${category}
Question: ${question}
Correct answer: ${correct}
${chosen ? `Student chose: ${chosen} (wrong)` : 'Not attempted.'}

Explain briefly why the correct answer is right. Plain text only, no markdown.`

    try {
        const raw = await callGemini(prompt, 2)
        return raw ? String(raw).trim() : ''
    } catch { return '' }
}

/* =========================================================
   ARITHMETIC TOPIC CONTENT (lesson)
   ========================================================= */
const buildTopicPrompt = (topic, languageAiName = 'English') => {
    const isTelugu = languageAiName.toLowerCase().includes('telugu')

    return `You are an Indian bank-exam tutor. Explain the arithmetic topic below in ${languageAiName}.

TOPIC: ${topic.title} — ${topic.subtitle}
SYLLABUS: ${topic.syllabus.join(', ')}
${isTelugu ? 'Write explanations in Telugu script. Keep technical terms in English.' : 'Write in simple, student-friendly English.'}

Return ONLY valid JSON:
{
  "definition": "2-3 sentence definition",
  "keyPoints": ["4-6 short bullet points"],
  "example": {
    "question": "worked example",
    "options": ["A", "B", "C", "D"],
    "correct": "the correct option",
    "steps": ["Step 1", "Step 2", "Step 3", "Step 4"]
  },
  "practice": {
    "question": "NEW practice question",
    "options": ["A", "B", "C", "D"],
    "correct": "the correct option",
    "explanation": "2-3 sentence explanation"
  }
}

Rules: 4 unique options each. "correct" matches one exactly.${STRICT_JSON_TAIL}`
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

    const prompt = `Explain in 2-3 sentences why the correct answer is right, in ${languageAiName}.${isTelugu ? ' Use Telugu script.' : ''}

Topic: ${topic.title}
Question: ${question}
Correct answer: ${correct}
Student chose: ${chosen}

Max 3 sentences. Plain text, no markdown.`

    try {
        const raw = await callGemini(prompt, 2)
        return raw ? String(raw).trim() : ''
    } catch { return '' }
}

/* =========================================================
   DATA INTERPRETATION — with chart data
   ========================================================= */
const DI_SUBTOPIC_GUIDE = {
    'table': 'A simple table with rows and columns of numeric data.',
    'bar-simple': 'A single-series bar chart with 4 to 6 categories.',
    'bar-grouped': 'A grouped bar chart with 2 series across 4 to 5 categories.',
    'line': 'A line graph showing a trend over 5 to 6 time periods.',
    'pie': 'A pie chart with 4 to 6 slices totalling 100%.',
    'mixed': 'A combined chart.',
    'caselet': 'A paragraph of text describing data in words, no chart.',
}

const buildDIPrompt = (subtopic, level, languageAiName = 'English') => {
    const isTelugu = languageAiName.toLowerCase().includes('telugu')
    const subtopicGuide = DI_SUBTOPIC_GUIDE[subtopic] || DI_SUBTOPIC_GUIDE['table']
    const difficulty = {
        easy: 'Simple numbers (under 500). Single-step questions.',
        medium: 'Numbers up to 2000. Two-step questions.',
        extreme: 'Large numbers, 3-4 step problems.',
    }[level]

    return `Create a Data Interpretation problem.

SUBTOPIC: ${subtopic}
CHART TYPE: ${subtopicGuide}
DIFFICULTY: ${level.toUpperCase()} — ${difficulty}
LANGUAGE: ${languageAiName}${isTelugu ? ' (Telugu script)' : ''}

Return ONLY valid JSON:
{
  "title": "short title",
  "chartType": "${subtopic}",
  "data": {
    "rows": [["Header1", "Header2"], ["Row1", "Value"]],
    "labels": ["A", "B", "C"],
    "series": [{ "name": "Sales", "values": [100, 200, 300] }],
    "text": "caselet text if applicable"
  },
  "unit": "₹ in lakhs",
  "questions": [
    { "question": "text", "options": ["A", "B", "C", "D"], "correct": "exact option", "explanation": "2-3 sentences" }
  ]
}

Rules: 4 questions. 4 unique options each. correct matches one option exactly.${STRICT_JSON_TAIL}`
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
        easy: 'Simple arithmetic. Small numbers.',
        medium: 'Bank exam prelims level. Two-step problems.',
        extreme: 'SBI PO Mains level. Multi-step, tricky.',
    }[level]

    const avoidBlock = avoidList.length
        ? `\nDO NOT repeat:\n${avoidList.slice(-10).map((q, i) => `${i + 1}. ${String(q).slice(0, 70)}`).join('\n')}\n`
        : ''

    return `Generate ONE practice question.

TOPIC: ${topic.title} — ${topic.subtitle}
DIFFICULTY: ${level.toUpperCase()} — ${difficulty}
LANGUAGE: ${languageAiName}${isTelugu ? ' (Telugu script, numbers as digits)' : ''}
${avoidBlock}
Return ONLY this JSON:
{
  "topic": "short label",
  "question": "full question",
  "options": ["A", "B", "C", "D"],
  "correct": "exact option text",
  "explanation": "2-3 sentence step-by-step solution"
}

Rules: 4 unique options. "correct" identical to one option.${STRICT_JSON_TAIL}`
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
                        `\n\nCRITICAL: Return ONLY a single JSON object.`
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
    'banking-awareness': 'RBI functions, monetary policy, types of banks, payment systems, NPA, SARFAESI, Ombudsman.',
    'financial-awareness': 'SEBI, IRDAI, PFRDA, mutual funds, insurance, Jan Dhan, Mudra, capital markets, NBFCs.',
    'static-gk-banking': 'Headquarters of RBI, SBI, NABARD, SEBI, IRDAI; founding years; bank taglines; IMF, World Bank.',
    'current-affairs-banking': 'Recent RBI policy, banking appointments, mergers, economic initiatives, financial summits.',
    'economy-banking': 'GDP, GNP, NNP, inflation (WPI/CPI), Union Budget terms, Economic Survey, Balance of Payments.',
}

const buildGKPrompt = (gkTopic, level, languageAiName = 'English', avoidList = []) => {
    const isTelugu = languageAiName.toLowerCase().includes('telugu')

    const difficulty = {
        easy: 'Basic factual question — direct recall.',
        medium: 'Prelims level — conceptual understanding.',
        extreme: 'Mains level — multi-statement, tricky.',
    }[level]

    const avoidBlock = avoidList.length
        ? `\nDO NOT repeat:\n${avoidList.slice(-10).map((q, i) => `${i + 1}. ${String(q).slice(0, 70)}`).join('\n')}\n`
        : ''

    return `Generate ONE GK question.

TOPIC: ${gkTopic.title}
FOCUS: ${GK_TOPIC_GUIDE[gkTopic.id] || gkTopic.syllabus.join(', ')}
DIFFICULTY: ${level.toUpperCase()} — ${difficulty}
LANGUAGE: ${languageAiName}${isTelugu ? ' (Telugu script, keep RBI/SBI in English)' : ''}
${avoidBlock}
Return ONLY this JSON:
{
  "topic": "short label",
  "question": "clear question",
  "options": ["A", "B", "C", "D"],
  "correct": "exact option text",
  "explanation": "2-3 sentence explanation"
}

Rules: 4 unique options. "correct" matches one option exactly.${STRICT_JSON_TAIL}`
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
                        `\n\nCRITICAL: Return ONLY a single JSON object.`
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