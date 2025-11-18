from fastapi import APIRouter, File, UploadFile, HTTPException
from fastapi.responses import JSONResponse
from models.diarization import diarization_model
from utils.audio_processing import convert_to_wav
import aiofiles
import os
import uuid

router = APIRouter()

@router.post("/diarize")
async def diarize_audio(file: UploadFile = File(...)):
    try:
        temp_dir = "storage/temp"
        os.makedirs(temp_dir, exist_ok=True)

        uid = str(uuid.uuid4())
        in_path = f"{temp_dir}/{uid}_{file.filename}"

        async with aiofiles.open(in_path, "wb") as f:
            await f.write(await file.read())

        wav_path = convert_to_wav(in_path)

        segments = diarization_model.diarize(wav_path)

        os.remove(in_path)
        if wav_path != in_path:
            os.remove(wav_path)

        return JSONResponse(segments)

    except Exception as e:
        raise HTTPException(500, f"Error: {str(e)}")
