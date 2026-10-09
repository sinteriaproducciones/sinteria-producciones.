import argparse
import concurrent.futures
import json
import shutil
import subprocess
from pathlib import Path


parser = argparse.ArgumentParser()
parser.add_argument("source", type=Path)
args = parser.parse_args()
root = Path(__file__).resolve().parents[1]
out = root / "docs" / "media"
out.mkdir(parents=True, exist_ok=True)


def probe(path):
    return json.loads(subprocess.check_output([
        "ffprobe", "-v", "error", "-show_format", "-show_streams", "-of", "json", str(path)
    ]))


def prepare_video(source):
    original = probe(source)
    target = out / source.name
    subprocess.run([
        "ffmpeg", "-hide_banner", "-loglevel", "error", "-i", str(source),
        "-map", "0:v:0", "-map", "0:a:0?", "-vf", "scale=720:-2,fps=30",
        "-c:v", "libx264", "-preset", "veryfast", "-crf", "25", "-threads", "2",
        "-maxrate", "2M", "-bufsize", "4M", "-pix_fmt", "yuv420p",
        "-c:a", "aac", "-b:a", "96k", "-movflags", "+faststart", "-y", str(target)
    ], check=True)
    final = probe(target)
    before = float(original["format"]["duration"])
    after = float(final["format"]["duration"])
    if abs(after - before) > 0.15 or after > 60.1 or target.stat().st_size > 20 * 1024 * 1024:
        raise ValueError("The optimized video must retain its full duration and fit the upload limit.")
    poster = out / (source.stem + ".jpg")
    subprocess.run([
        "ffmpeg", "-hide_banner", "-loglevel", "error", "-ss", "1", "-i", str(source),
        "-frames:v", "1", "-vf", "scale=480:-2", "-q:v", "3", "-y", str(poster)
    ], check=True)
    return {"file": target.name, "bytes": target.stat().st_size, "original_seconds": before, "seconds": after}


for number in range(117017, 117026):
    source = args.source / f"{number}.png"
    if not source.read_bytes().startswith(b"\xff\xd8\xff"):
        raise ValueError("Expected the original photo to contain JPEG bytes.")
    shutil.copy2(source, out / f"{number}.jpg")
with concurrent.futures.ThreadPoolExecutor(max_workers=3) as pool:
    results = list(pool.map(prepare_video, sorted(args.source.glob("*.mp4"))))
print(json.dumps({"videos": results, "files": len(list(out.iterdir())), "total_bytes": sum(p.stat().st_size for p in out.iterdir())}))
