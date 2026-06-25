import { useMemo } from 'react'
import styles from './ExamScreen.module.css'
import { useExamStore } from '../store/examStore.js'
import { CATEGORIES } from '../data/questions.js'
import { PASS_SCORE } from '../config.js'

const LETTERS = ['A', 'B', 'C', 'D']

function formatTime(sec) {
  const m = Math.floor(sec / 60).toString().padStart(2, '0')
  const s = (sec % 60).toString().padStart(2, '0')
  return `${m}:${s}`
}

export default function ExamScreen() {
  const mode             = useExamStore(s => s.mode)
  const categoryId       = useExamStore(s => s.categoryId)
  const questions        = useExamStore(s => s.questions)
  const currentIndex     = useExamStore(s => s.currentIndex)
  const answers          = useExamStore(s => s.answers)
  const answered         = useExamStore(s => s.answered)
  const remainingSeconds = useExamStore(s => s.remainingSeconds)
  const selectAnswer     = useExamStore(s => s.selectAnswer)
  const skipQuestion     = useExamStore(s => s.skipQuestion)
  const nextQuestion     = useExamStore(s => s.nextQuestion)
  const finishExam       = useExamStore(s => s.finishExam)
  const setScreen        = useExamStore(s => s.setScreen)
  const bookmarks        = useExamStore(s => s.bookmarks)
  const toggleBookmark   = useExamStore(s => s.toggleBookmark)

  const currentQ   = questions[currentIndex]
  const lastAnswer = answers[answers.length - 1]
  const correct    = answers.filter(a => a.correct).length
  const total      = questions.length
  const progress   = total ? (currentIndex / total) * 100 : 0

  const catInfo   = useMemo(() =>
    CATEGORIES.find(c => c.id === (currentQ?.category)) || CATEGORIES[0],
    [currentQ]
  )

  const modeLabel = {
    core: '🎯 核心練習',
    category: `📚 ${CATEGORIES.find(c => c.id === categoryId)?.name || '分類練習'}`,
    all: '🏆 完整模擬考試',
  }[mode]

  const timerClass = remainingSeconds <= 300
    ? styles.timerDanger
    : remainingSeconds <= 600
    ? styles.timerWarning
    : styles.timer

  function handleQuit() {
    if (window.confirm('確定要結束並返回首頁嗎？')) setScreen('home')
  }

  if (!currentQ) return null

  return (
    <div className={styles.page}>
      {/* ── Top Bar ── */}
      <div className={styles.topBar}>
        <div className={styles.topLeft}>
          <span className={styles.modeBadge}>{modeLabel}</span>
          <button className={styles.quitBtn} onClick={handleQuit}>✕ 結束</button>
        </div>
        <div className={styles.topRight}>
          {mode !== 'all' && (
            <div className={styles.liveScore}>
              <span className={styles.liveScoreLabel}>即時得分</span>
              <span className={styles.liveScoreNum}
                style={{ color: total === 0 ? '' : correct / Math.max(answers.length, 1) >= PASS_SCORE / 100 ? 'var(--green-600)' : 'var(--red-600)' }}>
                {correct}/{answers.length}
              </span>
            </div>
          )}
          {mode === 'all' && (
            <div className={timerClass}>
              <span>⏱</span>
              <span className={styles.timerDigit}>{formatTime(remainingSeconds)}</span>
            </div>
          )}
        </div>
      </div>

      {/* ── Progress Bar ── */}
      <div className={styles.progressWrap}>
        <div className={styles.progressMeta}>
          <span className={styles.progressLabel}>
            第 {currentIndex + 1} 題 / 共 {total} 題
          </span>
          <span className={styles.progressPct}>{Math.round(progress)}%</span>
        </div>
        <div className={styles.progressTrack}>
          <div className={styles.progressFill} style={{ width: `${progress}%` }} />
        </div>
      </div>

      {/* ── Question Card ── */}
      <div className={styles.questionCard}>
        <div className={styles.questionMeta}>
          <span className={styles.catBadge}
            style={{ background: catInfo.bg, color: catInfo.color, borderColor: `${catInfo.color}33` }}>
            {catInfo.icon} {catInfo.name}
          </span>
          <div className={styles.qHeaderRight}>
            <button 
              className={`${styles.bookmarkBtn} ${bookmarks.includes(currentQ.id) ? styles.bookmarked : ''}`}
              onClick={() => toggleBookmark(currentQ.id)}
              aria-label="Toggle Bookmark"
            >
              {bookmarks.includes(currentQ.id) ? '❤️' : '🤍'}
            </button>
            <span className={styles.qNum}>Q{currentIndex + 1}</span>
          </div>
        </div>
        <p className={styles.questionText}>{currentQ.text}</p>
        {currentQ.image && (
          <div className={styles.imageContainer}>
            <img src={currentQ.image} alt="Question Graphic" className={styles.qImage} />
          </div>
        )}
      </div>

      {/* ── Options ── */}
      <div className={styles.optionsGrid}>
        {currentQ.options.map((opt, i) => {
          let optClass = styles.option
          if (answered) {
            if (i === currentQ.answer) optClass = styles.optionCorrect
            else if (i === lastAnswer?.userAns && !lastAnswer?.correct) optClass = styles.optionWrong
            else optClass = styles.optionDisabled
          }
          return (
            <button
              key={i}
              className={optClass}
              disabled={answered}
              onClick={() => selectAnswer(i)}
            >
              <span className={styles.optionLetter}>{LETTERS[i]}</span>
              <span className={styles.optionText}>{opt}</span>
              {answered && i === currentQ.answer && (
                <span className={styles.optionCheck}>✓</span>
              )}
              {answered && i === lastAnswer?.userAns && !lastAnswer?.correct && (
                <span className={styles.optionX}>✗</span>
              )}
            </button>
          )
        })}
      </div>

      {/* ── Feedback ── */}
      {answered && (
        <div className={lastAnswer?.correct ? styles.feedbackCorrect : styles.feedbackWrong}>
          <div className={styles.feedbackTitle}>
            {lastAnswer?.correct ? '✅ 答對了！' : `❌ 答錯了，正確答案是 ${LETTERS[currentQ.answer]}`}
          </div>
          <div className={styles.feedbackExplanation}>{currentQ.explanation}</div>
        </div>
      )}

      {/* ── Actions ── */}
      <div className={styles.actions}>
        {mode !== 'all' && !answered && (
          <button className={styles.btnGhost} onClick={skipQuestion}>跳過此題</button>
        )}
        {answered && (
          <button className={styles.btnPrimary} onClick={nextQuestion}>
            {currentIndex + 1 >= total ? '查看結果 →' : '下一題 →'}
          </button>
        )}
        {mode === 'all' && !answered && (
          <button className={styles.btnDanger} onClick={finishExam}>提前交卷</button>
        )}
      </div>
    </div>
  )
}
