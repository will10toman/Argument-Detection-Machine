from pydub import AudioSegment
import os

def convert_to_wav(path: str):
    if path.lower().endswith(".wav"):
        return path

    audio = AudioSegment.from_file(path)
    wav_path = path.rsplit(".", 1)[0] + ".wav"
    audio.export(wav_path, format="wav")
    return wav_path
