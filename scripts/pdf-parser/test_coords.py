# /// script
# requires-python = ">=3.9"
# dependencies = [
#     "pymupdf",
# ]
# ///

import fitz

def main():
    doc = fitz.open("../../機車駕照筆試題庫(全部804題)-1150218.pdf")
    page = doc.load_page(1) # Page 2, which has Q9 image
    
    images = page.get_images(full=True)
    print(f"Found {len(images)} images on page 2")
    for img in images:
        xref = img[0]
        name = img[7]
        try:
            bbox = page.get_image_bbox(name)
            print(f"Image {name} (xref {xref}) bbox: {bbox}")
        except Exception as e:
            print(f"Error getting bbox for {name}: {e}")
            
    blocks = page.get_text("dict")["blocks"]
    for b in blocks:
        if b["type"] == 0:
            text = "".join("".join(s["text"] for s in l["spans"]) for l in b["lines"]).strip()
            if text.startswith("8") or text.startswith("9") or text.startswith("10"):
                print(f"Text block '{text[:20]}...' bbox: {b['bbox']}")

if __name__ == "__main__":
    main()
