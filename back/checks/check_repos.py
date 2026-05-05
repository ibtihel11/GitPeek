# check_repos.py
import json
from pathlib import Path
from collections import Counter
from pathlib import Path

BASE = Path(__file__).parent.parent  # goes up from checks/ to back/
with open(BASE / "data" / "final_dataset.json", encoding="utf-8") as f:
    dataset = json.load(f)

print("Meta:")
for k, v in dataset["meta"].items():
    print(f"  {k}: {v}")

rows = dataset["rows"]

# Count unique repos
repo_counter = Counter(row["repo"] for row in rows)

print(f"\nTotal unique repos in dataset:  {len(repo_counter):,}")
print(f"Top 10 most active repos:")
for repo, count in repo_counter.most_common(10):
    print(f"  {repo:<45} {count:>6,} rows")

# How many repos have a language vs not
repos_with_lang = {row["repo"] for row in rows if row.get("language")}
repos_without   = {row["repo"] for row in rows if not row.get("language")}

print(f"\nRepos WITH language fetched:    {len(repos_with_lang):,}")
print(f"Repos WITHOUT language:         {len(repos_without):,}")
print(f"\nIf we fetch all missing repos,")
print(f"estimated API calls needed:     {len(repos_without):,}")
print(f"Time at 0.8s/call:              ~{len(repos_without) * 0.8 / 60:.0f} minutes")