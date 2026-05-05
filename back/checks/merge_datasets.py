# merge_datasets.py

import json
from pathlib import Path

DATASET_1 = Path("../data/final_dataset1.json")
DATASET_2 = Path("../data/final_dataset.json")
OUTPUT    = Path("../data/merged_dataset.json")

with open(DATASET_1, encoding="utf-8") as f: 
    d1 = json.load(f)

with open(DATASET_2, encoding="utf-8") as f:
    d2 = json.load(f)

rows1 = d1["rows"]
rows2 = d2["rows"]

# --- Remove duplicates ---
seen = set()
merged_rows = []

def row_key(r):
    return (r["repo"], r["event_type"], r["message"], r["date"])

for row in rows1 + rows2:
    key = row_key(row)
    if key not in seen:
        seen.add(key)
        merged_rows.append(row)

# --- Merge processed files ---
pf1 = set(d1["meta"].get("processed_files", []))
pf2 = set(d2["meta"].get("processed_files", []))

merged_processed = sorted(pf1 | pf2)

# --- Build new dataset ---
dataset = {
    "meta": {
        "total_rows": len(merged_rows),
        "total_repos": len({r["repo"] for r in merged_rows}),
        "rows_with_lang": sum(1 for r in merged_rows if r.get("language")),
        "processed_files": merged_processed,
    },
    "rows": merged_rows,
}

with open(OUTPUT, "w", encoding="utf-8") as f:
    json.dump(dataset, f, ensure_ascii=False)

print(f"Merged dataset saved to {OUTPUT}")
print(f"Total rows: {len(merged_rows):,}")