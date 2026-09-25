"""
Building Schema
---------------
Pydantic models for Whole Building Life Cycle Assessment (WBLCA).
Covers 4 major structural/envelope classes across 25, 50, and 100-year spans.
"""
from __future__ import annotations

from typing import List, Optional, Dict, Any
from pydantic import BaseModel, Field


class MaterialClassItem(BaseModel):
    id: str
    name: str
    base_gwp: float
    unit: str = "kg CO₂e / kg"
    is_green: bool = False
    description: str
    benefits: Optional[str] = None


class MaterialClassDefinition(BaseModel):
    class_id: str
    class_name: str
    role_in_building: str
    lca_significance: str
    default_mass_ratio_kg_per_m2: float
    materials: List[MaterialClassItem]


class MaterialClassesResponse(BaseModel):
    classes: List[MaterialClassDefinition]


class BuildingAssemblySelection(BaseModel):
    material_name: str
    custom_weight_tonnes: Optional[float] = None


class BuildingLCARequest(BaseModel):
    substructure: BuildingAssemblySelection = Field(
        ..., description="Substructure & Foundation assembly"
    )
    superstructure: BuildingAssemblySelection = Field(
        ..., description="Superstructure & Primary Structural Frame"
    )
    facade: BuildingAssemblySelection = Field(
        ..., description="Enclosure, Facade & Exterior Walls"
    )
    roofing_insulation: BuildingAssemblySelection = Field(
        ..., description="Roofing, Thermal Insulation & Interior Partitions"
    )
    gross_floor_area_m2: float = Field(
        default=5000.0, ge=50.0, le=500000.0, description="Gross floor area in square meters"
    )
    building_type: str = Field(
        default="Commercial Multi-Story", description="Type/purpose of the building"
    )
    transit_distance_km: float = Field(
        default=400.0, ge=0.0, le=10000.0, description="Logistics transport distance to site in km"
    )
    vehicle_type: str = Field(
        default="Heavy Freight Truck", description="Fleet vehicle type used for material transit"
    )
    extreme_weather_events: float = Field(
        default=15.0, ge=0.0, le=50.0, description="Annual extreme weather event index"
    )
    temperature_anomaly: float = Field(
        default=1.2, ge=-2.0, le=5.0, description="Temperature anomaly in °C"
    )
    sea_level_rise: float = Field(
        default=12.0, ge=-5.0, le=50.0, description="Sea-level rise in cm"
    )
    policy_score: float = Field(
        default=65.0, ge=0.0, le=100.0, description="Climate policy score (0-100)"
    )


class AssemblyLCABreakdown(BaseModel):
    class_id: str
    class_name: str
    material_name: str
    mass_tonnes: float
    base_gwp: float
    embodied_A1A3_tonnes: float
    transport_A4_tonnes: float
    construction_A5_tonnes: float
    maintenance_B2B5_tonnes: float
    calamity_climate_B1B7_tonnes: float
    end_of_life_C1C4_tonnes: float
    total_100yr_tonnes: float


class TimelineDataPoint(BaseModel):
    year: int
    label: str
    procurement_A1A3: float
    transport_A4: float
    construction_A5: float
    maintenance_B2B5: float
    calamity_climate_B1B7: float
    demolition_C1C4: float
    cumulative_tonnes: float
    baseline_cumulative_tonnes: float
    carbon_avoided_tonnes: float


class LCASummaryMetrics(BaseModel):
    total_100yr_tonnes: float
    baseline_100yr_tonnes: float
    carbon_savings_tonnes: float
    carbon_savings_percentage: float
    upfront_embodied_A1A3_tonnes: float
    transport_A4_tonnes: float
    construction_A5_tonnes: float
    maintenance_B2B5_tonnes: float
    calamity_climate_B1B7_tonnes: float
    demolition_C1C4_tonnes: float
    intensity_kg_co2e_per_m2: float


class BuildingLCAResponse(BaseModel):
    gross_floor_area_m2: float
    building_type: str
    summary: LCASummaryMetrics
    assemblies: List[AssemblyLCABreakdown]
    timeline_trajectory: List[TimelineDataPoint]
    stage_breakdown: Dict[str, float]
