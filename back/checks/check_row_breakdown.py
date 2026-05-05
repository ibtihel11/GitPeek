# checks/check_rows_breakdown.py
import json
from pathlib import Path
from collections import Counter

BASE = Path(__file__).parent.parent
with open(BASE / "data" / "final_dataset.json", encoding="utf-8") as f:
    dataset = json.load(f)

rows = dataset["rows"]

# Count rows per event type
event_counter = Counter(r["event_type"] for r in rows)
print("Rows by event type:")
for event_type, count in event_counter.most_common():
    print(f"  {event_type:<25} {count:,}")

# Count rows per date to see which files contributed what
date_counter = Counter(r["date"][:10] for r in rows if r.get("date"))
print(f"\nRows by date ({len(date_counter)} unique dates):")
for date, count in sorted(date_counter.items()):
    print(f"  {date}    {count:,}")

print(f"\nTotal rows: {len(rows):,}")