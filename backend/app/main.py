import logging
from contextlib import asynccontextmanager
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from app.config import settings
from app.database import db
from app.routes import (
    auth_routes,
    file_routes,
    search_routes,
    similar_routes,
    duplicate_routes,
    dashboard_routes,
    analytics_routes,
    activity_routes,
    settings_routes,
    health_routes
)

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s"
)
logger = logging.getLogger("main")

@asynccontextmanager
async def lifespan(app: FastAPI):
    logger.info("Initializing Smart Cloud Storage AI Backend...")
    # Initialize MongoDB connection and indexes
    try:
        db.connect()
    except Exception as e:
        logger.error(f"Startup MongoDB initialization notice: {e}")
    yield
    logger.info("Shutting down Smart Cloud Storage AI Backend...")

app = FastAPI(
    title="Smart Cloud Storage AI API",
    description="High-performance, AI-driven cloud storage backend with intelligent document classification, dense semantic search, and cryptographic deduplication.",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc",
    lifespan=lifespan
)

# CORS configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins_list,
    allow_origin_regex=r"^https?://(localhost|127\.0\.0\.1)(:\d+)?$",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount all feature routers
app.include_router(health_routes.router)
app.include_router(auth_routes.router)
app.include_router(file_routes.router)
app.include_router(search_routes.router)
app.include_router(similar_routes.router)
app.include_router(duplicate_routes.router)
app.include_router(dashboard_routes.router)
app.include_router(analytics_routes.router)
app.include_router(activity_routes.router)
app.include_router(settings_routes.router)

@app.get("/")
def root():
    return {
        "name": "Smart Cloud Storage AI API",
        "version": "1.0.0",
        "status": "online",
        "docs": "/docs"
    }

@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    logger.error(f"Unhandled exception on {request.url}: {exc}", exc_info=True)
    return JSONResponse(
        status_code=500,
        content={"detail": "An internal server error occurred. Please check server logs."}
    )
