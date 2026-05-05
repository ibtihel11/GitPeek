#GET /api/languages/
from fastapi import APIRouter, HTTPException
from services.analytics_service import (
    get_language_stats,
    get_language_by_intent,
    get_language_trend,
)

router = APIRouter()

@router.get("/")
def language_stats():
    #Used by: dashboard language bar chart
    try:
        return get_language_stats()
    except FileNotFoundError as e:
        raise HTTPException(status_code=503, detail=str(e))

@router.get("/by-intent")
def language_by_intent():
    # Used by: stacked bar chart (commit intent per language)
    try:
        return get_language_by_intent()
    except FileNotFoundError as e:
        raise HTTPException(status_code=503, detail=str(e))

@router.get("/trend")
def language_trend():
    # Used by: line chart 
    try:
        return get_language_trend()
    except FileNotFoundError as e:
        raise HTTPException(status_code=503, detail=str(e))