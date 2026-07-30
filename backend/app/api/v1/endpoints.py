"""
API v1 — GWP Prediction Endpoints
-----------------------------------
All routes are mounted under the /api/v1 prefix (registered in main.py).

Endpoints
---------
GET  /api/v1/materials                          → list every material in the dataset
GET  /api/v1/materials/{material_name}/base-gwp → look up a single material's GWP
POST /api/v1/predict                            → run the 100-yr GWP ML prediction
"""
from __future__ import annotations

from fastapi import APIRouter, Path

from app.schemas.gwp_schema import (
    MaterialListResponse,
    PredictionRequest,
    PredictionResponse,
)
from app.services.material_service import material_service
from app.services.prediction_service import prediction_service

router = APIRouter(prefix="/api/v1", tags=["GWP Predictions"])


# ---------------------------------------------------------------------------
# GET /api/v1/materials
# ---------------------------------------------------------------------------
@router.get(
    "/materials",
    response_model=MaterialListResponse,
    summary="List all available materials",
    description=(
        "Returns every material name present in the ICE V5 Cleaned Materials "
        "dataset, along with the total count."
    ),
)
async def list_materials() -> MaterialListResponse:
    materials = material_service.get_all_materials()
    return MaterialListResponse(count=len(materials), materials=materials)


# ---------------------------------------------------------------------------
# GET /api/v1/materials/{material_name}/base-gwp
# ---------------------------------------------------------------------------
@router.get(
    "/materials/{material_name}/base-gwp",
    summary="Get baseline GWP for a material",
    description=(
        "Looks up the ICE V5 embodied carbon value (A1–A3, kg CO₂e / kg) for "
        "the specified material. Returns HTTP 404 if the material is not found."
    ),
)
async def get_base_gwp(
    material_name: str = Path(
        ...,
        description="Exact material name as it appears in the ICE V5 dataset.",
        examples=["Portland cement, general, CEM I"],
    ),
) -> dict:
    base_gwp = material_service.get_material_base_gwp(material_name)
    return {"material_name": material_name, "base_gwp_A1A3": base_gwp}


# ---------------------------------------------------------------------------
# POST /api/v1/predict
# ---------------------------------------------------------------------------
@router.post(
    "/predict",
    response_model=PredictionResponse,
    summary="Predict 100-year GWP under a climate scenario",
    description=(
        "Accepts a material name and four climate-scenario features. "
        "Retrieves the material's baseline embodied carbon from the ICE V5 "
        "dataset, then runs the trained ML model to produce a 100-year GWP "
        "prediction. The **calamity_carbon_penalty** is the difference between "
        "the predicted value and the baseline (i.e., the extra carbon burden "
        "attributable to the climate scenario)."
    ),
)
async def predict_gwp(request: PredictionRequest) -> PredictionResponse:
    # 1. Look up baseline GWP from the material dataset
    base_gwp = material_service.get_material_base_gwp(request.material_name)

    # 2. Run the ML model
    predicted_100yr_gwp = prediction_service.predict_100yr_gwp(request, base_gwp)

    # 3. Derive the calamity carbon penalty
    calamity_carbon_penalty = predicted_100yr_gwp - base_gwp

    return PredictionResponse(
        material_name=request.material_name,
        base_gwp_A1A3=base_gwp,
        predicted_100yr_gwp=predicted_100yr_gwp,
        calamity_carbon_penalty=calamity_carbon_penalty,
    )
