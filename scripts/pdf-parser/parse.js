import fs from 'fs'
import path from 'path'
import pdf from 'pdf-parse/lib/pdf-parse.js'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const pdfPath = path.resolve(__dirname, '../../機車駕照筆試題庫(全部804題)-1150218.pdf')
const outPath = path.resolve(__dirname, '../../src/data/questions.js')

const COLORS = [
  { color: '#4f46e5', bg: '#eef2ff' }, // indigo
  { color: '#0891b2', bg: '#ecfeff' }, // cyan
  { color: '#16a34a', bg: '#f0fdf4' }, // green
  { color: '#dc2626', bg: '#fef2f2' }, // red
  { color: '#d97706', bg: '#fffbeb' }, // amber
  { color: '#8b5cf6', bg: '#f5f3ff' }, // violet
  { color: '#ec4899', bg: '#fdf2f8' }  // pink
]

const ICONS = ['⚖️', '🛡️', '🚨', '🏍️', '🚦', '🛑', '⚠️']

async function run() {
  const dataBuffer = fs.readFileSync(pdfPath)
  const data = await pdf(dataBuffer)
  
  const text = data.text
  const lines = text.split('\n').map(l => l.trim()).filter(l => l.length > 0)
  
  const categories = []
  const questions = []
  
  let currentCategory = null
  let currentQuestion = null
  let nextExpectedId = 1
  
  // Regex to detect category header, e.g. ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n正確觀念與態度\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // But wait, after pdf-parse, it might just look like text. We can detect categories if we see lines without numbers and not options.
  // Actually, let's just use the exact strings from the index if possible.
  // Let's print out the text first to debug if needed, but we can do a robust parser.
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i]
    
    // Ignore headers/footers
    if (line.includes('機車駕照筆試題庫') || line.match(/^—\s*\d+\s*—$/) || line.includes('題號 答案') || line.includes('題目內容') || line.includes('【 題庫索引 】') || line.includes('分類')) {
      continue
    }

    // Is it a new question start?
    let qMatch = line.match(/^(\d+)\s+([123])\s*(.*)$/)
    if (qMatch && parseInt(qMatch[1]) === nextExpectedId) {
      if (currentQuestion) {
        processQuestion(currentQuestion, questions)
      }
      currentQuestion = {
        id: nextExpectedId,
        answer: parseInt(qMatch[2]) - 1, // 0-indexed
        categoryId: currentCategory ? currentCategory.id : 'default',
        rawText: qMatch[3] + ' '
      }
      nextExpectedId++
      continue
    }

    if (line === nextExpectedId.toString()) {
      if (currentQuestion) {
        processQuestion(currentQuestion, questions)
      }
      
      const nextLine = lines[i+1]
      let ans, rawText, skip
      
      if (nextLine.match(/^[123]$/)) {
        ans = parseInt(nextLine)
        rawText = ''
        skip = 1
      } else {
        const m = nextLine.match(/^([123])\s+(.*)/)
        if (m) {
          ans = parseInt(m[1])
          rawText = m[2] + ' '
          skip = 1
        } else {
          // not matched, might not be a question start
          continue
        }
      }
      
      currentQuestion = {
        id: nextExpectedId,
        answer: ans - 1, // 0-indexed
        categoryId: currentCategory ? currentCategory.id : 'default',
        rawText: rawText
      }
      nextExpectedId++
      i += skip // Skip the answer line
      continue
    }
    
    // Is it a category header? "正確觀念與態度" surrounded by "━━━..."
    if (line.match(/^━+$/)) {
      // Look at next line
      if (i + 1 < lines.length && !lines[i+1].match(/^━+$/)) {
        const catName = lines[i+1].trim()
        if (catName.length > 0 && !catName.match(/^\d/)) {
          // It's a category!
          let catId = 'cat_' + categories.length
          const catColor = COLORS[categories.length % COLORS.length]
          const catIcon = ICONS[categories.length % ICONS.length]
          
          categories.push({
            id: catId,
            name: catName,
            icon: catIcon,
            color: catColor.color,
            bg: catColor.bg,
            desc: catName
          })
          currentCategory = categories[categories.length - 1]
          i++ // skip the name line
          // skip the next line if it's also '━━━...'
          if (i + 1 < lines.length && lines[i+1].match(/^━+$/)) {
             i++
          }
        }
      }
      continue
    }
    
    if (currentQuestion) {
      currentQuestion.rawText += line + ' '
    }
  }
  
  if (currentQuestion) {
    processQuestion(currentQuestion, questions)
  }
  
  // Clean up categories: some categories might be sub-categories. 
  // If we couldn't parse categories perfectly, fallback to one default.
  if (categories.length === 0) {
    categories.push({ id: 'default', name: '全庫綜合', icon: '🏍️', color: '#4f46e5', bg: '#eef2ff', desc: '全部考題' })
  }

  // Deduplicate categories if needed
  const uniqueCats = []
  const catMap = new Map()
  for (const c of categories) {
    if (!catMap.has(c.name)) {
      catMap.set(c.name, c.id)
      uniqueCats.push(c)
    }
  }
  
  // Fix question category IDs
  for (const q of questions) {
    const c = categories.find(cat => cat.id === q.category)
    if (c && catMap.has(c.name)) {
      q.category = catMap.get(c.name)
    }
  }

  const jsContent = `// ============================================================
//  台灣機車駕照筆試完整題庫 — ${questions.length}題
// ============================================================

export const CATEGORIES = ${JSON.stringify(uniqueCats, null, 2)}

export const QUESTIONS = ${JSON.stringify(questions, null, 2)}
`
  
  fs.writeFileSync(outPath, jsContent, 'utf-8')
  console.log('Parsed ' + questions.length + ' questions and ' + uniqueCats.length + ' categories.')
}

function processQuestion(q, questionsList) {
  // Extract options (1)... (2)... (3)...
  const optMatch = q.rawText.match(/(.*?)[\(（]1[\)）]\s*(.*?)[\(（]2[\)）]\s*(.*?)[\(（]3[\)）]\s*(.*)/)
  if (optMatch) {
    let text = optMatch[1].trim()
    
    // Skip image questions (which have no text in the PDF parsed output)
    if (!text) return;
    
    let o1 = optMatch[2].trim()
    let o2 = optMatch[3].trim()
    let o3 = optMatch[4].trim()
    
    // Remove trailing periods from options
    o1 = o1.replace(/[。\.]$/, '')
    o2 = o2.replace(/[。\.]$/, '')
    o3 = o3.replace(/[。\.]$/, '')
    
    questionsList.push({
      id: q.id,
      category: q.categoryId,
      text: text,
      options: [o1, o2, o3],
      answer: q.answer,
      isCore: (q.id % 10 === 0),
      explanation: ''
    })
  } else {
    // If we fail to parse options, push a dummy and log it
    console.error('Failed to parse options for Q: ' + q.id, q.rawText)
  }
}

run().catch(console.error)
