import os
from pathlib import Path
import torch
from transformers import DistilBertTokenizerFast

# -----------------------------------------
# PATHS
# -----------------------------------------
MODELS_DIR = Path(__file__).resolve().parent
BACKEND_DIR = MODELS_DIR.parent
LIVE_TRANSCRIPTION_DIR = BACKEND_DIR.parent
PROJECT_ROOT = LIVE_TRANSCRIPTION_DIR.parent

HF_MODEL_DIR = PROJECT_ROOT / "hf_model"
TORCHSCRIPT_MODEL_PATH = MODELS_DIR / "adm_model.pt"

print("HF Model Dir:", HF_MODEL_DIR)
print("TorchScript Model:", TORCHSCRIPT_MODEL_PATH)

# -----------------------------------------
# LOAD TOKENIZER
# -----------------------------------------
try:
    tokenizer = DistilBertTokenizerFast.from_pretrained(str(HF_MODEL_DIR))
    print("Tokenizer loaded successfully.")
except Exception as e:
    print("\n[ADM] ERROR loading tokenizer")
    print("Path attempted:", HF_MODEL_DIR)
    raise e

# -----------------------------------------
# LOAD TORCHSCRIPT MODEL
# -----------------------------------------
try:
    model = torch.jit.load(str(TORCHSCRIPT_MODEL_PATH), map_location="cpu")
    model.eval()
    print("TorchScript model loaded successfully.")
except Exception as e:
    print("\n[ADM] ERROR loading TorchScript model")
    print("Path attempted:", TORCHSCRIPT_MODEL_PATH)
    raise e

# -----------------------------------------
# LABEL MAPPING (MUST MATCH TRAINING)
# -----------------------------------------
id2label = {
    0: "claim",
    1: "evidence",
    2: "non_info",
}


# -----------------------------------------
# MAIN INFERENCE FUNCTION
# -----------------------------------------
def analyze_text(text: str) -> str:
    """
    Takes a raw text string and returns the predicted label:
    'claim' | 'evidence' | 'non_info'
    """
    encoded = tokenizer(
        text,
        return_tensors="pt",
        truncation=True,
        padding=True,
        max_length=256,
    )

    with torch.no_grad():
        logits = model(encoded["input_ids"], encoded["attention_mask"])
        pred_id = int(torch.argmax(logits, dim=1).item())

    return id2label[pred_id]
