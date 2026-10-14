import hashlib
import uuid
import mimetypes
from io import BytesIO
from datetime import datetime, timezone
from typing import List, Optional
from fastapi import APIRouter, HTTPException, Depends, UploadFile, File, Query, status
from fastapi.responses import StreamingResponse
from pydantic import BaseModel
from app.auth import get_current_user
from app.database import db
from app.storage import get_storage, sanitize_filename
from app.ai.extractor import extract_text_from_bytes
from app.ai.classifier import classifier
from app.ai.embeddings import embedding_engine
from app.config import settings

router = APIRouter(prefix="/api/files", tags=["Files"])

def determine_kind(ext: str) -> str:
    e = ext.lower().lstrip(".")
    if e in ["png", "jpg", "jpeg", "gif", "webp", "svg", "bmp", "ico", "tiff"]:
        return "image"
    if e in ["mp4", "mov", "webm", "avi", "mkv"]:
        return "video"
    if e in ["mp3", "wav", "m4a", "flac", "ogg"]:
        return "audio"
    if e in ["zip", "rar", "7z", "tar", "gz"]:
        return "archive"
    if e in ["py", "ts", "js", "json", "html", "css", "c", "cpp", "java", "sql"]:
        return "code"
    if e in ["xlsx", "xls", "csv"]:
        return "spreadsheet"
    if e in ["pdf", "doc", "docx", "txt", "md", "pptx", "rtf"]:
        return "document"
    return "other"

class FileUpdate(BaseModel):
    name: Optional[str] = None
    category: Optional[str] = None
    favorite: Optional[bool] = None

@router.get("")
def list_files(
    q: Optional[str] = None,
    category: Optional[str] = None,
    sort: Optional[str] = "date",
    favorite: Optional[bool] = None,
    current_user: dict = Depends(get_current_user)
):
    query: dict = {"user_id": current_user["id"]}
    if q:
        query["name"] = {"$regex": q, "$options": "i"}
    if category and category != "All":
        query["category"] = category
    if favorite is not None:
        query["favorite"] = favorite

    sort_field = "date"
    sort_dir = -1
    if sort == "name":
        sort_field = "name"
        sort_dir = 1
    elif sort == "size":
        sort_field = "size"
        sort_dir = -1
    elif sort == "category":
        sort_field = "category"
        sort_dir = 1

    cursor = db.files.find(query, {"_id": 0, "embedding": 0}).sort(sort_field, sort_dir)
    return list(cursor)

@router.post("/upload")
async def upload_files(
    files: List[UploadFile] = File(...),
    current_user: dict = Depends(get_current_user)
):
    storage = get_storage()
    uploaded_records = []
    now = datetime.now(timezone.utc).isoformat()

    for upload in files:
        raw_name = upload.filename or "uploaded_file"
        base_name = raw_name.rsplit(".", 1)[0] if "." in raw_name else raw_name
        ext = raw_name.rsplit(".", 1)[1].lower() if "." in raw_name else "bin"
        kind = determine_kind(ext)

        # Read content
        content = await upload.read()
        file_size = len(content)

        # SHA-256 Checksum
        sha256 = hashlib.sha256(content).hexdigest()
        file_id = str(uuid.uuid4())

        # Save to Storage Provider
        storage_key = storage.save_file(
            file_id=file_id,
            filename=f"{base_name}.{ext}",
            content=content,
            user_id=current_user["id"]
        )

        # Extract text
        extracted_text = extract_text_from_bytes(content, raw_name, ext)

        # AI Classification
        predicted_category, confidence = classifier.classify(extracted_text, base_name, ext)

        # AI Embedding
        embedding_content = f"{base_name} {predicted_category} {extracted_text[:1500]}"
        embedding = embedding_engine.embed_text(embedding_content)

        # Create tags
        tags = [t for t in [ext, kind, predicted_category.lower()] if t]
        if "invoice" in base_name.lower():
            tags.append("finance")
        if any(w in base_name.lower() for w in ["college", "project", "assignment", "lecture"]):
            tags.append("college")

        # Text preview for documents
        text_preview = extracted_text[:4000] if extracted_text else None

        record = {
            "id": file_id,
            "user_id": current_user["id"],
            "name": base_name,
            "ext": ext,
            "kind": kind,
            "size": file_size,
            "date": now,
            "category": predicted_category,
            "confidence": confidence,
            "tags": tags,
            "favorite": False,
            "hash": sha256,
            "sha256": sha256,
            "storage_key": storage_key,
            "extracted_text": extracted_text[:10000],
            "textPreview": text_preview,
            "embedding": embedding,
            "created_at": now,
            "updated_at": now
        }

        db.files.insert_one(record)

        # Log activity
        db.activities.insert_one({
            "id": str(uuid.uuid4()),
            "user_id": current_user["id"],
            "type": "upload",
            "text": f"Uploaded {base_name}.{ext}",
            "date": now
        })

        safe_record = {k: v for k, v in record.items() if k not in ["_id", "embedding"]}
        uploaded_records.append(safe_record)

    return {"uploaded": uploaded_records, "count": len(uploaded_records)}

