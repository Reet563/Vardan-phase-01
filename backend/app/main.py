import os
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse

from app.config import settings
from app.api.v1.endpoints import router as v1_router

app = FastAPI(
    title="Project Vardan API",
    description=(
        "Backend engine for the Vardan materials intelligence platform. "
        "Predicts 100-year Global Warming Potential (GWP) for construction "
        "materials under user-defined climate scenarios using ML models trained "
        "on ICE V5 embodied carbon data and global climate indicators."
    ),
    version="0.1.0",
    docs_url="/docs",
    redoc_url="/redoc",
)

# ---------------------------------------------------------------------------
# CORS
# ---------------------------------------------------------------------------
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ---------------------------------------------------------------------------
# Routers
# ---------------------------------------------------------------------------
app.include_router(v1_router)


# ---------------------------------------------------------------------------
# Static Files & React SPA Fallback
# ---------------------------------------------------------------------------
# Assuming backend/app/main.py, frontend is at ../../frontend/dist
frontend_dist = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(__file__))), "frontend", "dist")
assets_dir = os.path.join(frontend_dist, "assets")

if os.path.exists(assets_dir):
    app.mount("/assets", StaticFiles(directory=assets_dir), name="assets")

@app.get("/{full_path:path}", include_in_schema=False)
async def serve_spa(full_path: str):
    # Don't intercept API routes or OpenAPI routes
    if full_path.startswith("api/") or full_path in ["docs", "openapi.json", "redoc"]:
        from fastapi import HTTPException
        raise HTTPException(status_code=404, detail="Not found")
    
    index_path = os.path.join(frontend_dist, "index.html")
    if os.path.exists(index_path):
        return FileResponse(index_path)
    
    # Fallback if frontend is not built yet
    return {"status": "healthy", "project": "Vardan Engine", "note": "Frontend not built yet"}
