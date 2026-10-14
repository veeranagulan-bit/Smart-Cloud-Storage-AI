from datetime import datetime, timezone
from fastapi import APIRouter
from app.database import db
from app.config import settings
from app.ai.embeddings import embedding_engine

router = APIRouter(prefix="/api/health", tags=["Health"])

@router.get("")
def health_check():
    db_connected = False
    try:
        if db.db is not None:
            db.db.command('ping')
            db_connected = True
    except Exception:
        db_connected = False

    return {
        "status": "healthy" if db_connected else "degraded",
        "database": {
            "type": "mongodb",
            "connected": db_connected,
            "database_name": settings.DATABASE_NAME
        },
        "storage": {
            "backend": settings.STORAGE_BACKEND,
            "quota_bytes": settings.STORAGE_QUOTA_BYTES
        },
        "ai": {
            "embedding_model": settings.EMBEDDING_MODEL_NAME,
            "embeddings_ready": embedding_engine.is_ready,
            "device": settings.USE_DEVICE
        },
        "timestamp": datetime.now(timezone.utc).isoformat()
    }
