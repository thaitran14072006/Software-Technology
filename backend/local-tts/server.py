"""Offline, self-hosted eSpeak NG -> FFmpeg MP3. No cloud keys or outbound speech requests."""
from http.server import ThreadingHTTPServer, BaseHTTPRequestHandler
from pathlib import Path
import json
import subprocess
import tempfile
import threading
from pykakasi import kakasi

VOICES = {"vi-VN": "vi", "en-US": "en-us", "ja-JP": "ja", "cmn-CN": "cmn", "ko-KR": "ko"}
LIMIT = threading.BoundedSemaphore(2)


class Handler(BaseHTTPRequestHandler):
    def log_message(self, fmt, *args):
        pass  # Never log narration bodies.

    def send_json(self, code, data):
        body = json.dumps(data).encode()
        self.send_response(code)
        self.send_header("Content-Type", "application/json")
        self.send_header("Content-Length", str(len(body)))
        self.end_headers()
        self.wfile.write(body)

    def do_GET(self):
        if self.path != "/health":
            return self.send_json(404, {"error": "NOT_FOUND"})
        self.send_json(200, {"ok": True, "engine": "espeak-ng", "locales": list(VOICES)})

    def do_POST(self):
        if self.path != "/synthesize":
            return self.send_json(404, {"error": "NOT_FOUND"})
        if not LIMIT.acquire(blocking=False):
            return self.send_json(503, {"error": "BUSY"})
        try:
            length = int(self.headers.get("Content-Length", "0"))
            if not 0 < length <= 150000:
                return self.send_json(400, {"error": "INVALID_SIZE"})
            data = json.loads(self.rfile.read(length))
            if not isinstance(data, dict):
                return self.send_json(400, {"error": "INVALID_JSON"})
            text, locale = data.get("text"), data.get("locale")
            if not isinstance(text, str) or not text.strip() or len(text) > 30000 or locale not in VOICES:
                return self.send_json(400, {"error": "INVALID_INPUT"})
            if data.get("gender") not in ("MALE", "FEMALE"):
                return self.send_json(400, {"error": "INVALID_GENDER"})
            if locale == "ja-JP":
                # eSpeak Japanese needs readings rather than raw Kanji.
                text = " ".join(part["hira"] for part in kakasi().convert(text))
            voice = VOICES[locale] + ("+f3" if data["gender"] == "FEMALE" else "+m3")
            with tempfile.TemporaryDirectory(prefix="sag-tts-") as folder:
                wav, mp3 = Path(folder) / "speech.wav", Path(folder) / "speech.mp3"
                subprocess.run(["espeak-ng", "-v", voice, "-s", "150", "-w", str(wav), "--stdin"], input=text.encode("utf-8"), check=True, timeout=90, capture_output=True)
                subprocess.run(["ffmpeg", "-hide_banner", "-loglevel", "error", "-y", "-i", str(wav), "-codec:a", "libmp3lame", "-b:a", "128k", "-write_xing", "0", str(mp3)], check=True, timeout=90, capture_output=True)
                body = mp3.read_bytes()
            self.send_response(200)
            self.send_header("Content-Type", "audio/mpeg")
            self.send_header("Content-Length", str(len(body)))
            self.send_header("X-Voice", voice)
            self.end_headers()
            self.wfile.write(body)
        except (ValueError, TypeError):
            self.send_json(400, {"error": "INVALID_JSON"})
        except (subprocess.SubprocessError, OSError):
            self.send_json(503, {"error": "LOCAL_SYNTHESIS_FAILED"})
        finally:
            LIMIT.release()


ThreadingHTTPServer(("0.0.0.0", 3010), Handler).serve_forever()
