# /// script
# requires-python = ">=3.9"
# dependencies = [
#     "pymupdf",
# ]
# ///

import fitz
import re
import json
import os
import sys

# Windows console encoding fix
sys.stdout.reconfigure(encoding='utf-8')

def run():
    pdf_path = "../../機車駕照筆試題庫(全部804題)-1150218.pdf"
    doc = fitz.open(pdf_path)
    
    categories = [
        {"id": "cat_0", "name": "正確觀念與態度", "icon": "⚖️", "color": "#4f46e5", "bg": "#eef2ff", "desc": "正確觀念與態度"},
        {"id": "cat_1", "name": "主動停讓文化", "icon": "🛡️", "color": "#0891b2", "bg": "#ecfeff", "desc": "主動停讓文化"},
        {"id": "cat_2", "name": "安全駕駛能力", "icon": "🚨", "color": "#16a34a", "bg": "#f0fdf4", "desc": "安全駕駛能力"},
    ]
    current_category = categories[0]
    
    questions = []
    next_expected_id = 1
    
    img_out_dir = "../../public/images"
    os.makedirs(img_out_dir, exist_ok=True)
    
    for page_num in range(len(doc)):
        page = doc.load_page(page_num)
        blocks = page.get_text("dict")["blocks"]
        
        # 1. Collect question text blocks on this page
        page_qs = []
        if questions:
            page_qs.append(questions[-1])
        for b in blocks:
            if b["type"] == 0:
                text = ""
                for l in b["lines"]:
                    text += "".join(s["text"] for s in l["spans"]) + "\n"
                text = text.strip()
                lines = text.split('\n')
                for line in lines:
                    line = line.strip()
                    if not line:
                        continue
                    
                    # Skip headers and footers
                    if '機車駕照筆試題庫' in line or re.match(r'^—\s*\d+\s*—$', line) or '題號 答案' in line or '題目內容' in line or '【 題庫索引 】' in line or line == '分類':
                        continue
                    if re.match(r'^━+$', line):
                        continue
                        
                    # Category detection
                    for c in categories:
                        if c["name"] in line and len(line) < 20:
                            current_category = c
                            break
                            
                    q_match = re.match(r'^(\d+)\s+([123])\s*(.*)$', line)
                    if q_match and int(q_match.group(1)) == next_expected_id:
                        q_id = next_expected_id
                        ans = int(q_match.group(2)) - 1
                        raw_text = q_match.group(3) + " "
                        
                        q_obj = {
                            "id": q_id,
                            "answer": ans,
                            "categoryId": current_category["id"],
                            "rawText": raw_text,
                            "image": None,
                            "y0": b["bbox"][1] # Store Y coordinate
                        }
                        page_qs.append(q_obj)
                        questions.append(q_obj)
                        next_expected_id += 1
                    elif line == str(next_expected_id):
                        # In case ID is on its own line
                        q_obj = {
                            "id": next_expected_id,
                            "answer": None,
                            "categoryId": current_category["id"],
                            "rawText": "",
                            "image": None,
                            "y0": b["bbox"][1],
                            "awaiting_answer": True
                        }
                        page_qs.append(q_obj)
                        questions.append(q_obj)
                        next_expected_id += 1
                    else:
                        # Append text to the last question globally
                        if questions:
                            last_q = questions[-1]
                            if last_q.get("awaiting_answer"):
                                ans_match = re.match(r'^([123])\s*(.*)$', line)
                                if ans_match:
                                    last_q["answer"] = int(ans_match.group(1)) - 1
                                    last_q["rawText"] += ans_match.group(2) + " "
                                    last_q["awaiting_answer"] = False
                                elif re.match(r'^[123]$', line):
                                    last_q["answer"] = int(line) - 1
                                    last_q["awaiting_answer"] = False
                            else:
                                last_q["rawText"] += line + " "

        # 2. Collect images on this page and map to closest question by Y coord
        images = page.get_images(full=True)
        for img in images:
            xref = img[0]
            name = img[7]
            try:
                bbox = page.get_image_bbox(name)
                img_y0 = bbox[1]
                
                # Find closest question
                closest_q = None
                min_dist = float('inf')
                for q in page_qs:
                    dist = abs(q["y0"] - img_y0)
                    if dist < min_dist:
                        min_dist = dist
                        closest_q = q
                        
                if closest_q and min_dist < 100: # Ensure it's reasonably close
                    # Extract image bytes
                    base_image = doc.extract_image(xref)
                    image_bytes = base_image["image"]
                    ext = base_image["ext"]
                    
                    img_filename = f"q_{closest_q['id']}.{ext}"
                    img_path = os.path.join(img_out_dir, img_filename)
                    with open(img_path, "wb") as f:
                        f.write(image_bytes)
                        
                    closest_q["image"] = f"/images/{img_filename}"
            except Exception as e:
                print(f"Failed to process image {name}: {e}")

    # Process options
    final_questions = []
    for q in questions:
        raw = q["rawText"]
        opt_match = re.search(r'(.*?)[\(（]1[\)）]\s*(.*?)[\(（]2[\)）]\s*(.*?)[\(（]3[\)）]\s*(.*)', raw)
        if opt_match:
            text = opt_match.group(1).strip()
            o1 = re.sub(r'[。\.]$', '', opt_match.group(2).strip())
            o2 = re.sub(r'[。\.]$', '', opt_match.group(3).strip())
            o3 = re.sub(r'[。\.]$', '', opt_match.group(4).strip())
            
            final_questions.append({
                "id": q["id"],
                "category": q["categoryId"],
                "text": text,
                "options": [o1, o2, o3],
                "answer": q["answer"] if q["answer"] is not None else 0,
                "image": q["image"],
                "isCore": (q["id"] % 10 == 0),
                "explanation": ""
            })
        else:
            print(f"Failed to parse options for Q: {q['id']} - {raw}")

    js_content = f"""// ============================================================
//  台灣機車駕照筆試完整題庫 — {len(final_questions)}題 (含圖片)
// ============================================================

export const CATEGORIES = {json.dumps(categories, ensure_ascii=False, indent=2)};

export const QUESTIONS = {json.dumps(final_questions, ensure_ascii=False, indent=2)};
"""
    out_path = "../../src/data/questions.js"
    with open(out_path, "w", encoding="utf-8") as f:
        f.write(js_content)
        
    img_count = sum(1 for q in final_questions if q['image'])
    print(f"Parsed {len(final_questions)} questions with {img_count} images.")

if __name__ == "__main__":
    run()
