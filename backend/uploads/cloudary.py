import os
import cloudinary
import cloudinary.uploader

API_KEY = "956829467844382"
API_SECRET = "Da-wX736KUEvIc1nQ4leYon7EzA"
CLOUD_NAME = "dpvumlr8r"

cloudinary.config(
    cloud_name=CLOUD_NAME,
    api_key=API_KEY,
    api_secret=API_SECRET,
    secure=True
)

def upload_to_cloudary(file_content: bytes, filename: str) -> str:
    """
    Uploads a file to Cloudinary and returns the secure URL.
    Supports images, videos, and raw files (pdfs, docs, etc.).
    """
    ext = os.path.splitext(filename)[1].lower()
    
    # Identify resource_type
    if ext in {".png", ".jpg", ".jpeg", ".gif", ".webp", ".svg", ".bmp", ".ico"}:
        resource_type = "image"
    elif ext in {".mp4", ".mov", ".avi", ".mkv", ".webm", ".mp3", ".wav"}:
        resource_type = "video"
    else:
        resource_type = "raw"

    response = cloudinary.uploader.upload(
        file_content,
        resource_type=resource_type,
        use_filename=True,
        unique_filename=True
    )
    return response.get("secure_url")