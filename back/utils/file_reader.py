#Reads all .json.gz files into a pandas DataFrame
import gzip
from importlib.resources import files
import json
import logging
import pandas as pd
from pathlib import Path

log = logging.getLogger(__name__)

USEFUL_EVENT_TYPES = {
    "PushEvent",
    "PullRequestEvent",
    "CreateEvent",
}

def read_events(
    folder: str | Path,
    event_types: set[str] | None = None,
) -> pd.DataFrame:
    #Read all .json.gz files in the folder
    folder = Path(folder)
    files  = list(folder.glob("*.json.gz"))
    if not files:
        raise FileNotFoundError(
            f"No .json.gz files found in '{folder}'.\n"
        )
    # Filter to only the event types listed
    filter_types = event_types if event_types is not None else USEFUL_EVENT_TYPES
    log.info(f"Reading {len(files)} files from {folder}")
    all_events = []

    for gz_file in files:
        log.info(f"  Reading {gz_file.name}...")
        try:
            with gzip.open(gz_file, "rt", encoding="utf-8", errors="replace") as f:
                for line in f:
                    line = line.strip()
                    if not line:
                        continue
                    try:
                        event = json.loads(line)
                        if filter_types and event.get("type") not in filter_types:
                            continue
                        all_events.append(event)
                    except json.JSONDecodeError:
                        continue
        except Exception as e:
            log.error(f"Failed to read {gz_file.name}: {e}")
            continue
        
    if not all_events:
        log.warning("No events found after filtering.")
        return pd.DataFrame()

    # Convert list of dictionaries into a structured DataFrame
    df = pd.json_normalize(all_events)
    log.info(f"Done — {len(df):,} events loaded into DataFrame")
    return df


def extract_repo_names(folder: str | Path) -> set[str]:
    #Used to build the list of repos to enrich via GitHub REST API. Returns set like: {"vercel/next.js", "torvalds/linux", ...}
    df = read_events(folder)

    if df.empty or "repo.name" not in df.columns:
        log.warning("No repo names found.")
        return set()
    repos = set(df["repo.name"].dropna().unique())
    valid = {r for r in repos if "/" in r}
    log.info(f"Found {len(valid):,} unique repos")
    return valid

def summarize_files(folder: str | Path) -> dict:
    #Counts events by type across all 30 files. Example output: { "files": 30, "total_events": 847293, "by_type": { "PushEvent": 312044,...} }
    folder = Path(folder)
    files  = list(folder.glob("*.json.gz"))
    if not files:
        raise FileNotFoundError(f"No .json.gz files found in '{folder}'")
    df = read_events(folder, event_types=None)

    if df.empty or "type" not in df.columns:
        return {"files": len(files), "total_events": 0, "by_type": {}}
    by_type = (
        df["type"]
        .value_counts()
        .to_dict()
    )

    return {
        "files":        len(files),
        "total_events": len(df),
        "by_type":      by_type,
    }