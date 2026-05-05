# check_coverage.py
import json
from pathlib import Path
from collections import Counter

BASE = Path(__file__).parent.parent
with open(BASE / "data" / "final_dataset.json", encoding="utf-8") as f:
    dataset = json.load(f)

rows = dataset["rows"]
total_rows = len(rows)

repo_counter = Counter(row["repo"] for row in rows)
total_repos  = len(repo_counter)

print(f"Total rows:   {total_rows:,}")
print(f"Total repos:  {total_repos:,}")
print()

# Simulate how many rows we COVER if we only fetch top N repos
for top_n in [500, 1000, 2000, 5000, 10000]:
    top_repos   = {repo for repo, _ in repo_counter.most_common(top_n)}
    covered     = sum(1 for row in rows if row["repo"] in top_repos)
    pct         = covered * 100 / total_rows
    api_minutes = top_n * 0.8 / 60
    print(f"  Top {top_n:>6} repos → {covered:>8,} rows covered  ({pct:.1f}%)  ~{api_minutes:.0f} min")