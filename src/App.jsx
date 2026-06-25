import { useEffect } from 'react'
import { useExamStore } from './store/examStore.js'
import HomeScreen    from './pages/HomeScreen.jsx'
import CategoryScreen from './pages/CategoryScreen.jsx'
import ExamScreen    from './pages/ExamScreen.jsx'
import ResultScreen  from './pages/ResultScreen.jsx'

export default function App() {
  const screen    = useExamStore(s => s.screen)
  const tickTimer = useExamStore(s => s.tickTimer)
  const timerRunning = useExamStore(s => s.timerRunning)
  const mergeBookmarks = useExamStore(s => s.mergeBookmarks)

  // Parse share URL parameter
  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const shareParam = params.get('share')
    if (shareParam) {
      try {
        const decoded = atob(shareParam)
        const ids = JSON.parse(decoded)
        if (Array.isArray(ids) && ids.length > 0) {
          // Use setTimeout to ensure it doesn't block the initial render immediately
          setTimeout(() => {
            if (window.confirm(`收到好友分享的 ${ids.length} 題錯題本，是否要合併到您的錯題本中？`)) {
              mergeBookmarks(ids)
              alert('合併成功！您可以開始「收藏錯題」練習了。')
            }
          }, 100)
        }
      } catch (e) {
        console.error('Failed to parse shared bookmarks:', e)
        alert('分享連結無效或已損壞。')
      }
      window.history.replaceState({}, document.title, window.location.pathname)
    }
  }, [mergeBookmarks])

  // Global 1-second timer
  useEffect(() => {
    if (!timerRunning) return
    const id = setInterval(tickTimer, 1000)
    return () => clearInterval(id)
  }, [timerRunning, tickTimer])

  return (
    <>
      {screen === 'home'     && <HomeScreen />}
      {screen === 'category' && <CategoryScreen />}
      {screen === 'exam'     && <ExamScreen />}
      {screen === 'result'   && <ResultScreen />}
    </>
  )
}
