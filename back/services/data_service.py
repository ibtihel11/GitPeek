#Builds final_dataset.json by reading files, calling the API & saving
import gzip
import json
import logging
import os
import time
from pathlib import Path
from collections import Counter, defaultdict
import re
import pandas as pd
import requests

log = logging.getLogger(__name__)

# Paths
RAW_DIR      = Path(__file__).parent.parent / "data" / "raw"
DATASET_PATH = Path(__file__).parent.parent / "data" / "final_dataset.json"

GITHUB_TOKEN  = os.getenv("GITHUB_TOKEN", "")
GRAPHQL_URL   = "https://api.github.com/graphql"
BATCH_SIZE    = 100 # repos per GraphQL request
SLEEP_BETWEEN = 0.05  # seconds between requests

TECH_PATTERNS = {
    # Frontend
    "react":       r"\breact\b",
    "vue":         r"\bvue\.?js\b|\bvuejs\b|\bvue\b",
    "angular":     r"\bangular\b",
    "svelte":      r"\bsvelte\b",
    "nextjs":      r"\bnext\.?js\b|\bnextjs\b",
    "nuxt":        r"\bnuxt\b",
    "gatsby":      r"\bgatsby\b",
    "remix":       r"\bremix\b",
    "astro":       r"\bastro\b",
    # Styling
    "tailwind":    r"\btailwind\b",
    "bootstrap":   r"\bbootstrap\b",
    "sass":        r"\bsass\b(?!-loader|-bootstrap|-1\.\d)",  # exclude dependabot sass-loader
    # Backend
    "django":      r"\bdjango\b",
    "fastapi":     r"\bfastapi\b",
    "flask":       r"\bflask\b",
    "express":     r"\bexpress\b",
    "fastify":     r"\bfastify\b",
    "spring":      r"\bspring[\s\-]boot\b|\bspring\b",
    "rails":       r"\bruby on rails\b|\brails\b(?!s\b|-i18n|-guard|-env)",
    "laravel":     r"\blaravel\b",
    "nestjs":      r"\bnest\.?js\b|\bnestjs\b",
    # Languages
    "typescript":  r"\btypescript\b|\btsconfig\b",
    "golang":      r"\bgolang\b|\bgo\.mod\b|\bgo\s+\d+\.\d+\b",
    "rust":        r"\brush\b(?!ed\b|ling\b|y\b)",   # exclude "rushed", "rushing", "rusty"
    "kotlin":      r"\bkotlin\b",
    "scala":       r"\bscala\b(?!r\b|bility\b|ble\b|doc\b|do\b)",
    # Data / ML
    "pytorch":     r"\bpytorch\b|\btorch\b",
    "tensorflow":  r"\btensorflow\b",
    "pandas":      r"\bpandas\b",
    "spark":       r"\bapache spark\b|\bpyspark\b|\bspark\s+\d\.\d\b",
    "kafka":       r"\bkafka\b",
    # Infra
    "docker":      r"\bdocker\b(?!file\sskip|\shub\sskip)",
    "kubernetes":  r"\bkubernetes\b|\bk8s\b|\bkubectl\b",
    "redis":       r"\bredis\b",
    "postgresql":  r"\bpostgresql\b|\bpostgres\b",
    "mongodb":     r"\bmongodb\b|\bmongo\b",
    # Runtime
    "bun":         r"\bbun\b(?!dler\b|dle\b|ny\b|ch\b|k\b)",  # exclude bundler, bundle, bunny etc
    "deno":        r"\bdeno\b",
    "nodejs":      r"\bnode\.js\b|\bnodejs\b|\bnode\s+v\d+\b",
}

_COMPILED_PATTERNS = {
    tech: re.compile(pattern, re.IGNORECASE)
    for tech, pattern in TECH_PATTERNS.items()
}

LANGUAGE_SIGNALS = {
    "JavaScript": ["javascript", " js ", "nodejs", "node.js", "npm",
                   "webpack", "eslint", "babel", "jest", "react",
                   "vue", "angular", "svelte"],
    "TypeScript": ["typescript", " ts ", " tsx", "tsconfig",
                   "next.js", "nextjs"],
    "Python":     ["python", " pip ", "django", "fastapi", "flask",
                   "pytest", "pandas", "numpy", " .py"],
    "Java":       ["java", "maven", "gradle", "spring", "junit"],
    "Rust":       ["rust", "cargo", "crate", "rustfmt", "clippy"],
    "Go":         ["golang", "go.mod", "goroutine"],
    "C++":        ["c++", "cmake", "clang", ".cpp", ".hpp"],
    "Ruby":       ["ruby", "rails", " gem ", "bundler", "rspec"],
    "PHP":        ["php", "composer", "laravel", "symfony"],
    "Kotlin":     ["kotlin", "coroutine", "jetpack"],
    "Swift":      ["swift", "xcode", "cocoapods", "swiftui"],
    "C#":         ["c#", ".net", "dotnet", "nuget", "blazor"],
    "Shell":      ["bash", "shell", " sh ", "zsh", "chmod", "#!/"],
    "Dart":       ["flutter", "dart", "pubspec"],
}

