import { useEffect, useRef } from 'react'
import styles from './ResultScreen.module.css'
import { useExamStore } from '../store/examStore.js'
import { CATEGORIES } from '../data/questions.js'
import { PASS_SCORE } from '../config.js'

const LETTERS = ['A', 'B', 'C', 'D']

function launchConfetti() {
  const colors = ['#6366f1','#06b6d4','#22c55e','#f59e0b','#ec4899','#8b5cf6']
  for (let i = 0; i < 90; i++) {
    setTimeout(() => {
      const el = document.createElement('div')
      el.className = 'confetti-piece'
      el.style.left = Math.random() * 100 + 'vw'
      el.style.background = colors[Math.floor(Math.random() * colors.length)]
      el.style.animationDuration = (Math.random() * 2 + 2.5) + 's'
      el.style.transform = `rotate(${Math.random() * 360}deg)`
      el.style.width = el.style.height = (Math.random() * 10 + 6) + 'px'
      document.body.appendChild(el)
      setTimeout(() => el.remove(), 5000)
    }, Math.random() * 1200)
  }
}

export default function ResultScreen() {
  const mode       = useExamStore(s => s.mode)
  const categoryId = useExamStore(s => s.categoryId)
  const questions  = useExamStore(s => s.questions)
  const answers    = useExamStore(s => s.answers)
  const startTime  = useExamStore(s => s.startTime)
  const endTime    = useExamStore(s => s.endTime)
  const retry      = useExamStore(s => s.retry)
  const setScreen  = useExamStore(s => s.setScreen)
  const wrongItems = useExamStore(s => s.wrongItems)
  const bookmarks      = useExamStore(s => s.bookmarks)
  const toggleBookmark = useExamStore(s => s.toggleBookmark)
  const ringRef = useRef(null)
  const numRef  = useRef(null)

  const total   = questions.length
  const correct = answers.filter(a => a.correct).length
  const wrong   = answers.filter(a => !a.correct && !a.skipped).length
  const skipped = answers.filter(a => a.skipped).length
  const score   = total ? Math.round((correct / total) * 100) : 0
  const passed  = score >= PASS_SCORE

  const usedMs  = (endTime || Date.now()) - (startTime || Date.now())
  const usedSec = Math.round(usedMs / 1000)
  const timeStr = `${Math.floor(usedSec / 60)}:${(usedSec % 60).toString().padStart(2,'0')}`



  // Score ring animation
  useEffect(() => {
    const circumference = 2 * Math.PI * 80
    if (ringRef.current) {
      ringRef.current.style.strokeDasharray = circumference
      ringRef.current.style.strokeDashoffset = circumference
      setTimeout(() => {
        ringRef.current.style.transition = 'stroke-dashoffset 1.4s cubic-bezier(0.4,0,0.2,1)'
        ringRef.current.style.strokeDashoffset = circumference - (circumference * score / 100)
      }, 200)
    }
    // Number animation
    const start = Date.now()
    const duration = 1200
    function tick() {
      const t = Math.min((Date.now() - start) / duration, 1)
      const eased = 1 - Math.pow(1 - t, 3)
      if (numRef.current) numRef.current.textContent = Math.round(score * eased)
      if (t < 1) requestAnimationFrame(tick)
    }
    requestAnimationFrame(tick)

    if (passed && mode === 'all') {
      setTimeout(launchConfetti, 600)
    }
  }, [])

  return (
    <div className={styles.page}>
      {/* ── Score Hero ── */}
      <div className={styles.hero}>
        <div className={styles.ringWrap}>
          <svg width="200" height="200" viewBox="0 0 200 200" className={styles.ringSvg}>
            <defs>
              <linearGradient id="passGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#22c55e" />
                <stop offset="100%" stopColor="#4ade80" />
              </linearGradient>
              <linearGradient id="failGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#ef4444" />
                <stop offset="100%" stopColor="#f87171" />
              </linearGradient>
            </defs>
            <circle cx="100" cy="100" r="80"
              fill="none" stroke="var(--gray-100)" strokeWidth="12" />
            <circle cx="100" cy="100" r="80"
              fill="none"
              stroke={passed ? 'url(#passGrad)' : 'url(#failGrad)'}
              strokeWidth="12"
              strokeLinecap="round"
              ref={ringRef}
            />
          </svg>
          <div className={styles.ringCenter}>
            <span
              className={styles.scoreNum}
              ref={numRef}
              style={{ color: passed ? 'var(--green-600)' : 'var(--red-600)' }}
            >0</span>
            <span className={styles.scoreSuffix}>分</span>
          </div>
        </div>

        <h2 className={styles.verdict} style={{ color: passed ? 'var(--green-600)' : 'var(--red-600)' }}>
          {passed ? '🎉 恭喜通過！' : '💪 繼續加油！'}
        </h2>
        <p className={styles.verdictSub}>
          {mode === 'all'
            ? (passed
                ? `得分 ${score} 分（及格標準${PASS_SCORE}分），答對 ${correct}/${total} 題`
                : `得分 ${score} 分，未達及格標準${PASS_SCORE}分，答對 ${correct}/${total} 題`)
            : `答對 ${correct} 題，答錯 ${wrong} 題${skipped ? `，跳過 ${skipped} 題` : ''}`
          }
        </p>
      </div>

      {/* ── Stats Row ── */}
      <div className={styles.statsRow}>
        {[
          { label: '答對題數', value: correct, color: 'var(--green-600)', bg: 'var(--green-50)', border: 'var(--green-100)' },
          { label: '答錯題數', value: wrong,   color: 'var(--red-600)',   bg: 'var(--red-50)',   border: 'var(--red-100)' },
          { label: '跳過題數', value: skipped, color: 'var(--amber-600)', bg: 'var(--amber-50)', border: 'var(--amber-100)' },
          { label: '使用時間', value: timeStr, color: 'var(--primary-600)', bg: 'var(--primary-50)', border: 'var(--primary-100)' },
        ].map(s => (
          <div key={s.label} className={styles.statCard}
            style={{ background: s.bg, borderColor: s.border }}>
            <span className={styles.statVal} style={{ color: s.color }}>{s.value}</span>
            <span className={styles.statLabel}>{s.label}</span>
          </div>
        ))}
      </div>

      {/* ── Category Breakdown ── */}
      <div className={styles.breakdown}>
        <h3 className={styles.sectionTitle}>📊 各類別成績</h3>
        <div className={styles.breakdownGrid}>
          {CATEGORIES.map(cat => {
            const catQs  = questions.filter(q => q.category === cat.id)
            const catAns = answers.filter(a => catQs.find(q => q.id === a.qId))
            const catOk  = catAns.filter(a => a.correct).length
            const pct    = catAns.length ? Math.round((catOk / catAns.length) * 100) : null
            if (!catAns.length) return null
            return (
              <div key={cat.id} className={styles.breakdownItem}
                style={{ '--accent': cat.color, '--accentBg': cat.bg }}>
                <div className={styles.breakdownTop}>
                  <span className={styles.breakdownIcon}>{cat.icon}</span>
                  <span className={styles.breakdownName}>{cat.name}</span>
                  <span className={styles.breakdownScore}
                    style={{ color: pct >= PASS_SCORE ? 'var(--green-600)' : 'var(--red-600)' }}>
                    {pct}%
                  </span>
                </div>
                <div className={styles.breakdownBar}>
                  <div className={styles.breakdownFill}
                    style={{ width: `${pct}%`, background: pct >= PASS_SCORE ? 'var(--green-500)' : 'var(--red-500)' }} />
                </div>
                <div className={styles.breakdownMeta}>{catOk}/{catAns.length} 題答對</div>
              </div>
            )
          })}
        </div>
      </div>

      {/* ── Wrong List ── */}
      {wrongItems.length > 0 && (
        <div className={styles.wrongSection}>
          <div className={styles.wrongHeader}>
            <h3 className={styles.sectionTitle}>📝 錯題解析</h3>
            <span className={styles.wrongBadge}>{wrongItems.length} 題</span>
          </div>
          <div className={styles.wrongList}>
            {wrongItems.map(({ answer: ans, q }) => {
              const cat = CATEGORIES.find(c => c.id === q.category)
              return (
                <div key={q.id} className={styles.wrongItem}>
                  <div className={styles.wrongItemHeader}>
                    <span className={styles.wrongCatBadge} style={{ background: cat?.bg, color: cat?.color, borderColor: `${cat?.color}33` }}>
                      {cat?.icon} {cat?.name}
                    </span>
                    <button 
                      className={`${styles.bookmarkBtn} ${bookmarks.includes(q.id) ? styles.bookmarked : ''}`}
                      onClick={() => toggleBookmark(q.id)}
                      aria-label="Toggle Bookmark"
                    >
                      {bookmarks.includes(q.id) ? '❤️' : '🤍'}
                    </button>
                  </div>
                  <p className={styles.wrongQ}>{q.text}</p>
                  {q.image && (
                    <div className={styles.imageContainer}>
                      <img src={import.meta.env.BASE_URL + q.image.replace(/^\//, '')} alt="Question Graphic" className={styles.qImage} />
                    </div>
                  )}
                  <div className={styles.wrongAnswers}>
                    <div className={styles.wrongRow}>
                      <span className={styles.wrongRowLabel} style={{ color: 'var(--red-600)' }}>你的答案：</span>
                      <span className={styles.wrongRowVal}>
                        {ans.skipped ? '（跳過）' : q.options[ans.userAns]}
                      </span>
                    </div>
                    <div className={styles.wrongRow}>
                      <span className={styles.wrongRowLabel} style={{ color: 'var(--green-600)' }}>正確答案：</span>
                      <span className={styles.wrongRowVal}>{q.options[q.answer]}</span>
                    </div>
                    <div className={styles.wrongExplain}>
                      <span className={styles.wrongExplainIcon}>💡</span>
                      <span>{q.explanation}</span>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* ── Actions ── */}
      <div className={styles.actions}>
        <button className={styles.btnGhost} onClick={() => setScreen('home')}>🏠 回首頁</button>
        <button className={styles.btnPrimary} onClick={retry}>🔄 再考一次</button>
      </div>
    </div>
  )
}
