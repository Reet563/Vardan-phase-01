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
    ReasoningRequest,
    ReasoningResponse,
    AlternativeResponse
)
from app.schemas.transport_schema import (
    TransportRequest,
    TransportResponse,
    VehicleInfo,
    VehicleListResponse,
)
from app.schemas.building_schema import (
    BuildingLCARequest,
    BuildingLCAResponse,
    MaterialClassesResponse,
)
from app.services.material_service import material_service
from app.services.prediction_service import prediction_service
from app.services.transport_service import transport_service
from app.services.reasoning_service import reasoning_service
from app.services.alternatives_service import alternatives_service
from app.services.building_service import building_service

router = APIRouter(prefix="/api/v1", tags=["GWP & Logistics Predictions"])


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
# GET /api/v1/transport/vehicles
# ---------------------------------------------------------------------------
@router.get(
    "/transport/vehicles",
    response_model=VehicleListResponse,
    summary="List supported transport fleet vehicles",
    description="Returns available transport vehicles with curb weight and base CO2 emission rates.",
)
async def list_transport_vehicles() -> VehicleListResponse:
    vehicles_dict = transport_service.get_vehicles()
    vehicle_items = [
        VehicleInfo(
            vehicle_type=k,
            vehicle_weight_kg=v["vehicle_weight_kg"],
            base_emission_g_per_km=v["base_emission_g_per_km"],
            icon=v.get("icon", "Truck"),
            description=v.get("description", ""),
        )
        for k, v in vehicles_dict.items()
    ]
    return VehicleListResponse(count=len(vehicle_items), vehicles=vehicle_items)


# ---------------------------------------------------------------------------
# POST /api/v1/transport/calculate
# ---------------------------------------------------------------------------
@router.post(
    "/transport/calculate",
    response_model=TransportResponse,
    summary="Calculate transportation CO2 emissions (LCA A4)",
    description=(
        "Calculates total and normalized transportation CO2 emissions for a "
        "given vehicle type, transit distance, and load weight."
    ),
)
async def calculate_transport_emissions(request: TransportRequest) -> TransportResponse:
    result = transport_service.calculate_emissions(
        vehicle_type=request.vehicle_type,
        distance_km=request.distance_km,
        load_weight_kg=request.load_weight_kg,
    )
    return TransportResponse(**result)


# ---------------------------------------------------------------------------
# POST /api/v1/predict
# ---------------------------------------------------------------------------
@router.post(
    "/predict",
    response_model=PredictionResponse,
    summary="Predict 100-year GWP & Lifecycle Carbon under a climate scenario",
    description=(
        "Accepts a material name, climate-scenario features, and optional transport "
        "logistics parameters. Retrieves baseline embodied carbon from ICE V5, runs the "
        "ML model for 100-year dynamic GWP, and computes integrated lifecycle emissions."
    ),
)
async def predict_gwp(request: PredictionRequest) -> PredictionResponse:
    # 1. Look up baseline GWP from the material dataset
    from fastapi import HTTPException
    try:
        base_gwp = material_service.get_material_base_gwp(request.material_name)
    except HTTPException:
        alt_gwp = alternatives_service.get_alternative_base_gwp(request.material_name)
        if alt_gwp is not None:
            base_gwp = alt_gwp
        else:
            raise

    # 2. Run the ML model
    predicted_100yr_gwp = prediction_service.predict_100yr_gwp(request, base_gwp)

    # 3. Derive the calamity carbon penalty
    calamity_carbon_penalty = predicted_100yr_gwp - base_gwp

    # 4. Process optional transportation emissions (LCA Stage A4)
    transport_response: TransportResponse | None = None
    total_cradle_to_site: float | None = None
    total_lifecycle: float | None = None

    if request.transport is not None:
        raw_transport = transport_service.calculate_emissions(
            vehicle_type=request.transport.vehicle_type,
            distance_km=request.transport.distance_km,
            load_weight_kg=request.transport.load_weight_kg,
        )
        transport_response = TransportResponse(**raw_transport)
        total_cradle_to_site = base_gwp + transport_response.per_kg_transport_co2e
        total_lifecycle = predicted_100yr_gwp + transport_response.per_kg_transport_co2e

    return PredictionResponse(
        material_name=request.material_name,
        base_gwp_A1A3=base_gwp,
        predicted_100yr_gwp=predicted_100yr_gwp,
        calamity_carbon_penalty=calamity_carbon_penalty,
        transport=transport_response,
        total_cradle_to_site_gwp=total_cradle_to_site,
        total_lifecycle_carbon=total_lifecycle,
    )


# ---------------------------------------------------------------------------
# POST /api/v1/reason
# ---------------------------------------------------------------------------
@router.post(
    "/reason",
    response_model=ReasoningResponse,
    summary="Reason out based on comparisons why green materials are better",
    description=(
        "Uses a trained whitebox Decision Tree model to compare two materials "
        "and generate a programmatic text explanation of why one is superior."
    ),
)
async def compare_materials_reasoning(request: ReasoningRequest) -> ReasoningResponse:
    result = reasoning_service.compare_materials(
        mat1_name=request.mat1_name,
        mat1_carbon=request.mat1_carbon,
        mat2_name=request.mat2_name,
        mat2_carbon=request.mat2_carbon
    )
    return ReasoningResponse(**result)


# ---------------------------------------------------------------------------
# GET /api/v1/materials/{material_name}/alternatives
# ---------------------------------------------------------------------------
@router.get(
    "/materials/{material_name}/alternatives",
    response_model=AlternativeResponse,
    summary="Get green material alternatives",
    description="Returns 2 or 3 green material alternatives for the requested material."
)
async def get_green_alternatives(material_name: str = Path(...)) -> AlternativeResponse:
    alts = alternatives_service.get_alternatives(material_name, count=3)
    return AlternativeResponse(
        original_material=material_name,
        alternatives=alts
    )


# ---------------------------------------------------------------------------
# GET /api/v1/building/classes
# ---------------------------------------------------------------------------
@router.get(
    "/building/classes",
    response_model=MaterialClassesResponse,
    summary="Get the 4 structural & envelope material classes for Whole Building LCA",
    description="Returns the 4 building classes (Substructure, Superstructure, Facade, Roofing/Insulation) with their LCA roles and material options."
)
async def get_building_material_classes() -> MaterialClassesResponse:
    return building_service.get_material_classes()


# ---------------------------------------------------------------------------
# POST /api/v1/building/calculate
# ---------------------------------------------------------------------------
@router.post(
    "/building/calculate",
    response_model=BuildingLCAResponse,
    summary="Calculate Whole Building Lifecycle Assessment (25, 50, and 100 years)",
    description=(
        "Accepts 1 material selection from each of the 4 building classes, along with "
        "gross floor area and climate/logistics parameters. Computes total building emissions "
        "across A1-A3 (Procurement), A4 (Logistics), A5 (Construction), B2-B5 (Maintenance), "
        "B1/B7 (Dynamic Calamity Stress), and C1-C4 (Demolition) over 25, 50, and 100-year horizons."
    )
)
async def calculate_building_lca(request: BuildingLCARequest) -> BuildingLCAResponse:
    return building_service.calculate_whole_building_lca(request)
