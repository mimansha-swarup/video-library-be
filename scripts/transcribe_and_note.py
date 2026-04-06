#!/usr/bin/env python3
"""
Transcribe a local video file using faster-whisper and print the transcript
to stdout (or write to a file with --out).

The AI summarization and Firestore update is handled by the Node.js script:
  npx ts-node src/scripts/generate-ai-note.ts --lesson-id <id> --transcript-file <file>

Usage:
    python3 scripts/transcribe_and_note.py --video <path> [--model base] [--out transcript.txt]

Requirements:
    pip3 install faster-whisper

Optional (to extract audio from video):
    brew install ffmpeg
"""

import argparse
import subprocess
import sys
import tempfile
from pathlib import Path


# ---------------------------------------------------------------------------
# Step 1 – Extract audio from video with ffmpeg
# ---------------------------------------------------------------------------
def extract_audio(video_path: str, out_path: str) -> None:
    """Convert video to 16-kHz mono WAV for Whisper."""
    cmd = [
        "ffmpeg", "-y",
        "-i", video_path,
        "-vn",          # no video
        "-ar", "16000", # 16 kHz
        "-ac", "1",     # mono
        "-f", "wav",
        out_path,
    ]
    result = subprocess.run(cmd, capture_output=True, text=True)
    if result.returncode != 0:
        print("[error] ffmpeg failed:\n", result.stderr, file=sys.stderr)
        sys.exit(1)
    print(f"[ok] Audio extracted → {out_path}", file=sys.stderr)


# ---------------------------------------------------------------------------
# Step 2 – Transcribe with faster-whisper
# ---------------------------------------------------------------------------
def transcribe(audio_path: str, model_size: str = "base") -> str:
    try:
        from faster_whisper import WhisperModel
    except ImportError:
        print("[error] faster-whisper not installed. Run:  pip3 install faster-whisper", file=sys.stderr)
        sys.exit(1)

    print(f"[info] Loading Whisper model '{model_size}' (first run downloads weights)…", file=sys.stderr)
    model = WhisperModel(model_size, device="cpu", compute_type="int8")

    print("[info] Transcribing…", file=sys.stderr)
    segments, info = model.transcribe(audio_path, beam_size=5)

    print(f"[info] Detected language: {info.language} ({info.language_probability:.2f})", file=sys.stderr)

    transcript = " ".join(seg.text.strip() for seg in segments)
    print(f"[ok] Transcript: {len(transcript)} characters", file=sys.stderr)
    return transcript


# ---------------------------------------------------------------------------
# CLI
# ---------------------------------------------------------------------------
def main():
    parser = argparse.ArgumentParser(
        description="Transcribe a video with faster-whisper and output the transcript."
    )
    parser.add_argument("--video", required=True, help="Path to the local video file")
    parser.add_argument(
        "--model",
        default="base",
        choices=["tiny", "base", "small", "medium", "large-v2", "large-v3"],
        help="Whisper model size (default: base)",
    )
    parser.add_argument(
        "--out",
        help="Write transcript to this file instead of stdout",
    )
    parser.add_argument(
        "--skip-audio-extract",
        action="store_true",
        help="Skip ffmpeg — use when --video is already a WAV file",
    )
    args = parser.parse_args()

    video_path = Path(args.video).resolve()
    if not video_path.exists():
        print(f"[error] File not found: {video_path}", file=sys.stderr)
        sys.exit(1)

    with tempfile.TemporaryDirectory() as tmp_dir:
        if args.skip_audio_extract:
            audio_path = str(video_path)
        else:
            audio_path = f"{tmp_dir}/audio.wav"
            extract_audio(str(video_path), audio_path)

        transcript = transcribe(audio_path, model_size=args.model)

    if not transcript.strip():
        print("[error] Transcription produced no text. Check the video has audio.", file=sys.stderr)
        sys.exit(1)

    if args.out:
        Path(args.out).write_text(transcript, encoding="utf-8")
        print(f"[done] Transcript written → {args.out}", file=sys.stderr)
    else:
        print(transcript)


if __name__ == "__main__":
    main()
