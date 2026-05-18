#!/usr/bin/env python3
import ffmpeg
import sys

SOUND_FILES = [
    "stackGenerateDot.wav",
    "stackShoot.wav", 
    "stackHit.wav",
    "stackMiss.wav",
    "stackLevelComplete.wav",
    "stackLevelFail.wav",
    "stackGameComplete.wav"
]

output = """#ifndef AUDIO_H
#define AUDIO_H

#include <stdint.h>

const uint8_t* const SOUNDS[] = {
"""

for wav_file in SOUND_FILES:
    try:
        # Run ffmpeg and capture both stdout and stderr
        raw_audio, stderr = (
            ffmpeg
            .input(wav_file)
            .output('pipe:', format='s16le', ar=44100, ac=1)
            .run(capture_stdout=True, capture_stderr=True)
        )
    except ffmpeg.Error as e:
        print(f"FFmpeg error for {wav_file}:", file=sys.stderr)
        print(e.stderr.decode(), file=sys.stderr)
        sys.exit(1)
    
    hex_bytes = [f'0x{b:02x}' for b in raw_audio]
    lines = []
    for i in range(0, len(hex_bytes), 16):
        lines.append(', '.join(hex_bytes[i:i+16]))
    array_str = ',\n    '.join(lines)
    output += f"    (const uint8_t[]){{{array_str}}},\n"

output += """};

const float DURATIONS[] = {
"""

for wav_file in SOUND_FILES:
    try:
        probe = ffmpeg.probe(wav_file)
        duration = float(probe['streams'][0]['duration'])
    except ffmpeg.Error as e:
        print(f"FFprobe error for {wav_file}:", file=sys.stderr)
        print(e.stderr.decode(), file=sys.stderr)
        sys.exit(1)
    output += f"    {duration}f,\n"

output += f"""}};

const int NUM_SOUNDS = {len(SOUND_FILES)};

#endif
"""

with open("audio.h", "w") as f:
    f.write(output)

print("Generated audio.h")