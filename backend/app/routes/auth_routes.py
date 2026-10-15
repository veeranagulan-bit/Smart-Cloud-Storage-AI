import uuid
from datetime import datetime, timezone
from fastapi import APIRouter, HTTPException, Depends, status
from pydantic import BaseModel
from app.auth import hash_password, verify_password, create_access_token, get_current_user
from app.database import db
from app.config import settings

router = APIRouter(prefix="/api/auth", tags=["Authentication"])

class RegisterRequest(BaseModel):
    email: str
    password: str
    name: str | None = None

class LoginRequest(BaseModel):
    email: str
    password: str

class AuthResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: dict

@router.post("/register", response_model=AuthResponse)
def register(req: RegisterRequest):
    email_clean = req.email.lower().strip()
    if "@" not in email_clean or "." not in email_clean:
        raise HTTPException(status_code=400, detail="Please provide a valid email address")
    existing = db.users.find_one({"email": email_clean})
    if existing:
        raise HTTPException(status_code=400, detail="An account with this email already exists")

    user_id = str(uuid.uuid4())
    now = datetime.now(timezone.utc).isoformat()
    hashed = hash_password(req.password)

    new_user = {
        "id": user_id,
        "email": email_clean,
        "username": email_clean,
        "name": req.name or email_clean.split("@")[0],
        "password_hash": hashed,
        "created_at": now,
        "storage_quota": settings.STORAGE_QUOTA_BYTES
    }
    db.users.insert_one(new_user)

    # Initialize default settings for user
    db.settings.update_one(
        {"user_id": user_id},
        {"$setOnInsert": {
            "user_id": user_id,
            "accent": "aurora",
            "motion": "full",
            "density": "comfortable",
            "notifications": True
        }},
        upsert=True
    )

    # Log initial activity
    db.activities.insert_one({
        "id": str(uuid.uuid4()),
        "user_id": user_id,
        "type": "index",
        "text": f"Account created for {email_clean}",
        "date": now
    })

    token = create_access_token({"sub": user_id, "email": email_clean})
    safe_user = {k: v for k, v in new_user.items() if k not in ["password_hash", "_id"]}
    return {"access_token": token, "token_type": "bearer", "user": safe_user}

@router.post("/login", response_model=AuthResponse)
def login(req: LoginRequest):
    email_clean = req.email.lower().strip()
    user = db.users.find_one({"email": email_clean})
    if not user or not verify_password(req.password, user.get("password_hash", "")):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )

    token = create_access_token({"sub": user["id"], "email": email_clean})
    safe_user = {k: v for k, v in user.items() if k not in ["password_hash", "_id"]}
    return {"access_token": token, "token_type": "bearer", "user": safe_user}

@router.get("/me")
def me(current_user: dict = Depends(get_current_user)):
    safe_user = {k: v for k, v in current_user.items() if k not in ["password_hash", "_id"]}
    
    # Calculate current storage used
    used = 0
    files = list(db.files.find({"user_id": current_user["id"]}, {"size": 1}))
    used = sum(f.get("size", 0) for f in files)
    
    safe_user["storage_used"] = used
    safe_user["total_files"] = len(files)
    safe_user["storage_quota"] = current_user.get("storage_quota", settings.STORAGE_QUOTA_BYTES)
    return safe_user
