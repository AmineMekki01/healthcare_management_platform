from fastapi import APIRouter, HTTPException
from fastapi.responses import JSONResponse
from src.constants import LIST_OF_SPECIALTIES
from src.models import SymptomsRequest
from src.service import SearchService
from src import logger


router = APIRouter(tags=["Search Endpoints"])


@router.post("/api/v1/analyze_symptoms_and_recommend_doctor")
async def analyze_symptoms_and_recommend_doctor(request_body: SymptomsRequest):
    userQuery = request_body.userQuery
    if not userQuery:
        raise HTTPException(status_code=400, detail="Invalid request")
    specialty = await SearchService.analyze_symptoms(userQuery)
    
    if not specialty:
        return {"doctors": None}
    
    if specialty and specialty.lower() not in [s.lower() for s in LIST_OF_SPECIALTIES]:
        logger.info(f"Invalid specialty: {specialty}")
        raise HTTPException(
            status_code=404, detail=f"Specialty not found: {specialty}")
        
    doctors = SearchService.find_best_matching_doctors(specialty)
    return JSONResponse(content={"doctors": doctors}, status_code=200)
