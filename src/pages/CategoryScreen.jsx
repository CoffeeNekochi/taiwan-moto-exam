import styles from './CategoryScreen.module.css'
import { useExamStore } from '../store/examStore.js'
import { CATEGORIES } from '../data/questions.js'

export default function CategoryScreen() {
  const setScreen      = useExamStore(s => s.setScreen)
  const startExam      = useExamStore(s => s.startExam)
  const categoryCounts = useExamStore(s => s.categoryCounts)

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <button className={styles.backBtn} onClick={() => setScreen('home')}>
          ← 返回首頁
        </button>
        <div>
          <h1 className={styles.title}>選擇練習分類</h1>
          <p className={styles.sub}>針對薄弱科目加強練習</p>
        </div>
      </div>

      <div className={styles.grid}>
        {CATEGORIES.map(cat => {
          const count = categoryCounts[cat.id] ?? 0
          return (
            <button
              key={cat.id}
              className={styles.card}
              style={{ '--accent': cat.color, '--accentBg': cat.bg }}
              onClick={() => startExam('category', cat.id)}
            >
              <div className={styles.cardTop}>
                <div className={styles.catIcon}>{cat.icon}</div>
                <span className={styles.catCount}>{count} 題</span>
              </div>
              <div className={styles.catName}>{cat.name}</div>
              <p className={styles.catDesc}>{cat.desc}</p>
              <div className={styles.startHint}>開始練習 →</div>
            </button>
          )
        })}
      </div>
    </div>
  )
}
