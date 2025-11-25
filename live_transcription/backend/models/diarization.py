import os
from typing import List, Dict, Any
from pathlib import Path
import tempfile
import shutil

import torch
import whisper


class DiarizationModel:
    """
    Whisper-based pseudo-diarization.

    It uses Whisper to get segment timings and then assigns speakers
    in an alternating pattern:

        spk_0, spk_1, spk_0, spk_1, ...

    Output format:
        [
          {"speaker": "spk_0", "start": 0.50, "end": 3.21},
          ...
        ]
    """

    def __init__(self, model_name: str | None = None) -> None:
        self.device = "cuda" if torch.cuda.is_available() else "cpu"
        self.model_name = model_name or os.getenv("WHISPER_MODEL", "base")
        self.model = None

    def load_model(self) -> None:
        if self.model is not None:
            return
        print("[Diarization] Loading Whisper model...")
        self.model = whisper.load_model(self.model_name, device=self.device)
        print("[Diarization] Whisper loaded.")

    def diarize(self, audio_path: str) -> List[Dict[str, Any]]:
        """
        Run "diarization" on an audio file by:
        - running Whisper transcription
        - taking each segment's start/end
        - assigning alternating speakers
        """
        self.load_model()

        result = self.model.transcribe(
            audio_path,
            word_timestamps=False,  # segment-level is enough here
            verbose=False,
        )

        segments: List[Dict[str, Any]] = []
        speaker_toggle = 0

        for seg in result.get("segments", []):
            start = float(seg["start"])
            end = float(seg["end"])
            speaker = f"spk_{speaker_toggle}"
            segments.append(
                {
                    "speaker": speaker,
                    "start": start,
                    "end": end,
                }
            )
            speaker_toggle = 1 - speaker_toggle  # flip between 0 and 1

        # If Whisper returned nothing, still give something valid
        if not segments:
            segments.append(
                {
                    "speaker": "spk_0",
                    "start": 0.0,
                    "end": 0.0,
                }
            )

        return segments


# Global singleton used by the router
diarization_model = DiarizationModel()
