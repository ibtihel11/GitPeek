# run this ONCE to patch the existing dataset meta
# save as: patch_meta.py in back/

import json
from pathlib import Path

DATASET_PATH = Path("data/merged_dataset.json")
RAW_DIR      = Path("data/raw")

with open(DATASET_PATH, encoding="utf-8") as f:
    dataset = json.load(f)

# Register all currently existing files as already processed
existing_files = [f.name for f in sorted(RAW_DIR.glob("*.json.gz"))]
dataset["meta"]["processed_files"] = existing_files

with open(DATASET_PATH, "w", encoding="utf-8") as f:
    json.dump(dataset, f, ensure_ascii=False)

print(f"Registered {len(existing_files)} files as already processed:")
for name in existing_files:
    print(f"  {name}")