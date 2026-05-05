#GET /api/frameworks/
from fastapi import APIRouter, HTTPException
from services.analytics_service import (
    get_framework_stats,
    get_frameworks_by_language,
)

router = APIRouter()

@router.get("/")
def framework_stats():
    # Used by: framework popularity ranking chart (framework mention counts)
    try:
        return get_framework_stats()
    except FileNotFoundError as e:
        raise HTTPException(status_code=503, detail=str(e))


@router.get("/by-language")
def frameworks_by_language():
    # Used by: ecosystem explorer (Top frameworks per language ecosystem)
    try:
        return get_frameworks_by_language()
    except FileNotFoundError as e:
        raise HTTPException(status_code=503, detail=str(e))