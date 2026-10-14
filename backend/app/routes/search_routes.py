import uuid
from datetime import datetime, timezone, timedelta
from typing import Optional
from fastapi import APIRouter, Depends, Query
from app.auth import get_current_user
from app.database import db
from app.ai.embeddings import embedding_engine

router = APIRouter(prefix="/api/search", tags=["Search"])

@router.get("")
def search_documents(
    q: str = Query(..., description="Natural language search query"),
    kind: Optional[str] = "all",
    category: Optional[str] = "all",
    days: Optional[str] = "all",
    current_user: dict = Depends(get_current_user)
):
    now = datetime.now(timezone.utc)
    now_iso = now.isoformat()

    # Log search activity
    db.activities.insert_one({
        "id": str(uuid.uuid4()),
        "user_id": current_user["id"],
        "type": "search",
        "text": f"Searched “{q}”",
        "date": now_iso
    })

    # Fetch user's files
    query_filter: dict = {"user_id": current_user["id"]}
    if kind and kind != "all":
        query_filter["kind"] = kind
    if category and category != "all":
        query_filter["category"] = category
    if days and days != "all":
        try:
            day_count = int(days)
            cutoff = (now - timedelta(days=day_count)).isoformat()
            query_filter["date"] = {"$gte": cutoff}
        except ValueError:
            pass

    files = list(db.files.find(query_filter, {"_id": 0}))

    if not files:
        return {"query": q, "results": [], "count": 0, "engine": "semantic" if embedding_engine.is_ready else "keyword"}

    ranked = embedding_engine.semantic_rank(q, files)

    results = []
    for doc, score, engine_mode in ranked:
        # Strip internal embedding to save payload size
        safe_file = {k: v for k, v in doc.items() if k not in ["embedding", "_id"]}
        results.append({
            "file": safe_file,
            "score": round(score),
            "match_mode": engine_mode
        })

    return {
        "query": q,
        "results": results,
        "count": len(results),
        "embedding_model_ready": embedding_engine.is_ready
    }
