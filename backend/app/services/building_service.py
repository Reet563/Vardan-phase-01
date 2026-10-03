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

BUILDING_CLASSES: List[MaterialClassDefinition] = [
    MaterialClassDefinition(
        class_id="substructure",
        class_name="Substructure & Foundation",
        role_in_building="Load transfer to bedrock/soil, moisture barrier, seismic footing foundation",
        lca_significance="Heavy mass (~30% building weight), critical upfront embodied carbon (A1-A3), 100-yr permanent lifespan",
        default_mass_ratio_kg_per_m2=300.0,
        materials=[
            MaterialClassItem(
                id="portland_cement_general_cem_i",
                name="Portland cement, general, CEM I",
                base_gwp=0.86,
                is_green=False,
                description="Traditional virgin Portland cement standard foundation footing mix."
            ),
            MaterialClassItem(
                id="concrete_ready_mix_general",
                name="Concrete (Ready mix - general)",
                base_gwp=0.13,
                is_green=False,
                description="Standard C25/30 ready-mix concrete for foundation grade slabs."
            ),
            MaterialClassItem(
                id="concrete_c25_30_standard_foundation_mix",
                name="Concrete (C25/30 standard foundation mix)",
                base_gwp=0.145,
                is_green=False,
                description="Standard reinforced foundation concrete with standard Portland binder."
            ),
            MaterialClassItem(
                id="precast_concrete_foundation_piles",
                name="Precast concrete foundation piles",
                base_gwp=0.18,
                is_green=False,
                description="Factory-cured high-density concrete driven piles."
            ),
            MaterialClassItem(
                id="heavy_unreinforced_footing_concrete",
                name="Heavy unreinforced footing concrete",
                base_gwp=0.125,
                is_green=False,
                description="Mass gravity foundation pad without steel reinforcement."
            ),
            MaterialClassItem(
                id="virgin_aggregate_crushed_gravel_mix",
                name="Virgin aggregate & crushed gravel mix",
                base_gwp=0.055,
                is_green=False,
                description="Quarried virgin rock and crushed gravel sub-base bedding."
            ),
            MaterialClassItem(
                id="asphaltic_foundation_moisture_seal",
                name="Asphaltic foundation moisture seal",
                base_gwp=0.45,
                is_green=False,
                description="Petroleum bitumen damp-proof foundation coating."
            ),
            MaterialClassItem(
                id="carbon_negative_olivine_mineralized_aggr",
                name="Carbon-negative olivine mineralized aggregate concrete",
                base_gwp=-0.045,
                is_green=True,
                description="Carbon-mineralizing permanent foundation footings."
            ),
            MaterialClassItem(
                id="carbon_negative_synthetic_limestone_aggr",
                name="Carbon negative synthetic limestone aggregate concrete",
                base_gwp=-0.015,
                is_green=True,
                description="Sub-base mass concrete & grade slabs."
            ),
            MaterialClassItem(
                id="bio_asphalt_binder_100_microalgae_tall_o",
                name="Bio-asphalt binder, 100% microalgae/tall oil derived",
                base_gwp=0.095,
                is_green=True,
                description="Sub-slab moisture & subterranean damp-proof barrier."
            ),
            MaterialClassItem(
                id="bio_asphalt_waterproof_membrane_coating",
                name="Bio-asphalt waterproof membrane coating",
                base_gwp=0.18,
                is_green=True,
                description="Foundation wall damp-proof tanking coating."
            ),
            MaterialClassItem(
                id="recycled_rubber_asphalt_waterproofing_me",
                name="Recycled rubber asphalt waterproofing membrane",
                base_gwp=0.52,
                is_green=True,
                description="Basement retaining wall waterproofing sheet."
            ),
            MaterialClassItem(
                id="natural_hydraulic_lime_waterproofing_slu",
                name="Natural hydraulic lime waterproofing slurry",
                base_gwp=0.14,
                is_green=True,
                description="Subgrade masonry & foundation waterproofing barrier."
            ),
            MaterialClassItem(
                id="crumb_rubber_modified_asphalt_emulsion_s",
                name="Crumb rubber modified asphalt emulsion sealant",
                base_gwp=0.42,
                is_green=True,
                description="Foundation expansion joint & crack sealant."
            ),
            MaterialClassItem(
                id="recycled_aggregate_concrete_c25_30_100_r",
                name="Recycled aggregate concrete C25/30 (100% recycled coarse aggregate)",
                base_gwp=0.074,
                is_green=True,
                description="Foundation grade slabs and mass concrete footings."
            ),
            MaterialClassItem(
                id="recycled_brick_aggregate_concrete_c20_25",
                name="Recycled brick aggregate concrete C20/25",
                base_gwp=0.061,
                is_green=True,
                description="Unreinforced ground bedding and pad footings."
            ),
            MaterialClassItem(
                id="low_carbon_concrete_with_lc3_limestone_c",
                name="Low-carbon concrete with LC3 (Limestone Calcined Clay Cement)",
                base_gwp=0.095,
                is_green=True,
                description="General foundation grade slabs and basement walls."
            ),
            MaterialClassItem(
                id="geopolymer_concrete_100_fly_ash_ggbs_act",
                name="Geopolymer concrete (100% Fly Ash & GGBS activated)",
                base_gwp=0.052,
                is_green=True,
                description="Sulfate & chloride-resistant foundation piles."
            ),
            MaterialClassItem(
                id="volcanic_ash_pozzolan_natural_hydraulic_",
                name="Volcanic ash pozzolan natural hydraulic lime concrete",
                base_gwp=0.045,
                is_green=True,
                description="Mass foundation bedding & subgrade fill."
            ),
            MaterialClassItem(
                id="micro_algae_infused_self_healing_concret",
                name="Micro-algae infused self-healing concrete",
                base_gwp=0.088,
                is_green=True,
                description="Waterproof underground basement retaining walls."
            ),
            MaterialClassItem(
                id="dredged_sediment_aggregate_lightweight_c",
                name="Dredged sediment aggregate lightweight concrete",
                base_gwp=0.055,
                is_green=True,
                description="Subgrade void filling and non-structural bedding."
            ),
            MaterialClassItem(
                id="low_binder_roller_compacted_eco_concrete",
                name="Low-binder roller compacted eco-concrete (RCC)",
                base_gwp=0.055,
                is_green=True,
                description="Heavy ground slabs and subgrade base courses."
            ),
            MaterialClassItem(
                id="sulfur_polymer_concrete_made_with_indust",
                name="Sulfur-polymer concrete made with industrial byproduct sulfur",
                base_gwp=0.068,
                is_green=True,
                description="High chemical/acid-resistant foundation concrete."
            ),
            MaterialClassItem(
                id="pervious_eco_concrete_with_recycled_aggr",
                name="Pervious eco-concrete with recycled aggregate (permeable)",
                base_gwp=0.065,
                is_green=True,
                description="Ground stormwater infiltration & perimeter drainage slabs."
            ),
            MaterialClassItem(
                id="ceramic_waste_coarse_aggregate_concrete",
                name="Ceramic waste coarse aggregate concrete",
                base_gwp=0.064,
                is_green=True,
                description="Foundation concrete mix using crushed ceramic scrap."
            ),
            MaterialClassItem(
                id="copper_slag_blended_eco_concrete",
                name="Copper slag blended eco-concrete",
                base_gwp=0.072,
                is_green=True,
                description="High-density foundation gravity footing concrete."
            ),
            MaterialClassItem(
                id="calcined_paper_sludge_hydraulic_cement_b",
                name="Calcined paper sludge hydraulic cement binder",
                base_gwp=0.049,
                is_green=True,
                description="Soil stabilization and sub-base hydraulic binder."
            ),
            MaterialClassItem(
                id="calcined_clay_and_slag_blended_low_emiss",
                name="Calcined clay and slag blended low-emissions binder",
                base_gwp=0.065,
                is_green=True,
                description="Low-heat foundation mass concrete binder."
            ),
            MaterialClassItem(
                id="alkali_activated_fly_ash_metakaolin_geop",
                name="Alkali-activated fly ash-metakaolin geopolymer mortar",
                base_gwp=0.076,
                is_green=True,
                description="Substructure masonry and foundation bed jointing."
            ),
            MaterialClassItem(
                id="recycled_glass_pozzolan_mortar_mix",
                name="Recycled glass pozzolan mortar mix",
                base_gwp=0.042,
                is_green=True,
                description="Moisture-resistant foundation bedding mortar."
            ),
            MaterialClassItem(
                id="recycled_glass_foam_insulating_gravel",
                name="Recycled glass foam insulating gravel",
                base_gwp=0.18,
                is_green=True,
                description="Thermal insulating load-bearing sub-slab gravel bed."
            ),
            MaterialClassItem(
                id="pumice_stone_lightweight_insulating_aggr",
                name="Pumice stone lightweight insulating aggregate",
                base_gwp=0.082,
                is_green=True,
                description="Sub-slab lightweight drainage fill and footing insulation."
            ),
            MaterialClassItem(
                id="100_recycled_glass_aggregate_for_terrazz",
                name="100% Recycled glass aggregate for terrazzo/landscaping",
                base_gwp=0.025,
                is_green=True,
                description="Subgrade pipe bedding and drainage layer."
            ),
            MaterialClassItem(
                id="coir_fiber_geotextile_matting_for_ground",
                name="Coir fiber geotextile matting for ground stabilization",
                base_gwp=-0.38,
                is_green=True,
                description="Subgrade soil reinforcement and ground stabilization."
            ),
            MaterialClassItem(
                id="natural_jute_geotextile_erosion_control_",
                name="Natural jute geotextile erosion control mat",
                base_gwp=-0.32,
                is_green=True,
                description="Foundation excavation slope & embankment stabilization."
            ),
            MaterialClassItem(
                id="bio_based_pla_geogrid_for_soil_stabiliza",
                name="Bio-based PLA geogrid for soil stabilization",
                base_gwp=0.68,
                is_green=True,
                description="High-tensile subgrade structural soil reinforcement."
            ),
            MaterialClassItem(
                id="100_recycled_polypropylene_pp_drainage_b",
                name="100% Recycled Polypropylene (PP) drainage board",
                base_gwp=0.58,
                is_green=True,
                description="Subterranean basement wall drainage dimple sheet."
            ),
            MaterialClassItem(
                id="recycled_hdpe_corrugated_drainage_pipe",
                name="Recycled HDPE corrugated drainage pipe",
                base_gwp=0.54,
                is_green=True,
                description="Foundation perimeter French drainage and groundwater collection."
            ),
            MaterialClassItem(
                id="bio_polyethylene_water_pipes_sugarcane_f",
                name="Bio-polyethylene water pipes (sugarcane feedstock)",
                base_gwp=0.82,
                is_green=True,
                description="Subgrade building water supply and utility conduits."
            ),
            MaterialClassItem(
                id="recycled_cast_iron_drain_pipe_and_fittin",
                name="Recycled cast iron drain pipe and fittings",
                base_gwp=0.62,
                is_green=True,
                description="Subgrade heavy wastewater and soil plumbing."
            ),
            MaterialClassItem(
                id="100_recycled_plastic_interlocking_paver_",
                name="100% Recycled plastic interlocking paver tile",
                base_gwp=0.48,
                is_green=True,
                description="Ground-level exterior perimeter drainage paving."
            ),
            MaterialClassItem(
                id="recycled_polyolefin_turf_protection_grid",
                name="Recycled polyolefin turf protection grid",
                base_gwp=0.49,
                is_green=True,
                description="Permeable ground reinforcement & driveway grid."
            ),
            MaterialClassItem(
                id="red_mud_geopolymer_paving_brick",
                name="Red mud geopolymer paving brick",
                base_gwp=0.035,
                is_green=True,
                description="Ground walkway and perimeter hardscaping brick."
            ),
            MaterialClassItem(
                id="alkali_activated_red_mud_fly_ash_eco_pav",
                name="Alkali-activated red mud-fly ash eco-paver",
                base_gwp=0.039,
                is_green=True,
                description="Ground-level heavy interlocking pavement."
            ),
            MaterialClassItem(
                id="100_recycled_container_glass_paving_pave",
                name="100% Recycled container glass paving pavers",
                base_gwp=0.12,
                is_green=True,
                description="Ground pathway permeable pavement."
            ),
            MaterialClassItem(
                id="recycled_tire_rubber_playground_safety_t",
                name="Recycled tire rubber playground safety tile",
                base_gwp=0.38,
                is_green=True,
                description="Ground surface impact-absorbing exterior tile."
            ),
        ]
    ),
    MaterialClassDefinition(
        class_id="superstructure",
        class_name="Superstructure & Structural Frame",
        role_in_building="Primary structural gravity support (columns, beams, slabs) and lateral wind/earthquake stability",
        lca_significance="Primary driver of structural embodied carbon, highly vulnerable to seismic and temperature fatigue",
        default_mass_ratio_kg_per_m2=500.0,
        materials=[
            MaterialClassItem(
                id="structural_steel_virgin_bof",
                name="Structural steel, virgin / BOF",
                base_gwp=2.45,
                is_green=False,
                description="Traditional blast furnace-basic oxygen furnace structural steel sections."
            ),
            MaterialClassItem(
                id="reinforced_concrete_c30_37_structural",
                name="Reinforced Concrete (C30/37 structural)",
                base_gwp=0.165,
                is_green=False,
                description="Standard reinforced concrete frame with high tensile rebar."
            ),
            MaterialClassItem(
                id="structural_steel_sections_heavy_rebar",
                name="Structural steel sections & heavy rebar",
                base_gwp=1.72,
                is_green=False,
                description="Standard hot-rolled structural steel beams and columns."
            ),
            MaterialClassItem(
                id="precast_concrete_beams_and_columns",
                name="Precast concrete beams and columns",
                base_gwp=0.235,
                is_green=False,
                description="Heavy precast concrete structural frame assemblies."
            ),
            MaterialClassItem(
                id="high_strength_structural_steel_i_beams",
                name="High-strength structural steel I-beams",
                base_gwp=2.2,
                is_green=False,
                description="Heavy structural flange I-beams for long-span construction."
            ),
            MaterialClassItem(
                id="standard_post_tensioned_concrete_slab",
                name="Standard post-tensioned concrete slab",
                base_gwp=0.19,
                is_green=False,
                description="Cast-in-place concrete floor slab with steel tendons."
            ),
            MaterialClassItem(
                id="bio_char_impregnated_structural_timber_p",
                name="Bio-char impregnated structural timber post",
                base_gwp=-0.89,
                is_green=True,
                description="Heavy structural columns with extreme biogenic carbon storage."
            ),
            MaterialClassItem(
                id="recycled_reclaimed_barn_timber_beam",
                name="Recycled reclaimed barn timber beam",
                base_gwp=-0.82,
                is_green=True,
                description="Heavy structural timber girders and post-and-beam framing."
            ),
            MaterialClassItem(
                id="hardwood_timber_beam_european_oak_sustai",
                name="Hardwood timber beam, European oak, sustainably managed",
                base_gwp=-0.72,
                is_green=True,
                description="High-capacity structural beams and architectural trusses."
            ),
            MaterialClassItem(
                id="softwood_framing_timber_kiln_dried_fsc_c",
                name="Softwood framing timber, kiln dried, FSC certified",
                base_gwp=-0.68,
                is_green=True,
                description="Primary structural framing studs and joists."
            ),
            MaterialClassItem(
                id="dowel_laminated_timber_dlt_100_wood_stru",
                name="Dowel-Laminated Timber (DLT) 100% wood structural panel",
                base_gwp=-0.67,
                is_green=True,
                description="Adhesive-free mass timber floor and roof structural slabs."
            ),
            MaterialClassItem(
                id="nail_laminated_timber_nlt_panel_without_",
                name="Nail-Laminated Timber (NLT) panel without adhesive",
                base_gwp=-0.65,
                is_green=True,
                description="Heavy mass timber structural floor and ceiling decks."
            ),
            MaterialClassItem(
                id="cross_laminated_timber_clt_fsc_certified",
                name="Cross-Laminated Timber (CLT), FSC certified softwood (incl. carbon storage)",
                base_gwp=-0.61,
                is_green=True,
                description="Structural multi-story load-bearing shear walls & floor slabs."
            ),
            MaterialClassItem(
                id="fsc_douglas_fir_structural_glulam_posts",
                name="FSC Douglas fir structural glulam posts",
                base_gwp=-0.59,
                is_green=True,
                description="High-load structural glulam columns."
            ),
            MaterialClassItem(
                id="glued_laminated_timber_glulam_fsc_certif",
                name="Glued Laminated Timber (Glulam), FSC certified (incl. carbon storage)",
                base_gwp=-0.58,
                is_green=True,
                description="Long-span structural arched beams and primary frame girders."
            ),
            MaterialClassItem(
                id="mass_plywood_panel_mpp_structural_engine",
                name="Mass Plywood Panel (MPP) structural engineered timber",
                base_gwp=-0.56,
                is_green=True,
                description="Massive structural engineered timber columns and core walls."
            ),
            MaterialClassItem(
                id="lightweight_structural_timber_hollow_cor",
                name="Lightweight structural timber hollow core slab",
                base_gwp=-0.55,
                is_green=True,
                description="Long-span pre-fabricated structural floor cassettes."
            ),
            MaterialClassItem(
                id="laminated_veneer_lumber_lvl_sustainably_",
                name="Laminated Veneer Lumber (LVL), sustainably managed pine",
                base_gwp=-0.54,
                is_green=True,
                description="High-strength structural framing headers, rim boards & beams."
            ),
            MaterialClassItem(
                id="timber_i_joist_with_osb_web_and_solid_wo",
                name="Timber I-joist with OSB web and solid wood flanges",
                base_gwp=-0.52,
                is_green=True,
                description="Lightweight high-stiffness structural floor & roof joists."
            ),
            MaterialClassItem(
                id="parallel_strand_lumber_psl_eco_certified",
                name="Parallel Strand Lumber (PSL), eco-certified spruce",
                base_gwp=-0.51,
                is_green=True,
                description="Heavy-duty structural columns and long-span beams."
            ),
            MaterialClassItem(
                id="kempas_keruing_timber_substitute_eucalyp",
                name="Kempas / Keruing timber substitute - Eucalyptus timber (FSC)",
                base_gwp=-0.49,
                is_green=True,
                description="Dense structural hardwood framing."
            ),
            MaterialClassItem(
                id="fsc_laminated_strand_lumber_lsl",
                name="FSC Laminated Strand Lumber (LSL)",
                base_gwp=-0.48,
                is_green=True,
                description="Engineered structural studs, headers, and rim boards."
            ),
            MaterialClassItem(
                id="bio_resin_laminated_veneer_lumber_panel",
                name="Bio-resin laminated veneer lumber panel",
                base_gwp=-0.46,
                is_green=True,
                description="Bio-bonded structural load-bearing timber panels."
            ),
            MaterialClassItem(
                id="sustainably_harvested_rattan_structural_",
                name="Sustainably harvested rattan structural framing element",
                base_gwp=-0.21,
                is_green=True,
                description="Rapidly renewable lightweight structural framework."
            ),
            MaterialClassItem(
                id="engineered_bamboo_timber_hybrid_structur",
                name="Engineered bamboo-timber hybrid structural joist",
                base_gwp=-0.12,
                is_green=True,
                description="High tensile-strength hybrid floor and ceiling joists."
            ),
            MaterialClassItem(
                id="bio_char_infused_concrete_slab_carbon_st",
                name="Bio-char infused concrete slab (carbon storing)",
                base_gwp=-0.025,
                is_green=True,
                description="Carbon-sequestering elevated reinforced structural floor slab."
            ),
            MaterialClassItem(
                id="cross_laminated_bamboo_timber_structural",
                name="Cross-laminated bamboo timber structural panel",
                base_gwp=0.08,
                is_green=True,
                description="Multi-layer structural bamboo wall and floor panels."
            ),
            MaterialClassItem(
                id="engineered_bamboo_structural_i_joist",
                name="Engineered bamboo structural I-joist",
                base_gwp=0.095,
                is_green=True,
                description="High strength-to-weight structural floor joists."
            ),
            MaterialClassItem(
                id="bamboo_laminated_timber_beam_glubam",
                name="Bamboo laminated timber beam (Glubam)",
                base_gwp=0.18,
                is_green=True,
                description="High tensile structural beams and portal frames."
            ),
            MaterialClassItem(
                id="low_carbon_green_steel_hydrogen_direct_r",
                name="Low-carbon green steel (Hydrogen Direct Reduced Iron - H2-DRI)",
                base_gwp=0.18,
                is_green=True,
                description="Zero-coal primary structural steel I-beams and columns."
            ),
            MaterialClassItem(
                id="100_recycled_content_structural_steel_ea",
                name="100% Recycled content structural steel (EAF process, renewable energy)",
                base_gwp=0.35,
                is_green=True,
                description="Heavy structural steel columns, girders, and trusses."
            ),
            MaterialClassItem(
                id="decarbonized_eaf_steel_structural_tube_s",
                name="Decarbonized EAF steel structural tube section",
                base_gwp=0.38,
                is_green=True,
                description="Hollow structural steel (HSS) columns and spatial trusses."
            ),
            MaterialClassItem(
                id="recycled_steel_rebar_electric_arc_furnac",
                name="Recycled steel rebar (Electric Arc Furnace, 98% recycled)",
                base_gwp=0.42,
                is_green=True,
                description="Reinforcing rebar for structural concrete columns & beams."
            ),
            MaterialClassItem(
                id="recycled_steel_rebar_with_epoxy_coating",
                name="Recycled steel rebar with epoxy coating",
                base_gwp=0.51,
                is_green=True,
                description="Corrosion-resistant structural rebar for slabs and beams."
            ),
            MaterialClassItem(
                id="recycled_steel_wire_mesh_for_concrete_re",
                name="Recycled steel wire mesh for concrete reinforcement",
                base_gwp=0.41,
                is_green=True,
                description="Welded wire reinforcement mesh for structural slabs."
            ),
            MaterialClassItem(
                id="recycled_steel_decking_sheet_for_composi",
                name="Recycled steel decking sheet for composite floors",
                base_gwp=0.48,
                is_green=True,
                description="Profiled structural steel floor decking for composite slabs."
            ),
            MaterialClassItem(
                id="green_certified_steel_cable_for_tension_",
                name="Green-certified steel cable for tension structures",
                base_gwp=0.49,
                is_green=True,
                description="Structural tensile stay cables, bracing, and suspension ties."
            ),
            MaterialClassItem(
                id="low_emission_primary_steel_biomass_reduc",
                name="Low-emission primary steel (biomass reductant blast furnace)",
                base_gwp=0.85,
                is_green=True,
                description="Heavy structural steel plate and section profiles."
            ),
            MaterialClassItem(
                id="recycled_aluminum_structural_beam_i_prof",
                name="Recycled aluminum structural beam I-profile",
                base_gwp=0.72,
                is_green=True,
                description="Lightweight high-strength architectural structural beams."
            ),
            MaterialClassItem(
                id="flax_epoxy_natural_fiber_composite_struc",
                name="Flax-epoxy natural fiber composite structural rod",
                base_gwp=0.88,
                is_green=True,
                description="Non-corrosive structural reinforcement rebar substitute."
            ),
            MaterialClassItem(
                id="bio_epoxy_carbon_fiber_composite_rod",
                name="Bio-epoxy carbon fiber composite rod",
                base_gwp=2.85,
                is_green=True,
                description="Ultra-high tensile post-tensioning tendons & structural reinforcement."
            ),
            MaterialClassItem(
                id="recycled_aggregate_concrete_c35_45_with_",
                name="Recycled aggregate concrete C35/45 with 50% GGBS",
                base_gwp=0.059,
                is_green=True,
                description="High-strength structural concrete frame (columns and slabs)."
            ),
            MaterialClassItem(
                id="low_carbon_concrete_70_ggbs_replacement_",
                name="Low-carbon concrete 70% GGBS replacement (C32/40)",
                base_gwp=0.068,
                is_green=True,
                description="Structural frame concrete with low hydration heat."
            ),
            MaterialClassItem(
                id="low_carbon_concrete_50_fly_ash_replaceme",
                name="Low-carbon concrete 50% Fly Ash replacement (C30/37)",
                base_gwp=0.082,
                is_green=True,
                description="Standard reinforced structural concrete frame."
            ),
            MaterialClassItem(
                id="alkali_activated_slag_aas_structural_con",
                name="Alkali-activated slag (AAS) structural concrete",
                base_gwp=0.058,
                is_green=True,
                description="Clinker-free structural columns and core walls."
            ),
            MaterialClassItem(
                id="seawater_sea_sand_geopolymer_structural_",
                name="Seawater & sea-sand geopolymer structural concrete",
                base_gwp=0.051,
                is_green=True,
                description="Non-potable water structural reinforced geopolymer frame."
            ),
            MaterialClassItem(
                id="carbon_injected_ready_mix_concrete_30_mp",
                name="Carbon-injected ready-mix concrete 30 MPa",
                base_gwp=0.105,
                is_green=True,
                description="Mineralized CO2 structural ready-mix concrete."
            ),
            MaterialClassItem(
                id="clay_calcined_cement_concrete_c30_37",
                name="Clay-calcined cement concrete C30/37",
                base_gwp=0.088,
                is_green=True,
                description="Low-clinker structural floor slabs and columns."
            ),
            MaterialClassItem(
                id="nanocellulose_reinforced_low_carbon_conc",
                name="Nanocellulose reinforced low-carbon concrete mix",
                base_gwp=0.098,
                is_green=True,
                description="High flexural-strength structural concrete frame."
            ),
            MaterialClassItem(
                id="ultra_low_cement_scc_self_consolidating_",
                name="Ultra-low cement SCC (Self-Consolidating Concrete)",
                base_gwp=0.089,
                is_green=True,
                description="Heavily reinforced congested column and beam cast-in-place."
            ),
            MaterialClassItem(
                id="basalt_fiber_reinforced_low_carbon_concr",
                name="Basalt fiber reinforced low-carbon concrete slab",
                base_gwp=0.112,
                is_green=True,
                description="Crack-resistant structural composite suspended floor slabs."
            ),
            MaterialClassItem(
                id="ultra_high_performance_bio_concrete_with",
                name="Ultra-high performance bio-concrete with hemp fibers",
                base_gwp=0.115,
                is_green=True,
                description="Ductile ultra-high performance structural components."
            ),
            MaterialClassItem(
                id="silica_fume_enhanced_low_binder_concrete",
                name="Silica fume enhanced low-binder concrete C50/60",
                base_gwp=0.128,
                is_green=True,
                description="High-rise high-capacity structural columns and transfer girders."
            ),
        ]
    ),
    MaterialClassDefinition(
        class_id="facade",
        class_name="Enclosure, Facade & Exterior Walls",
        role_in_building="Building envelope weatherproofing, thermal insulation barrier, acoustic dampening, solar shielding",
        lca_significance="Undergoes repeated renovation/resealing (B4-B5) every 25-30 years, exposed to extreme climate wear",
        default_mass_ratio_kg_per_m2=160.0,
        materials=[
            MaterialClassItem(
                id="standard_clay_facing_brick",
                name="Standard Clay Facing Brick",
                base_gwp=0.24,
                is_green=False,
                description="Fired clay external brickwork with Portland mortar backing."
            ),
            MaterialClassItem(
                id="double_glazed_curtain_wall_glass",
                name="Double-Glazed Curtain Wall Glass",
                base_gwp=1.4,
                is_green=False,
                description="Aluminum mullion framed double-glazed exterior facade system."
            ),
            MaterialClassItem(
                id="aluminum_composite_panel_acp_cladding",
                name="Aluminum composite panel (ACP) cladding",
                base_gwp=6.8,
                is_green=False,
                description="Extruded aluminum bonded architectural cladding panels."
            ),
            MaterialClassItem(
                id="standard_concrete_masonry_unit_cmu",
                name="Standard concrete masonry unit (CMU)",
                base_gwp=0.18,
                is_green=False,
                description="Portland-based hollow core concrete masonry blocks."
            ),
            MaterialClassItem(
                id="fired_terracotta_rainscreen_tile",
                name="Fired terracotta rainscreen tile",
                base_gwp=0.55,
                is_green=False,
                description="High-temperature kiln fired exterior rainscreen tiles."
            ),
            MaterialClassItem(
                id="extruded_aluminum_window_framing",
                name="Extruded aluminum window framing",
                base_gwp=4.5,
                is_green=False,
                description="Anodized aluminum framing for facade window openings."
            ),
            MaterialClassItem(
                id="standard_portland_cement_exterior_stucco",
                name="Standard Portland cement exterior stucco",
                base_gwp=0.32,
                is_green=False,
                description="Portland cement three-coat exterior render finish."
            ),
            MaterialClassItem(
                id="sustainably_harvested_cedar_shingles_and",
                name="Sustainably harvested cedar shingles and siding",
                base_gwp=-0.75,
                is_green=True,
                description="Weather-resistant exterior timber rainscreen and siding."
            ),
            MaterialClassItem(
                id="larch_timber_cladding_board_untreated_na",
                name="Larch timber cladding board, untreated natural durability",
                base_gwp=-0.64,
                is_green=True,
                description="Naturally rot-resistant exterior facade rainscreen."
            ),
            MaterialClassItem(
                id="hempcrete_block_density_300_kg_m3",
                name="Hempcrete block, density 300 kg/m3",
                base_gwp=-0.41,
                is_green=True,
                description="Monolithic breathable exterior envelope wall block."
            ),
            MaterialClassItem(
                id="hempcrete_wall_panel_prefabricated",
                name="Hempcrete wall panel, prefabricated",
                base_gwp=-0.38,
                is_green=True,
                description="Fast-erect thermal exterior envelope cassette panel."
            ),
            MaterialClassItem(
                id="giant_reed_arundo_donax_structural_panel",
                name="Giant reed (Arundo donax) structural panel",
                base_gwp=-0.36,
                is_green=True,
                description="Bio-composite exterior wall and cladding panel."
            ),
            MaterialClassItem(
                id="charred_wood_cladding_shou_sugi_ban_styl",
                name="Charred wood cladding (Shou Sugi Ban style) pine",
                base_gwp=-0.32,
                is_green=True,
                description="Fire and rot-resistant decorative exterior facade cladding."
            ),
            MaterialClassItem(
                id="hemp_lime_modular_structural_block_dried",
                name="Hemp-lime modular structural block, dried",
                base_gwp=-0.31,
                is_green=True,
                description="Breathable external envelope masonry block."
            ),
            MaterialClassItem(
                id="structural_insulated_panel_sip_with_osb_",
                name="Structural Insulated Panel (SIP) with OSB and bio-polyol core",
                base_gwp=-0.29,
                is_green=True,
                description="Complete high-performance exterior wall envelope panel."
            ),
            MaterialClassItem(
                id="thermally_modified_wood_cladding_thermow",
                name="Thermally modified wood cladding (ThermoWood pine)",
                base_gwp=-0.22,
                is_green=True,
                description="Dimensionally stable exterior cladding."
            ),
            MaterialClassItem(
                id="acetylated_wood_decking_accoya_radiata_p",
                name="Acetylated wood decking (Accoya Radiata Pine)",
                base_gwp=-0.18,
                is_green=True,
                description="High-durability exterior facade siding and louvers."
            ),
            MaterialClassItem(
                id="furfurylated_wood_cladding_kebony_softwo",
                name="Furfurylated wood cladding (Kebony softwood)",
                base_gwp=-0.15,
                is_green=True,
                description="Modified high-density exterior wood rainscreen."
            ),
            MaterialClassItem(
                id="papercrete_block_recycled_paper_pulp_lim",
                name="Papercrete block, recycled paper pulp & lime",
                base_gwp=-0.11,
                is_green=True,
                description="Lightweight insulating exterior infill block."
            ),
            MaterialClassItem(
                id="lime_hemp_thermal_insulation_render",
                name="Lime-hemp thermal insulation render",
                base_gwp=-0.08,
                is_green=True,
                description="Continuous exterior insulating facade render."
            ),
            MaterialClassItem(
                id="cob_building_material_clay_sand_straw_mi",
                name="Cob building material (clay, sand, straw mix)",
                base_gwp=-0.035,
                is_green=True,
                description="Traditional thermal mass exterior envelope wall."
            ),
            MaterialClassItem(
                id="adobe_earth_brick_sun_dried_with_straw_b",
                name="Adobe earth brick, sun-dried with straw binder",
                base_gwp=-0.015,
                is_green=True,
                description="Zero-kiln sun-dried exterior wall brick."
            ),
            MaterialClassItem(
                id="compressed_earth_block_ceb_unfired_natur",
                name="Compressed Earth Block (CEB), unfired natural clay",
                base_gwp=0.018,
                is_green=True,
                description="High-density unfired exterior masonry wall block."
            ),
            MaterialClassItem(
                id="rammed_earth_block_unstabilized_natural_",
                name="Rammed earth block, unstabilized natural clay",
                base_gwp=0.022,
                is_green=True,
                description="Natural clay exterior thermal mass block."
            ),
            MaterialClassItem(
                id="bio_cement_block_using_microbial_induced",
                name="Bio-cement block using microbial-induced calcite precipitation (MICP)",
                base_gwp=0.028,
                is_green=True,
                description="Bacteria-mineralized exterior bio-masonry block."
            ),
            MaterialClassItem(
                id="carbonated_steel_slag_aggregate_block",
                name="Carbonated steel slag aggregate block",
                base_gwp=0.028,
                is_green=True,
                description="CO2-cured exterior masonry building block."
            ),
            MaterialClassItem(
                id="compressed_earth_block_with_recycled_fly",
                name="Compressed Earth Block with recycled fly ash binder",
                base_gwp=0.032,
                is_green=True,
                description="Stabilized exterior masonry wall unit."
            ),
            MaterialClassItem(
                id="bio_mineralized_concrete_block_bacteria_",
                name="Bio-mineralized concrete block (bacteria-cured)",
                base_gwp=0.038,
                is_green=True,
                description="Self-healing exterior masonry wall block."
            ),
            MaterialClassItem(
                id="municipal_solid_waste_incineration_ash_b",
                name="Municipal solid waste incineration ash brick",
                base_gwp=0.038,
                is_green=True,
                description="Circular exterior facing masonry brick."
            ),
            MaterialClassItem(
                id="sugarcane_bagasse_ash_aggregate_block",
                name="Sugarcane bagasse ash aggregate block",
                base_gwp=0.042,
                is_green=True,
                description="Eco-composite exterior masonry wall block."
            ),
            MaterialClassItem(
                id="compressed_earth_block_ceb_5_lime_binder",
                name="Compressed Earth Block (CEB), 5% lime binder",
                base_gwp=0.045,
                is_green=True,
                description="Water-resistant exterior stabilized earth block."
            ),
            MaterialClassItem(
                id="geopolymer_concrete_aggregate_block_holl",
                name="Geopolymer concrete aggregate block, hollow",
                base_gwp=0.048,
                is_green=True,
                description="Hollow core exterior envelope masonry block."
            ),
            MaterialClassItem(
                id="cellular_lightweight_geopolymer_block",
                name="Cellular lightweight geopolymer block",
                base_gwp=0.052,
                is_green=True,
                description="Low-density thermal exterior infill block."
            ),
            MaterialClassItem(
                id="foundry_sand_aggregate_eco_concrete_bloc",
                name="Foundry sand aggregate eco-concrete block",
                base_gwp=0.058,
                is_green=True,
                description="Exterior concrete masonry unit (CMU)."
            ),
            MaterialClassItem(
                id="cast_earth_block_using_alkali_activated_",
                name="Cast earth block using alkali-activated binder",
                base_gwp=0.062,
                is_green=True,
                description="High-strength stabilized earth facade block."
            ),
            MaterialClassItem(
                id="carbon_sequestered_concrete_block_minera",
                name="Carbon-sequestered concrete block (mineralized CO2)",
                base_gwp=0.062,
                is_green=True,
                description="Mineralized CO2 exterior CMU block."
            ),
            MaterialClassItem(
                id="rice_husk_ash_blended_cement_block_20_rh",
                name="Rice husk ash blended cement block (20% RHA)",
                base_gwp=0.064,
                is_green=True,
                description="Lightweight exterior wall masonry block."
            ),
            MaterialClassItem(
                id="rubberized_concrete_block_crumb_tire_agg",
                name="Rubberized concrete block (crumb tire aggregate 10%)",
                base_gwp=0.067,
                is_green=True,
                description="Impact and seismic-resistant exterior block."
            ),
            MaterialClassItem(
                id="plastic_waste_aggregate_concrete_block_1",
                name="Plastic waste aggregate concrete block (15% PET replacing sand)",
                base_gwp=0.071,
                is_green=True,
                description="Recycled plastic exterior masonry block."
            ),
            MaterialClassItem(
                id="hydrated_lime_and_pozzolan_heritage_repa",
                name="Hydrated lime and pozzolan heritage repair mortar",
                base_gwp=0.085,
                is_green=True,
                description="Breathable exterior masonry pointing and repair mortar."
            ),
            MaterialClassItem(
                id="calcined_clay_masonry_unit_with_organic_",
                name="Calcined clay masonry unit with organic pore formers",
                base_gwp=0.092,
                is_green=True,
                description="Insulated exterior fired clay facing block."
            ),
            MaterialClassItem(
                id="expanded_glass_lightweight_aggregate_con",
                name="Expanded glass lightweight aggregate concrete block",
                base_gwp=0.11,
                is_green=True,
                description="High-thermal-insulation exterior facade block."
            ),
            MaterialClassItem(
                id="hydraulic_lime_plaster_render_with_hemp_",
                name="Hydraulic lime plaster render with hemp fibers",
                base_gwp=0.12,
                is_green=True,
                description="Weatherproof breathable exterior facade stucco."
            ),
            MaterialClassItem(
                id="expanded_clay_aggregate_leca_low_density",
                name="Expanded clay aggregate (LECA) low-density eco-block",
                base_gwp=0.135,
                is_green=True,
                description="Lightweight thermal insulating envelope block."
            ),
            MaterialClassItem(
                id="low_energy_fired_clay_facing_brick_bioma",
                name="Low-energy fired clay facing brick (biomass kiln fuel)",
                base_gwp=0.14,
                is_green=True,
                description="Traditional exterior aesthetic facing brick."
            ),
            MaterialClassItem(
                id="glass_fiber_reinforced_geopolymer_panel_",
                name="Glass-fiber reinforced geopolymer panel (GFRG)",
                base_gwp=0.145,
                is_green=True,
                description="Lightweight exterior architectural facade panel."
            ),
            MaterialClassItem(
                id="autoclaved_aerated_concrete_aac_with_rec",
                name="Autoclaved Aerated Concrete (AAC) with recycled fly ash",
                base_gwp=0.16,
                is_green=True,
                description="Fireproof lightweight exterior wall blocks."
            ),
            MaterialClassItem(
                id="recycled_content_ceramic_wall_tile_min_5",
                name="Recycled content ceramic wall tile (min 50% post-industrial waste)",
                base_gwp=0.28,
                is_green=True,
                description="Exterior rainscreen architectural ceramic facade tile."
            ),
            MaterialClassItem(
                id="ultra_thin_eco_porcelain_slab_tile",
                name="Ultra-thin eco-porcelain slab tile",
                base_gwp=0.35,
                is_green=True,
                description="Large-format exterior porcelain rainscreen cladding."
            ),
            MaterialClassItem(
                id="wood_plastic_composite_wpc_with_100_recy",
                name="Wood-plastic composite (WPC) with 100% recycled sawdust & HDPE",
                base_gwp=0.38,
                is_green=True,
                description="Weatherproof exterior cladding slats & louvers."
            ),
            MaterialClassItem(
                id="recycled_plastic_composite_fence_post",
                name="Recycled plastic composite fence post",
                base_gwp=0.42,
                is_green=True,
                description="Exterior perimeter screen and boundary posts."
            ),
            MaterialClassItem(
                id="wood_plastic_composite_wpc_with_70_recyc",
                name="Wood-plastic composite (WPC) with 70% recycled bio-HDPE",
                base_gwp=0.42,
                is_green=True,
                description="Bio-polymer exterior rainscreen siding."
            ),
            MaterialClassItem(
                id="recycled_steel_wire_rope_for_green_facad",
                name="Recycled steel wire rope for green facade trellis",
                base_gwp=0.46,
                is_green=True,
                description="Vertical green wall trellis & climbing plant cables."
            ),
            MaterialClassItem(
                id="bio_composite_decking_board_rice_husk_re",
                name="Bio-composite decking board (rice husk + recycled PVC)",
                base_gwp=0.51,
                is_green=True,
                description="Exterior facade rainscreen board and sun deck."
            ),
            MaterialClassItem(
                id="sintered_recycled_glass_tiles_for_claddi",
                name="Sintered recycled glass tiles for cladding",
                base_gwp=0.52,
                is_green=True,
                description="Glossy non-porous exterior architectural cladding tile."
            ),
            MaterialClassItem(
                id="silicate_emulsion_exterior_paint_low_voc",
                name="Silicate emulsion exterior paint, low VOC",
                base_gwp=0.58,
                is_green=True,
                description="Breathable mineral exterior facade paint."
            ),
            MaterialClassItem(
                id="cast_recycled_glass_structural_block",
                name="Cast recycled glass structural block",
                base_gwp=0.61,
                is_green=True,
                description="Translucent light-transmitting exterior facade block."
            ),
            MaterialClassItem(
                id="bio_epoxy_resin_matrix_with_flax_woven_c",
                name="Bio-epoxy resin matrix with flax woven composite",
                base_gwp=0.62,
                is_green=True,
                description="Bio-composite exterior architectural panel."
            ),
            MaterialClassItem(
                id="recycled_hdpe_plastic_lumber_deck_board",
                name="Recycled HDPE plastic lumber deck board",
                base_gwp=0.62,
                is_green=True,
                description="Weatherproof exterior siding & facade batten."
            ),
            MaterialClassItem(
                id="low_carbon_float_glass_powered_by_hydrog",
                name="Low-carbon float glass (powered by hydrogen/electricity)",
                base_gwp=0.62,
                is_green=True,
                description="Standard exterior window & curtain wall glazing."
            ),
            MaterialClassItem(
                id="recycled_aluminum_sheet_95_post_consumer",
                name="Recycled aluminum sheet (95% post-consumer scrap)",
                base_gwp=0.65,
                is_green=True,
                description="Formed exterior architectural cladding panels."
            ),
            MaterialClassItem(
                id="natural_mineral_silicate_masonry_paint",
                name="Natural mineral silicate masonry paint",
                base_gwp=0.65,
                is_green=True,
                description="Weather-resistant exterior masonry coating."
            ),
            MaterialClassItem(
                id="low_iron_eco_glass_solar_collector_cover",
                name="Low-iron eco-glass solar collector cover",
                base_gwp=0.71,
                is_green=True,
                description="High-transmittance building-envelope solar thermal glazing."
            ),
            MaterialClassItem(
                id="bio_based_poly_lactic_acid_pla_3d_printe",
                name="Bio-based poly lactic acid (PLA) 3D printed architectural element",
                base_gwp=0.78,
                is_green=True,
                description="Custom exterior facade shading screens & brise-soleils."
            ),
            MaterialClassItem(
                id="solar_control_low_e_double_glass_unit_wi",
                name="Solar control low-E double glass unit with 50% recycled cullet",
                base_gwp=0.78,
                is_green=True,
                description="High-efficiency thermal solar control window glazing."
            ),
            MaterialClassItem(
                id="recycled_aluminum_louvers_and_sunshades",
                name="Recycled aluminum louvers and sunshades",
                base_gwp=0.79,
                is_green=True,
                description="Exterior solar shading louvers & brise-soleil systems."
            ),
            MaterialClassItem(
                id="hydro_circal_75r_recycled_aluminum_profi",
                name="Hydro CIRCAL 75R recycled aluminum profile (min 75% post-consumer)",
                base_gwp=0.85,
                is_green=True,
                description="Curtain wall mullions, transoms & window frames."
            ),
            MaterialClassItem(
                id="ultralight_foamed_aluminum_insulation_pa",
                name="Ultralight foamed aluminum insulation panel (70% recycled)",
                base_gwp=0.92,
                is_green=True,
                description="Non-combustible exterior facade sandwich core."
            ),
            MaterialClassItem(
                id="recycled_pet_structural_foam_core_for_sa",
                name="Recycled PET structural foam core for sandwich panels",
                base_gwp=0.95,
                is_green=True,
                description="Lightweight core for insulated facade panels."
            ),
            MaterialClassItem(
                id="bio_polyurethane_joint_sealant",
                name="Bio-polyurethane joint sealant",
                base_gwp=0.95,
                is_green=True,
                description="Exterior facade panel weatherproofing joint sealant."
            ),
            MaterialClassItem(
                id="recycled_aluminum_honeycomb_composite_cl",
                name="Recycled aluminum honeycomb composite cladding panel",
                base_gwp=1.08,
                is_green=True,
                description="Ultra-flat exterior rainscreen cassette panels."
            ),
            MaterialClassItem(
                id="vacuum_insulated_glass_vig_unit_low_carb",
                name="Vacuum insulated glass (VIG) unit, low carbon glass",
                base_gwp=1.15,
                is_green=True,
                description="Ultra-high R-value slimline exterior window glazing."
            ),
            MaterialClassItem(
                id="hydro_powered_low_carbon_aluminum_window",
                name="Hydro-powered low-carbon aluminum window frame profile",
                base_gwp=1.22,
                is_green=True,
                description="Thermally broken exterior window framing."
            ),
            MaterialClassItem(
                id="recycled_stainless_steel_sheet_304_grade",
                name="Recycled stainless steel sheet 304 grade (85% scrap)",
                base_gwp=1.35,
                is_green=True,
                description="Durable architectural stainless facade cladding."
            ),
            MaterialClassItem(
                id="electro_chromic_dynamic_smart_glass_wind",
                name="Electro-chromic dynamic smart glass window panel",
                base_gwp=1.45,
                is_green=True,
                description="Dynamic solar tinting facade window glazing."
            ),
            MaterialClassItem(
                id="photovoltaic_integrated_glass_panel_bipv",
                name="Photovoltaic integrated glass panel (BIPV double glazed)",
                base_gwp=1.85,
                is_green=True,
                description="Electricity-generating building envelope facade glass."
            ),
            MaterialClassItem(
                id="low_carbon_primary_aluminum_powered_by_1",
                name="Low-carbon primary aluminum (powered by 100% hydro power)",
                base_gwp=1.85,
                is_green=True,
                description="Structural curtain wall framing members."
            ),
            MaterialClassItem(
                id="aerogel_infused_double_glazing_unit_fram",
                name="Aerogel infused double glazing unit frame",
                base_gwp=1.95,
                is_green=True,
                description="Super-insulated thermal bridge-free window frame."
            ),
            MaterialClassItem(
                id="recycled_nickel_alloy_architectural_mesh",
                name="Recycled nickel alloy architectural mesh",
                base_gwp=2.1,
                is_green=True,
                description="Exterior decorative architectural solar shading mesh."
            ),
            MaterialClassItem(
                id="recycled_titanium_sheet_for_architectura",
                name="Recycled titanium sheet for architectural facade",
                base_gwp=3.2,
                is_green=True,
                description="Extreme-durability architectural feature facade cladding."
            ),
        ]
    ),
    MaterialClassDefinition(
        class_id="roofing_insulation",
        class_name="Roofing, Insulation & Internal Partitions",
        role_in_building="Thermal resistance (R-value), passive interior climate regulation, fireproofing & room division",
        lca_significance="Shortest replacement cycle (20-25 yrs), direct impact on operational HVAC energy and end-of-life disposal",
        default_mass_ratio_kg_per_m2=60.0,
        materials=[
            MaterialClassItem(
                id="extruded_polystyrene_xps_rigid_foam",
                name="Extruded Polystyrene (XPS) Rigid Foam",
                base_gwp=2.8,
                is_green=False,
                description="Petrochemical polymer extruded foam insulation boards."
            ),
            MaterialClassItem(
                id="stone_mineral_wool_insulation",
                name="Stone / Mineral Wool Insulation",
                base_gwp=1.25,
                is_green=False,
                description="Melted rock spun into fiber batts with phenolic resin binder."
            ),
            MaterialClassItem(
                id="polyurethane_pur_pir_foam_insulation",
                name="Polyurethane (PUR/PIR) foam insulation",
                base_gwp=3.2,
                is_green=False,
                description="High-performance closed-cell synthetic polymer foam boards."
            ),
            MaterialClassItem(
                id="bituminous_roofing_felt_asphalt_membrane",
                name="Bituminous roofing felt & asphalt membrane",
                base_gwp=0.95,
                is_green=False,
                description="Petrochemical asphalt waterproof roof membrane sheet."
            ),
            MaterialClassItem(
                id="standard_gypsum_plasterboard",
                name="Standard gypsum plasterboard",
                base_gwp=0.28,
                is_green=False,
                description="Standard virgin gypsum interior partition wallboard."
            ),
            MaterialClassItem(
                id="fiberglass_batt_insulation",
                name="Fiberglass batt insulation",
                base_gwp=1.35,
                is_green=False,
                description="Spun glass fiber thermal batts with polymer binder."
            ),
            MaterialClassItem(
                id="expanded_polystyrene_eps_board",
                name="Expanded Polystyrene (EPS) board",
                base_gwp=2.4,
                is_green=False,
                description="Expanded polystyrene bead insulation."
            ),
            MaterialClassItem(
                id="fsc_chestnut_timber_shakes_for_roofing",
                name="FSC Chestnut timber shakes for roofing",
                base_gwp=-0.69,
                is_green=True,
                description="Renewable carbon-storing roof shingles and shakes."
            ),
            MaterialClassItem(
                id="straw_bale_dense_agricultural_residue",
                name="Straw bale, dense agricultural residue",
                base_gwp=-0.65,
                is_green=True,
                description="Thick high-insulation attic and wall thermal fill."
            ),
            MaterialClassItem(
                id="fsc_pine_flooring_boards_solid_wood_tong",
                name="FSC Pine flooring boards, solid wood tongue & groove",
                base_gwp=-0.63,
                is_green=True,
                description="Solid interior timber flooring."
            ),
            MaterialClassItem(
                id="bio_char_enriched_clay_render",
                name="Bio-char enriched clay render",
                base_gwp=-0.55,
                is_green=True,
                description="Moisture-buffering interior wall plaster finish."
            ),
            MaterialClassItem(
                id="compressed_straw_wall_panel_stramit",
                name="Compressed straw wall panel (Stramit)",
                base_gwp=-0.52,
                is_green=True,
                description="Non-loadbearing interior dividing wallboard."
            ),
            MaterialClassItem(
                id="wood_fiberboard_insulation_soft_density",
                name="Wood fiberboard insulation, soft density",
                base_gwp=-0.45,
                is_green=True,
                description="Flexible thermal insulation between roof rafters."
            ),
            MaterialClassItem(
                id="poplar_plywood_low_density_sustainable_p",
                name="Poplar plywood, low-density sustainable plantation",
                base_gwp=-0.45,
                is_green=True,
                description="Interior wall lining and built-in joinery."
            ),
            MaterialClassItem(
                id="reed_matting_thermal_acoustic_ceiling_pa",
                name="Reed matting thermal acoustic ceiling panel",
                base_gwp=-0.42,
                is_green=True,
                description="Natural suspended acoustic ceiling board."
            ),
            MaterialClassItem(
                id="flexible_wood_fiber_batt_insulation",
                name="Flexible wood fiber batt insulation",
                base_gwp=-0.41,
                is_green=True,
                description="Cavity friction-fit acoustic & thermal insulation batt."
            ),
            MaterialClassItem(
                id="recycled_wood_palette_particleboard_pane",
                name="Recycled wood palette particleboard panel",
                base_gwp=-0.41,
                is_green=True,
                description="Interior partition sub-panel."
            ),
            MaterialClassItem(
                id="oriented_strand_board_osb_3_bio_resin_bo",
                name="Oriented Strand Board (OSB/3), bio-resin bound (incl. storage)",
                base_gwp=-0.42,
                is_green=True,
                description="Internal partition sheathing & roof decking substrate."
            ),
            MaterialClassItem(
                id="wood_fiberboard_insulation_rigid_tongue_",
                name="Wood fiberboard insulation, rigid tongue & groove",
                base_gwp=-0.39,
                is_green=True,
                description="Continuous over-rafter roof & floor insulation board."
            ),
            MaterialClassItem(
                id="plywood_pefc_certified_european_beech",
                name="Plywood, PEFC certified European beech",
                base_gwp=-0.38,
                is_green=True,
                description="Interior decorative wall paneling & cabinetry."
            ),
            MaterialClassItem(
                id="high_density_wood_fiber_underlayment_boa",
                name="High density wood fiber underlayment board",
                base_gwp=-0.37,
                is_green=True,
                description="Acoustic floor underlayment & roof sarking."
            ),
            MaterialClassItem(
                id="fsc_certified_birch_plywood_18mm",
                name="FSC certified Birch plywood 18mm",
                base_gwp=-0.35,
                is_green=True,
                description="Interior partition joinery and underlayment."
            ),
            MaterialClassItem(
                id="cork_board_insulation_100_expanded_natur",
                name="Cork board insulation, 100% expanded natural cork",
                base_gwp=-0.35,
                is_green=True,
                description="Thermal roof insulation & acoustic wall lining."
            ),
            MaterialClassItem(
                id="sunflower_stalk_eco_insulation_board",
                name="Sunflower stalk eco-insulation board",
                base_gwp=-0.34,
                is_green=True,
                description="Rigid bio-based interior insulation board."
            ),
            MaterialClassItem(
                id="compressed_wood_particleboard_low_formal",
                name="Compressed wood particleboard, low-formaldehyde E0 grade",
                base_gwp=-0.31,
                is_green=True,
                description="Interior furniture core & room partition board."
            ),
            MaterialClassItem(
                id="coconut_coir_thermal_acoustic_board",
                name="Coconut coir thermal & acoustic board",
                base_gwp=-0.31,
                is_green=True,
                description="Acoustic soundproofing partition board."
            ),
            MaterialClassItem(
                id="sugarcane_bagasse_particleboard",
                name="Sugarcane bagasse particleboard",
                base_gwp=-0.29,
                is_green=True,
                description="Interior acoustic ceiling and dividing panel."
            ),
            MaterialClassItem(
                id="cork_flooring_tile_high_density",
                name="Cork flooring tile, high density",
                base_gwp=-0.28,
                is_green=True,
                description="Resilient acoustic natural floor tile."
            ),
            MaterialClassItem(
                id="date_palm_fiber_thermal_insulation_mat",
                name="Date palm fiber thermal insulation mat",
                base_gwp=-0.28,
                is_green=True,
                description="Natural thermal loft and ceiling insulation mat."
            ),
            MaterialClassItem(
                id="medium_density_fiberboard_mdf_bio_based_",
                name="Medium Density Fiberboard (MDF), bio-based binder",
                base_gwp=-0.28,
                is_green=True,
                description="Interior architectural mouldings & partitions."
            ),
            MaterialClassItem(
                id="corn_cob_acoustic_tile",
                name="Corn cob acoustic tile",
                base_gwp=-0.27,
                is_green=True,
                description="Sound-absorbing ceiling and wall tile."
            ),
            MaterialClassItem(
                id="kenaf_fiber_composite_board",
                name="Kenaf fiber composite board",
                base_gwp=-0.25,
                is_green=True,
                description="Interior decorative acoustic partition board."
            ),
            MaterialClassItem(
                id="compressed_cork_wood_sandwich_acoustic_f",
                name="Compressed cork-wood sandwich acoustic floor panel",
                base_gwp=-0.22,
                is_green=True,
                description="Acoustic impact-damping subfloor panel."
            ),
            MaterialClassItem(
                id="hemp_insulation_batts_100_natural_fiber",
                name="Hemp insulation batts, 100% natural fiber",
                base_gwp=-0.22,
                is_green=True,
                description="Non-itchy thermal cavity insulation batts."
            ),
            MaterialClassItem(
                id="flax_fiber_insulation_panel",
                name="Flax fiber insulation panel",
                base_gwp=-0.21,
                is_green=True,
                description="Natural fiber roof rafter & stud cavity insulation."
            ),
            MaterialClassItem(
                id="seaweed_alginate_insulation_panel",
                name="Seaweed/Alginate insulation panel",
                base_gwp=-0.21,
                is_green=True,
                description="Naturally flame-retardant roof insulation board."
            ),
            MaterialClassItem(
                id="jute_fiber_thermal_insulation_roll",
                name="Jute fiber thermal insulation roll",
                base_gwp=-0.19,
                is_green=True,
                description="Loft & stud cavity roll insulation."
            ),
            MaterialClassItem(
                id="lignin_based_binding_agent_for_boards",
                name="Lignin-based binding agent for boards",
                base_gwp=-0.18,
                is_green=True,
                description="Formaldehyde-free binder for interior boards."
            ),
            MaterialClassItem(
                id="cellulose_insulation_loose_fill_recycled",
                name="Cellulose insulation, loose-fill recycled newsprint",
                base_gwp=-0.18,
                is_green=True,
                description="Blown attic & roof cavity thermal insulation."
            ),
            MaterialClassItem(
                id="mycelium_insulation_board_grown_on_agric",
                name="Mycelium insulation board, grown on agricultural waste",
                base_gwp=-0.15,
                is_green=True,
                description="Biodegradable acoustic & thermal insulation board."
            ),
            MaterialClassItem(
                id="linoleum_flooring_100_bio_based_linseed_",
                name="Linoleum flooring, 100% bio-based (linseed oil, cork, jute)",
                base_gwp=-0.15,
                is_green=True,
                description="Durable bio-based resilient floor sheet."
            ),
            MaterialClassItem(
                id="recycled_paper_honey_comb_core_partition",
                name="Recycled paper honey-comb core partition board",
                base_gwp=-0.15,
                is_green=True,
                description="Ultra-lightweight interior room divider core."
            ),
            MaterialClassItem(
                id="mycelium_based_acoustical_ceiling_baffle",
                name="Mycelium-based acoustical ceiling baffle",
                base_gwp=-0.14,
                is_green=True,
                description="Suspended acoustic sound baffle."
            ),
            MaterialClassItem(
                id="mycelium_structural_acoustic_panel",
                name="Mycelium structural acoustic panel",
                base_gwp=-0.12,
                is_green=True,
                description="Decorative interior acoustic wall panel."
            ),
            MaterialClassItem(
                id="natural_cork_acoustic_wall_wallpaper",
                name="Natural cork acoustic wall wallpaper",
                base_gwp=-0.12,
                is_green=True,
                description="Sound-absorbing decorative cork wall covering."
            ),
            MaterialClassItem(
                id="bio_resin_hemp_fiber_corrugated_roof_she",
                name="Bio-resin hemp fiber corrugated roof sheet",
                base_gwp=-0.11,
                is_green=True,
                description="Lightweight bio-composite roofing sheet."
            ),
            MaterialClassItem(
                id="algae_based_acoustic_insulation_panel",
                name="Algae-based acoustic insulation panel",
                base_gwp=-0.095,
                is_green=True,
                description="Acoustic wall absorption board."
            ),
            MaterialClassItem(
                id="algae_based_bio_foam_insulation",
                name="Algae-based bio-foam insulation",
                base_gwp=-0.08,
                is_green=True,
                description="Bio-polyol expanding cavity insulation foam."
            ),
            MaterialClassItem(
                id="recycled_textile_waste_cotton_jeans_insu",
                name="Recycled textile waste (cotton/jeans) insulation batt",
                base_gwp=-0.05,
                is_green=True,
                description="Acoustic sound-absorbing wall insulation batt."
            ),
            MaterialClassItem(
                id="unfired_clay_indoor_building_brick",
                name="Unfired clay indoor building brick",
                base_gwp=0.024,
                is_green=True,
                description="Interior acoustic & humidity-buffering partition wall."
            ),
            MaterialClassItem(
                id="foamed_eco_concrete_800_kg_m3_density_40",
                name="Foamed eco-concrete, 800 kg/m3 density, 40% fly ash",
                base_gwp=0.078,
                is_green=True,
                description="Lightweight roof slope screed & partition block."
            ),
            MaterialClassItem(
                id="cellulose_based_eco_wallpaper_unbleached",
                name="Cellulose-based eco-wallpaper, unbleached",
                base_gwp=0.08,
                is_green=True,
                description="Breathable chemical-free interior wall covering."
            ),
            MaterialClassItem(
                id="rice_husk_ash_insulation_block",
                name="Rice husk ash insulation block",
                base_gwp=0.085,
                is_green=True,
                description="Interior thermal cavity insulation block."
            ),
            MaterialClassItem(
                id="natural_clay_plaster_finish_zero_synthet",
                name="Natural clay plaster finish, zero synthetic binders",
                base_gwp=0.085,
                is_green=True,
                description="Breathable VOC-free interior wall plaster finish."
            ),
            MaterialClassItem(
                id="wood_wool_cement_board_acoustic_thermal_",
                name="Wood wool cement board, acoustic & thermal insulation",
                base_gwp=0.085,
                is_green=True,
                description="High-durability acoustic ceiling & wall panel."
            ),
            MaterialClassItem(
                id="recycled_rubber_and_cork_acoustic_floor_",
                name="Recycled rubber and cork acoustic floor underlayment",
                base_gwp=0.11,
                is_green=True,
                description="Sound-dampening underlayment under hardwood."
            ),
            MaterialClassItem(
                id="chalk_and_clay_traditional_distemper_pai",
                name="Chalk and clay traditional distemper paint",
                base_gwp=0.11,
                is_green=True,
                description="Matte breathable interior ceiling and wall paint."
            ),
            MaterialClassItem(
                id="volcanic_pozzolan_mortar_for_tile_adhesi",
                name="Volcanic pozzolan mortar for tile adhesive",
                base_gwp=0.11,
                is_green=True,
                description="Non-toxic floor and wall tile bonding adhesive."
            ),
            MaterialClassItem(
                id="sheep_s_wool_insulation_batts_treated_wi",
                name="Sheep's wool insulation batts, treated with borate",
                base_gwp=0.12,
                is_green=True,
                description="Moisture-regulating roof and wall insulation batt."
            ),
            MaterialClassItem(
                id="sisal_fiber_reinforced_gypsum_board",
                name="Sisal fiber reinforced gypsum board",
                base_gwp=0.14,
                is_green=True,
                description="High-impact interior partition wallboard."
            ),
            MaterialClassItem(
                id="beeswax_natural_timber_polish_finish",
                name="Beeswax natural timber polish finish",
                base_gwp=0.15,
                is_green=True,
                description="Non-toxic natural wood floor & furniture sealant."
            ),
            MaterialClassItem(
                id="bamboo_plywood_panel_19mm",
                name="Bamboo plywood panel, 19mm",
                base_gwp=0.16,
                is_green=True,
                description="Interior cabinetry & wall lining panel."
            ),
            MaterialClassItem(
                id="synthetic_fgd_gypsum_plasterboard_100_re",
                name="Synthetic FGD gypsum plasterboard (100% recycled industrial gypsum)",
                base_gwp=0.18,
                is_green=True,
                description="Recycled drywall partition board."
            ),
            MaterialClassItem(
                id="fly_ash_bio_composite_acoustic_tile",
                name="Fly ash bio-composite acoustic tile",
                base_gwp=0.18,
                is_green=True,
                description="Suspended acoustic ceiling tile."
            ),
            MaterialClassItem(
                id="terrazzo_tile_with_80_recycled_glass_agg",
                name="Terrazzo tile with 80% recycled glass aggregate",
                base_gwp=0.18,
                is_green=True,
                description="Decorative polished interior floor tile."
            ),
            MaterialClassItem(
                id="bamboo_strand_woven_flooring",
                name="Bamboo strand woven flooring",
                base_gwp=0.21,
                is_green=True,
                description="High-hardness interior bamboo flooring planks."
            ),
            MaterialClassItem(
                id="magnesium_oxide_mgo_wallboard_low_embodi",
                name="Magnesium oxide (MgO) wallboard, low-embodied carbon",
                base_gwp=0.21,
                is_green=True,
                description="Fireproof & mold-resistant interior drywall board."
            ),
            MaterialClassItem(
                id="recycled_glass_micro_sphere_lightweight_",
                name="Recycled glass micro-sphere lightweight filler",
                base_gwp=0.21,
                is_green=True,
                description="Lightweight additive for interior plasters & paints."
            ),
            MaterialClassItem(
                id="plant_oil_wood_sealant_and_floor_oil",
                name="Plant-oil wood sealant and floor oil",
                base_gwp=0.22,
                is_green=True,
                description="Penetrating natural floor protection oil."
            ),
            MaterialClassItem(
                id="calcined_gypsum_plasterboard_with_100_re",
                name="Calcined gypsum plasterboard with 100% recycled paper facing",
                base_gwp=0.22,
                is_green=True,
                description="Standard drywall partition sheet."
            ),
            MaterialClassItem(
                id="natural_casein_milk_protein_paint",
                name="Natural casein milk protein paint",
                base_gwp=0.24,
                is_green=True,
                description="Zero-VOC historic interior wall paint."
            ),
            MaterialClassItem(
                id="bamboo_fiber_composite_acoustic_panel",
                name="Bamboo fiber composite acoustic panel",
                base_gwp=0.24,
                is_green=True,
                description="High-frequency sound absorbing wall panel."
            ),
            MaterialClassItem(
                id="natural_linseed_oil_wood_finish_stain",
                name="Natural linseed oil wood finish / stain",
                base_gwp=0.28,
                is_green=True,
                description="Deep-penetrating interior wood stain."
            ),
            MaterialClassItem(
                id="magnesium_oxychloride_cement_board_green",
                name="Magnesium oxychloride cement board (green board)",
                base_gwp=0.185,
                is_green=True,
                description="Moisture-resistant interior backer board."
            ),
            MaterialClassItem(
                id="geopolymer_based_thermal_insulation_tile",
                name="Geopolymer based thermal insulation tile",
                base_gwp=0.28,
                is_green=True,
                description="Fire-resistant thermal insulation ceiling tile."
            ),
            MaterialClassItem(
                id="micro_algae_bio_pigment_interior_wall_pa",
                name="Micro-algae bio-pigment interior wall paint",
                base_gwp=0.31,
                is_green=True,
                description="Sustainable interior architectural emulsion paint."
            ),
            MaterialClassItem(
                id="perlite_expanded_insulation_loose_fill_n",
                name="Perlite expanded insulation loose fill, natural",
                base_gwp=0.31,
                is_green=True,
                description="Non-combustible attic & partition loose-fill."
            ),
            MaterialClassItem(
                id="recycled_tire_rubber_acoustic_underlayme",
                name="Recycled tire rubber acoustic underlayment mat",
                base_gwp=0.32,
                is_green=True,
                description="Heavy acoustic impact isolation underlayment."
            ),
            MaterialClassItem(
                id="pine_resin_bio_polyurethane_board",
                name="Pine resin bio-polyurethane board",
                base_gwp=0.35,
                is_green=True,
                description="Bio-based rigid insulation board."
            ),
            MaterialClassItem(
                id="exfoliated_vermiculite_loose_fill_insula",
                name="Exfoliated vermiculite loose fill insulation",
                base_gwp=0.35,
                is_green=True,
                description="High-temperature chimney & loft loose-fill insulation."
            ),
            MaterialClassItem(
                id="recycled_paper_counter_top_with_bio_resi",
                name="Recycled paper counter top with bio-resin (PaperStone)",
                base_gwp=0.38,
                is_green=True,
                description="Durable interior solid surface countertop."
            ),
            MaterialClassItem(
                id="fibrillated_cellulose_reinforced_calcium",
                name="Fibrillated cellulose reinforced calcium silicate board",
                base_gwp=0.42,
                is_green=True,
                description="2-hour fire-rated internal partition board."
            ),
            MaterialClassItem(
                id="recycled_steel_studs_for_drywall_framing",
                name="Recycled steel studs for drywall framing",
                base_gwp=0.45,
                is_green=True,
                description="Non-structural interior partition framing studs."
            ),
            MaterialClassItem(
                id="sustainably_harvested_natural_latex_foam",
                name="Sustainably harvested natural latex foam mattress insulation",
                base_gwp=0.45,
                is_green=True,
                description="Hypoallergenic natural acoustic insulation."
            ),
            MaterialClassItem(
                id="foamed_cell_glass_insulation_board_100_r",
                name="Foamed cell glass insulation board (100% recycled glass cullet)",
                base_gwp=0.48,
                is_green=True,
                description="Zero-moisture flat roof & floor insulation board."
            ),
            MaterialClassItem(
                id="bio_polyethylene_foam_board_from_sugarca",
                name="Bio-polyethylene foam board from sugarcane ethanol",
                base_gwp=0.51,
                is_green=True,
                description="Closed-cell acoustic floor underlayment."
            ),
            MaterialClassItem(
                id="recycled_corrugated_galvanized_iron_shee",
                name="Recycled corrugated galvanized iron sheet",
                base_gwp=0.58,
                is_green=True,
                description="Corrugated metal roof covering."
            ),
            MaterialClassItem(
                id="ultra_thin_eco_glass_panel_for_interior_",
                name="Ultra-thin eco-glass panel for interior partitions",
                base_gwp=0.58,
                is_green=True,
                description="Interior office dividing glass wall partition."
            ),
            MaterialClassItem(
                id="recycled_polyolefin_cavity_wall_insulati",
                name="Recycled polyolefin cavity wall insulation bead",
                base_gwp=0.61,
                is_green=True,
                description="Injected cavity wall thermal insulation."
            ),
            MaterialClassItem(
                id="recycled_ocean_bound_plastic_ceiling_pan",
                name="Recycled ocean-bound plastic ceiling panel",
                base_gwp=0.68,
                is_green=True,
                description="Suspended acoustic ceiling grid panel."
            ),
            MaterialClassItem(
                id="plant_derived_bio_binder_mineral_wool_in",
                name="Plant-derived bio-binder mineral wool insulation batt",
                base_gwp=0.72,
                is_green=True,
                description="Formaldehyde-free mineral wool roof insulation."
            ),
            MaterialClassItem(
                id="recycled_glass_and_bio_epoxy_solid_surfa",
                name="Recycled glass and bio-epoxy solid surface countertop",
                base_gwp=0.72,
                is_green=True,
                description="Cast recycled glass interior countertop."
            ),
            MaterialClassItem(
                id="recycled_vinyl_composition_tile_vct_floo",
                name="Recycled vinyl composition tile (VCT) flooring",
                base_gwp=0.76,
                is_green=True,
                description="High-traffic commercial interior flooring tile."
            ),
            MaterialClassItem(
                id="recycled_aluminum_expanded_mesh_ceiling_",
                name="Recycled aluminum expanded mesh ceiling tile",
                base_gwp=0.76,
                is_green=True,
                description="Architectural drop ceiling expanded metal tile."
            ),
            MaterialClassItem(
                id="zero_voc_water_based_acrylic_paint",
                name="Zero-VOC water-based acrylic paint",
                base_gwp=0.82,
                is_green=True,
                description="Low-odor interior wall and ceiling paint."
            ),
            MaterialClassItem(
                id="bio_based_polylactic_acid_pla_carpet_fib",
                name="Bio-based polylactic acid (PLA) carpet fiber",
                base_gwp=0.82,
                is_green=True,
                description="Stain-resistant bio-polymer interior carpet."
            ),
            MaterialClassItem(
                id="bio_based_pvc_alternative_polyolefin_fle",
                name="Bio-based PVC alternative (Polyolefin) flexible flooring",
                base_gwp=0.82,
                is_green=True,
                description="Non-toxic resilient interior sheet flooring."
            ),
            MaterialClassItem(
                id="recycled_lead_sheet_for_flashing_95_recy",
                name="Recycled lead sheet for flashing (95% recycled)",
                base_gwp=0.82,
                is_green=True,
                description="Roof valley and chimney waterproofing flashing."
            ),
            MaterialClassItem(
                id="recycled_pet_plastic_insulation_batt_100",
                name="Recycled PET plastic insulation batt (100% recycled bottles)",
                base_gwp=0.85,
                is_green=True,
                description="Thermal roof rafter and wall insulation batt."
            ),
            MaterialClassItem(
                id="low_embodied_carbon_stone_wool_insulatio",
                name="Low-embodied carbon stone wool insulation slab",
                base_gwp=0.88,
                is_green=True,
                description="Non-combustible fire barrier roof & wall slab."
            ),
            MaterialClassItem(
                id="recycled_pet_polyester_fiber_acoustic_ba",
                name="Recycled PET polyester fiber acoustic baffle",
                base_gwp=0.88,
                is_green=True,
                description="Suspended architectural sound absorbing baffle."
            ),
            MaterialClassItem(
                id="bio_based_polyurethane_carpet_cushion_un",
                name="Bio-based polyurethane carpet cushion underlay",
                base_gwp=0.89,
                is_green=True,
                description="Soft luxury carpet cushion underlayment."
            ),
            MaterialClassItem(
                id="recycled_pet_acoustic_wall_felt_board",
                name="Recycled PET acoustic wall felt / board",
                base_gwp=0.92,
                is_green=True,
                description="Decorative interior acoustic wall felt panel."
            ),
            MaterialClassItem(
                id="recycled_pvc_waterproof_roofing_membrane",
                name="Recycled PVC waterproof roofing membrane (min 60% scrap)",
                base_gwp=0.98,
                is_green=True,
                description="Flat roof single-ply waterproof membrane."
            ),
            MaterialClassItem(
                id="recycled_zinc_standing_seam_roofing_pane",
                name="Recycled zinc standing seam roofing panel (70% recycled)",
                base_gwp=1.05,
                is_green=True,
                description="Long-life standing seam metal roof panel."
            ),
            MaterialClassItem(
                id="recycled_copper_sheet_roofing_90_recycle",
                name="Recycled copper sheet / roofing (90% recycled)",
                base_gwp=1.1,
                is_green=True,
                description="Architectural standing seam copper roof."
            ),
            MaterialClassItem(
                id="recycled_carpet_tiles_with_80_recycled_n",
                name="Recycled carpet tiles with 80% recycled nylon face & backing",
                base_gwp=1.12,
                is_green=True,
                description="Modular commercial office carpet tiles."
            ),
            MaterialClassItem(
                id="bio_based_epoxy_floor_resin_coating",
                name="Bio-based epoxy floor resin coating",
                base_gwp=1.15,
                is_green=True,
                description="Seamless high-gloss bio-epoxy floor coating."
            ),
            MaterialClassItem(
                id="soy_based_polyol_rigid_insulation_foam_b",
                name="Soy-based polyol rigid insulation foam board",
                base_gwp=1.18,
                is_green=True,
                description="Roof and cavity rigid foam insulation."
            ),
            MaterialClassItem(
                id="recycled_brass_plumbing_valve_assembly",
                name="Recycled brass plumbing valve assembly",
                base_gwp=1.18,
                is_green=True,
                description="Interior water distribution and plumbing valves."
            ),
            MaterialClassItem(
                id="recycled_brass_pipe_fittings_85_scrap_co",
                name="Recycled brass pipe fittings (85% scrap content)",
                base_gwp=1.25,
                is_green=True,
                description="Interior domestic plumbing connections."
            ),
            MaterialClassItem(
                id="bio_based_polyurethane_spray_foam_insula",
                name="Bio-based polyurethane spray foam insulation (soybean oil based)",
                base_gwp=1.25,
                is_green=True,
                description="Airtight cavity spray foam roof insulation."
            ),
            MaterialClassItem(
                id="recycled_scrap_copper_wiring_insulated_w",
                name="Recycled scrap copper wiring, insulated with bio-PVC",
                base_gwp=1.32,
                is_green=True,
                description="Interior electrical branch power wiring."
            ),
            MaterialClassItem(
                id="bio_based_pir_insulation_board_with_recy",
                name="Bio-based PIR insulation board with recycled facing",
                base_gwp=1.38,
                is_green=True,
                description="High R-value flat roof thermal insulation board."
            ),
            MaterialClassItem(
                id="recycled_bronze_door_hardware_and_fittin",
                name="Recycled bronze door hardware and fittings",
                base_gwp=1.4,
                is_green=True,
                description="Interior architectural door handles & hinges."
            ),
            MaterialClassItem(
                id="tpo_thermoplastic_polyolefin_single_ply_",
                name="TPO (Thermoplastic Polyolefin) single-ply roofing membrane",
                base_gwp=1.42,
                is_green=True,
                description="White reflective heat-shield flat roof membrane."
            ),
            MaterialClassItem(
                id="expanded_polystyrene_eps_with_50_recycle",
                name="Expanded Polystyrene (EPS) with 50% recycled content",
                base_gwp=1.45,
                is_green=True,
                description="Under-slab and ceiling polystyrene insulation."
            ),
            MaterialClassItem(
                id="extruded_polystyrene_xps_with_low_gwp_bl",
                name="Extruded Polystyrene (XPS) with low-GWP blowing agent & 30% recycled",
                base_gwp=1.65,
                is_green=True,
                description="Moisture-proof inverted flat roof insulation."
            ),
            MaterialClassItem(
                id="phase_change_material_pcm_micro_encapsul",
                name="Phase Change Material (PCM) micro-encapsulated plasterboard",
                base_gwp=1.85,
                is_green=True,
                description="Passive thermal regulating interior drywall."
            ),
            MaterialClassItem(
                id="vacuum_insulation_panel_vip_with_fumed_s",
                name="Vacuum Insulation Panel (VIP) with fumed silica core",
                base_gwp=2.1,
                is_green=True,
                description="Ultra-thin space-saving roof terrace insulation."
            ),
            MaterialClassItem(
                id="aerogel_blanket_insulation_ultra_high_th",
                name="Aerogel blanket insulation (ultra-high thermal resistance)",
                base_gwp=3.4,
                is_green=True,
                description="Ultra-insulating thermal break insulation blanket."
            ),
        ]
    ),

]


