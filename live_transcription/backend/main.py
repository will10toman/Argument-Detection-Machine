from fastapi import FastAPI, File, UploadFile, HTTPException
from fastapi.middleware.cors import CORSMiddleware
import tempfile
import os
import logging

from .diarization_service import perform_diarization

app = FastAPI()

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

logger = logging.getLogger(__name__)

@app.post("/diarize")
async def diarize_audio(file: UploadFile = File(...)):
    if not file:
        raise HTTPException(status_code=400, detail="No file provided")

    # Save uploaded chunk
    try:
        with tempfile.NamedTemporaryFile(delete=False, suffix=".webm") as temp_file:
            content = await file.read()
            temp_file.write(content)
            temp_path = temp_file.name
    except Exception as e:
        logger.error(f"Failed to save uploaded chunk: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail="Failed to save uploaded chunk")

    try:
        segments = perform_diarization(temp_path)
        return {"segments": segments}
    except Exception as e:
        logger.error(f"Diarization failed: {e}", exc_info=True)
        raise HTTPException(status_code=422, detail=f"Diarization failed: {str(e)}")
    finally:
        if os.path.exists(temp_path):
            os.remove(temp_path)
