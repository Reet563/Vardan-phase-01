"""
Building Service
----------------
Whole Building Life Cycle Assessment (WBLCA) engine.
Computes comprehensive building emissions across A1-A5, B1-B7, and C1-C4
over 25, 50, and 100-year operational and calamity horizons.
"""
from __future__ import annotations

import logging
from typing import Dict, List, Any

from app.schemas.building_schema import (
    MaterialClassesResponse,
    MaterialClassDefinition,
    MaterialClassItem,
    BuildingLCARequest,
    BuildingLCAResponse,
    AssemblyLCABreakdown,
    TimelineDataPoint,
    LCASummaryMetrics,
)
from app.schemas.gwp_schema import PredictionRequest
from app.services.material_service import material_service
from app.services.alternatives_service import alternatives_service
from app.services.transport_service import transport_service, VEHICLES
from app.services.prediction_service import prediction_service

logger = logging.getLogger(__name__)

# Predefined curated material classes for Whole Building LCA
BUILDING_CLASSES: List[MaterialClassDefinition] = [
    MaterialClassDefinition(
        class_id="substructure",
        class_name="Substructure & Foundation",
        role_in_building="Load transfer to bedrock/soil, moisture barrier, seismic footing foundation",
        lca_significance="Heavy mass, critical upfront embodied carbon (A1-A3), low replacement frequency",
        default_mass_ratio_kg_per_m2=300.0,
        materials=[
            MaterialClassItem(
                id="cem_i_found",
                name="Portland cement, general, CEM I",
                base_gwp=0.860,
                is_green=False,
                description="Traditional virgin Portland cement standard foundation footing mix.",
            ),
            MaterialClassItem(
                id="rc_ready_found",
                name="Concrete (Ready mix - general)",
                base_gwp=0.130,
                is_green=False,
                description="Standard C25/30 ready-mix concrete for foundation grade slabs.",
            ),
            MaterialClassItem(
                id="lc3_found",
                name="Low-carbon concrete with LC3",
                base_gwp=0.095,
                is_green=True,
                description="Limestone Calcined Clay Cement reducing clinker ratio by up to 50%.",
                benefits="40% lower embodied CO2 with superior sulfate & chloride durability."
            ),
            MaterialClassItem(
                id="ggbs_found",
                name="Recycled glass pozzolan mortar mix",
                base_gwp=0.042,
                is_green=True,
                description="High industrial byproduct replacement foundation binder.",
                benefits="Dramatically lower upfront emissions and high water resistance."
            ),
        ]
    ),
    MaterialClassDefinition(
        class_id="superstructure",
        class_name="Superstructure & Structural Frame",
        role_in_building="Primary structural gravity support (columns, beams, slabs) and lateral wind/earthquake stability",
        lca_significance="Primary driver of structural embodied carbon, highly vulnerable to seismic/thermal aging",
        default_mass_ratio_kg_per_m2=500.0,
        materials=[
            MaterialClassItem(
                id="steel_virgin",
                name="Structural steel, virgin / BOF",
                base_gwp=2.450,
                is_green=False,
                description="Traditional blast furnace-basic oxygen furnace structural steel sections.",
            ),
            MaterialClassItem(
                id="rc_super",
                name="Reinforced Concrete (C30/37 structural)",
                base_gwp=0.165,
                is_green=False,
                description="Standard reinforced concrete frame with high tensile rebar.",
            ),
            MaterialClassItem(
                id="clt_timber",
                name="Cross-Laminated Timber (CLT)",
                base_gwp=-0.610,
                is_green=True,
                description="Engineered solid wood multi-layer panels providing carbon sequestration.",
                benefits="Net-negative embodied carbon (-0.61 kg CO₂e/kg) storing biogenic carbon."
            ),
            MaterialClassItem(
                id="bamboo_glubam",
                name="Bamboo laminated timber beam (Glubam)",
                base_gwp=0.180,
                is_green=True,
                description="Fast-growing structural bamboo composite beams with high tensile capacity.",
                benefits="Rapidly renewable crop, high strength-to-weight ratio."
            ),
        ]
    ),
    MaterialClassDefinition(
        class_id="facade",
        class_name="Enclosure, Facade & Exterior Walls",
        role_in_building="Building envelope weatherproofing, thermal insulation, acoustic barrier, solar shielding",
        lca_significance="Undergoes repeated replacement/renovation (B4-B5) every 25-30 years, exposed to extreme climate",
        default_mass_ratio_kg_per_m2=160.0,
        materials=[
            MaterialClassItem(
                id="clay_brick",
                name="Standard Clay Facing Brick",
                base_gwp=0.240,
                is_green=False,
                description="Fired clay external brickwork with Portland mortar backing.",
            ),
            MaterialClassItem(
                id="curtain_wall",
                name="Double-Glazed Curtain Wall Glass",
                base_gwp=1.400,
                is_green=False,
                description="Aluminum mullion framed double-glazed exterior facade system.",
            ),
            MaterialClassItem(
                id="hempcrete_wall",
                name="Hempcrete block, density 300 kg/m3",
                base_gwp=-0.410,
                is_green=True,
                description="Hemp shiv and lime binder masonry block providing continuous insulation.",
                benefits="Carbon negative biocomposite, breathable, excellent thermal inertia."
            ),
            MaterialClassItem(
                id="ceb_clay",
                name="Compressed Earth Block (CEB), unfired natural clay",
                base_gwp=0.018,
                is_green=True,
                description="Unfired clay stabilized with minimal lime, zero high-temperature kiln firing.",
                benefits="Virtually zero upfront carbon footprint with superb thermal mass."
            ),
        ]
    ),
    MaterialClassDefinition(
        class_id="roofing_insulation",
        class_name="Roofing, Insulation & Internal Partitions",
        role_in_building="Thermal resistance (R-value), passive interior climate regulation, fireproofing partitions",
        lca_significance="Shortest replacement cycle (20-25 yrs), direct impact on operational energy and fire safety",
        default_mass_ratio_kg_per_m2=60.0,
        materials=[
            MaterialClassItem(
                id="xps_foam",
                name="Extruded Polystyrene (XPS) Rigid Foam",
                base_gwp=2.800,
                is_green=False,
                description="Petrochemical polymer extruded foam insulation boards.",
            ),
            MaterialClassItem(
                id="mineral_wool",
                name="Stone / Mineral Wool Insulation",
                base_gwp=1.250,
                is_green=False,
                description="Melted rock spun into fiber batts with phenolic resin binder.",
            ),
            MaterialClassItem(
                id="wood_fiberboard",
                name="Wood fiberboard insulation",
                base_gwp=-0.450,
                is_green=True,
                description="Bio-based renewable timber residue insulation board.",
                benefits="Carbon-negative insulation (-0.45 kg CO₂e/kg) with high heat storage capacity."
            ),
            MaterialClassItem(
                id="mycelium_board",
                name="Mycelium insulation board",
                base_gwp=-0.150,
                is_green=True,
                description="Fungal mycelium grown on agricultural sub-products into rigid boards.",
                benefits="Fully biodegradable, non-toxic, naturally fire resistant."
            ),
            MaterialClassItem(
                id="biochar_render",
                name="Bio-char enriched clay render",
                base_gwp=-0.550,
                is_green=True,
                description="Internal clay plaster enriched with carbonized biomass bio-char.",
                benefits="Permanently sequesters carbon while regulating indoor humidity."
            ),
        ]
    ),
]


