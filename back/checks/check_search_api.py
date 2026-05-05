# check_search_api.py
# Tests the GitHub Search API (fetch 100 repo languages in ONE request)
import os
import requests
from pathlib import Path

GITHUB_TOKEN = os.getenv("GITHUB_TOKEN", "")

def fetch_repos_batch(repo_names: list[str]) -> dict[str, str | None]:
    headers = {
        "Authorization": f"Bearer {GITHUB_TOKEN}",
        "Content-Type": "application/json",
    }

    # Build GraphQL query — one alias per repo
    aliases = []
    for i, repo_name in enumerate(repo_names[:100]):
        owner, name = repo_name.split("/", 1)
        # Escape special chars in alias name
        alias = f"repo{i}"
        aliases.append(f"""
            {alias}: repository(owner: "{owner}", name: "{name}") {{
                nameWithOwner
                primaryLanguage {{ name }}
            }}
        """)

    query = "{ " + "\n".join(aliases) + " }"

    r = requests.post(
        "https://api.github.com/graphql",
        json={"query": query},
        headers=headers,
        timeout=30,
    )

    if r.status_code != 200:
        print(f"Error: {r.status_code} — {r.text}")
        return {}

    data = r.json().get("data", {})
    results = {}
    for alias, repo_data in data.items():
        if repo_data:
            name     = repo_data["nameWithOwner"]
            language = (repo_data.get("primaryLanguage") or {}).get("name")
            results[name] = language

    return results


# ── Test with your top 10 uncovered repos ────────────────────────────────────
import json

BASE = Path(__file__).parent.parent
with open(BASE / "data" / "final_dataset.json", encoding="utf-8") as f:
    dataset = json.load(f)

from collections import Counter
rows = dataset["rows"]
repo_counter = Counter(row["repo"] for row in rows if not row.get("language"))
top_uncovered = [repo for repo, _ in repo_counter.most_common(10)]

print(f"Testing GraphQL API with top 10 uncovered repos...")
print(f"Repos: {top_uncovered}\n")

results = fetch_repos_batch(top_uncovered)

print(f"Results ({len(results)} repos):")
for repo, lang in results.items():
    print(f"  {repo:<45} {lang or 'None'}")

# Rate limit info
r = requests.get(
    "https://api.github.com/rate_limit",
    headers={"Authorization": f"Bearer {GITHUB_TOKEN}"},
)
limits = r.json()
graphql = limits.get("resources", {}).get("graphql", {})
print(f"\nGraphQL rate limit:")
print(f"  Remaining:  {graphql.get('remaining')}")
print(f"  Limit:      {graphql.get('limit')}")
print(f"\nWith GraphQL — {graphql.get('limit', 5000)} requests × 100 repos = "
      f"{graphql.get('limit', 5000) * 100:,} repos/hour")