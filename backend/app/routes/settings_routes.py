from typing import Optional
from fastapi import APIRouter, Depends
from pydantic import BaseModel
from app.auth import get_current_user
from app.database import db

router = APIRouter(prefix="/api/settings", tags=["Settings"])

class SettingsUpdate(BaseModel):
    accent: Optional[str] = None
    motion: Optional[str] = None
    density: Optional[str] = None
    notifications: Optional[bool] = None

DEFAULT_SETTINGS = {
    "accent": "aurora",
    "motion": "full",
    "density": "comfortable",
    "notifications": True
}

@router.get("")
def get_user_settings(current_user: dict = Depends(get_current_user)):
    user_settings = db.settings.find_one({"user_id": current_user["id"]}, {"_id": 0, "user_id": 0})
    if not user_settings:
        user_settings = DEFAULT_SETTINGS.copy()
        db.settings.update_one(
            {"user_id": current_user["id"]},
            {"$set": {**DEFAULT_SETTINGS, "user_id": current_user["id"]}},
            upsert=True
        )
    return user_settings

@router.patch("")
def update_user_settings(payload: SettingsUpdate, current_user: dict = Depends(get_current_user)):
    updates = {}
    if payload.accent is not None:
        updates["accent"] = payload.accent
    if payload.motion is not None:
        updates["motion"] = payload.motion
    if payload.density is not None:
        updates["density"] = payload.density
    if payload.notifications is not None:
        updates["notifications"] = payload.notifications

    if updates:
        db.settings.update_one(
            {"user_id": current_user["id"]},
            {"$set": updates},
            upsert=True
        )

    return get_user_settings(current_user)
