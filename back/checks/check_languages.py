import json
from pathlib import Path
from collections import Counter

with open("data/final_dataset.json", encoding="utf-8") as f:
    dataset = json.load(f)

rows = dataset["rows"]

languages = [row["language"] for row in rows if row.get("language")]

counter = Counter(languages)

print(f"Total rows:           {len(rows):,}")
print(f"Rows with language:   {len(languages):,}")
print(f"Rows without:         {len(rows) - len(languages):,}")
print(f"Unique languages:     {len(counter)}")
print("\nTop 15 languages:")
for lang, count in counter.most_common(15):
    pct = round(count * 100 / len(languages), 1)
    bar = "█" * int(pct / 2)
    print(f"  {lang:<20} {count:>8,}  {pct:>5}%  {bar}")