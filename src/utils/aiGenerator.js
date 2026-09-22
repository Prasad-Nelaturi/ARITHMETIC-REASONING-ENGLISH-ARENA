/**
 * Pure AI question generator — Google Gemini.
 * No static fallbacks. Retries on failure.
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

const buildPrompt = (category, level, count) => {
    return `You are a question generator for competitive bank exams. Return ONLY valid JSON, no markdown, no explanation.

${CATEGORY_GUIDE[category]}

Difficulty: ${level.toUpperCase()}
${DIFFICULTY[level]}

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
6. Do not wrap the response in markdown code fences.
7. Do not add any text before or after the JSON array.
8. If a value is a number, still return it as a string in "correct" and "options".

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
                        temperature: 1.0,
                        topP: 0.95,
                        maxOutputTokens: 8192,
                        responseMimeType: 'application/json',
                    },
                }),
            })

            if (res.status === 429) {
                // Rate limit — wait and retry
                await new Promise((r) => setTimeout(r, 1500 * (attempt + 1)))
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

const parseAIResponse = (raw) => {
    if (!raw) throw new Error('Empty AI response')
    let text = String(raw).trim()

    // Strip any markdown fences
    text = text.replace(/^```(?:json)?/i, '').replace(/```$/i, '').trim()

    let parsed
    try {
        parsed = JSON.parse(text)
    } catch {
        // Find first [ ... ] block
        const s = text.indexOf('[')
        const e = text.lastIndexOf(']')
        if (s === -1 || e === -1) throw new Error('AI response has no JSON array')
        try {
            parsed = JSON.parse(text.slice(s, e + 1))
        } catch (err) {
            throw new Error('AI returned malformed JSON')
        }
    }

    // Unwrap if AI returned { questions: [...] }
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
            // Dedupe options, ensure correct is present
            const optsRaw = [String(q.correct), ...q.options.map(String)]
            const opts = [...new Set(optsRaw)]

            // Pad to exactly 4 if AI returned fewer
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

export const generateWithAI = async (category, level, count = 10) => {
    if (!GEMINI_KEY) {
        throw new Error('Gemini API key missing. Add VITE_GEMINI_API_KEY to .env')
    }
    const prompt = buildPrompt(category, level, count)
    const raw = await callGemini(prompt)
    const questions = parseAIResponse(raw)

    if (questions.length < count) {
        // Ask for the missing ones
        const needed = count - questions.length
        try {
            const secondPrompt = buildPrompt(category, level, needed)
            const raw2 = await callGemini(secondPrompt)
            const more = parseAIResponse(raw2)
            questions.push(...more.slice(0, needed))
        } catch {
            // ignore — accept fewer
        }
    }

    return questions.slice(0, count)
}