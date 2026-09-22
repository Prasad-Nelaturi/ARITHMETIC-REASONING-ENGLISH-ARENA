class QuestionBank {
    constructor() {
        this.seen = new Set()
    }
    has(sig) { return this.seen.has(sig) }
    add(sig) { this.seen.add(sig) }
    reset() { this.seen.clear() }
    size() { return this.seen.size }
}

export const questionBank = new QuestionBank()