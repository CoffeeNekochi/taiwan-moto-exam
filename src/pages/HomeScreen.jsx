import styles from './HomeScreen.module.css'
import { useExamStore } from '../store/examStore.js'
import { CATEGORIES } from '../data/questions.js'
import { PASS_SCORE } from '../config.js'

const MODES = [
  {
    id: 'core',
    icon: '🎯',
    label: '核心練習',
    sub: 'Core Practice',
    desc: '針對高頻考題集中刷題，每題即時解析，快速建立答題直覺。無時間限制，隨時停止。',
    tags: ['即時解析', '高頻題庫', '無限刷題'],
    accent: '#4f46e5',
    accentBg: '#eef2ff',
  },
  {
    id: 'category',
    icon: '📚',
    label: '分類練習',
    sub: 'Category Practice',
    desc: '依科目選擇加強，包含交通法規、號誌標誌、行車安全、緊急狀況、車輛常識五大主題。',
    tags: ['5大分類', '專項強化', '弱點擊破'],
    accent: '#0891b2',
    accentBg: '#ecfeff',
  },
  {
    id: 'all',
    icon: '🏆',
    label: '我都要會模式',
    sub: 'Full Simulation',
    desc: '完整模擬正式考試，60分鐘計時，隨機抽取35題，考後提供詳細成績分析及錯題解析。',
    tags: ['60分鐘計時', '35題模擬', '成績報告'],
    accent: '#d97706',
    accentBg: '#fffbeb',
  },
  {
    id: 'bookmarks',
    icon: '❤️',
    label: '收藏錯題',
    sub: 'Bookmarks Practice',
    desc: '專屬您的個人題庫！集中複習所有標記為收藏或曾經答錯的題目，高效率克服弱點。',
    tags: ['個人化', '弱點突破', '自訂題庫'],
    accent: '#ec4899',
    accentBg: '#fdf2f8',
  },
]

export default function HomeScreen() {
  const startExam        = useExamStore(s => s.startExam)
  const setScreen        = useExamStore(s => s.setScreen)
  const totalQ           = useExamStore(s => s.totalQuestionCount)
  const bookmarks        = useExamStore(s => s.bookmarks)
  const catCount         = CATEGORIES.length

  const handleStart = (mode) => {
    if (mode === 'bookmarks' && bookmarks.length === 0) {
      alert('您目前還沒有收藏任何題目喔！請在測驗或結算畫面點擊愛心收藏題目。')
      return
    }
    if (mode === 'category') {
      setScreen('category')
    } else {
      startExam(mode)
    }
  }

  const handleShare = (e) => {
    e.stopPropagation()
    if (bookmarks.length === 0) {
      alert('您目前還沒有收藏任何題目可以分享喔！')
      return
    }
    try {
      const base64 = btoa(JSON.stringify(bookmarks))
      const shareUrl = `${window.location.origin}${window.location.pathname}?share=${base64}`
      navigator.clipboard.writeText(shareUrl)
      alert('分享連結已複製到剪貼簿！快去貼給朋友吧。')
    } catch (err) {
      console.error('Copy failed', err)
      alert('複製失敗，請稍後再試。')
    }
  }

  return (
    <div className={styles.page}>
      {/* ── Hero ── */}
      <header className={styles.hero}>
        <div className={styles.heroBadge}>
          <span className={styles.badgeDot}></span>
          <span>台灣機車駕照筆試 2026 最新版</span>
        </div>
        <h1 className={styles.heroTitle}>
          機車駕照<br />
          <span className={styles.heroAccent}>筆試模擬考試</span>
        </h1>
        <p className={styles.heroSub}>
          {totalQ} 題完整題庫・{catCount} 大分類・三種練習模式
        </p>
      </header>

      {/* ── Stats ── */}
      <div className={styles.statsRow}>
        {[
          { value: totalQ + '+', label: '題庫總題數' },
          { value: String(PASS_SCORE), label: '及格分數（分）' },
          { value: '60', label: '考試時間（分鐘）' },
          { value: catCount, label: '題目分類' },
        ].map(s => (
          <div key={s.label} className={styles.statCard}>
            <span className={styles.statNum}>{s.value}</span>
            <span className={styles.statLabel}>{s.label}</span>
          </div>
        ))}
      </div>

      {/* ── Mode Cards ── */}
      <div className={styles.modeGrid}>
        {MODES.map(m => (
          <button
            key={m.id}
            className={styles.modeCard}
            style={{ '--accent': m.accent, '--accentBg': m.accentBg }}
            onClick={() => handleStart(m.id)}
            aria-label={m.label}
          >
            <div className={styles.modeTop}>
              <div className={styles.modeIcon}>{m.icon}</div>
              {m.id === 'bookmarks' && (
                <button 
                  className={styles.shareBtn} 
                  onClick={handleShare}
                  aria-label="Share Bookmarks"
                  title="分享錯題本"
                >
                  📤
                </button>
              )}
              <div className={styles.modeArrow}>→</div>
            </div>
            <div className={styles.modeSub}>{m.sub}</div>
            <div className={styles.modeLabel}>{m.label}</div>
            <p className={styles.modeDesc}>{m.desc}</p>
            <div className={styles.modeTags}>
              {m.tags.map(t => (
                <span key={t} className={styles.modeTag}>{t}</span>
              ))}
            </div>
          </button>
        ))}
      </div>

      {/* ── Footer note ── */}
      <p className={styles.footer}>
        本模擬題庫依2026年道路交通管理處罰條例及安全規則編製，僅供練習參考。
      </p>
    </div>
  )
}
