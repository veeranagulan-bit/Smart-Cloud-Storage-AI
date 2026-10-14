from datetime import datetime, timezone
from typing import Optional
from fastapi import APIRouter, Depends, Query
from app.auth import get_current_user
from app.database import db

router = APIRouter(prefix="/api/activity", tags=["Activity"])

@router.get("")
def get_activities(
    type: Optional[str] = "all",
    limit: Optional[int] = 50,
    current_user: dict = Depends(get_current_user)
):
    user_id = current_user["id"]
    query = {"$or": [{"user_id": user_id}, {"userId": user_id}]}

    if type and type != "all":
        query["$and"] = [{"$or": [{"type": type}, {"action": type.upper()}]}]

    cursor = db.activities.find(query).sort([("date", -1), ("timestamp", -1)]).limit(limit)

    activities = []
    for doc in cursor:
        doc_id = str(doc.get("id") or doc.get("_id"))
        raw_type = (doc.get("type") or doc.get("action") or "upload").lower()
        if "upload" in raw_type:
            clean_type = "upload"
        elif "classify" in raw_type:
            clean_type = "classify"
        elif "search" in raw_type:
            clean_type = "search"
        elif "duplicate" in raw_type:
            clean_type = "duplicate"
        elif "download" in raw_type:
            clean_type = "download"
        elif "rename" in raw_type:
            clean_type = "rename"
        elif "remove" in raw_type or "delete" in raw_type:
            clean_type = "remove"
        elif "index" in raw_type:
            clean_type = "index"
        else:
            clean_type = raw_type

        # Extract text description
        text = doc.get("text")
        if not text:
            doc_name = doc.get("documentName") or doc.get("name")
            if doc_name:
                text = f"Uploaded {doc_name}"
            else:
                text = f"{clean_type.capitalize()} activity"

        date_val = doc.get("date") or doc.get("timestamp") or datetime.now(timezone.utc).isoformat()

        activities.append({
            "id": doc_id,
            "user_id": user_id,
            "type": clean_type,
            "text": text,
            "date": date_val
        })

    return activities
