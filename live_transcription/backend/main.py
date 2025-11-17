from fastapi import FastAPI, UploadFile, File
from live_transcription.backend.diarization_service import cluster_speakers

app = FastAPI()

@app.post("/diarize")
async def diarize_audio(file: UploadFile = File(...)):
    audio_bytes = await file.read()
    segments = cluster_speakers(audio_bytes)
    return {"segments": segments}
