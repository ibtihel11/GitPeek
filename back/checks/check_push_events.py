# checks/check_push_events.py
import gzip, json
from pathlib import Path
from collections import Counter

BASE    = Path(__file__).parent.parent
RAW_DIR = BASE / "data" / "raw"

files  = sorted(RAW_DIR.glob("*.json.gz"))
counts = Counter()

print(f"Scanning {len(files)} files...\n")

for gz_file in files:
    file_counts = Counter()
    with gzip.open(gz_file, "rt", encoding="utf-8", errors="replace") as f:
        for line in f:
            line = line.strip()
            if not line:
                continue
            try:
                event = json.loads(line)
                file_counts[event.get("type")] += 1
            except json.JSONDecodeError:
                continue
    counts.update(file_counts)
    push = file_counts.get("PushEvent", 0)
    pr   = file_counts.get("PullRequestEvent", 0)
    cr   = file_counts.get("CreateEvent", 0)
    print(f"  {gz_file.name:<20} Push={push:>6,}  PR={pr:>6,}  Create={cr:>6,}")

print(f"\nTotal across all files:")
for event_type, count in counts.most_common():
    print(f"  {event_type:<25} {count:,}")