from fastapi import APIRouter, HTTPException
from fastapi.responses import JSONResponse
from pydantic import BaseModel
from models.adm_model import adm_model

router = APIRouter()

class AnalyzeTextRequest(BaseModel):
    text: str

@router.post("/analyze-text")
async def analyze_text(req: AnalyzeTextRequest):
    if not req.text.strip():
        raise HTTPException(400, "Text is empty")

    result = adm_model.analyze(req.text)
    return JSONResponse({"run_id": "local", "segments": result})
