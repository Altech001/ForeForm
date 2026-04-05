"""
Upload router — file uploads (logo, PDF, XLSX, CSV).
Stores files locally in development; swap to S3/Cloudinary for production.
"""
import os
import uuid
from fastapi import APIRouter, Depends, UploadFile, File, HTTPException
from fastapi.responses import FileResponse

from config import settings
from models.user import User
from auth.jwt import get_current_user

router = APIRouter(prefix="/api", tags=["upload"])

# Ensure upload directory exists
os.makedirs(settings.UPLOAD_DIR, exist_ok=True)

ALLOWED_EXTENSIONS = {
    ".png", ".jpg", ".jpeg", ".gif", ".webp", ".svg",  # images
    ".pdf", ".xlsx", ".xls", ".csv", ".docx",         # documents
}
MAX_FILE_SIZE = 10 * 1024 * 1024  # 10 MB


@router.post("/upload")
async def upload_file(
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_user),
):
    """
    Upload a file (logo, PDF, spreadsheet, etc.).
    Returns { file_url: "/api/files/<filename>" }.
    """
    # Validate extension
    ext = os.path.splitext(file.filename or "")[1].lower()
    if ext not in ALLOWED_EXTENSIONS:
        raise HTTPException(status_code=400, detail=f"File type '{ext}' not allowed")

    # Read and validate size
    contents = await file.read()
    if len(contents) > MAX_FILE_SIZE:
        raise HTTPException(status_code=400, detail="File exceeds 10 MB limit")

    # Save with unique filename
    unique_name = f"{uuid.uuid4().hex}{ext}"
    file_path = os.path.join(settings.UPLOAD_DIR, unique_name)
    with open(file_path, "wb") as f:
        f.write(contents)

    file_url = f"/api/files/{unique_name}"
    return {"file_url": file_url}


@router.get("/files/{filename}")
async def serve_file(filename: str):
    """Serve an uploaded file by filename."""
    file_path = os.path.join(settings.UPLOAD_DIR, filename)
    if not os.path.exists(file_path):
        raise HTTPException(status_code=404, detail="File not found")
    return FileResponse(file_path)
