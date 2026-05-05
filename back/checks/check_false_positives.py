# checks/check_bun_samples.py
import json
from pathlib import Path

BASE = Path(__file__).parent.parent
with open(BASE / "data" / "final_dataset.json", encoding="utf-8") as f:
    dataset = json.load(f)

rows = dataset["rows"]

bun_rows = [
    row["message"]
    for row in rows
    if "bun" in row.get("techs", [])
][:10]

print(f"Total bun matches: {len([r for r in rows if 'bun' in r.get('techs', [])])}")
print("\nSample messages:")
for msg in bun_rows:
    print(f"  {msg[:80]}")