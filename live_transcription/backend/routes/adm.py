from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

from models.adm_model import analyze_text

router = APIRouter()


class PredictRequest(BaseModel):
    text: str


class PredictResponse(BaseModel):
    label: str


@router.post("/predict", response_model=PredictResponse)
async def predict(request: PredictRequest):
    text = request.text.strip()
    if not text:
        raise HTTPException(status_code=400, detail="text must not be empty")

    label = analyze_text(text)
    return PredictResponse(label=label)
