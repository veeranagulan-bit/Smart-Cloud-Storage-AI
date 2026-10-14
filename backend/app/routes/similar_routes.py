from fastapi import APIRouter, HTTPException, Depends
from app.auth import get_current_user
from app.database import db
from app.ai.embeddings import embedding_engine

router = APIRouter(prefix="/api/similar", tags=["Similar Files"])

@router.get("/{file_id}")
def get_similar_files(file_id: str, current_user: dict = Depends(get_current_user)):
    target = db.files.find_one({"id": file_id, "user_id": current_user["id"]})
    if not target:
        raise HTTPException(status_code=404, detail="Target file not found")

    # Get all other files for this user
    all_files = list(db.files.find({"user_id": current_user["id"], "id": {"$ne": file_id}}))

    target_tags = set(target.get("tags", []))
    target_vec = target.get("embedding", [])
    target_cat = target.get("category", "")
    target_kind = target.get("kind", "")

    recommendations = []

    for other in all_files:
        other_tags = set(other.get("tags", []))
        shared = target_tags.intersection(other_tags)
        other_vec = other.get("embedding", [])

        # Vector similarity if available
        vec_score = 0.0
        if target_vec and other_vec and len(target_vec) == len(other_vec):
            cosine = embedding_engine.cosine_similarity(target_vec, other_vec)
            vec_score = max(0.0, ((cosine + 1.0) / 2.0) * 100)

        same_cat = (other.get("category") == target_cat)
        same_kind = (other.get("kind") == target_kind)

        # Compute composite score
        base_score = len(shared) * 18 + (30 if same_cat else 0) + (10 if same_kind else 0)
        final_score = max(base_score, vec_score)

        # Formulate meaningful reason
        if shared:
            reason = f"Related topic: {next(iter(shared))}"
        elif same_cat and vec_score > 60:
            reason = f"High semantic similarity in {target_cat}"
        elif same_cat:
            reason = "Same category"
        elif same_kind:
            reason = "Same file type"
        else:
            reason = "Metadata affinity"

        # Cap at 98%
        clamped_score = min(98, round(final_score))
        if clamped_score >= 25:
            safe_file = {k: v for k, v in other.items() if k not in ["embedding", "_id"]}
            recommendations.append({
                "file": safe_file,
                "f": safe_file,  # support frontend property alias
                "score": clamped_score,
                "reason": reason
            })

    recommendations.sort(key=lambda x: x["score"], reverse=True)
    return {
        "target_file_id": file_id,
        "similar": recommendations[:6]
    }
