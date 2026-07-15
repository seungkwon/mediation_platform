import uuid
from pathlib import Path
from typing import Literal

from fastapi import APIRouter, Depends, HTTPException, UploadFile, status

from app.api.deps import get_current_user
from app.core.config import settings
from app.models.user import User

router = APIRouter(prefix="/uploads", tags=["uploads"])

UploadCategory = Literal[
    "profiles", "portfolios", "service_requests", "quotes", "chat", "notices", "qna", "faq", "resources"
]

IMAGE_EXTENSIONS = {".jpg", ".jpeg", ".png", ".gif", ".webp"}
VIDEO_EXTENSIONS = {".mp4", ".mov", ".webm"}
DOCUMENT_EXTENSIONS = {
    ".pdf",
    ".doc",
    ".docx",
    ".xls",
    ".xlsx",
    ".ppt",
    ".pptx",
    ".txt",
    ".csv",
    ".hwp",
    ".zip",
    ".rar",
}
ALLOWED_EXTENSIONS = IMAGE_EXTENSIONS | VIDEO_EXTENSIONS | DOCUMENT_EXTENSIONS


@router.post("/{category}")
async def upload_file(
    category: UploadCategory,
    file: UploadFile,
    user: User = Depends(get_current_user),
) -> dict[str, str]:
    ext = Path(file.filename or "").suffix.lower()
    if ext not in ALLOWED_EXTENSIONS:
        raise HTTPException(status.HTTP_400_BAD_REQUEST, f"허용되지 않는 파일 형식입니다: {ext}")

    if category == "resources":
        max_size_mb = settings.max_resource_size_mb
    elif ext in VIDEO_EXTENSIONS:
        max_size_mb = settings.max_video_size_mb
    else:
        max_size_mb = settings.max_image_size_mb
    max_bytes = max_size_mb * 1024 * 1024

    content = await file.read()
    if len(content) > max_bytes:
        raise HTTPException(status.HTTP_400_BAD_REQUEST, f"파일 크기는 {max_size_mb}MB를 초과할 수 없습니다.")

    dest_dir = Path(settings.upload_dir) / category / str(user.id)
    dest_dir.mkdir(parents=True, exist_ok=True)
    filename = f"{uuid.uuid4()}{ext}"
    dest_path = dest_dir / filename
    dest_path.write_bytes(content)

    relative_path = f"{category}/{user.id}/{filename}"
    return {
        "file_path": relative_path,
        "url": f"/static/{relative_path}",
        "original_filename": file.filename or filename,
        "size": str(len(content)),
    }
