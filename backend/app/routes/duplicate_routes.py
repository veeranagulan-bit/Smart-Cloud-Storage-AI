import re
import uuid
from datetime import datetime, timezone
from typing import List
from fastapi import APIRouter, Depends, Body
from app.auth import get_current_user
from app.database import db
from app.storage import get_storage

router = APIRouter(prefix="/api/duplicates", tags=["Duplicates"])

def normalize_name(name: str) -> str:
    cleaned = re.sub(r'\(copy\)|copy|\(\d+\)|[-_ ]?v\d+|final|[^a-z0-9]', '', name.lower())
    return cleaned.strip()

@router.get("")
def get_duplicates(current_user: dict = Depends(get_current_user)):
    files = list(db.files.find({"user_id": current_user["id"]}, {"_id": 0, "embedding": 0}))

    # 1. Exact identical content groups (by SHA-256 hash)
    by_hash = {}
    for f in files:
        h = f.get("hash") or f.get("sha256")
        if h:
            by_hash.setdefault(h, []).append(f)

    identical_groups = [
        {"type": "identical", "files": group}
        for h, group in by_hash.items() if len(group) > 1
    ]

    identical_file_ids = set()
    for g in identical_groups:
        for f in g["files"]:
            identical_file_ids.add(f["id"])

    # 2. Similar name groups (files not already in identical groups)
    by_name = {}
    for f in files:
        if f["id"] not in identical_file_ids:
            norm_key = normalize_name(f.get("name", ""))
            if len(norm_key) >= 3:
                by_name.setdefault(norm_key, []).append(f)

    similar_groups = [
        {"type": "name", "files": group}
        for k, group in by_name.items() if len(group) > 1
    ]

    all_groups = identical_groups + similar_groups

    # Calculate recoverable storage (size of all redundant copies in identical groups)
    recoverable_bytes = 0
    for g in identical_groups:
        sorted_copies = sorted(g["files"], key=lambda x: x.get("date", ""))
        # keep original (earliest), redundant are remaining
        for dup in sorted_copies[1:]:
            recoverable_bytes += dup.get("size", 0)

    # Log check activity
    now = datetime.now(timezone.utc).isoformat()
    db.activities.insert_one({
        "id": str(uuid.uuid4()),
        "user_id": current_user["id"],
        "type": "duplicate",
        "text": f"Duplicate scan identified {len(all_groups)} group(s)",
        "date": now
    })

    return {
        "groups": all_groups,
        "count": len(all_groups),
        "recoverable_bytes": recoverable_bytes,
        "total_files_scanned": len(files)
    }

@router.post("/delete")
def delete_duplicates(file_ids: List[str] = Body(..., embed=True), current_user: dict = Depends(get_current_user)):
    if not file_ids:
        return {"deleted_count": 0}

    storage = get_storage()
    deleted_count = 0
    now = datetime.now(timezone.utc).isoformat()

    for fid in file_ids:
        f = db.files.find_one({"id": fid, "user_id": current_user["id"]})
        if f:
            storage.delete_file(f.get("storage_key", ""))
            db.files.delete_one({"id": fid, "user_id": current_user["id"]})
            deleted_count += 1

    db.activities.insert_one({
        "id": str(uuid.uuid4()),
        "user_id": current_user["id"],
        "type": "remove",
        "text": f"Deleted {deleted_count} duplicate file(s)",
        "date": now
    })

    return {"success": True, "deleted_count": deleted_count}
