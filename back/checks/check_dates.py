# checks/check_raw_folder.py
from pathlib import Path

BASE    = Path(__file__).parent.parent
RAW_DIR = BASE / "data" / "raw"

files = sorted(RAW_DIR.glob("*.json.gz"))
print(f"Files in data/raw/: {len(files)}\n")
for f in files:
    size_mb = f.stat().st_size / 1_000_000
    print(f"  {f.name:<25} {size_mb:.1f} MB")