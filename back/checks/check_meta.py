# checks/check_meta.py
import json
from pathlib import Path

BASE = Path(__file__).parent.parent
with open(BASE / "data" / "final_dataset.json", encoding="utf-8") as f:
    dataset = json.load(f)

meta = dataset["meta"]

print("Dataset meta:")
for key, value in meta.items():
    if key != "processed_files":
        print(f"  {key:<25} {value}")

print(f"\nProcessed files ({len(meta.get('processed_files', []))}):")
for fname in sorted(meta.get("processed_files", [])):
    print(f"  {fname}")