#Reads dataset and computes all analytics + all results are cached in memory and recomputed only when the dataset changes
import json
import logging
from collections import Counter, defaultdict
from functools import lru_cache
from pathlib import Path

log = logging.getLogger(__name__)

DATASET_PATH = Path(__file__).parent.parent / "data" / "merged_dataset.json"

# Load data
@lru_cache(maxsize=1)
def _load_rows() -> list[dict]:
    #Loads final_dataset.json into memory once.
    if not DATASET_PATH.exists():
        raise FileNotFoundError(
            f"Dataset not found at {DATASET_PATH}.\n"
            f"Run first:  py -3.11 -m services.data_service"
        )
    log.info(f"Loading dataset from {DATASET_PATH}...")
    with open(DATASET_PATH, encoding="utf-8") as f:
        data = json.load(f)
    rows = data["rows"]
    log.info(f"Loaded {len(rows):,} rows")
    return rows


def bust_cache():
    #Clears the in-memory cache, called automatically after a dataset rebuild.
    _load_rows.cache_clear()
    log.info("Analytics cache cleared")


def get_meta() -> dict:
    #Returns the dataset metadata (row counts, build time...)
    with open(DATASET_PATH, encoding="utf-8") as f:
        data = json.load(f)
    return data.get("meta", {})


# Analytics

#Used by: GET /api/languages
def get_language_stats() -> dict:
    #Returns language distribution across all rows ("total_rows", "rows_with_language", "languages")
    rows = _load_rows()
    rows_with_lang = [r for r in rows if r.get("language")]
    counter = Counter(r["language"] for r in rows_with_lang)
    total = len(rows_with_lang)

    languages = [
        {
            "language": lang,
            "count": count,
            "pct": round(count * 100 / total, 1) if total else 0,
        }
        for lang, count in counter.most_common()
    ]

    return {
        "total_rows": len(rows),
        "rows_with_language": total,
        "languages": languages,
    }

#Used by: GET /api/languages/by-intent
def get_language_by_intent() -> dict:
    #Returns commit intent breakdown per language (language with the percentage of each action)
    rows   = _load_rows()
    intents = ["fix", "feat", "refactor", "docs", "other"]

    lang_intents: defaultdict[str, Counter] = defaultdict(Counter)
    for row in rows:
        lang = row.get("language")
        if lang:
            lang_intents[lang][row.get("intent", "other")] += 1

    result = []
    for lang, counts in sorted(lang_intents.items(), key=lambda x: -sum(x[1].values())):
        total = sum(counts.values())
        result.append({
            "language": lang,
            **{
                intent: round(counts[intent] * 100 / total, 1)
                for intent in intents
            }
        })

    return {"languages": result}

#Used by: GET /api/languages/trend
def get_language_trend() -> dict:
    rows = _load_rows()

    DAY_NAMES = {0:"Mon", 1:"Tue", 2:"Wed", 3:"Thu", 4:"Fri", 5:"Sat", 6:"Sun"}

    # Need to parse the full date to get weekday
    from datetime import datetime

    day_lang: defaultdict[str, Counter] = defaultdict(Counter)

    for row in rows:
        lang = row.get("language")
        date = row.get("date", "")
        if lang and date:
            try:
                dt      = datetime.strptime(date[:10], "%Y-%m-%d")
                weekday = DAY_NAMES[dt.weekday()]
                day_lang[weekday][lang] += 1
            except ValueError:
                continue

    total_by_lang: Counter = Counter()
    for counts in day_lang.values():
        total_by_lang.update(counts)
    top_langs = [lang for lang, _ in total_by_lang.most_common(8)]

    days   = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"]
    series = [
        {
            "language": lang,
            "data":     [day_lang[day].get(lang, 0) for day in days],
        }
        for lang in top_langs
    ]
    counts = [sum(day_lang[day].values()) for day in days]
    return {"days": days, "counts": counts, "languages": top_langs, "series": series}

#Used by: GET /api/frameworks
def get_framework_stats() -> dict:
    #Returns tech/framework mention counts across all commit messages ("count", "pct")
    rows    = _load_rows()
    counter = Counter()

    for row in rows:
        for tech in row.get("techs", []):
            counter[tech] += 1

    total_mentions = sum(counter.values())
    frameworks = [
        {
            "framework": tech,
            "count": count,
            "pct": round(count * 100 / total_mentions, 1),
        }
        for tech, count in counter.most_common()
    ]

    return {"total_mentions": total_mentions, "frameworks": frameworks}

#Used by: GET /api/frameworks/by-language
def get_frameworks_by_language() -> dict:
    #Returns which frameworks are used most within each language (ecosystems: {language, frameworks: {framework, count}})
    
    rows = _load_rows()

    lang_techs: defaultdict[str, Counter] = defaultdict(Counter)
    for row in rows:
        lang = row.get("language")
        if lang:
            for tech in row.get("techs", []):
                lang_techs[lang][tech] += 1

    ecosystems = [
        {
            "language": lang,
            "frameworks": [
                {"framework": tech, "count": count}
                for tech, count in counts.most_common(10)
            ],
        }
        for lang, counts in sorted(lang_techs.items(), key=lambda x: -sum(x[1].values()))
        if counts
    ]

    return {"ecosystems": ecosystems}

#Used by: GET /api/repos/
def get_repo_stats() -> dict:
    #Returns top repos by activity (total_repos, repos: {repo, count, language})
    rows         = _load_rows()
    repo_counts  = Counter(r["repo"] for r in rows)
    repo_lang    = {r["repo"]: r.get("language") for r in rows if r.get("language")}

    repos = [
        {
            "repo":     repo,
            "count":    count,
            "language": repo_lang.get(repo),
        }
        for repo, count in repo_counts.most_common(100)
    ]

    return {"total_repos": len(repo_counts), "repos": repos}

#Used by: GET /api/repos/intent
def get_intent_stats() -> dict:
    #Returns commit intent distribution, excluding unclassified rows
    rows    = _load_rows()
    counter = Counter(r.get("intent", "other") for r in rows)

    counter.pop("other", None)

    total_classified = sum(counter.values())

    intents = [
        {
            "intent": intent,
            "count":  count,
            "pct":    round(count * 100 / total_classified, 1),
        }
        for intent, count in counter.most_common()
    ]

    return {
        "total_rows":       len(rows),
        "total_classified": total_classified,
        "intents":          intents,
    }