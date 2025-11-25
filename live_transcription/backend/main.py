from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv
import os

# Load environment variables from .env if present
load_dotenv()

# Routers
from routes import adm
from routes import diarization_routes as diarization

app = FastAPI(
    title="ADM + Diarization API",
    version="1.0.0",
)

# -------------------------------
# CORS SETTINGS
# -------------------------------
origins_env = os.getenv("CORS_ORIGINS", "*")
origins = [o.strip() for o in origins_env.split(",") if o.strip()]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins or ["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# -------------------------------
# ROUTERS
# -------------------------------
app.include_router(adm.router, prefix="/api/adm", tags=["ADM"])
app.include_router(diarization.router, prefix="/api", tags=["Diarization"])


@app.get("/health")
async def health():
    return {"status": "healthy"}


# -------------------------------
# LOCAL RUNNER
# -------------------------------
if __name__ == "__main__":
    import uvicorn

    host = os.getenv("HOST", "127.0.0.1")
    port = int(os.getenv("PORT", "8000"))

    uvicorn.run(
        "main:app",
        host=host,
        port=port,
        reload=True,
    )