class BuildingService:
    def get_material_classes(self) -> MaterialClassesResponse:
        return MaterialClassesResponse(classes=BUILDING_CLASSES)

    def _resolve_base_gwp(self, material_name: str) -> float:
        # 1. Check curated custom classes first
        for c in BUILDING_CLASSES:
            for m in c.materials:
                if m.name.lower() == material_name.lower():
                    return m.base_gwp

        # 2. Check alternatives service
        alt_gwp = alternatives_service.get_alternative_base_gwp(material_name)
        if alt_gwp is not None:
            return alt_gwp

        # 3. Check ICE V5 dataset
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

        # Normalized climate stress factor (0.02 to 0.25)
        climate_stress = (
            (req.extreme_weather_events / 50.0) * 0.05 +
            (max(0.0, req.temperature_anomaly) / 5.0) * 0.05 +
            (max(0.0, req.sea_level_rise) / 50.0) * 0.02 +
            (max(0.0, 100.0 - req.policy_score) / 100.0) * 0.03
        )

        def get_ml_calamity_penalty(mat_name: str, base_gwp: float) -> float:
            if base_gwp <= 0:
                return abs(base_gwp) * climate_stress * 0.8
            
            pred_req = PredictionRequest(
                material_name=mat_name,
                extreme_weather_events=req.extreme_weather_events,
                temperature_anomaly=req.temperature_anomaly,
                sea_level_rise=req.sea_level_rise,
                policy_score=req.policy_score,
            )
            try:
                pred_100 = prediction_service.predict_100yr_gwp(pred_req, base_gwp)
                diff = pred_100 - base_gwp
                return max(0.005, min(diff, base_gwp * 0.40))
            except Exception as e:
                logger.warning("ML prediction fallback for %s: %s", mat_name, e)
                return max(0.005, base_gwp * climate_stress * 1.5)

        # Map the 4 user selections
        selections = [
            ("substructure", "Substructure & Foundation", req.substructure, 300.0, 0.02, 0.05),
            ("superstructure", "Superstructure & Structural Frame", req.superstructure, 500.0, 0.05, 0.06),
            ("facade", "Enclosure, Facade & Exterior Walls", req.facade, 160.0, 0.25, 0.05),
            ("roofing_insulation", "Roofing, Insulation & Internal Partitions", req.roofing_insulation, 60.0, 0.35, 0.04),
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
            mass_tonnes = sel.custom_weight_tonnes if sel.custom_weight_tonnes is not None else (gfa * default_ratio / 1000.0)
            mass_kg = mass_tonnes * 1000.0

            base_gwp = self._resolve_base_gwp(mat_name)
            calamity_penalty_per_kg = get_ml_calamity_penalty(mat_name, base_gwp)

            # LCA Stages in Tonnes CO2e
            embodied_A1A3 = (mass_kg * base_gwp) / 1000.0
            transport_A4 = (mass_kg * transport_rate_per_kg) / 1000.0
            
            construction_A5 = mass_tonnes * 0.015

            if base_gwp < 0:
                maintenance_B2B5 = mass_tonnes * 0.025 * (maint_factor / 0.10)
                demolition_C1C4 = mass_tonnes * 0.015 * (demo_factor / 0.05)
            else:
                maintenance_B2B5 = max(mass_tonnes * 0.015, embodied_A1A3 * maint_factor)
                demolition_C1C4 = max(mass_tonnes * 0.010, embodied_A1A3 * demo_factor)

            calamity_B1B7 = (mass_kg * calamity_penalty_per_kg) / 1000.0

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

        # Baseline reference building
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

        base_total_mass_t = base_sub_mass + base_super_mass + base_facade_mass + base_roof_mass
        base_transport = (base_total_mass_t * 1000.0 * transport_rate_per_kg) / 1000.0
        base_construction = base_total_mass_t * 0.015
        base_maintenance = base_embodied * 0.20
        base_calamity = base_embodied * climate_stress * 1.5
        base_demolition = base_embodied * 0.05
        baseline_100yr = (
            base_embodied + base_transport + base_construction +
            base_maintenance + base_calamity + base_demolition
        )

        carbon_savings = max(0.0, baseline_100yr - total_100yr)
        savings_pct = (carbon_savings / baseline_100yr * 100.0) if baseline_100yr > 0 else 0.0

        # Timeline trajectory
        yr0 = total_embodied_A1A3 + total_transport_A4 + total_construction_A5
        base_yr0 = base_embodied + base_transport + base_construction

        yr25_maint = total_maintenance_B2B5 * 0.25
        yr25_calam = total_calamity_B1B7 * 0.25
        yr25 = yr0 + yr25_maint + yr25_calam
        base_yr25 = base_yr0 + (base_maintenance * 0.25) + (base_calamity * 0.25)

        yr50_maint = total_maintenance_B2B5 * 0.50
        yr50_calam = total_calamity_B1B7 * 0.50
        yr50 = yr0 + yr50_maint + yr50_calam
        base_yr50 = base_yr0 + (base_maintenance * 0.50) + (base_calamity * 0.50)

        yr75_maint = total_maintenance_B2B5 * 0.75
        yr75_calam = total_calamity_B1B7 * 0.75
        yr75 = yr0 + yr75_maint + yr75_calam
        base_yr75 = base_yr0 + (base_maintenance * 0.75) + (base_calamity * 0.75)

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