class BuildingService:
    def get_material_classes(self) -> MaterialClassesResponse:
        return MaterialClassesResponse(classes=BUILDING_CLASSES)

    def _resolve_base_gwp(self, material_name: str) -> float:
        # Check custom classes first
        for c in BUILDING_CLASSES:
            for m in c.materials:
                if m.name.lower() == material_name.lower():
                    return m.base_gwp

        # Check alternatives service
        alt_gwp = alternatives_service.get_alternative_base_gwp(material_name)
        if alt_gwp is not None:
            return alt_gwp

        # Check ICE V5 dataset
        try:
            return material_service.get_material_base_gwp(material_name)
        except Exception:
            return 0.250  # reasonable fallback default

    def calculate_whole_building_lca(self, req: BuildingLCARequest) -> BuildingLCAResponse:
        gfa = req.gross_floor_area_m2
        distance_km = req.transit_distance_km
        vehicle_type = req.vehicle_type if req.vehicle_type in VEHICLES else "Heavy Freight Truck"

        # Transport emission calculation per kg
        t_calc = transport_service.calculate_emissions(
            vehicle_type=vehicle_type,
            distance_km=distance_km,
            load_weight_kg=1000.0,
        )
        transport_rate_per_kg = t_calc["per_kg_transport_co2e"]

        # Climate prediction payload template
        def get_ml_calamity_penalty(mat_name: str, base_gwp: float) -> float:
            pred_req = PredictionRequest(
                material_name=mat_name,
                extreme_weather_events=req.extreme_weather_events,
                temperature_anomaly=req.temperature_anomaly,
                sea_level_rise=req.sea_level_rise,
                policy_score=req.policy_score,
            )
            try:
                pred_100 = prediction_service.predict_100yr_gwp(pred_req, base_gwp)
                return max(0.0, pred_100 - base_gwp)
            except Exception as e:
                logger.warning("ML prediction fallback for %s: %s", mat_name, e)
                # Calamity baseline formula: 15% to 30% climate stress factor
                stress = (req.extreme_weather_events / 50.0) * 0.15 + (req.temperature_anomaly / 5.0) * 0.15
                return max(0.01, abs(base_gwp) * stress)

        # Map the 4 user selections
        selections = [
            ("substructure", "Substructure & Foundation", req.substructure, 300.0, 0.02, 0.05),
            ("superstructure", "Superstructure & Structural Frame", req.superstructure, 500.0, 0.05, 0.06),
            ("facade", "Enclosure, Facade & Exterior Walls", req.facade, 160.0, 0.35, 0.05),
            ("roofing_insulation", "Roofing, Insulation & Internal Partitions", req.roofing_insulation, 60.0, 0.50, 0.04),
        ]

        assemblies: List[AssemblyLCABreakdown] = []

        total_embodied_A1A3 = 0.0
        total_transport_A4 = 0.0
        total_construction_A5 = 0.0
        total_maintenance_B2B5 = 0.0
        total_calamity_B1B7 = 0.0
        total_demolition_C1C4 = 0.0

        for class_id, class_name, sel, default_ratio, maint_factor, demo_factor in selections:
            mat_name = sel.material_name
            # Mass in tonnes
            mass_tonnes = sel.custom_weight_tonnes if sel.custom_weight_tonnes is not None else (gfa * default_ratio / 1000.0)
            mass_kg = mass_tonnes * 1000.0

            base_gwp = self._resolve_base_gwp(mat_name)
            calamity_penalty_per_kg = get_ml_calamity_penalty(mat_name, base_gwp)

            # LCA Stages in Tonnes CO2e
            embodied_A1A3 = (mass_kg * base_gwp) / 1000.0
            transport_A4 = (mass_kg * transport_rate_per_kg) / 1000.0
            
            # A5 Construction site activities (~8% of embodied or 15 kg/m2 minimum)
            construction_A5 = max(0.0, abs(embodied_A1A3) * 0.08)

            # B2-B5 Maintenance & Replacement over 100 years
            maintenance_B2B5 = abs(embodied_A1A3) * maint_factor

            # B1-B7 Climate Calamity dynamic impact
            calamity_B1B7 = (mass_kg * calamity_penalty_per_kg) / 1000.0

            # C1-C4 Deconstruction & End of Life Demolition
            demolition_C1C4 = abs(embodied_A1A3) * demo_factor

            total_assembly_100yr = (
                embodied_A1A3 + transport_A4 + construction_A5 +
                maintenance_B2B5 + calamity_B1B7 + demolition_C1C4
            )

            assemblies.append(
                AssemblyLCABreakdown(
                    class_id=class_id,
                    class_name=class_name,
                    material_name=mat_name,
                    mass_tonnes=round(mass_tonnes, 2),
                    base_gwp=round(base_gwp, 4),
                    embodied_A1A3_tonnes=round(embodied_A1A3, 2),
                    transport_A4_tonnes=round(transport_A4, 2),
                    construction_A5_tonnes=round(construction_A5, 2),
                    maintenance_B2B5_tonnes=round(maintenance_B2B5, 2),
                    calamity_climate_B1B7_tonnes=round(calamity_B1B7, 2),
                    end_of_life_C1C4_tonnes=round(demolition_C1C4, 2),
                    total_100yr_tonnes=round(total_assembly_100yr, 2),
                )
            )

            total_embodied_A1A3 += embodied_A1A3
            total_transport_A4 += transport_A4
            total_construction_A5 += construction_A5
            total_maintenance_B2B5 += maintenance_B2B5
            total_calamity_B1B7 += calamity_B1B7
            total_demolition_C1C4 += demolition_C1C4

        total_100yr = (
            total_embodied_A1A3 + total_transport_A4 + total_construction_A5 +
            total_maintenance_B2B5 + total_calamity_B1B7 + total_demolition_C1C4
        )

        # Conventional Baseline Building (Traditional Portland, Virgin Steel, Brick, XPS Foam)
        base_sub_mass = gfa * 300.0 / 1000.0
        base_super_mass = gfa * 500.0 / 1000.0
        base_facade_mass = gfa * 160.0 / 1000.0
        base_roof_mass = gfa * 60.0 / 1000.0

        base_embodied = (
            (base_sub_mass * 1000.0 * 0.860) +
            (base_super_mass * 1000.0 * 2.450) +
            (base_facade_mass * 1000.0 * 0.240) +
            (base_roof_mass * 1000.0 * 2.800)
        ) / 1000.0

        base_total_mass_kg = (base_sub_mass + base_super_mass + base_facade_mass + base_roof_mass) * 1000.0
        base_transport = (base_total_mass_kg * transport_rate_per_kg) / 1000.0
        base_construction = base_embodied * 0.08
        base_maintenance = base_embodied * 0.28
        base_calamity = base_embodied * 0.25
        base_demolition = base_embodied * 0.05
        baseline_100yr = (
            base_embodied + base_transport + base_construction +
            base_maintenance + base_calamity + base_demolition
        )

        carbon_savings = max(0.0, baseline_100yr - total_100yr)
        savings_pct = (carbon_savings / baseline_100yr * 100.0) if baseline_100yr > 0 else 0.0

        # Construct multi-year timeline trajectory across 25, 50, and 100 years
        # Year 0: As-built handover (A1-A3 + A4 + A5)
        yr0 = total_embodied_A1A3 + total_transport_A4 + total_construction_A5
        base_yr0 = base_embodied + base_transport + base_construction

        # Year 25: Yr0 + 25-yr maintenance + 25% calamity
        yr25_maint = total_maintenance_B2B5 * 0.25
        yr25_calam = total_calamity_B1B7 * 0.25
        yr25 = yr0 + yr25_maint + yr25_calam
        base_yr25 = base_yr0 + (base_maintenance * 0.25) + (base_calamity * 0.25)

        # Year 50: Yr25 + 50-yr maintenance + 25% calamity
        yr50_maint = total_maintenance_B2B5 * 0.50
        yr50_calam = total_calamity_B1B7 * 0.50
        yr50 = yr0 + yr50_maint + yr50_calam
        base_yr50 = base_yr0 + (base_maintenance * 0.50) + (base_calamity * 0.50)

        # Year 75: Yr50 + 75-yr maintenance + 25% calamity
        yr75_maint = total_maintenance_B2B5 * 0.75
        yr75_calam = total_calamity_B1B7 * 0.75
        yr75 = yr0 + yr75_maint + yr75_calam
        base_yr75 = base_yr0 + (base_maintenance * 0.75) + (base_calamity * 0.75)

        # Year 100: Total 100yr including Demolition C1-C4
        yr100 = total_100yr
        base_yr100 = baseline_100yr

        timeline_trajectory = [
            TimelineDataPoint(
                year=0,
                label="Year 0 (Handover)",
                procurement_A1A3=round(total_embodied_A1A3, 2),
                transport_A4=round(total_transport_A4, 2),
                construction_A5=round(total_construction_A5, 2),
                maintenance_B2B5=0.0,
                calamity_climate_B1B7=0.0,
                demolition_C1C4=0.0,
                cumulative_tonnes=round(yr0, 2),
                baseline_cumulative_tonnes=round(base_yr0, 2),
                carbon_avoided_tonnes=round(max(0.0, base_yr0 - yr0), 2),
            ),
            TimelineDataPoint(
                year=25,
                label="Year 25 (Mid-Life I)",
                procurement_A1A3=round(total_embodied_A1A3, 2),
                transport_A4=round(total_transport_A4, 2),
                construction_A5=round(total_construction_A5, 2),
                maintenance_B2B5=round(yr25_maint, 2),
                calamity_climate_B1B7=round(yr25_calam, 2),
                demolition_C1C4=0.0,
                cumulative_tonnes=round(yr25, 2),
                baseline_cumulative_tonnes=round(base_yr25, 2),
                carbon_avoided_tonnes=round(max(0.0, base_yr25 - yr25), 2),
            ),
            TimelineDataPoint(
                year=50,
                label="Year 50 (Major Renovation)",
                procurement_A1A3=round(total_embodied_A1A3, 2),
                transport_A4=round(total_transport_A4, 2),
                construction_A5=round(total_construction_A5, 2),
                maintenance_B2B5=round(yr50_maint, 2),
                calamity_climate_B1B7=round(yr50_calam, 2),
                demolition_C1C4=0.0,
                cumulative_tonnes=round(yr50, 2),
                baseline_cumulative_tonnes=round(base_yr50, 2),
                carbon_avoided_tonnes=round(max(0.0, base_yr50 - yr50), 2),
            ),
            TimelineDataPoint(
                year=75,
                label="Year 75 (Envelope Refit)",
                procurement_A1A3=round(total_embodied_A1A3, 2),
                transport_A4=round(total_transport_A4, 2),
                construction_A5=round(total_construction_A5, 2),
                maintenance_B2B5=round(yr75_maint, 2),
                calamity_climate_B1B7=round(yr75_calam, 2),
                demolition_C1C4=0.0,
                cumulative_tonnes=round(yr75, 2),
                baseline_cumulative_tonnes=round(base_yr75, 2),
                carbon_avoided_tonnes=round(max(0.0, base_yr75 - yr75), 2),
            ),
            TimelineDataPoint(
                year=100,
                label="Year 100 (End of Life)",
                procurement_A1A3=round(total_embodied_A1A3, 2),
                transport_A4=round(total_transport_A4, 2),
                construction_A5=round(total_construction_A5, 2),
                maintenance_B2B5=round(total_maintenance_B2B5, 2),
                calamity_climate_B1B7=round(total_calamity_B1B7, 2),
                demolition_C1C4=round(total_demolition_C1C4, 2),
                cumulative_tonnes=round(yr100, 2),
                baseline_cumulative_tonnes=round(base_yr100, 2),
                carbon_avoided_tonnes=round(max(0.0, base_yr100 - yr100), 2),
            ),
        ]

        summary = LCASummaryMetrics(
            total_100yr_tonnes=round(total_100yr, 2),
            baseline_100yr_tonnes=round(baseline_100yr, 2),
            carbon_savings_tonnes=round(carbon_savings, 2),
            carbon_savings_percentage=round(savings_pct, 1),
            upfront_embodied_A1A3_tonnes=round(total_embodied_A1A3, 2),
            transport_A4_tonnes=round(total_transport_A4, 2),
            construction_A5_tonnes=round(total_construction_A5, 2),
            maintenance_B2B5_tonnes=round(total_maintenance_B2B5, 2),
            calamity_climate_B1B7_tonnes=round(total_calamity_B1B7, 2),
            demolition_C1C4_tonnes=round(total_demolition_C1C4, 2),
            intensity_kg_co2e_per_m2=round((total_100yr * 1000.0) / gfa, 1),
        )

        stage_breakdown = {
            "A1-A3 Procurement (Embodied)": round(total_embodied_A1A3, 2),
            "A4 Logistics Transit": round(total_transport_A4, 2),
            "A5 Construction & Erection": round(total_construction_A5, 2),
            "B2-B5 Maintenance & Renewal": round(total_maintenance_B2B5, 2),
            "B1/B7 Calamity & Aging": round(total_calamity_B1B7, 2),
            "C1-C4 Demolition & Deconstruction": round(total_demolition_C1C4, 2),
        }

        return BuildingLCAResponse(
            gross_floor_area_m2=gfa,
            building_type=req.building_type,
            summary=summary,
            assemblies=assemblies,
            timeline_trajectory=timeline_trajectory,
            stage_breakdown=stage_breakdown,
        )


building_service = BuildingService()
