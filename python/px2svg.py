#!/usr/bin/env python3
"""px2svg.py – convert all .px files in the current directory into a single snapshots.md

Each .px file is a raw RGB dump (resolution * 3 bytes).  The script creates an
SVG showing the strip as a row of coloured circles on a transparent background
and wraps it in a Markdown heading for direct embedding in documentation.
"""

import glob
import os
import sys

RADIUS = 4
SPACING = 12
HEIGHT = 12

def px_to_svg(data: bytes) -> str:
    """Return an SVG string for the given raw RGB pixel data."""
    if len(data) % 3 != 0:
        raise ValueError("px file length must be a multiple of 3")
    resolution = len(data) // 3
    width = SPACING * resolution
    lines = [
        f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {width} {HEIGHT}" width="{width}" height="{HEIGHT}">'
    ]
    for i in range(resolution):
        r = data[i * 3]
        g = data[i * 3 + 1]
        b = data[i * 3 + 2]
        cx = 6 + i * SPACING
        lines.append(f'<circle cx="{cx}" cy="6" r="{RADIUS}" fill="rgb({r},{g},{b})"/>')
    lines.append('</svg>')
    return "\n".join(lines)

def main():
    px_files = sorted(glob.glob("*.px"))
    if not px_files:
        print("No .px files found in current directory.", file=sys.stderr)
        sys.exit(0)

    with open("snapshots.md", "w", encoding="utf-8") as md:
        for i, filepath in enumerate(px_files):
            basename = os.path.splitext(os.path.basename(filepath))[0]
            with open(filepath, "rb") as f:
                data = f.read()
            svg = px_to_svg(data)
            if i > 0:
                md.write("\n")   # blank line between entries
            md.write(f"## {basename}\n")
            md.write(svg + "\n")

    print(f"Converted {len(px_files)} .px file(s) to snapshots.md", file=sys.stderr)

if __name__ == "__main__":
    main()