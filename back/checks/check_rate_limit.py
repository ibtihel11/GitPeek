# checks/check_rate_limit.py
import os, requests

GITHUB_TOKEN = os.getenv("GITHUB_TOKEN", "")
r = requests.get(
    "https://api.github.com/rate_limit",
    headers={"Authorization": f"Bearer {GITHUB_TOKEN}"}
)
data = r.json()

graphql = data["resources"]["graphql"]
core    = data["resources"]["core"]

print(f"GraphQL:  {graphql['remaining']:,} / {graphql['limit']:,} remaining")
print(f"Core API: {core['remaining']:,} / {core['limit']:,} remaining")
print(f"\nAt 100 repos/request:")
print(f"  Can fetch: {graphql['remaining'] * 100:,} repos before reset")