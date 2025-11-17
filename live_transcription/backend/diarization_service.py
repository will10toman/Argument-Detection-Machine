import os
import io
import numpy as np
import torch
import torchaudio
from sklearn.cluster import AgglomerativeClustering
from dotenv import load_dotenv
import soundfile as sf

load_dotenv()

# Extract embeddings using a simple pretrained wav2vec2
bundle = torchaudio.pipelines.WAV2VEC2_BASE
model = bundle.get_model()

def extract_embeddings(audio, sample_rate):
    if sample_rate != bundle.sample_rate:
        audio = torchaudio.functional.resample(audio, sample_rate, bundle.sample_rate)
    with torch.inference_mode():
        emb = model(audio).mean(dim=-1).squeeze().cpu().numpy()
    return emb

def cluster_speakers(audio_bytes: bytes, n_speakers: int = 2):
    """Performs basic speaker segmentation & clustering on short audio."""
    audio_np, sr = sf.read(io.BytesIO(audio_bytes), dtype="float32")
    waveform = torch.tensor(audio_np).unsqueeze(0)

    frame_size = int(sr * 2.0)  # 2-second frames
    embeddings, timestamps = [], []

    for start in range(0, waveform.size(1), frame_size):
        end = start + frame_size
        segment = waveform[:, start:end]
        if segment.size(1) < frame_size // 2:
            continue
        emb = extract_embeddings(segment, sr)
        embeddings.append(emb)
        timestamps.append((start / sr, end / sr))

    embeddings = np.vstack(embeddings)
    clustering = AgglomerativeClustering(n_clusters=n_speakers)
    labels = clustering.fit_predict(embeddings)

    diar = [
        {"speaker": f"spk_{int(lbl)}", "start": round(t[0], 2), "end": round(t[1], 2)}
        for lbl, t in zip(labels, timestamps)
    ]
    return diar
