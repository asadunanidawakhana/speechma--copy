from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse
from pydantic import BaseModel
import edge_tts
import asyncio
import os
import uuid
import shutil
from mangum import Mangum

# Try to import pydub for silence removal
try:
    from pydub import AudioSegment
    from pydub.silence import split_on_silence
    HAS_PYDUB = True
except ImportError:
    HAS_PYDUB = False

app = FastAPI(title="Speechas API")

# Enable CORS for the frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class TTSRequest(BaseModel):
    text: str
    voice: str = "en-US-AriaNeural"
    rate: str = "+0%"
    pitch: str = "+0Hz"
    remove_silence: bool = False

@app.get("/")
def read_root():
    return {"status": "Speechas API is running"}

@app.get("/api/voices")
@app.get("/voices")
async def get_voices():
    try:
        voices = await edge_tts.list_voices()
        return voices
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/generate")
@app.post("/generate")
async def generate_speech(req: TTSRequest):
    try:
        output_id = str(uuid.uuid4())
        files_dir = "/tmp/outputs"
        os.makedirs(files_dir, exist_ok=True)
        raw_audio_path = os.path.join(files_dir, f"{output_id}_raw.mp3")
        final_audio_path = os.path.join(files_dir, f"{output_id}.mp3")
        
        # Edge-TTS respects percentage for rate and Hz for pitch
        # Format strings: "+10%" or "-10%" for rate, "+10Hz" or "-10Hz" for pitch.
        # Ensure we pass them properly if they don't default to "+0%"
        rate = req.rate if req.rate else "+0%"
        pitch = req.pitch if req.pitch else "+0Hz"
        
        communicate = edge_tts.Communicate(req.text, req.voice, rate=rate, pitch=pitch)
        await communicate.save(raw_audio_path)
        
        if req.remove_silence and HAS_PYDUB:
            try:
                audio = AudioSegment.from_mp3(raw_audio_path)
                # Split ignoring long silences
                chunks = split_on_silence(
                    audio, 
                    min_silence_len=300, 
                    silence_thresh=audio.dBFS-16, 
                    keep_silence=200
                )
                if chunks:
                    processed_audio = chunks[0]
                    for chunk in chunks[1:]:
                        processed_audio += chunk
                    processed_audio.export(final_audio_path, format="mp3")
                else:
                    shutil.copy(raw_audio_path, final_audio_path)
            except Exception as e:
                # Fallback to raw if pydub/ffmpeg fails
                shutil.copy(raw_audio_path, final_audio_path)
        else:
            shutil.copy(raw_audio_path, final_audio_path)
            
        return FileResponse(final_audio_path, media_type="audio/mpeg", filename=f"speechas_{output_id}.mp3")
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

handler = Mangum(app)
