"""
Download Malayalam font for PDF generation
This script downloads Noto Sans Malayalam font from Google Fonts
"""
import os
import urllib.request

def download_malayalam_font():
    """Download Noto Sans Malayalam font"""
    font_url = "https://github.com/google/fonts/raw/main/ofl/notosansmalayalam/NotoSansMalayalam%5Bwdth%2Cwght%5D.ttf"
    font_dir = "fonts"
    font_path = os.path.join(font_dir, "NotoSansMalayalam.ttf")

    # Create fonts directory if it doesn't exist
    if not os.path.exists(font_dir):
        os.makedirs(font_dir)
        print(f"Created {font_dir} directory")

    # Download font if not already present
    if not os.path.exists(font_path):
        print(f"Downloading Malayalam font from Google Fonts...")
        try:
            urllib.request.urlretrieve(font_url, font_path)
            print(f"[SUCCESS] Downloaded: {font_path}")
            print(f"  Font size: {os.path.getsize(font_path) / 1024:.2f} KB")
            return font_path
        except Exception as e:
            print(f"[ERROR] Failed to download font: {str(e)}")
            print("\nAlternative: Download manually from:")
            print("https://fonts.google.com/noto/specimen/Noto+Sans+Malayalam")
            return None
    else:
        print(f"[INFO] Font already exists: {font_path}")
        return font_path

if __name__ == "__main__":
    download_malayalam_font()
