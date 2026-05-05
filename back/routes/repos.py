# GET /api/repos/
import logging
import threading
from fastapi import APIRouter, HTTPException, BackgroundTasks
from services.analytics_service import (
    get_repo_stats,
    get_intent_stats,
    bust_cache,
)
from services.data_service import build_dataset

router  = APIRouter()
log     = logging.getLogger(__name__)

# Tracks whether a rebuild is running
_state = {"running": False, "log": []}

def _run_build():
    _state["running"] = True
    _state["log"]     = ["Starting dataset build..."]
    try:
        meta = build_dataset()
        bust_cache()
        _state["log"].append(f"Done — {meta['total_rows']:,} rows built")
    except Exception as e:
        _state["log"].append(f"Failed: {e}")
        log.error(f"Dataset build failed: {e}")
    finally:
        _state["running"] = False


@router.get("/")
def repo_stats():
    #Used by: repos table in dashboard (Top 100 repos by commit activity)
    try:
        return get_repo_stats()
    except FileNotFoundError as e:
        raise HTTPException(status_code=503, detail=str(e))


@router.get("/intent")
def intent_stats():
    #Used by: intent pie/bar chart (Overall commit intent distribution)
    try:
        return get_intent_stats()
    except FileNotFoundError as e:
        raise HTTPException(status_code=503, detail=str(e))

@router.post("/build-dataset")
def build_dataset_endpoint(background_tasks: BackgroundTasks):
    # full dataset rebuild in the background 
    if _state["running"]:
        raise HTTPException(
            status_code=409,
            detail="Build already running. Poll /api/repos/build-status."
        )
    thread = threading.Thread(target=_run_build, daemon=True)
    thread.start()
    return {"message": "Build started", "poll": "/api/repos/build-status"}


@router.get("/build-status")
def build_status():
    # Returns current build state and log tail
    return {
        "running": _state["running"],
        "log":     _state["log"][-20:],
    }