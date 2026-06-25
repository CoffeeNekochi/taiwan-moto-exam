# /// script
# requires-python = ">=3.9"
# dependencies = [
#     "pymupdf",
# ]
# ///

import fitz
import sys

def main():
    doc = fitz.open("../../機車駕照筆試題庫(全部804題)-1150218.pdf")
    total_images = 0
    for page_num in range(len(doc)):
        page = doc.load_page(page_num)
        images = page.get_images(full=True)
        if images:
            print(f"Page {page_num+1}: {len(images)} images")
        total_images += len(images)
    print(f"Total images found: {total_images}")

if __name__ == "__main__":
    main()