@router.get("/{file_id}")
def get_file_detail(file_id: str, current_user: dict = Depends(get_current_user)):
    file_doc = db.files.find_one({"id": file_id, "user_id": current_user["id"]}, {"_id": 0, "embedding": 0})
    if not file_doc:
        raise HTTPException(status_code=404, detail="File not found")
    return file_doc

@router.get("/{file_id}/download")
def download_file(file_id: str, current_user: dict = Depends(get_current_user)):
    file_doc = db.files.find_one({"id": file_id, "user_id": current_user["id"]})
    if not file_doc:
        raise HTTPException(status_code=404, detail="File not found")

    storage = get_storage()
    try:
        data = storage.get_file_bytes(file_doc["storage_key"])
    except Exception as e:
        raise HTTPException(status_code=404, detail=f"File binary missing: {e}")

    # Log download activity
    now = datetime.now(timezone.utc).isoformat()
    db.activities.insert_one({
        "id": str(uuid.uuid4()),
        "user_id": current_user["id"],
        "type": "download",
        "text": f"Downloaded {file_doc['name']}.{file_doc['ext']}",
        "date": now
    })

    mime_type, _ = mimetypes.guess_type(f"{file_doc['name']}.{file_doc['ext']}")
    mime_type = mime_type or "application/octet-stream"

    filename = f"{file_doc['name']}.{file_doc['ext']}"
    return StreamingResponse(
        BytesIO(data),
        media_type=mime_type,
        headers={"Content-Disposition": f'attachment; filename="{filename}"'}
    )

@router.patch("/{file_id}")
def update_file(file_id: str, payload: FileUpdate, current_user: dict = Depends(get_current_user)):
    file_doc = db.files.find_one({"id": file_id, "user_id": current_user["id"]})
    if not file_doc:
        raise HTTPException(status_code=404, detail="File not found")

    updates = {"updated_at": datetime.now(timezone.utc).isoformat()}
    activities_to_log = []

    if payload.name is not None and payload.name.strip():
        new_name = payload.name.strip()
        if new_name != file_doc["name"]:
            updates["name"] = new_name
            activities_to_log.append(("rename", f"Renamed {file_doc['name']} → {new_name}"))

    if payload.category is not None and payload.category.strip():
        new_cat = payload.category.strip()
        if new_cat != file_doc.get("category"):
            updates["category"] = new_cat
            activities_to_log.append(("classify", f"Manual category update: {file_doc['name']} → {new_cat}"))

    if payload.favorite is not None:
        updates["favorite"] = payload.favorite

    db.files.update_one({"id": file_id, "user_id": current_user["id"]}, {"$set": updates})

    for act_type, act_text in activities_to_log:
        db.activities.insert_one({
            "id": str(uuid.uuid4()),
            "user_id": current_user["id"],
            "type": act_type,
            "text": act_text,
            "date": updates["updated_at"]
        })

    updated = db.files.find_one({"id": file_id, "user_id": current_user["id"]}, {"_id": 0, "embedding": 0})
    return updated

@router.delete("/{file_id}")
def delete_file(file_id: str, current_user: dict = Depends(get_current_user)):
    file_doc = db.files.find_one({"id": file_id, "user_id": current_user["id"]})
    if not file_doc:
        raise HTTPException(status_code=404, detail="File not found")

    storage = get_storage()
    storage.delete_file(file_doc.get("storage_key", ""))
    db.files.delete_one({"id": file_id, "user_id": current_user["id"]})

    now = datetime.now(timezone.utc).isoformat()
    db.activities.insert_one({
        "id": str(uuid.uuid4()),
        "user_id": current_user["id"],
        "type": "remove",
        "text": f"Removed {file_doc['name']}.{file_doc['ext']}",
        "date": now
    })

    return {"success": True, "deleted_id": file_id}

@router.post("/{file_id}/classify")
def run_classification(file_id: str, current_user: dict = Depends(get_current_user)):
    file_doc = db.files.find_one({"id": file_id, "user_id": current_user["id"]})
    if not file_doc:
        raise HTTPException(status_code=404, detail="File not found")

    extracted = file_doc.get("extracted_text", "")
    pred_cat, conf = classifier.classify(extracted, file_doc["name"], file_doc["ext"])

    now = datetime.now(timezone.utc).isoformat()
    db.files.update_one(
        {"id": file_id, "user_id": current_user["id"]},
        {"$set": {"category": pred_cat, "confidence": conf, "updated_at": now}}
    )

    db.activities.insert_one({
        "id": str(uuid.uuid4()),
        "user_id": current_user["id"],
        "type": "classify",
        "text": f"AI classification: {file_doc['name']} → {pred_cat} ({conf}%)",
        "date": now
    })

    return {"file_id": file_id, "category": pred_cat, "confidence": conf}
