import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { QUESTIONS, CATEGORIES } from '../data/questions.js'
import {
  PASS_SCORE,
  TIMER_SECONDS,
  ALL_MODE_Q_COUNT,
  CORE_MODE_Q_COUNT,
} from '../config.js'

function shuffle(arr) {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

// 題庫衍生資料（靜態，只算一次）
const TOTAL_Q_COUNT = QUESTIONS.length
const CATEGORY_COUNTS = Object.fromEntries(
  CATEGORIES.map(cat => [cat.id, QUESTIONS.filter(q => q.category === cat.id).length])
)

export const useExamStore = create(
  persist(
    (set, get) => ({
  // ── Navigation ──
  screen: 'home',  // 'home' | 'category' | 'exam' | 'result'
  setScreen: (s) => set({ screen: s }),

  // ── Mode ──
  mode: null,       // 'core' | 'category' | 'all' | 'bookmarks'
  categoryId: null,

  // ── Bookmarks ──
  bookmarks: [],
  toggleBookmark: (id) => set(state => ({
    bookmarks: state.bookmarks.includes(id)
      ? state.bookmarks.filter(b => b !== id)
      : [...state.bookmarks, id]
  })),
  mergeBookmarks: (newIds) => set(state => {
    const combined = [...new Set([...state.bookmarks, ...newIds])]
    return { bookmarks: combined }
  }),

  // ── Exam state ──
  questions: [],
  currentIndex: 0,
  answers: [],       // [{qId, userAns, correct, skipped}]
  answered: false,
  startTime: null,
  endTime: null,

  // ── Timer (all mode only) ──
  totalSeconds: TIMER_SECONDS,
  remainingSeconds: TIMER_SECONDS,
  timerRunning: false,

  // ── Static data helpers (頁面元件透過 store 取，不直接 import QUESTIONS) ──
  totalQuestionCount: TOTAL_Q_COUNT,
  categoryCounts: CATEGORY_COUNTS,   // { law: 35, signs: 30, ... }

  // ── Start exam ──
  startExam: (mode, categoryId = null) => {
    let pool = [...QUESTIONS]
    if (mode === 'category' && categoryId) {
      pool = pool.filter(q => q.category === categoryId)
    } else if (mode === 'bookmarks') {
      pool = pool.filter(q => get().bookmarks.includes(q.id))
    }
    pool = shuffle(pool)

    let questions
    if (mode === 'all')  questions = pool.slice(0, ALL_MODE_Q_COUNT)
    else if (mode === 'core') questions = pool.filter(q => q.isCore).slice(0, Math.min(CORE_MODE_Q_COUNT, pool.length))
    else questions = pool

    set({
      mode,
      categoryId,
      questions,
      currentIndex: 0,
      answers: [],
      answered: false,
      startTime: Date.now(),
      endTime: null,
      totalSeconds: TIMER_SECONDS,
      remainingSeconds: TIMER_SECONDS,
      timerRunning: mode === 'all',
      screen: 'exam',
    })
  },

  // ── Select answer ──
  selectAnswer: (idx) => {
    const { answered, questions, currentIndex, answers } = get()
    if (answered) return
    const q = questions[currentIndex]
    const isCorrect = idx === q.answer
    set({
      answered: true,
      answers: [...answers, { qId: q.id, userAns: idx, correct: isCorrect, skipped: false }],
    })
  },

  // ── Skip ──
  skipQuestion: () => {
    const { questions, currentIndex, answers } = get()
    const q = questions[currentIndex]
    const newAnswers = [...answers, { qId: q.id, userAns: -1, correct: false, skipped: true }]
    const nextIndex = currentIndex + 1
    if (nextIndex >= questions.length) {
      set({ answers: newAnswers, endTime: Date.now(), timerRunning: false, screen: 'result' })
    } else {
      set({ answers: newAnswers, currentIndex: nextIndex, answered: false })
    }
  },

  // ── Next question ──
  nextQuestion: () => {
    const { questions, currentIndex } = get()
    const nextIndex = currentIndex + 1
    if (nextIndex >= questions.length) {
      set({ endTime: Date.now(), timerRunning: false, screen: 'result' })
    } else {
      set({ currentIndex: nextIndex, answered: false })
    }
  },

  // ── Timer tick ──
  tickTimer: () => {
    const { remainingSeconds, timerRunning } = get()
    if (!timerRunning) return
    if (remainingSeconds <= 1) {
      set({ remainingSeconds: 0, timerRunning: false, endTime: Date.now(), screen: 'result' })
    } else {
      set({ remainingSeconds: remainingSeconds - 1 })
    }
  },

  // ── Finish (manual quit) ──
  finishExam: () => {
    set({ endTime: Date.now(), timerRunning: false, screen: 'result' })
  },

  // ── Retry ──
  retry: () => {
    const { mode, categoryId } = get()
    get().startExam(mode, categoryId)
  },

  // ── Computed helpers ──
  get currentQuestion() {
    const { questions, currentIndex } = get()
    return questions[currentIndex] || null
  },
  get score() {
    const { answers, questions } = get()
    if (!questions.length) return 0
    const correct = answers.filter(a => a.correct).length
    return Math.round((correct / questions.length) * 100)
  },
  get passed() {
    return get().score >= PASS_SCORE
  },
  /** 錯題列表（含完整題目資料），供 ResultScreen 使用 */
  get wrongItems() {
    const { answers } = get()
    return answers
      .filter(a => !a.correct)
      .map(a => ({ answer: a, q: QUESTIONS.find(q => q.id === a.qId) }))
      .filter(({ q }) => q)
  },
}),
{
  name: 'moto-exam-storage',
  partialize: (state) => ({ bookmarks: state.bookmarks })
})
)
