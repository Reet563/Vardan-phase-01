"""
Transport Schema
----------------
Pydantic models for validating vehicle transportation emissions requests and responses.
"""
from __future__ import annotations

from pydantic import BaseModel, Field


class VehicleInfo(BaseModel):
    """Specification of a fleet vehicle."""

    vehicle_type: str = Field(..., description="Name/identifier of the vehicle.")
    vehicle_weight_kg: float = Field(..., description="Curb weight of the vehicle in kg.")
    base_emission_g_per_km: float = Field(
        ..., description="Baseline CO2 emission rate in grams per kilometre."
    )
    icon: str = Field(default="Truck", description="UI icon descriptor.")
    description: str = Field(default="", description="Brief vehicle description.")


class VehicleListResponse(BaseModel):
    """Response containing available transport vehicles."""

    count: int = Field(..., description="Total number of supported vehicles.")
    vehicles: list[VehicleInfo] = Field(..., description="List of vehicle specifications.")


class TransportRequest(BaseModel):
    """Input payload for calculating transportation emissions (LCA Stage A4)."""

    vehicle_type: str = Field(
        default="Diesel Van",
        description="Selected vehicle type (e.g., Bike, Electric Van, CNG Truck, Diesel Van).",
    )
    distance_km: float = Field(
        default=50.0,
        ge=0.0,
        description="One-way or total transit distance to the construction site in km.",
    )
    load_weight_kg: float = Field(
        default=1000.0,
        ge=0.0,
        description="Weight of the transported construction material load in kg.",
    )

    model_config = {
        "json_schema_extra": {
            "example": {
                "vehicle_type": "Diesel Van",
                "distance_km": 50.0,
                "load_weight_kg": 1000.0,
            }
        }
    }


class TransportResponse(BaseModel):
    """Output payload with calculated transportation CO2 emissions breakdown."""

    vehicle_type: str = Field(..., description="Selected vehicle type.")
    vehicle_weight_kg: float = Field(..., description="Vehicle curb weight in kg.")
    load_weight_kg: float = Field(..., description="Payload weight in kg.")
    total_weight_kg: float = Field(..., description="Combined weight (vehicle + payload) in kg.")
    distance_km: float = Field(..., description="Travelled distance in km.")
    base_emission_g_per_km: float = Field(..., description="Base vehicle emission rate in g/km.")
    weight_factor: float = Field(
        ..., description="Load adjustment multiplier (total_weight / vehicle_weight)."
    )
    co2_emissions_g: float = Field(..., description="Total journey emissions in grams of CO2.")
    co2_emissions_kg: float = Field(..., description="Total journey emissions in kilograms of CO2.")
    per_kg_transport_co2e: float = Field(
        ...,
        description="Transport emissions normalized per kg of transported material (kg CO2e / kg material).",
    )
