from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from contextlib import asynccontextmanager
import os

from models.database import init_db
from routes.auth import router as auth_router
from routes.upload import router as upload_router
from routes.notes import router as notes_router
from routes.youtube import router as youtube_router
from routes.learning_tools import router as learning_router
from routes.live_meeting import router as live_meeting_router


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup: initialize database
    await init_db()
    os.makedirs("uploads", exist_ok=True)
    print("✅ Database initialized")
    print("✅ AI Voice Notes API is running")
    yield
    # Shutdown
    print("👋 Shutting down...")


app = FastAPI(
    title="AI Voice Notes Summarizer API",
    description="Convert voice recordings and live meetings into summarized notes using Groq AI",
    version="1.0.0",
    lifespan=lifespan
)

# CORS - allow Flutter web and mobile
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Ensure CORS headers are present even on unhandled exceptions
from fastapi import Request
from fastapi.responses import JSONResponse

@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    return JSONResponse(
        status_code=500,
        content={"detail": str(exc)},
        headers={"Access-Control-Allow-Origin": "*"},
    )

# Include routers
app.include_router(auth_router, prefix="/api", tags=["Auth"])
app.include_router(upload_router, prefix="/api", tags=["Upload"])
app.include_router(notes_router, prefix="/api", tags=["Notes"])
app.include_router(youtube_router, prefix="/api", tags=["YouTube"])
app.include_router(learning_router, prefix="/api", tags=["Learning Tools"])
app.include_router(live_meeting_router, prefix="/api", tags=["Live Meeting"])


@app.get("/")
async def root():
    return {
        "message": "AI Voice Notes Summarizer API",
        "version": "1.0.0",
        "docs": "/docs",
        "status": "running"
    }


@app.get("/health")
async def health_check():
    return {"status": "healthy"}


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
