import { generateWithAI, isAIConfigured } from './aiGenerator.js'
import { questionBank } from './questionBank.js'

/**
 * Fetch a set of AI-generated questions.
 * No static fallback — if AI fails, throw a clear error.
 * Retries automatically on rate limits.
 */
export const fetchQuestionSet = async (category, level, count = 10) => {
    if (!isAIConfigured()) {
        throw new Error('AI not configured. Please add your Gemini API key to .env')
    }

    const aiQuestions = await generateWithAI(category, level, count)
    const unique = []

    for (const q of aiQuestions) {
        const sig = `${category}_${q.question}`.slice(0, 200)
        if (!questionBank.has(sig)) {
            questionBank.add(sig)
            unique.push(q)
        }
    }

    // If AI returned duplicates, ask once more for the missing count
    if (unique.length < count) {
        const needed = count - unique.length
        try {
            const more = await generateWithAI(category, level, needed + 2)
            for (const q of more) {
                const sig = `${category}_${q.question}`.slice(0, 200)
                if (!questionBank.has(sig)) {
                    questionBank.add(sig)
                    unique.push(q)
                }
                if (unique.length === count) break
            }
        } catch {
            // ignore
        }
    }

    if (unique.length === 0) {
        throw new Error('AI did not return any usable questions. Please try again.')
    }

    return unique.slice(0, count)
}