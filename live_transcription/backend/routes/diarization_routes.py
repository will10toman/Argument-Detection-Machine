import os
import shutil
import tempfile
from pathlib import Path

from fastapi import APIRouter, UploadFile, File, HTTPException

from models.diarization import diarization_model

router = APIRouter()


@router.post("/diarize")
async def diarize_endpoint(file: UploadFile = File(...)):
    """
    Accepts an uploaded audio file (e.g., WebM / WAV) and returns
    a list of diarization segments.

    Frontend is expected to send:
        formData.append("file", audioBlob, "audio.webm")
    """
    if not file.filename:
        raise HTTPException(status_code=400, detail="No file uploaded")

    suffix = Path(file.filename).suffix or ".webm"

    # Save upload to a temp file
    with tempfile.NamedTemporaryFile(delete=False, suffix=suffix) as tmp:
        tmp_path = tmp.name
        shutil.copyfileobj(file.file, tmp)

    try:
        segments = diarization_model.diarize(tmp_path)
        return {"segments": segments}
    finally:
        try:
            os.remove(tmp_path)
        except OSError:
            pass
