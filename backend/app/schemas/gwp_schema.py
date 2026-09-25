"""
GWP Schema
----------
Pydantic models for validating Global Warming Potential request /
response payloads.
"""
from __future__ import annotations

from typing import Optional
from pydantic import BaseModel, Field

from app.schemas.transport_schema import TransportRequest, TransportResponse


class PredictionRequest(BaseModel):
    """Input schema for a GWP prediction request."""

    material_name: str = Field(
        ...,
        description="Exact material name as it appears in the ICE V5 dataset.",
    )
    extreme_weather_events: float = Field(
        default=15.0,
        ge=0,
        le=50,
        description="Annual extreme weather event index (0–50).",
    )
    temperature_anomaly: float = Field(
        default=1.2,
        ge=-2.0,
        le=5.0,
        description="Global mean temperature anomaly in °C relative to pre-industrial baseline.",
    )
    sea_level_rise: float = Field(
        default=12.0,
        ge=-5.0,
        le=50.0,
        description="Sea-level rise in cm relative to 1990 baseline.",
    )
    policy_score: float = Field(
        default=65.0,
        ge=0,
        le=100,
        description="Climate policy stringency score (0 = no policy, 100 = maximum stringency).",
    )

    # Optional transport parameters (LCA Stage A4)
    transport: Optional[TransportRequest] = Field(
        default=None,
        description="Optional transport logistics parameters (vehicle, distance, cargo load).",
    )

    model_config = {
        "json_schema_extra": {
            "example": {
                "material_name": "Portland cement, general, CEM I",
                "extreme_weather_events": 15.0,
                "temperature_anomaly": 1.2,
                "sea_level_rise": 12.0,
                "policy_score": 65.0,
                "transport": {
                    "vehicle_type": "Diesel Van",
                    "distance_km": 50.0,
                    "load_weight_kg": 1000.0,
                },
            }
        }
    }


class PredictionResponse(BaseModel):
    """Output schema for a GWP prediction response."""

    material_name: str = Field(..., description="Name of the queried material.")
    base_gwp_A1A3: float = Field(
        ...,
        description="Baseline embodied carbon from the ICE V5 dataset (kg CO₂e / kg), "
        "covering life-cycle stages A1–A3.",
    )
    predicted_100yr_gwp: float = Field(
        ...,
        description="ML-predicted 100-year GWP under the supplied climate scenario "
        "(kg CO₂e / kg).",
    )
    calamity_carbon_penalty: float = Field(
        ...,
        description="Additional carbon penalty attributed to climate calamity factors "
        "(predicted_100yr_gwp − base_gwp_A1A3, kg CO₂e / kg).",
    )
    transport: Optional[TransportResponse] = Field(
        default=None,
        description="Calculated transportation emissions (LCA Stage A4) if requested.",
    )
    total_cradle_to_site_gwp: Optional[float] = Field(
        default=None,
        description="Combined cradle-to-site emissions: Base A1–A3 + normalized transport carbon (kg CO₂e / kg).",
    )
    total_lifecycle_carbon: Optional[float] = Field(
        default=None,
        description="Total 100-year lifecycle carbon footprint including transport (kg CO₂e / kg).",
    )


class MaterialListResponse(BaseModel):
    """Response schema for the list-all-materials endpoint."""

    count: int = Field(..., description="Total number of materials available.")
    materials: list[str] = Field(..., description="List of all available material names.")


class ReasoningRequest(BaseModel):
    """Input schema for a reasoning comparison request."""
    
    mat1_name: str = Field(..., description="Name of the first material.")
    mat1_carbon: float = Field(..., description="Embodied carbon of the first material (kgCO2e/kg).")
    mat2_name: str = Field(..., description="Name of the second material.")
    mat2_carbon: float = Field(..., description="Embodied carbon of the second material (kgCO2e/kg).")

    model_config = {
        "json_schema_extra": {
            "example": {
                "mat1_name": "Hempcrete block",
                "mat1_carbon": -0.41,
                "mat2_name": "Portland cement",
                "mat2_carbon": 0.85
            }
        }
    }


class ReasoningResponse(BaseModel):
    """Output schema for a reasoning comparison response."""
    
    material_1_reasoning: str = Field(..., description="Whitebox explanation for material 1.")
    material_2_reasoning: str = Field(..., description="Whitebox explanation for material 2.")
    comparison_conclusion: str = Field(..., description="Final conclusion comparing the two materials.")


class AlternativeInfo(BaseModel):
    material_name: str
    embodied_carbon: float

class AlternativeResponse(BaseModel):
    original_material: str
    alternatives: list[AlternativeInfo]


