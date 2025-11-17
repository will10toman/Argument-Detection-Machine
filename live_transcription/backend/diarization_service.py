import io
import numpy as np
import soundfile as sf
from sklearn.cluster import AgglomerativeClustering
import python_speech_features
from pydub import AudioSegment
from typing import List
import os
import tempfile

def extract_features(audio: np.ndarray, sample_rate: int) -> np.ndarray:
    """
    Extract MFCC feature embedding for a chunk of mono audio.
    """
    if len(audio.shape) > 1:
        audio = audio.mean(axis=1)

    mfcc = python_speech_features.mfcc(audio, samplerate=sample_rate, numcep=13)
    return mfcc.mean(axis=0)

def perform_diarization(audio_path: str, n_speakers: int = 2) -> List[dict]:
    """
    Lightweight speaker diarization using MFCC + clustering.
    Works fully CPU-only and handles WebM chunks from the frontend.
    """

    # Convert WebM → WAV
    audio = AudioSegment.from_file(audio_path, format="webm")
    with tempfile.NamedTemporaryFile(delete=False, suffix=".wav") as wav_file:
        wav_path = wav_file.name
        audio.export(wav_path, format="wav")

    try:
        audio_np, sr = sf.read(wav_path, dtype="float32")

        frame_size = int(sr * 2.0)  # 2-second frames
        embeddings = []
        timestamps = []

        total_samples = len(audio_np)
        for start in range(0, total_samples, frame_size):
            end = start + frame_size
            chunk = audio_np[start:end]

            if len(chunk) < frame_size // 2:
                continue

            emb = extract_features(chunk, sr)
            embeddings.append(emb)
            timestamps.append((start / sr, end / sr))

        if not embeddings:
            duration = total_samples / sr if sr else 0
            return [{
                "speaker": "unknown",
                "start": 0.0,
                "end": round(duration, 2)
            }]

        embeddings = np.vstack(embeddings)
        clustering = AgglomerativeClustering(n_clusters=n_speakers)
        labels = clustering.fit_predict(embeddings)

        segments = []
        for lbl, (s, e) in zip(labels, timestamps):
            segments.append({
                "speaker": f"spk_{int(lbl)}",
                "start": round(s, 2),
                "end": round(e, 2)
            })

        return segments

    finally:
        if os.path.exists(wav_path):
            os.remove(wav_path)
