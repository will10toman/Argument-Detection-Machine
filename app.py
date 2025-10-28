import gradio as gr
import pyttsx3
import whisper
from datetime import datetime

# ---------------------------------
# UNCW COLORS
# ---------------------------------
UNCW_COLORS = {
    "teal": "#006666",
    "navy": "#003366",
    "gold": "#FFD700",
    "white": "#FFFFFF"
}

# ---------------------------------
# Initialize Whisper STT
# ---------------------------------
try:
    whisper_model = whisper.load_model("base")
    WHISPER_READY = True
except Exception as e:
    print("⚠️ Whisper model not loaded:", e)
    WHISPER_READY = False

# ---------------------------------
# Initialize TTS Engine
# ---------------------------------
try:
    engine = pyttsx3.init()
    engine.setProperty("rate", 160)
    engine.setProperty("volume", 1.0)
    voices = engine.getProperty("voices")
    if voices:
        engine.setProperty("voice", voices[0].id)
    TTS_READY = True
except Exception as e:
    print("⚠️ pyttsx3 not initialized:", e)
    engine = None
    TTS_READY = False

# ---------------------------------
# Transcription Function (Whisper)
# ---------------------------------
def transcribe_audio(audio):
    if audio is None:
        return "🎙️ No audio recorded yet."

    ts = datetime.now().strftime("%I:%M:%S %p")
    try:
        if WHISPER_READY:
            result = whisper_model.transcribe(audio)
            text = result["text"].strip()
            return f"[{ts}] {text}"
        else:
            return f"[{ts}] ⚠️ Whisper not loaded. Install it with `pip install openai-whisper`."
    except Exception as e:
        return f"[{ts}] ❌ Error during transcription: {e}"

# ---------------------------------
# Text-to-Speech Function
# ---------------------------------
def speak_text(text):
    if not text or text.strip() == "":
        return None, "⚠️ Nothing to speak."
    if not TTS_READY:
        return None, "⚠️ TTS engine not available."

    output_file = "tts_output.wav"
    try:
        engine.save_to_file(text, output_file)
        engine.runAndWait()
        return output_file, f" Spoke {len(text.split())} words."
    except Exception as e:
        return None, f"❌ Error: {e}"

# ---------------------------------
# Custom CSS (UNCW Theme)
# ---------------------------------
custom_css = f"""
body {{
    background-color: {UNCW_COLORS['navy']};
    color: {UNCW_COLORS['white']};
}}
.gradio-container {{
    background: linear-gradient(135deg, {UNCW_COLORS['navy']}, {UNCW_COLORS['teal']});
    font-family: 'Inter', sans-serif;
}}
h1, h2, h3, h4, h5, h6 {{
    color: {UNCW_COLORS['gold']};
}}
button, .gr-button {{
    background-color: {UNCW_COLORS['teal']} !important;
    color: {UNCW_COLORS['white']} !important;
    border-radius: 12px !important;
    border: 1px solid {UNCW_COLORS['gold']} !important;
    font-weight: 600 !important;
}}
button:hover {{
    background-color: {UNCW_COLORS['gold']} !important;
    color: {UNCW_COLORS['navy']} !important;
}}
.gr-textbox textarea {{
    background-color: {UNCW_COLORS['white']} !important;
    color: {UNCW_COLORS['navy']} !important;
    border-radius: 10px;
    font-size: 1rem;
}}
footer {{
    text-align: center;
    margin-top: 1.5em;
    color: {UNCW_COLORS['gold']};
}}
"""

# ---------------------------------
# Gradio App Layout
# ---------------------------------
with gr.Blocks(css=custom_css, title="Endill Argument Detection Machine") as demo:
    gr.Markdown(
        f"""
        <div style="text-align:center; padding: 1.5em 0;">
            <h1 style="color:{UNCW_COLORS['gold']}; font-size:2.5em;">Endill Argument Detection Machine</h1>
            <p style="color:{UNCW_COLORS['white']}; font-size:1.1em;">
                Record speech, see the transcript, and see how effective your argument was.
            </p>
        </div>
        """
    )

    with gr.Row():
        with gr.Column(scale=1):
            gr.Markdown("### 🎙️ Record your voice")
            audio_input = gr.Audio(
                sources=["microphone"],
                type="filepath",
                label="Click 'Record'"
            )
            transcribe_btn = gr.Button("Transcribe", variant="primary")

        with gr.Column(scale=2):
            gr.Markdown("### 📝 Transcript & Argument Output")
            transcript_box = gr.Textbox(
                label="Transcript",
                placeholder="Your transcription will appear here...",
                lines=8
            )
            tts_btn = gr.Button("Speak Text", variant="primary")
            audio_out = gr.Audio(label="Speech Output", interactive=False)
            status_box = gr.Textbox(label="Status", interactive=False)

    footer = gr.Markdown(
        "<footer>Debate Kindly and Effectively | UNCW Colors</footer>"
    )

    transcribe_btn.click(fn=transcribe_audio, inputs=audio_input, outputs=transcript_box)
    tts_btn.click(fn=speak_text, inputs=transcript_box, outputs=[audio_out, status_box])

demo.launch(server_name="0.0.0.0", server_port=7860)
