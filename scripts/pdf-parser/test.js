import fs from 'fs'; 
import pdf from 'pdf-parse/lib/pdf-parse.js'; 
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const pdfPath = path.resolve(__dirname, '../../機車駕照筆試題庫(全部804題)-1150218.pdf');

async function run() { 
  const dataBuffer = fs.readFileSync(pdfPath); 
  const data = await pdf(dataBuffer); 
  const lines = data.text.split('\n').map(l => l.trim()).filter(l => l.length > 0); 
  for(let i=0; i<lines.length; i++) { 
    if(lines[i].startsWith('18 ') || lines[i] === '18') {
      console.log('--- FOUND 18 ---');
      console.log(lines.slice(i, i+15).join('\n')); 
    } 
  } 
} 
run();