INTENT_KEYWORDS = {
    "fix": ["fix", "bug", "patch", "hotfix", "resolve", "revert"],
    "feat": ["feat", "feature", "add", "new", "implement", "create"],
    "refactor": ["refactor", "clean", "improve", "update", "enhance"],
    "docs": ["docs", "doc", "readme", "comment", "changelog"],
}

# Helpers
def _extract_techs(text: str) -> list[str]:
    #Returns list of techs found in text using word boundary regex matching
    if not text:
        return []
    return [
        tech
        for tech, pattern in _COMPILED_PATTERNS.items()
        if pattern.search(text)
    ]
    
def _classify_intent(message: str) -> str:
    #Classifies a commit message into fix/feat/refactor/docs/other.
    if not message:
        return "other"

    msg = message.lower().strip()

    # conventional commits / branch names / plain first word
    patterns = [
        (r"\b(fix|bug|patch|hotfix|resolve|revert)\b", "fix"),
        (r"\b(feat|feature|add|new|implement|create)\b", "feat"),
        (r"\b(refactor|clean|improve|enhance|restructure)\b", "refactor"),
        (r"\b(docs?|readme|comment|changelog|document)\b", "docs"),
        (r"\b(test|spec|coverage|jest|pytest)\b", "test"),
        (r"\b(chore|ci|cd|build|release|deploy|bump|update|upgrade|dependabot)\b", "chore"),
    ]

    for pattern, intent in patterns:
        if re.search(pattern, msg):
            return intent

    return "other"

def _infer_language(text: str) -> str | None:
    text_lower = text.lower()
    for language, keywords in LANGUAGE_SIGNALS.items():
        if any(kw in text_lower for kw in keywords):
            return language
    return None


# Parsing
def _parse_events(raw_dir: Path) -> tuple[list[dict], set[str]]:
    # Reads all .json.gz files and extracts rows
    files = sorted(raw_dir.glob("*.json.gz"))
    if not files:
        raise FileNotFoundError(f"No .json.gz files found in {raw_dir}")

    rows: list[dict] = []
    repo_names: set[str] = set()

    for gz_file in files:
        log.info(f"  Parsing {gz_file.name}...")
        try:
            with gzip.open(gz_file, "rt", encoding="utf-8", errors="replace") as f:
                for line in f:
                    line = line.strip()
                    if not line:
                        continue
                    try:
                        event = json.loads(line)
                    except json.JSONDecodeError:
                        continue

                    event_type = event.get("type")
                    repo_name  = event.get("repo", {}).get("name", "")
                    created_at = event.get("created_at", "")

                    if repo_name and "/" in repo_name:
                        repo_names.add(repo_name)

                    if event_type == "PushEvent":
                        commits = event.get("payload", {}).get("commits", [])
                        for commit in commits:
                            message = commit.get("message", "")
                            rows.append({
                                "repo":       repo_name,
                                "event_type": "PushEvent",
                                "message":    message,
                                "techs":      _extract_techs(message),
                                "intent":     _classify_intent(message),
                                "date":       created_at,
                                "language":   None,
                            })

                    elif event_type == "PullRequestEvent":
                        pr    = event.get("payload", {}).get("pull_request", {})
                        title = pr.get("title", "")
                        body  = pr.get("body") or ""
                        rows.append({
                            "repo":       repo_name,
                            "event_type": "PullRequestEvent",
                            "message":    title,
                            "techs":      _extract_techs(f"{title} {body}"),
                            "intent":     _classify_intent(title),
                            "date":       created_at,
                            "language":   None,
                        })

                    elif event_type == "CreateEvent":
                        ref = event.get("payload", {}).get("ref", "")
                        rows.append({
                            "repo":       repo_name,
                            "event_type": "CreateEvent",
                            "message":    ref,
                            "techs":      _extract_techs(ref),
                            "intent":     "other",
                            "date":       created_at,
                            "language":   None,
                        })

        except Exception as e:
            log.error(f"Failed to read {gz_file.name}: {e}")
            continue

    return rows, repo_names

#Language inference

def _infer_repo_languages(rows: list[dict]) -> dict[str, str]:
    #A repo gets the language that appears most in its commits. Returns dict of {repo_name: language}.
    votes: defaultdict[str, Counter] = defaultdict(Counter)

    for row in rows:
        text = f"{row.get('message', '')} {row.get('repo', '')}"
        lang = _infer_language(text)
        if lang:
            votes[row["repo"]][lang] += 1

    return {
        repo: counter.most_common(1)[0][0]
        for repo, counter in votes.items()
        if counter
    }

#GitHub GraphQL

def _graphql_headers() -> dict:
    if not GITHUB_TOKEN:
        raise RuntimeError(
            "GITHUB_TOKEN is not set.\n"
            "Set it with:  set GITHUB_TOKEN=ghp_yourtoken  (Windows)\n"
            "Then rerun the script."
        )
    return {
        "Authorization": f"Bearer {GITHUB_TOKEN}",
        "Content-Type":  "application/json",
    }

