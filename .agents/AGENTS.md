# moto-exam 專案規則與開發指引

## 專案識別

這是 **moto-exam**：台灣2026年機車駕照筆試模擬 Web App。  
完整的 Agent Memory 存放於：  
`C:\Users\huanl\.gemini\antigravity-ide\knowledge\moto-exam-project\artifacts\project-overview.md`

在開始任何任務前，請先閱讀上述 KI artifact 以取得完整的架構理解。

---

## 核心架構規則

1. **無 Router**：導航透過 Zustand `screen` 欄位 + App.jsx 條件渲染。不得引入 react-router 或任何路由函式庫，除非使用者明確要求。

2. **狀態集中**：所有全域狀態必須定義在 `src/store/examStore.js`。頁面元件不得使用 `useState` 管理跨頁面共用資料。

3. **CSS Modules + 全域變數**：
   - 每個頁面 `.jsx` 對應同名 `.module.css`
   - 顏色、間距、陰影、圓角必須使用 `global.css` 中定義的 CSS 變數
   - 禁止在 JS 中寫死顏色值（例外：CATEGORIES 中的 `color`/`bg` 屬性，它們作為動態主題色）

4. **題庫維護**：新增題目到 `src/data/questions.js`，確保 `id` 唯一遞增，`answer` 為 0~3 索引，`options` 長度為 4。

---

## 開發慣例

- 元件引入 store 優先使用選擇器訂閱：`useExamStore(s => s.xxx)` 而非 `useExamStore()`
- 計時器由 `App.jsx` 的 `setInterval` 統一驅動，不在元件內建立計時器
- 及格門檻 **85分**，勿硬編碼，改成常數或參考 `score >= 85`
- 新增頁面時同步在 `App.jsx` 加條件渲染、在 store 的 `screen` 型別加上新值

---

## 字體與設計

- 中文字體：`Noto Sans TC`；英數：`Inter`（Google Fonts，已在 index.html 預載）
- 主色系：indigo（`--primary-*`）
- 設計風格：白底卡片，輕量陰影，微動畫，CSS 自訂屬性驅動多主題卡片色

---

## 禁止事項

- ❌ 不使用 TailwindCSS（除非使用者明確要求）
- ❌ 不使用 UI 元件庫（MUI/Ant Design 等）
- ❌ 不新增 localStorage 持久化（除非使用者要求）
- ❌ 不在頁面元件內直接 import 並呼叫 `QUESTIONS` 做篩選邏輯，應將邏輯移入 store
