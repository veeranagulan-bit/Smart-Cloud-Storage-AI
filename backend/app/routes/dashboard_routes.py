from fastapi import APIRouter, Depends
from app.auth import get_current_user
from app.database import db
from app.config import settings

router = APIRouter(prefix="/api/dashboard", tags=["Dashboard"])

CATEGORIES = ["Documents", "Images", "Educational", "Business", "Reports", "Others"]

@router.get("")
def get_dashboard_data(current_user: dict = Depends(get_current_user)):
    user_id = current_user["id"]
    quota = current_user.get("storage_quota", settings.STORAGE_QUOTA_BYTES)

    files = list(db.files.find({"user_id": user_id}, {"_id": 0, "embedding": 0}))
    activities = list(db.activities.find({"user_id": user_id}, {"_id": 0}).sort("date", -1).limit(10))

    # Calculations
    total_files = len(files)
    used_storage = sum(f.get("size", 0) for f in files)
    available_storage = max(0, quota - used_storage)

    # Duplicates calculation
    hashes = {}
    for f in files:
        h = f.get("hash") or f.get("sha256")
        if h:
            hashes[h] = hashes.get(h, 0) + 1
    duplicate_count = sum(count - 1 for count in hashes.values() if count > 1)

    # Category distribution
    cat_counts = {c: 0 for c in CATEGORIES}
    cat_sizes = {c: 0 for c in CATEGORIES}
    for f in files:
        cat = f.get("category", "Others")
        if cat in cat_counts:
            cat_counts[cat] += 1
            cat_sizes[cat] += f.get("size", 0)
        else:
            cat_counts["Others"] += 1
            cat_sizes["Others"] += f.get("size", 0)

    storage_distribution = [
        {"name": c, "value": cat_counts[c], "size": cat_sizes[c]}
        for c in CATEGORIES if cat_counts[c] > 0
    ]

    # Recent files (up to 8)
    recent_files = sorted(files, key=lambda x: x.get("date", ""), reverse=True)[:8]

    return {
        "total_files": total_files,
        "storage_used": used_storage,
        "storage_quota": quota,
        "available_storage": available_storage,
        "duplicate_count": duplicate_count,
        "recent_files": recent_files,
        "storage_distribution": storage_distribution,
        "recent_activity": activities[:6]
    }