def _fetch_batch(repo_names: list[str]) -> dict[str, str | None]:
    #Fetches primary language for up to 100 repos in a single GraphQL call. Returns {repo_name: language_or_None}.
    aliases = []
    for i, repo_name in enumerate(repo_names):
        try:
            owner, name = repo_name.split("/", 1)
        except ValueError:
            continue
        # Sanitize owner/name for GraphQL alias
        owner = owner.replace("-", "_").replace(".", "_")
        name  = name.replace("-",  "_").replace(".", "_")
        aliases.append(f"""
            r{i}: repository(owner: "{repo_names[i].split('/')[0]}",
                             name:  "{repo_names[i].split('/')[1]}") {{
                nameWithOwner
                primaryLanguage {{ name }}
            }}
        """)

    if not aliases:
        return {}

    query = "{ " + "\n".join(aliases) + " }"

    try:
        r = requests.post(
            GRAPHQL_URL,
            json={"query": query},
            headers=_graphql_headers(),
            timeout=30,
        )
        if r.status_code != 200:
            log.error(f"GraphQL error {r.status_code}: {r.text[:200]}")
            return {}

        data = r.json().get("data") or {}
        results = {}
        for alias_data in data.values():
            if alias_data:
                name = alias_data.get("nameWithOwner", "")
                lang = (alias_data.get("primaryLanguage") or {}).get("name")
                if name:
                    results[name] = lang
        return results

    except requests.RequestException as e:
        log.error(f"GraphQL request failed: {e}")
        return {}
    
def _fetch_all_languages(
    repo_names: set[str],
    already_known: dict[str, str],
) -> dict[str, str | None]:
    #Fetches languages for all repos not already known in batches of 100 repos per GraphQL request
    to_fetch = [r for r in repo_names if r not in already_known]
    total    = len(to_fetch)

    log.info(f" Repos already known (from inference): {len(already_known):,}")
    log.info(f" Repos to fetch via GraphQL:           {total:,}")
    log.info(f" Batches of {BATCH_SIZE}:              {total // BATCH_SIZE + 1} requests")
    log.info(f" Estimated time:                       ~{total * SLEEP_BETWEEN / 60:.1f} min")

    results: dict[str, str | None] = dict(already_known)

    for i in range(0, total, BATCH_SIZE):
        batch   = to_fetch[i : i + BATCH_SIZE]
        fetched = _fetch_batch(batch)
        results.update(fetched)

        # Progress every 10 batches (every 1000 repos)
        if (i // BATCH_SIZE + 1) % 10 == 0:
            done = min(i + BATCH_SIZE, total)
            log.info(f"  Progress: {done:,} / {total:,} repos fetched")

        time.sleep(SLEEP_BETWEEN)
        
    #returns complete {repo_name: language} dict.
    return results

# Main

def build_dataset() -> dict:
    #Full pipeline: building final_dataset.json.
    log.info("=" * 55)
    log.info("  Building dataset")
    log.info("=" * 55)

    # Step 1: Parse all .json.gz files
    log.info("Step 1/4 Parsing events from .json.gz files")
    rows, repo_names = _parse_events(RAW_DIR)
    log.info(f"{len(rows):,} rows · {len(repo_names):,} unique repos")

    # Step 2: Infer languages from commit messages
    log.info("Step 2/4  Inferring languages from commit messages")
    inferred = _infer_repo_languages(rows)
    log.info(f"          Language inferred for {len(inferred):,} repos")

    # Step 3: Fetch remaining via GraphQL
    log.info("Step 3/4  Fetching remaining languages via GitHub GraphQL")
    repo_languages = _fetch_all_languages(repo_names, inferred)

    found = sum(1 for v in repo_languages.values() if v)
    log.info(f"          Language known for {found:,} / {len(repo_names):,} repos")

     # Step 4: Propagate language to all rows + save
    log.info("Step 4/4  Propagating languages to rows and saving")

    for row in rows:
        row["language"] = repo_languages.get(row["repo"])

    rows_with_lang = sum(1 for r in rows if r.get("language"))
    log.info(f"          Rows with language: {rows_with_lang:,} / {len(rows):,} "
             f"({rows_with_lang*100/len(rows):.1f}%)")

    dataset = {
        "meta": {
            "total_rows":    len(rows),
            "total_repos":   len(repo_names),
            "repos_with_lang": found,
            "rows_with_lang":  rows_with_lang,
            "built_at":      time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()),
        },
        "rows": rows,
    }

    DATASET_PATH.parent.mkdir(parents=True, exist_ok=True)
    with open(DATASET_PATH, "w", encoding="utf-8") as f:
        json.dump(dataset, f, ensure_ascii=False)

    size_mb = DATASET_PATH.stat().st_size / 1_000_000
    log.info(f"          Saved → {DATASET_PATH} ({size_mb:.1f} MB)")
    log.info("=" * 55)

    return dataset["meta"]

# Run 
if __name__ == "__main__":
    logging.basicConfig(
        level=logging.INFO,
        format="%(asctime)s  %(message)s",
        datefmt="%H:%M:%S",
    )
    build_dataset()