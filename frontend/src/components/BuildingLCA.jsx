import React, { useState, useEffect } from 'react';
import axios from 'axios';
import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, Legend, ReferenceLine, Cell
} from 'recharts';
import {
  Building2, Layers, ShieldCheck, AlertTriangle, TrendingDown,
  TrendingUp, Truck, Leaf, Loader2, ArrowRight, CheckCircle2,
  Scale, Info, Sparkles, Sliders, Calendar, ChevronRight, HelpCircle
} from 'lucide-react';
import MaterialSelector from './MaterialSelector';
import InteractiveBuildingDiagram from './InteractiveBuildingDiagram';
import './BuildingLCA.css';

const API = (import.meta.env.VITE_API_URL || '') + '/api/v1';

// Fallback curated classes if API request is pending or offline
const DEFAULT_CLASSES = [
  {
    "class_id": "substructure",
    "class_name": "Substructure & Foundation",
    "role_in_building": "Load transfer to bedrock/soil, moisture barrier, seismic footing foundation",
    "lca_significance": "Heavy mass (~30% building weight), critical upfront embodied carbon (A1-A3), 100-yr permanent lifespan",
    "materials": [
      {
        "id": "portland_cement_general_cem_i",
        "name": "Portland cement, general, CEM I",
        "base_gwp": 0.86,
        "is_green": false,
        "description": "Traditional virgin Portland cement standard foundation footing mix."
      },
      {
        "id": "concrete_ready_mix_general",
        "name": "Concrete (Ready mix - general)",
        "base_gwp": 0.13,
        "is_green": false,
        "description": "Standard C25/30 ready-mix concrete for foundation grade slabs."
      },
      {
        "id": "concrete_c25_30_standard_foundation_mix",
        "name": "Concrete (C25/30 standard foundation mix)",
        "base_gwp": 0.145,
        "is_green": false,
        "description": "Standard reinforced foundation concrete with standard Portland binder."
      },
      {
        "id": "precast_concrete_foundation_piles",
        "name": "Precast concrete foundation piles",
        "base_gwp": 0.18,
        "is_green": false,
        "description": "Factory-cured high-density concrete driven piles."
      },
      {
        "id": "heavy_unreinforced_footing_concrete",
        "name": "Heavy unreinforced footing concrete",
        "base_gwp": 0.125,
        "is_green": false,
        "description": "Mass gravity foundation pad without steel reinforcement."
      },
      {
        "id": "virgin_aggregate_crushed_gravel_mix",
        "name": "Virgin aggregate & crushed gravel mix",
        "base_gwp": 0.055,
        "is_green": false,
        "description": "Quarried virgin rock and crushed gravel sub-base bedding."
      },
      {
        "id": "asphaltic_foundation_moisture_seal",
        "name": "Asphaltic foundation moisture seal",
        "base_gwp": 0.45,
        "is_green": false,
        "description": "Petroleum bitumen damp-proof foundation coating."
      },
      {
        "id": "carbon_negative_olivine_mineralized_aggr",
        "name": "Carbon-negative olivine mineralized aggregate concrete",
        "base_gwp": -0.045,
        "is_green": true,
        "description": "Carbon-mineralizing permanent foundation footings."
      },
      {
        "id": "carbon_negative_synthetic_limestone_aggr",
        "name": "Carbon negative synthetic limestone aggregate concrete",
        "base_gwp": -0.015,
        "is_green": true,
        "description": "Sub-base mass concrete & grade slabs."
      },
      {
        "id": "bio_asphalt_binder_100_microalgae_tall_o",
        "name": "Bio-asphalt binder, 100% microalgae/tall oil derived",
        "base_gwp": 0.095,
        "is_green": true,
        "description": "Sub-slab moisture & subterranean damp-proof barrier."
      },
      {
        "id": "bio_asphalt_waterproof_membrane_coating",
        "name": "Bio-asphalt waterproof membrane coating",
        "base_gwp": 0.18,
        "is_green": true,
        "description": "Foundation wall damp-proof tanking coating."
      },
      {
        "id": "recycled_rubber_asphalt_waterproofing_me",
        "name": "Recycled rubber asphalt waterproofing membrane",
        "base_gwp": 0.52,
        "is_green": true,
        "description": "Basement retaining wall waterproofing sheet."
      },
      {
        "id": "natural_hydraulic_lime_waterproofing_slu",
        "name": "Natural hydraulic lime waterproofing slurry",
        "base_gwp": 0.14,
        "is_green": true,
        "description": "Subgrade masonry & foundation waterproofing barrier."
      },
      {
        "id": "crumb_rubber_modified_asphalt_emulsion_s",
        "name": "Crumb rubber modified asphalt emulsion sealant",
        "base_gwp": 0.42,
        "is_green": true,
        "description": "Foundation expansion joint & crack sealant."
      },
      {
        "id": "recycled_aggregate_concrete_c25_30_100_r",
        "name": "Recycled aggregate concrete C25/30 (100% recycled coarse aggregate)",
        "base_gwp": 0.074,
        "is_green": true,
        "description": "Foundation grade slabs and mass concrete footings."
      },
      {
        "id": "recycled_brick_aggregate_concrete_c20_25",
        "name": "Recycled brick aggregate concrete C20/25",
        "base_gwp": 0.061,
        "is_green": true,
        "description": "Unreinforced ground bedding and pad footings."
      },
      {
        "id": "low_carbon_concrete_with_lc3_limestone_c",
        "name": "Low-carbon concrete with LC3 (Limestone Calcined Clay Cement)",
        "base_gwp": 0.095,
        "is_green": true,
        "description": "General foundation grade slabs and basement walls."
      },
      {
        "id": "geopolymer_concrete_100_fly_ash_ggbs_act",
        "name": "Geopolymer concrete (100% Fly Ash & GGBS activated)",
        "base_gwp": 0.052,
        "is_green": true,
        "description": "Sulfate & chloride-resistant foundation piles."
      },
      {
        "id": "volcanic_ash_pozzolan_natural_hydraulic_",
        "name": "Volcanic ash pozzolan natural hydraulic lime concrete",
        "base_gwp": 0.045,
        "is_green": true,
        "description": "Mass foundation bedding & subgrade fill."
      },
      {
        "id": "micro_algae_infused_self_healing_concret",
        "name": "Micro-algae infused self-healing concrete",
        "base_gwp": 0.088,
        "is_green": true,
        "description": "Waterproof underground basement retaining walls."
      },
      {
        "id": "dredged_sediment_aggregate_lightweight_c",
        "name": "Dredged sediment aggregate lightweight concrete",
        "base_gwp": 0.055,
        "is_green": true,
        "description": "Subgrade void filling and non-structural bedding."
      },
      {
        "id": "low_binder_roller_compacted_eco_concrete",
        "name": "Low-binder roller compacted eco-concrete (RCC)",
        "base_gwp": 0.055,
        "is_green": true,
        "description": "Heavy ground slabs and subgrade base courses."
      },
      {
        "id": "sulfur_polymer_concrete_made_with_indust",
        "name": "Sulfur-polymer concrete made with industrial byproduct sulfur",
        "base_gwp": 0.068,
        "is_green": true,
        "description": "High chemical/acid-resistant foundation concrete."
      },
      {
        "id": "pervious_eco_concrete_with_recycled_aggr",
        "name": "Pervious eco-concrete with recycled aggregate (permeable)",
        "base_gwp": 0.065,
        "is_green": true,
        "description": "Ground stormwater infiltration & perimeter drainage slabs."
      },
      {
        "id": "ceramic_waste_coarse_aggregate_concrete",
        "name": "Ceramic waste coarse aggregate concrete",
        "base_gwp": 0.064,
        "is_green": true,
        "description": "Foundation concrete mix using crushed ceramic scrap."
      },
      {
        "id": "copper_slag_blended_eco_concrete",
        "name": "Copper slag blended eco-concrete",
        "base_gwp": 0.072,
        "is_green": true,
        "description": "High-density foundation gravity footing concrete."
      },
      {
        "id": "calcined_paper_sludge_hydraulic_cement_b",
        "name": "Calcined paper sludge hydraulic cement binder",
        "base_gwp": 0.049,
        "is_green": true,
        "description": "Soil stabilization and sub-base hydraulic binder."
      },
      {
        "id": "calcined_clay_and_slag_blended_low_emiss",
        "name": "Calcined clay and slag blended low-emissions binder",
        "base_gwp": 0.065,
        "is_green": true,
        "description": "Low-heat foundation mass concrete binder."
      },
      {
        "id": "alkali_activated_fly_ash_metakaolin_geop",
        "name": "Alkali-activated fly ash-metakaolin geopolymer mortar",
        "base_gwp": 0.076,
        "is_green": true,
        "description": "Substructure masonry and foundation bed jointing."
      },
      {
        "id": "recycled_glass_pozzolan_mortar_mix",
        "name": "Recycled glass pozzolan mortar mix",
        "base_gwp": 0.042,
        "is_green": true,
        "description": "Moisture-resistant foundation bedding mortar."
      },
      {
        "id": "recycled_glass_foam_insulating_gravel",
        "name": "Recycled glass foam insulating gravel",
        "base_gwp": 0.18,
        "is_green": true,
        "description": "Thermal insulating load-bearing sub-slab gravel bed."
      },
      {
        "id": "pumice_stone_lightweight_insulating_aggr",
        "name": "Pumice stone lightweight insulating aggregate",
        "base_gwp": 0.082,
        "is_green": true,
        "description": "Sub-slab lightweight drainage fill and footing insulation."
      },
      {
        "id": "100_recycled_glass_aggregate_for_terrazz",
        "name": "100% Recycled glass aggregate for terrazzo/landscaping",
        "base_gwp": 0.025,
        "is_green": true,
        "description": "Subgrade pipe bedding and drainage layer."
      },
      {
        "id": "coir_fiber_geotextile_matting_for_ground",
        "name": "Coir fiber geotextile matting for ground stabilization",
        "base_gwp": -0.38,
        "is_green": true,
        "description": "Subgrade soil reinforcement and ground stabilization."
      },
      {
        "id": "natural_jute_geotextile_erosion_control_",
        "name": "Natural jute geotextile erosion control mat",
        "base_gwp": -0.32,
        "is_green": true,
        "description": "Foundation excavation slope & embankment stabilization."
      },
      {
        "id": "bio_based_pla_geogrid_for_soil_stabiliza",
        "name": "Bio-based PLA geogrid for soil stabilization",
        "base_gwp": 0.68,
        "is_green": true,
        "description": "High-tensile subgrade structural soil reinforcement."
      },
      {
        "id": "100_recycled_polypropylene_pp_drainage_b",
        "name": "100% Recycled Polypropylene (PP) drainage board",
        "base_gwp": 0.58,
        "is_green": true,
        "description": "Subterranean basement wall drainage dimple sheet."
      },
      {
        "id": "recycled_hdpe_corrugated_drainage_pipe",
        "name": "Recycled HDPE corrugated drainage pipe",
        "base_gwp": 0.54,
        "is_green": true,
        "description": "Foundation perimeter French drainage and groundwater collection."
      },
      {
        "id": "bio_polyethylene_water_pipes_sugarcane_f",
        "name": "Bio-polyethylene water pipes (sugarcane feedstock)",
        "base_gwp": 0.82,
        "is_green": true,
        "description": "Subgrade building water supply and utility conduits."
      },
      {
        "id": "recycled_cast_iron_drain_pipe_and_fittin",
        "name": "Recycled cast iron drain pipe and fittings",
        "base_gwp": 0.62,
        "is_green": true,
        "description": "Subgrade heavy wastewater and soil plumbing."
      },
      {
        "id": "100_recycled_plastic_interlocking_paver_",
        "name": "100% Recycled plastic interlocking paver tile",
        "base_gwp": 0.48,
        "is_green": true,
        "description": "Ground-level exterior perimeter drainage paving."
      },
      {
        "id": "recycled_polyolefin_turf_protection_grid",
        "name": "Recycled polyolefin turf protection grid",
        "base_gwp": 0.49,
        "is_green": true,
        "description": "Permeable ground reinforcement & driveway grid."
      },
      {
        "id": "red_mud_geopolymer_paving_brick",
        "name": "Red mud geopolymer paving brick",
        "base_gwp": 0.035,
        "is_green": true,
        "description": "Ground walkway and perimeter hardscaping brick."
      },
      {
        "id": "alkali_activated_red_mud_fly_ash_eco_pav",
        "name": "Alkali-activated red mud-fly ash eco-paver",
        "base_gwp": 0.039,
        "is_green": true,
        "description": "Ground-level heavy interlocking pavement."
      },
      {
        "id": "100_recycled_container_glass_paving_pave",
        "name": "100% Recycled container glass paving pavers",
        "base_gwp": 0.12,
        "is_green": true,
        "description": "Ground pathway permeable pavement."
      },
      {
        "id": "recycled_tire_rubber_playground_safety_t",
        "name": "Recycled tire rubber playground safety tile",
        "base_gwp": 0.38,
        "is_green": true,
        "description": "Ground surface impact-absorbing exterior tile."
      }
    ]
  },
  {
    "class_id": "superstructure",
    "class_name": "Superstructure & Structural Frame",
    "role_in_building": "Primary structural gravity support (columns, beams, slabs) and lateral wind/earthquake stability",
    "lca_significance": "Primary driver of structural embodied carbon, highly vulnerable to seismic and temperature fatigue",
    "materials": [
      {
        "id": "structural_steel_virgin_bof",
        "name": "Structural steel, virgin / BOF",
        "base_gwp": 2.45,
        "is_green": false,
        "description": "Traditional blast furnace-basic oxygen furnace structural steel sections."
      },
      {
        "id": "reinforced_concrete_c30_37_structural",
        "name": "Reinforced Concrete (C30/37 structural)",
        "base_gwp": 0.165,
        "is_green": false,
        "description": "Standard reinforced concrete frame with high tensile rebar."
      },
      {
        "id": "structural_steel_sections_heavy_rebar",
        "name": "Structural steel sections & heavy rebar",
        "base_gwp": 1.72,
        "is_green": false,
        "description": "Standard hot-rolled structural steel beams and columns."
      },
      {
        "id": "precast_concrete_beams_and_columns",
        "name": "Precast concrete beams and columns",
        "base_gwp": 0.235,
        "is_green": false,
        "description": "Heavy precast concrete structural frame assemblies."
      },
      {
        "id": "high_strength_structural_steel_i_beams",
        "name": "High-strength structural steel I-beams",
        "base_gwp": 2.2,
        "is_green": false,
        "description": "Heavy structural flange I-beams for long-span construction."
      },
      {
        "id": "standard_post_tensioned_concrete_slab",
        "name": "Standard post-tensioned concrete slab",
        "base_gwp": 0.19,
        "is_green": false,
        "description": "Cast-in-place concrete floor slab with steel tendons."
      },
      {
        "id": "bio_char_impregnated_structural_timber_p",
        "name": "Bio-char impregnated structural timber post",
        "base_gwp": -0.89,
        "is_green": true,
        "description": "Heavy structural columns with extreme biogenic carbon storage."
      },
      {
        "id": "recycled_reclaimed_barn_timber_beam",
        "name": "Recycled reclaimed barn timber beam",
        "base_gwp": -0.82,
        "is_green": true,
        "description": "Heavy structural timber girders and post-and-beam framing."
      },
      {
        "id": "hardwood_timber_beam_european_oak_sustai",
        "name": "Hardwood timber beam, European oak, sustainably managed",
        "base_gwp": -0.72,
        "is_green": true,
        "description": "High-capacity structural beams and architectural trusses."
      },
      {
        "id": "softwood_framing_timber_kiln_dried_fsc_c",
        "name": "Softwood framing timber, kiln dried, FSC certified",
        "base_gwp": -0.68,
        "is_green": true,
        "description": "Primary structural framing studs and joists."
      },
      {
        "id": "dowel_laminated_timber_dlt_100_wood_stru",
        "name": "Dowel-Laminated Timber (DLT) 100% wood structural panel",
        "base_gwp": -0.67,
        "is_green": true,
        "description": "Adhesive-free mass timber floor and roof structural slabs."
      },
      {
        "id": "nail_laminated_timber_nlt_panel_without_",
        "name": "Nail-Laminated Timber (NLT) panel without adhesive",
        "base_gwp": -0.65,
        "is_green": true,
        "description": "Heavy mass timber structural floor and ceiling decks."
      },
      {
        "id": "cross_laminated_timber_clt_fsc_certified",
        "name": "Cross-Laminated Timber (CLT), FSC certified softwood (incl. carbon storage)",
        "base_gwp": -0.61,
        "is_green": true,
        "description": "Structural multi-story load-bearing shear walls & floor slabs."
      },
      {
        "id": "fsc_douglas_fir_structural_glulam_posts",
        "name": "FSC Douglas fir structural glulam posts",
        "base_gwp": -0.59,
        "is_green": true,
        "description": "High-load structural glulam columns."
      },
      {
        "id": "glued_laminated_timber_glulam_fsc_certif",
        "name": "Glued Laminated Timber (Glulam), FSC certified (incl. carbon storage)",
        "base_gwp": -0.58,
        "is_green": true,
        "description": "Long-span structural arched beams and primary frame girders."
      },
      {
        "id": "mass_plywood_panel_mpp_structural_engine",
        "name": "Mass Plywood Panel (MPP) structural engineered timber",
        "base_gwp": -0.56,
        "is_green": true,
        "description": "Massive structural engineered timber columns and core walls."
      },
      {
        "id": "lightweight_structural_timber_hollow_cor",
        "name": "Lightweight structural timber hollow core slab",
        "base_gwp": -0.55,
        "is_green": true,
        "description": "Long-span pre-fabricated structural floor cassettes."
      },
      {
        "id": "laminated_veneer_lumber_lvl_sustainably_",
        "name": "Laminated Veneer Lumber (LVL), sustainably managed pine",
        "base_gwp": -0.54,
        "is_green": true,
        "description": "High-strength structural framing headers, rim boards & beams."
      },
      {
        "id": "timber_i_joist_with_osb_web_and_solid_wo",
        "name": "Timber I-joist with OSB web and solid wood flanges",
        "base_gwp": -0.52,
        "is_green": true,
        "description": "Lightweight high-stiffness structural floor & roof joists."
      },
      {
        "id": "parallel_strand_lumber_psl_eco_certified",
        "name": "Parallel Strand Lumber (PSL), eco-certified spruce",
        "base_gwp": -0.51,
        "is_green": true,
        "description": "Heavy-duty structural columns and long-span beams."
      },
      {
        "id": "kempas_keruing_timber_substitute_eucalyp",
        "name": "Kempas / Keruing timber substitute - Eucalyptus timber (FSC)",
        "base_gwp": -0.49,
        "is_green": true,
        "description": "Dense structural hardwood framing."
      },
      {
        "id": "fsc_laminated_strand_lumber_lsl",
        "name": "FSC Laminated Strand Lumber (LSL)",
        "base_gwp": -0.48,
        "is_green": true,
        "description": "Engineered structural studs, headers, and rim boards."
      },
      {
        "id": "bio_resin_laminated_veneer_lumber_panel",
        "name": "Bio-resin laminated veneer lumber panel",
        "base_gwp": -0.46,
        "is_green": true,
        "description": "Bio-bonded structural load-bearing timber panels."
      },
      {
        "id": "sustainably_harvested_rattan_structural_",
        "name": "Sustainably harvested rattan structural framing element",
        "base_gwp": -0.21,
        "is_green": true,
        "description": "Rapidly renewable lightweight structural framework."
      },
      {
        "id": "engineered_bamboo_timber_hybrid_structur",
        "name": "Engineered bamboo-timber hybrid structural joist",
        "base_gwp": -0.12,
        "is_green": true,
        "description": "High tensile-strength hybrid floor and ceiling joists."
      },
      {
        "id": "bio_char_infused_concrete_slab_carbon_st",
        "name": "Bio-char infused concrete slab (carbon storing)",
        "base_gwp": -0.025,
        "is_green": true,
        "description": "Carbon-sequestering elevated reinforced structural floor slab."
      },
      {
        "id": "cross_laminated_bamboo_timber_structural",
        "name": "Cross-laminated bamboo timber structural panel",
        "base_gwp": 0.08,
        "is_green": true,
        "description": "Multi-layer structural bamboo wall and floor panels."
      },
      {
        "id": "engineered_bamboo_structural_i_joist",
        "name": "Engineered bamboo structural I-joist",
        "base_gwp": 0.095,
        "is_green": true,
        "description": "High strength-to-weight structural floor joists."
      },
      {
        "id": "bamboo_laminated_timber_beam_glubam",
        "name": "Bamboo laminated timber beam (Glubam)",
        "base_gwp": 0.18,
        "is_green": true,
        "description": "High tensile structural beams and portal frames."
      },
      {
        "id": "low_carbon_green_steel_hydrogen_direct_r",
        "name": "Low-carbon green steel (Hydrogen Direct Reduced Iron - H2-DRI)",
        "base_gwp": 0.18,
        "is_green": true,
        "description": "Zero-coal primary structural steel I-beams and columns."
      },
      {
        "id": "100_recycled_content_structural_steel_ea",
        "name": "100% Recycled content structural steel (EAF process, renewable energy)",
        "base_gwp": 0.35,
        "is_green": true,
        "description": "Heavy structural steel columns, girders, and trusses."
      },
      {
        "id": "decarbonized_eaf_steel_structural_tube_s",
        "name": "Decarbonized EAF steel structural tube section",
        "base_gwp": 0.38,
        "is_green": true,
        "description": "Hollow structural steel (HSS) columns and spatial trusses."
      },
      {
        "id": "recycled_steel_rebar_electric_arc_furnac",
        "name": "Recycled steel rebar (Electric Arc Furnace, 98% recycled)",
        "base_gwp": 0.42,
        "is_green": true,
        "description": "Reinforcing rebar for structural concrete columns & beams."
      },
      {
        "id": "recycled_steel_rebar_with_epoxy_coating",
        "name": "Recycled steel rebar with epoxy coating",
        "base_gwp": 0.51,
        "is_green": true,
        "description": "Corrosion-resistant structural rebar for slabs and beams."
      },
      {
        "id": "recycled_steel_wire_mesh_for_concrete_re",
        "name": "Recycled steel wire mesh for concrete reinforcement",
        "base_gwp": 0.41,
        "is_green": true,
        "description": "Welded wire reinforcement mesh for structural slabs."
      },
      {
        "id": "recycled_steel_decking_sheet_for_composi",
        "name": "Recycled steel decking sheet for composite floors",
        "base_gwp": 0.48,
        "is_green": true,
        "description": "Profiled structural steel floor decking for composite slabs."
      },
      {
        "id": "green_certified_steel_cable_for_tension_",
        "name": "Green-certified steel cable for tension structures",
        "base_gwp": 0.49,
        "is_green": true,
        "description": "Structural tensile stay cables, bracing, and suspension ties."
      },
      {
        "id": "low_emission_primary_steel_biomass_reduc",
        "name": "Low-emission primary steel (biomass reductant blast furnace)",
        "base_gwp": 0.85,
        "is_green": true,
        "description": "Heavy structural steel plate and section profiles."
      },
      {
        "id": "recycled_aluminum_structural_beam_i_prof",
        "name": "Recycled aluminum structural beam I-profile",
        "base_gwp": 0.72,
        "is_green": true,
        "description": "Lightweight high-strength architectural structural beams."
      },
      {
        "id": "flax_epoxy_natural_fiber_composite_struc",
        "name": "Flax-epoxy natural fiber composite structural rod",
        "base_gwp": 0.88,
        "is_green": true,
        "description": "Non-corrosive structural reinforcement rebar substitute."
      },
      {
        "id": "bio_epoxy_carbon_fiber_composite_rod",
        "name": "Bio-epoxy carbon fiber composite rod",
        "base_gwp": 2.85,
        "is_green": true,
        "description": "Ultra-high tensile post-tensioning tendons & structural reinforcement."
      },
      {
        "id": "recycled_aggregate_concrete_c35_45_with_",
        "name": "Recycled aggregate concrete C35/45 with 50% GGBS",
        "base_gwp": 0.059,
        "is_green": true,
        "description": "High-strength structural concrete frame (columns and slabs)."
      },
      {
        "id": "low_carbon_concrete_70_ggbs_replacement_",
        "name": "Low-carbon concrete 70% GGBS replacement (C32/40)",
        "base_gwp": 0.068,
        "is_green": true,
        "description": "Structural frame concrete with low hydration heat."
      },
      {
        "id": "low_carbon_concrete_50_fly_ash_replaceme",
        "name": "Low-carbon concrete 50% Fly Ash replacement (C30/37)",
        "base_gwp": 0.082,
        "is_green": true,
        "description": "Standard reinforced structural concrete frame."
      },
      {
        "id": "alkali_activated_slag_aas_structural_con",
        "name": "Alkali-activated slag (AAS) structural concrete",
        "base_gwp": 0.058,
        "is_green": true,
        "description": "Clinker-free structural columns and core walls."
      },
      {
        "id": "seawater_sea_sand_geopolymer_structural_",
        "name": "Seawater & sea-sand geopolymer structural concrete",
        "base_gwp": 0.051,
        "is_green": true,
        "description": "Non-potable water structural reinforced geopolymer frame."
      },
      {
        "id": "carbon_injected_ready_mix_concrete_30_mp",
        "name": "Carbon-injected ready-mix concrete 30 MPa",
        "base_gwp": 0.105,
        "is_green": true,
        "description": "Mineralized CO2 structural ready-mix concrete."
      },
      {
        "id": "clay_calcined_cement_concrete_c30_37",
        "name": "Clay-calcined cement concrete C30/37",
        "base_gwp": 0.088,
        "is_green": true,
        "description": "Low-clinker structural floor slabs and columns."
      },
      {
        "id": "nanocellulose_reinforced_low_carbon_conc",
        "name": "Nanocellulose reinforced low-carbon concrete mix",
        "base_gwp": 0.098,
        "is_green": true,
        "description": "High flexural-strength structural concrete frame."
      },
      {
        "id": "ultra_low_cement_scc_self_consolidating_",
        "name": "Ultra-low cement SCC (Self-Consolidating Concrete)",
        "base_gwp": 0.089,
        "is_green": true,
        "description": "Heavily reinforced congested column and beam cast-in-place."
      },
      {
        "id": "basalt_fiber_reinforced_low_carbon_concr",
        "name": "Basalt fiber reinforced low-carbon concrete slab",
        "base_gwp": 0.112,
        "is_green": true,
        "description": "Crack-resistant structural composite suspended floor slabs."
      },
      {
        "id": "ultra_high_performance_bio_concrete_with",
        "name": "Ultra-high performance bio-concrete with hemp fibers",
        "base_gwp": 0.115,
        "is_green": true,
        "description": "Ductile ultra-high performance structural components."
      },
      {
        "id": "silica_fume_enhanced_low_binder_concrete",
        "name": "Silica fume enhanced low-binder concrete C50/60",
        "base_gwp": 0.128,
        "is_green": true,
        "description": "High-rise high-capacity structural columns and transfer girders."
      }
    ]
  },
  {
    "class_id": "facade",
    "class_name": "Enclosure, Facade & Exterior Walls",
    "role_in_building": "Building envelope weatherproofing, thermal insulation barrier, acoustic dampening, solar shielding",
    "lca_significance": "Undergoes repeated renovation/resealing (B4-B5) every 25-30 years, exposed to extreme climate wear",
    "materials": [
      {
        "id": "standard_clay_facing_brick",
        "name": "Standard Clay Facing Brick",
        "base_gwp": 0.24,
        "is_green": false,
        "description": "Fired clay external brickwork with Portland mortar backing."
      },
      {
        "id": "double_glazed_curtain_wall_glass",
        "name": "Double-Glazed Curtain Wall Glass",
        "base_gwp": 1.4,
        "is_green": false,
        "description": "Aluminum mullion framed double-glazed exterior facade system."
      },
      {
        "id": "aluminum_composite_panel_acp_cladding",
        "name": "Aluminum composite panel (ACP) cladding",
        "base_gwp": 6.8,
        "is_green": false,
        "description": "Extruded aluminum bonded architectural cladding panels."
      },
      {
        "id": "standard_concrete_masonry_unit_cmu",
        "name": "Standard concrete masonry unit (CMU)",
        "base_gwp": 0.18,
        "is_green": false,
        "description": "Portland-based hollow core concrete masonry blocks."
      },
      {
        "id": "fired_terracotta_rainscreen_tile",
        "name": "Fired terracotta rainscreen tile",
        "base_gwp": 0.55,
        "is_green": false,
        "description": "High-temperature kiln fired exterior rainscreen tiles."
      },
      {
        "id": "extruded_aluminum_window_framing",
        "name": "Extruded aluminum window framing",
        "base_gwp": 4.5,
        "is_green": false,
        "description": "Anodized aluminum framing for facade window openings."
      },
      {
        "id": "standard_portland_cement_exterior_stucco",
        "name": "Standard Portland cement exterior stucco",
        "base_gwp": 0.32,
        "is_green": false,
        "description": "Portland cement three-coat exterior render finish."
      },
      {
        "id": "sustainably_harvested_cedar_shingles_and",
        "name": "Sustainably harvested cedar shingles and siding",
        "base_gwp": -0.75,
        "is_green": true,
        "description": "Weather-resistant exterior timber rainscreen and siding."
      },
      {
        "id": "larch_timber_cladding_board_untreated_na",
        "name": "Larch timber cladding board, untreated natural durability",
        "base_gwp": -0.64,
        "is_green": true,
        "description": "Naturally rot-resistant exterior facade rainscreen."
      },
      {
        "id": "hempcrete_block_density_300_kg_m3",
        "name": "Hempcrete block, density 300 kg/m3",
        "base_gwp": -0.41,
        "is_green": true,
        "description": "Monolithic breathable exterior envelope wall block."
      },
      {
        "id": "hempcrete_wall_panel_prefabricated",
        "name": "Hempcrete wall panel, prefabricated",
        "base_gwp": -0.38,
        "is_green": true,
        "description": "Fast-erect thermal exterior envelope cassette panel."
      },
      {
        "id": "giant_reed_arundo_donax_structural_panel",
        "name": "Giant reed (Arundo donax) structural panel",
        "base_gwp": -0.36,
        "is_green": true,
        "description": "Bio-composite exterior wall and cladding panel."
      },
      {
        "id": "charred_wood_cladding_shou_sugi_ban_styl",
        "name": "Charred wood cladding (Shou Sugi Ban style) pine",
        "base_gwp": -0.32,
        "is_green": true,
        "description": "Fire and rot-resistant decorative exterior facade cladding."
      },
      {
        "id": "hemp_lime_modular_structural_block_dried",
        "name": "Hemp-lime modular structural block, dried",
        "base_gwp": -0.31,
        "is_green": true,
        "description": "Breathable external envelope masonry block."
      },
      {
        "id": "structural_insulated_panel_sip_with_osb_",
        "name": "Structural Insulated Panel (SIP) with OSB and bio-polyol core",
        "base_gwp": -0.29,
        "is_green": true,
        "description": "Complete high-performance exterior wall envelope panel."
      },
      {
        "id": "thermally_modified_wood_cladding_thermow",
        "name": "Thermally modified wood cladding (ThermoWood pine)",
        "base_gwp": -0.22,
        "is_green": true,
        "description": "Dimensionally stable exterior cladding."
      },
      {
        "id": "acetylated_wood_decking_accoya_radiata_p",
        "name": "Acetylated wood decking (Accoya Radiata Pine)",
        "base_gwp": -0.18,
        "is_green": true,
        "description": "High-durability exterior facade siding and louvers."
      },
      {
        "id": "furfurylated_wood_cladding_kebony_softwo",
        "name": "Furfurylated wood cladding (Kebony softwood)",
        "base_gwp": -0.15,
        "is_green": true,
        "description": "Modified high-density exterior wood rainscreen."
      },
      {
        "id": "papercrete_block_recycled_paper_pulp_lim",
        "name": "Papercrete block, recycled paper pulp & lime",
        "base_gwp": -0.11,
        "is_green": true,
        "description": "Lightweight insulating exterior infill block."
      },
      {
        "id": "lime_hemp_thermal_insulation_render",
        "name": "Lime-hemp thermal insulation render",
        "base_gwp": -0.08,
        "is_green": true,
        "description": "Continuous exterior insulating facade render."
      },
      {
        "id": "cob_building_material_clay_sand_straw_mi",
        "name": "Cob building material (clay, sand, straw mix)",
        "base_gwp": -0.035,
        "is_green": true,
        "description": "Traditional thermal mass exterior envelope wall."
      },
      {
        "id": "adobe_earth_brick_sun_dried_with_straw_b",
        "name": "Adobe earth brick, sun-dried with straw binder",
        "base_gwp": -0.015,
        "is_green": true,
        "description": "Zero-kiln sun-dried exterior wall brick."
      },
      {
        "id": "compressed_earth_block_ceb_unfired_natur",
        "name": "Compressed Earth Block (CEB), unfired natural clay",
        "base_gwp": 0.018,
        "is_green": true,
        "description": "High-density unfired exterior masonry wall block."
      },
      {
        "id": "rammed_earth_block_unstabilized_natural_",
        "name": "Rammed earth block, unstabilized natural clay",
        "base_gwp": 0.022,
        "is_green": true,
        "description": "Natural clay exterior thermal mass block."
      },
      {
        "id": "bio_cement_block_using_microbial_induced",
        "name": "Bio-cement block using microbial-induced calcite precipitation (MICP)",
        "base_gwp": 0.028,
        "is_green": true,
        "description": "Bacteria-mineralized exterior bio-masonry block."
      },
      {
        "id": "carbonated_steel_slag_aggregate_block",
        "name": "Carbonated steel slag aggregate block",
        "base_gwp": 0.028,
        "is_green": true,
        "description": "CO2-cured exterior masonry building block."
      },
      {
        "id": "compressed_earth_block_with_recycled_fly",
        "name": "Compressed Earth Block with recycled fly ash binder",
        "base_gwp": 0.032,
        "is_green": true,
        "description": "Stabilized exterior masonry wall unit."
      },
      {
        "id": "bio_mineralized_concrete_block_bacteria_",
        "name": "Bio-mineralized concrete block (bacteria-cured)",
        "base_gwp": 0.038,
        "is_green": true,
        "description": "Self-healing exterior masonry wall block."
      },
      {
        "id": "municipal_solid_waste_incineration_ash_b",
        "name": "Municipal solid waste incineration ash brick",
        "base_gwp": 0.038,
        "is_green": true,
        "description": "Circular exterior facing masonry brick."
      },
      {
        "id": "sugarcane_bagasse_ash_aggregate_block",
        "name": "Sugarcane bagasse ash aggregate block",
        "base_gwp": 0.042,
        "is_green": true,
        "description": "Eco-composite exterior masonry wall block."
      },
      {
        "id": "compressed_earth_block_ceb_5_lime_binder",
        "name": "Compressed Earth Block (CEB), 5% lime binder",
        "base_gwp": 0.045,
        "is_green": true,
        "description": "Water-resistant exterior stabilized earth block."
      },
      {
        "id": "geopolymer_concrete_aggregate_block_holl",
        "name": "Geopolymer concrete aggregate block, hollow",
        "base_gwp": 0.048,
        "is_green": true,
        "description": "Hollow core exterior envelope masonry block."
      },
      {
        "id": "cellular_lightweight_geopolymer_block",
        "name": "Cellular lightweight geopolymer block",
        "base_gwp": 0.052,
        "is_green": true,
        "description": "Low-density thermal exterior infill block."
      },
      {
        "id": "foundry_sand_aggregate_eco_concrete_bloc",
        "name": "Foundry sand aggregate eco-concrete block",
        "base_gwp": 0.058,
        "is_green": true,
        "description": "Exterior concrete masonry unit (CMU)."
      },
      {
        "id": "cast_earth_block_using_alkali_activated_",
        "name": "Cast earth block using alkali-activated binder",
        "base_gwp": 0.062,
        "is_green": true,
        "description": "High-strength stabilized earth facade block."
      },
      {
        "id": "carbon_sequestered_concrete_block_minera",
        "name": "Carbon-sequestered concrete block (mineralized CO2)",
        "base_gwp": 0.062,
        "is_green": true,
        "description": "Mineralized CO2 exterior CMU block."
      },
      {
        "id": "rice_husk_ash_blended_cement_block_20_rh",
        "name": "Rice husk ash blended cement block (20% RHA)",
        "base_gwp": 0.064,
        "is_green": true,
        "description": "Lightweight exterior wall masonry block."
      },
      {
        "id": "rubberized_concrete_block_crumb_tire_agg",
        "name": "Rubberized concrete block (crumb tire aggregate 10%)",
        "base_gwp": 0.067,
        "is_green": true,
        "description": "Impact and seismic-resistant exterior block."
      },
      {
        "id": "plastic_waste_aggregate_concrete_block_1",
        "name": "Plastic waste aggregate concrete block (15% PET replacing sand)",
        "base_gwp": 0.071,
        "is_green": true,
        "description": "Recycled plastic exterior masonry block."
      },
      {
        "id": "hydrated_lime_and_pozzolan_heritage_repa",
        "name": "Hydrated lime and pozzolan heritage repair mortar",
        "base_gwp": 0.085,
        "is_green": true,
        "description": "Breathable exterior masonry pointing and repair mortar."
      },
      {
        "id": "calcined_clay_masonry_unit_with_organic_",
        "name": "Calcined clay masonry unit with organic pore formers",
        "base_gwp": 0.092,
        "is_green": true,
        "description": "Insulated exterior fired clay facing block."
      },
      {
        "id": "expanded_glass_lightweight_aggregate_con",
        "name": "Expanded glass lightweight aggregate concrete block",
        "base_gwp": 0.11,
        "is_green": true,
        "description": "High-thermal-insulation exterior facade block."
      },
      {
        "id": "hydraulic_lime_plaster_render_with_hemp_",
        "name": "Hydraulic lime plaster render with hemp fibers",
        "base_gwp": 0.12,
        "is_green": true,
        "description": "Weatherproof breathable exterior facade stucco."
      },
      {
        "id": "expanded_clay_aggregate_leca_low_density",
        "name": "Expanded clay aggregate (LECA) low-density eco-block",
        "base_gwp": 0.135,
        "is_green": true,
        "description": "Lightweight thermal insulating envelope block."
      },
      {
        "id": "low_energy_fired_clay_facing_brick_bioma",
        "name": "Low-energy fired clay facing brick (biomass kiln fuel)",
        "base_gwp": 0.14,
        "is_green": true,
        "description": "Traditional exterior aesthetic facing brick."
      },
      {
        "id": "glass_fiber_reinforced_geopolymer_panel_",
        "name": "Glass-fiber reinforced geopolymer panel (GFRG)",
        "base_gwp": 0.145,
        "is_green": true,
        "description": "Lightweight exterior architectural facade panel."
      },
      {
        "id": "autoclaved_aerated_concrete_aac_with_rec",
        "name": "Autoclaved Aerated Concrete (AAC) with recycled fly ash",
        "base_gwp": 0.16,
        "is_green": true,
        "description": "Fireproof lightweight exterior wall blocks."
      },
      {
        "id": "recycled_content_ceramic_wall_tile_min_5",
        "name": "Recycled content ceramic wall tile (min 50% post-industrial waste)",
        "base_gwp": 0.28,
        "is_green": true,
        "description": "Exterior rainscreen architectural ceramic facade tile."
      },
      {
        "id": "ultra_thin_eco_porcelain_slab_tile",
        "name": "Ultra-thin eco-porcelain slab tile",
        "base_gwp": 0.35,
        "is_green": true,
        "description": "Large-format exterior porcelain rainscreen cladding."
      },
      {
        "id": "wood_plastic_composite_wpc_with_100_recy",
        "name": "Wood-plastic composite (WPC) with 100% recycled sawdust & HDPE",
        "base_gwp": 0.38,
        "is_green": true,
        "description": "Weatherproof exterior cladding slats & louvers."
      },
      {
        "id": "recycled_plastic_composite_fence_post",
        "name": "Recycled plastic composite fence post",
        "base_gwp": 0.42,
        "is_green": true,
        "description": "Exterior perimeter screen and boundary posts."
      },
      {
        "id": "wood_plastic_composite_wpc_with_70_recyc",
        "name": "Wood-plastic composite (WPC) with 70% recycled bio-HDPE",
        "base_gwp": 0.42,
        "is_green": true,
        "description": "Bio-polymer exterior rainscreen siding."
      },
      {
        "id": "recycled_steel_wire_rope_for_green_facad",
        "name": "Recycled steel wire rope for green facade trellis",
        "base_gwp": 0.46,
        "is_green": true,
        "description": "Vertical green wall trellis & climbing plant cables."
      },
      {
        "id": "bio_composite_decking_board_rice_husk_re",
        "name": "Bio-composite decking board (rice husk + recycled PVC)",
        "base_gwp": 0.51,
        "is_green": true,
        "description": "Exterior facade rainscreen board and sun deck."
      },
      {
        "id": "sintered_recycled_glass_tiles_for_claddi",
        "name": "Sintered recycled glass tiles for cladding",
        "base_gwp": 0.52,
        "is_green": true,
        "description": "Glossy non-porous exterior architectural cladding tile."
      },
      {
        "id": "silicate_emulsion_exterior_paint_low_voc",
        "name": "Silicate emulsion exterior paint, low VOC",
        "base_gwp": 0.58,
        "is_green": true,
        "description": "Breathable mineral exterior facade paint."
      },
      {
        "id": "cast_recycled_glass_structural_block",
        "name": "Cast recycled glass structural block",
        "base_gwp": 0.61,
        "is_green": true,
        "description": "Translucent light-transmitting exterior facade block."
      },
      {
        "id": "bio_epoxy_resin_matrix_with_flax_woven_c",
        "name": "Bio-epoxy resin matrix with flax woven composite",
        "base_gwp": 0.62,
        "is_green": true,
        "description": "Bio-composite exterior architectural panel."
      },
      {
        "id": "recycled_hdpe_plastic_lumber_deck_board",
        "name": "Recycled HDPE plastic lumber deck board",
        "base_gwp": 0.62,
        "is_green": true,
        "description": "Weatherproof exterior siding & facade batten."
      },
      {
        "id": "low_carbon_float_glass_powered_by_hydrog",
        "name": "Low-carbon float glass (powered by hydrogen/electricity)",
        "base_gwp": 0.62,
        "is_green": true,
        "description": "Standard exterior window & curtain wall glazing."
      },
      {
        "id": "recycled_aluminum_sheet_95_post_consumer",
        "name": "Recycled aluminum sheet (95% post-consumer scrap)",
        "base_gwp": 0.65,
        "is_green": true,
        "description": "Formed exterior architectural cladding panels."
      },
      {
        "id": "natural_mineral_silicate_masonry_paint",
        "name": "Natural mineral silicate masonry paint",
        "base_gwp": 0.65,
        "is_green": true,
        "description": "Weather-resistant exterior masonry coating."
      },
      {
        "id": "low_iron_eco_glass_solar_collector_cover",
        "name": "Low-iron eco-glass solar collector cover",
        "base_gwp": 0.71,
        "is_green": true,
        "description": "High-transmittance building-envelope solar thermal glazing."
      },
      {
        "id": "bio_based_poly_lactic_acid_pla_3d_printe",
        "name": "Bio-based poly lactic acid (PLA) 3D printed architectural element",
        "base_gwp": 0.78,
        "is_green": true,
        "description": "Custom exterior facade shading screens & brise-soleils."
      },
      {
        "id": "solar_control_low_e_double_glass_unit_wi",
        "name": "Solar control low-E double glass unit with 50% recycled cullet",
        "base_gwp": 0.78,
        "is_green": true,
        "description": "High-efficiency thermal solar control window glazing."
      },
      {
        "id": "recycled_aluminum_louvers_and_sunshades",
        "name": "Recycled aluminum louvers and sunshades",
        "base_gwp": 0.79,
        "is_green": true,
        "description": "Exterior solar shading louvers & brise-soleil systems."
      },
      {
        "id": "hydro_circal_75r_recycled_aluminum_profi",
        "name": "Hydro CIRCAL 75R recycled aluminum profile (min 75% post-consumer)",
        "base_gwp": 0.85,
        "is_green": true,
        "description": "Curtain wall mullions, transoms & window frames."
      },
      {
        "id": "ultralight_foamed_aluminum_insulation_pa",
        "name": "Ultralight foamed aluminum insulation panel (70% recycled)",
        "base_gwp": 0.92,
        "is_green": true,
        "description": "Non-combustible exterior facade sandwich core."
      },
      {
        "id": "recycled_pet_structural_foam_core_for_sa",
        "name": "Recycled PET structural foam core for sandwich panels",
        "base_gwp": 0.95,
        "is_green": true,
        "description": "Lightweight core for insulated facade panels."
      },
      {
        "id": "bio_polyurethane_joint_sealant",
        "name": "Bio-polyurethane joint sealant",
        "base_gwp": 0.95,
        "is_green": true,
        "description": "Exterior facade panel weatherproofing joint sealant."
      },
      {
        "id": "recycled_aluminum_honeycomb_composite_cl",
        "name": "Recycled aluminum honeycomb composite cladding panel",
        "base_gwp": 1.08,
        "is_green": true,
        "description": "Ultra-flat exterior rainscreen cassette panels."
      },
      {
        "id": "vacuum_insulated_glass_vig_unit_low_carb",
        "name": "Vacuum insulated glass (VIG) unit, low carbon glass",
        "base_gwp": 1.15,
        "is_green": true,
        "description": "Ultra-high R-value slimline exterior window glazing."
      },
      {
        "id": "hydro_powered_low_carbon_aluminum_window",
        "name": "Hydro-powered low-carbon aluminum window frame profile",
        "base_gwp": 1.22,
        "is_green": true,
        "description": "Thermally broken exterior window framing."
      },
      {
        "id": "recycled_stainless_steel_sheet_304_grade",
        "name": "Recycled stainless steel sheet 304 grade (85% scrap)",
        "base_gwp": 1.35,
        "is_green": true,
        "description": "Durable architectural stainless facade cladding."
      },
      {
        "id": "electro_chromic_dynamic_smart_glass_wind",
        "name": "Electro-chromic dynamic smart glass window panel",
        "base_gwp": 1.45,
        "is_green": true,
        "description": "Dynamic solar tinting facade window glazing."
      },
      {
        "id": "photovoltaic_integrated_glass_panel_bipv",
        "name": "Photovoltaic integrated glass panel (BIPV double glazed)",
        "base_gwp": 1.85,
        "is_green": true,
        "description": "Electricity-generating building envelope facade glass."
      },
      {
        "id": "low_carbon_primary_aluminum_powered_by_1",
        "name": "Low-carbon primary aluminum (powered by 100% hydro power)",
        "base_gwp": 1.85,
        "is_green": true,
        "description": "Structural curtain wall framing members."
      },
      {
        "id": "aerogel_infused_double_glazing_unit_fram",
        "name": "Aerogel infused double glazing unit frame",
        "base_gwp": 1.95,
        "is_green": true,
        "description": "Super-insulated thermal bridge-free window frame."
      },
      {
        "id": "recycled_nickel_alloy_architectural_mesh",
        "name": "Recycled nickel alloy architectural mesh",
        "base_gwp": 2.1,
        "is_green": true,
        "description": "Exterior decorative architectural solar shading mesh."
      },
      {
        "id": "recycled_titanium_sheet_for_architectura",
        "name": "Recycled titanium sheet for architectural facade",
        "base_gwp": 3.2,
        "is_green": true,
        "description": "Extreme-durability architectural feature facade cladding."
      }
    ]
  },
  {
    "class_id": "roofing_insulation",
    "class_name": "Roofing, Insulation & Internal Partitions",
    "role_in_building": "Thermal resistance (R-value), passive interior climate regulation, fireproofing & room division",
    "lca_significance": "Shortest replacement cycle (20-25 yrs), direct impact on operational HVAC energy and end-of-life disposal",
    "materials": [
      {
        "id": "extruded_polystyrene_xps_rigid_foam",
        "name": "Extruded Polystyrene (XPS) Rigid Foam",
        "base_gwp": 2.8,
        "is_green": false,
        "description": "Petrochemical polymer extruded foam insulation boards."
      },
      {
        "id": "stone_mineral_wool_insulation",
        "name": "Stone / Mineral Wool Insulation",
        "base_gwp": 1.25,
        "is_green": false,
        "description": "Melted rock spun into fiber batts with phenolic resin binder."
      },
      {
        "id": "polyurethane_pur_pir_foam_insulation",
        "name": "Polyurethane (PUR/PIR) foam insulation",
        "base_gwp": 3.2,
        "is_green": false,
        "description": "High-performance closed-cell synthetic polymer foam boards."
      },
      {
        "id": "bituminous_roofing_felt_asphalt_membrane",
        "name": "Bituminous roofing felt & asphalt membrane",
        "base_gwp": 0.95,
        "is_green": false,
        "description": "Petrochemical asphalt waterproof roof membrane sheet."
      },
      {
        "id": "standard_gypsum_plasterboard",
        "name": "Standard gypsum plasterboard",
        "base_gwp": 0.28,
        "is_green": false,
        "description": "Standard virgin gypsum interior partition wallboard."
      },
      {
        "id": "fiberglass_batt_insulation",
        "name": "Fiberglass batt insulation",
        "base_gwp": 1.35,
        "is_green": false,
        "description": "Spun glass fiber thermal batts with polymer binder."
      },
      {
        "id": "expanded_polystyrene_eps_board",
        "name": "Expanded Polystyrene (EPS) board",
        "base_gwp": 2.4,
        "is_green": false,
        "description": "Expanded polystyrene bead insulation."
      },
      {
        "id": "fsc_chestnut_timber_shakes_for_roofing",
        "name": "FSC Chestnut timber shakes for roofing",
        "base_gwp": -0.69,
        "is_green": true,
        "description": "Renewable carbon-storing roof shingles and shakes."
      },
      {
        "id": "straw_bale_dense_agricultural_residue",
        "name": "Straw bale, dense agricultural residue",
        "base_gwp": -0.65,
        "is_green": true,
        "description": "Thick high-insulation attic and wall thermal fill."
      },
      {
        "id": "fsc_pine_flooring_boards_solid_wood_tong",
        "name": "FSC Pine flooring boards, solid wood tongue & groove",
        "base_gwp": -0.63,
        "is_green": true,
        "description": "Solid interior timber flooring."
      },
      {
        "id": "bio_char_enriched_clay_render",
        "name": "Bio-char enriched clay render",
        "base_gwp": -0.55,
        "is_green": true,
        "description": "Moisture-buffering interior wall plaster finish."
      },
      {
        "id": "compressed_straw_wall_panel_stramit",
        "name": "Compressed straw wall panel (Stramit)",
        "base_gwp": -0.52,
        "is_green": true,
        "description": "Non-loadbearing interior dividing wallboard."
      },
      {
        "id": "wood_fiberboard_insulation_soft_density",
        "name": "Wood fiberboard insulation, soft density",
        "base_gwp": -0.45,
        "is_green": true,
        "description": "Flexible thermal insulation between roof rafters."
      },
      {
        "id": "poplar_plywood_low_density_sustainable_p",
        "name": "Poplar plywood, low-density sustainable plantation",
        "base_gwp": -0.45,
        "is_green": true,
        "description": "Interior wall lining and built-in joinery."
      },
      {
        "id": "reed_matting_thermal_acoustic_ceiling_pa",
        "name": "Reed matting thermal acoustic ceiling panel",
        "base_gwp": -0.42,
        "is_green": true,
        "description": "Natural suspended acoustic ceiling board."
      },
      {
        "id": "flexible_wood_fiber_batt_insulation",
        "name": "Flexible wood fiber batt insulation",
        "base_gwp": -0.41,
        "is_green": true,
        "description": "Cavity friction-fit acoustic & thermal insulation batt."
      },
      {
        "id": "recycled_wood_palette_particleboard_pane",
        "name": "Recycled wood palette particleboard panel",
        "base_gwp": -0.41,
        "is_green": true,
        "description": "Interior partition sub-panel."
      },
      {
        "id": "oriented_strand_board_osb_3_bio_resin_bo",
        "name": "Oriented Strand Board (OSB/3), bio-resin bound (incl. storage)",
        "base_gwp": -0.42,
        "is_green": true,
        "description": "Internal partition sheathing & roof decking substrate."
      },
      {
        "id": "wood_fiberboard_insulation_rigid_tongue_",
        "name": "Wood fiberboard insulation, rigid tongue & groove",
        "base_gwp": -0.39,
        "is_green": true,
        "description": "Continuous over-rafter roof & floor insulation board."
      },
      {
        "id": "plywood_pefc_certified_european_beech",
        "name": "Plywood, PEFC certified European beech",
        "base_gwp": -0.38,
        "is_green": true,
        "description": "Interior decorative wall paneling & cabinetry."
      },
      {
        "id": "high_density_wood_fiber_underlayment_boa",
        "name": "High density wood fiber underlayment board",
        "base_gwp": -0.37,
        "is_green": true,
        "description": "Acoustic floor underlayment & roof sarking."
      },
      {
        "id": "fsc_certified_birch_plywood_18mm",
        "name": "FSC certified Birch plywood 18mm",
        "base_gwp": -0.35,
        "is_green": true,
        "description": "Interior partition joinery and underlayment."
      },
      {
        "id": "cork_board_insulation_100_expanded_natur",
        "name": "Cork board insulation, 100% expanded natural cork",
        "base_gwp": -0.35,
        "is_green": true,
        "description": "Thermal roof insulation & acoustic wall lining."
      },
      {
        "id": "sunflower_stalk_eco_insulation_board",
        "name": "Sunflower stalk eco-insulation board",
        "base_gwp": -0.34,
        "is_green": true,
        "description": "Rigid bio-based interior insulation board."
      },
      {
        "id": "compressed_wood_particleboard_low_formal",
        "name": "Compressed wood particleboard, low-formaldehyde E0 grade",
        "base_gwp": -0.31,
        "is_green": true,
        "description": "Interior furniture core & room partition board."
      },
      {
        "id": "coconut_coir_thermal_acoustic_board",
        "name": "Coconut coir thermal & acoustic board",
        "base_gwp": -0.31,
        "is_green": true,
        "description": "Acoustic soundproofing partition board."
      },
      {
        "id": "sugarcane_bagasse_particleboard",
        "name": "Sugarcane bagasse particleboard",
        "base_gwp": -0.29,
        "is_green": true,
        "description": "Interior acoustic ceiling and dividing panel."
      },
      {
        "id": "cork_flooring_tile_high_density",
        "name": "Cork flooring tile, high density",
        "base_gwp": -0.28,
        "is_green": true,
        "description": "Resilient acoustic natural floor tile."
      },
      {
        "id": "date_palm_fiber_thermal_insulation_mat",
        "name": "Date palm fiber thermal insulation mat",
        "base_gwp": -0.28,
        "is_green": true,
        "description": "Natural thermal loft and ceiling insulation mat."
      },
      {
        "id": "medium_density_fiberboard_mdf_bio_based_",
        "name": "Medium Density Fiberboard (MDF), bio-based binder",
        "base_gwp": -0.28,
        "is_green": true,
        "description": "Interior architectural mouldings & partitions."
      },
      {
        "id": "corn_cob_acoustic_tile",
        "name": "Corn cob acoustic tile",
        "base_gwp": -0.27,
        "is_green": true,
        "description": "Sound-absorbing ceiling and wall tile."
      },
      {
        "id": "kenaf_fiber_composite_board",
        "name": "Kenaf fiber composite board",
        "base_gwp": -0.25,
        "is_green": true,
        "description": "Interior decorative acoustic partition board."
      },
      {
        "id": "compressed_cork_wood_sandwich_acoustic_f",
        "name": "Compressed cork-wood sandwich acoustic floor panel",
        "base_gwp": -0.22,
        "is_green": true,
        "description": "Acoustic impact-damping subfloor panel."
      },
      {
        "id": "hemp_insulation_batts_100_natural_fiber",
        "name": "Hemp insulation batts, 100% natural fiber",
        "base_gwp": -0.22,
        "is_green": true,
        "description": "Non-itchy thermal cavity insulation batts."
      },
      {
        "id": "flax_fiber_insulation_panel",
        "name": "Flax fiber insulation panel",
        "base_gwp": -0.21,
        "is_green": true,
        "description": "Natural fiber roof rafter & stud cavity insulation."
      },
      {
        "id": "seaweed_alginate_insulation_panel",
        "name": "Seaweed/Alginate insulation panel",
        "base_gwp": -0.21,
        "is_green": true,
        "description": "Naturally flame-retardant roof insulation board."
      },
      {
        "id": "jute_fiber_thermal_insulation_roll",
        "name": "Jute fiber thermal insulation roll",
        "base_gwp": -0.19,
        "is_green": true,
        "description": "Loft & stud cavity roll insulation."
      },
      {
        "id": "lignin_based_binding_agent_for_boards",
        "name": "Lignin-based binding agent for boards",
        "base_gwp": -0.18,
        "is_green": true,
        "description": "Formaldehyde-free binder for interior boards."
      },
      {
        "id": "cellulose_insulation_loose_fill_recycled",
        "name": "Cellulose insulation, loose-fill recycled newsprint",
        "base_gwp": -0.18,
        "is_green": true,
        "description": "Blown attic & roof cavity thermal insulation."
      },
      {
        "id": "mycelium_insulation_board_grown_on_agric",
        "name": "Mycelium insulation board, grown on agricultural waste",
        "base_gwp": -0.15,
        "is_green": true,
        "description": "Biodegradable acoustic & thermal insulation board."
      },
      {
        "id": "linoleum_flooring_100_bio_based_linseed_",
        "name": "Linoleum flooring, 100% bio-based (linseed oil, cork, jute)",
        "base_gwp": -0.15,
        "is_green": true,
        "description": "Durable bio-based resilient floor sheet."
      },
      {
        "id": "recycled_paper_honey_comb_core_partition",
        "name": "Recycled paper honey-comb core partition board",
        "base_gwp": -0.15,
        "is_green": true,
        "description": "Ultra-lightweight interior room divider core."
      },
      {
        "id": "mycelium_based_acoustical_ceiling_baffle",
        "name": "Mycelium-based acoustical ceiling baffle",
        "base_gwp": -0.14,
        "is_green": true,
        "description": "Suspended acoustic sound baffle."
      },
      {
        "id": "mycelium_structural_acoustic_panel",
        "name": "Mycelium structural acoustic panel",
        "base_gwp": -0.12,
        "is_green": true,
        "description": "Decorative interior acoustic wall panel."
      },
      {
        "id": "natural_cork_acoustic_wall_wallpaper",
        "name": "Natural cork acoustic wall wallpaper",
        "base_gwp": -0.12,
        "is_green": true,
        "description": "Sound-absorbing decorative cork wall covering."
      },
      {
        "id": "bio_resin_hemp_fiber_corrugated_roof_she",
        "name": "Bio-resin hemp fiber corrugated roof sheet",
        "base_gwp": -0.11,
        "is_green": true,
        "description": "Lightweight bio-composite roofing sheet."
      },
      {
        "id": "algae_based_acoustic_insulation_panel",
        "name": "Algae-based acoustic insulation panel",
        "base_gwp": -0.095,
        "is_green": true,
        "description": "Acoustic wall absorption board."
      },
      {
        "id": "algae_based_bio_foam_insulation",
        "name": "Algae-based bio-foam insulation",
        "base_gwp": -0.08,
        "is_green": true,
        "description": "Bio-polyol expanding cavity insulation foam."
      },
      {
        "id": "recycled_textile_waste_cotton_jeans_insu",
        "name": "Recycled textile waste (cotton/jeans) insulation batt",
        "base_gwp": -0.05,
        "is_green": true,
        "description": "Acoustic sound-absorbing wall insulation batt."
      },
      {
        "id": "unfired_clay_indoor_building_brick",
        "name": "Unfired clay indoor building brick",
        "base_gwp": 0.024,
        "is_green": true,
        "description": "Interior acoustic & humidity-buffering partition wall."
      },
      {
        "id": "foamed_eco_concrete_800_kg_m3_density_40",
        "name": "Foamed eco-concrete, 800 kg/m3 density, 40% fly ash",
        "base_gwp": 0.078,
        "is_green": true,
        "description": "Lightweight roof slope screed & partition block."
      },
      {
        "id": "cellulose_based_eco_wallpaper_unbleached",
        "name": "Cellulose-based eco-wallpaper, unbleached",
        "base_gwp": 0.08,
        "is_green": true,
        "description": "Breathable chemical-free interior wall covering."
      },
      {
        "id": "rice_husk_ash_insulation_block",
        "name": "Rice husk ash insulation block",
        "base_gwp": 0.085,
        "is_green": true,
        "description": "Interior thermal cavity insulation block."
      },
      {
        "id": "natural_clay_plaster_finish_zero_synthet",
        "name": "Natural clay plaster finish, zero synthetic binders",
        "base_gwp": 0.085,
        "is_green": true,
        "description": "Breathable VOC-free interior wall plaster finish."
      },
      {
        "id": "wood_wool_cement_board_acoustic_thermal_",
        "name": "Wood wool cement board, acoustic & thermal insulation",
        "base_gwp": 0.085,
        "is_green": true,
        "description": "High-durability acoustic ceiling & wall panel."
      },
      {
        "id": "recycled_rubber_and_cork_acoustic_floor_",
        "name": "Recycled rubber and cork acoustic floor underlayment",
        "base_gwp": 0.11,
        "is_green": true,
        "description": "Sound-dampening underlayment under hardwood."
      },
      {
        "id": "chalk_and_clay_traditional_distemper_pai",
        "name": "Chalk and clay traditional distemper paint",
        "base_gwp": 0.11,
        "is_green": true,
        "description": "Matte breathable interior ceiling and wall paint."
      },
      {
        "id": "volcanic_pozzolan_mortar_for_tile_adhesi",
        "name": "Volcanic pozzolan mortar for tile adhesive",
        "base_gwp": 0.11,
        "is_green": true,
        "description": "Non-toxic floor and wall tile bonding adhesive."
      },
      {
        "id": "sheep_s_wool_insulation_batts_treated_wi",
        "name": "Sheep's wool insulation batts, treated with borate",
        "base_gwp": 0.12,
        "is_green": true,
        "description": "Moisture-regulating roof and wall insulation batt."
      },
      {
        "id": "sisal_fiber_reinforced_gypsum_board",
        "name": "Sisal fiber reinforced gypsum board",
        "base_gwp": 0.14,
        "is_green": true,
        "description": "High-impact interior partition wallboard."
      },
      {
        "id": "beeswax_natural_timber_polish_finish",
        "name": "Beeswax natural timber polish finish",
        "base_gwp": 0.15,
        "is_green": true,
        "description": "Non-toxic natural wood floor & furniture sealant."
      },
      {
        "id": "bamboo_plywood_panel_19mm",
        "name": "Bamboo plywood panel, 19mm",
        "base_gwp": 0.16,
        "is_green": true,
        "description": "Interior cabinetry & wall lining panel."
      },
      {
        "id": "synthetic_fgd_gypsum_plasterboard_100_re",
        "name": "Synthetic FGD gypsum plasterboard (100% recycled industrial gypsum)",
        "base_gwp": 0.18,
        "is_green": true,
        "description": "Recycled drywall partition board."
      },
      {
        "id": "fly_ash_bio_composite_acoustic_tile",
        "name": "Fly ash bio-composite acoustic tile",
        "base_gwp": 0.18,
        "is_green": true,
        "description": "Suspended acoustic ceiling tile."
      },
      {
        "id": "terrazzo_tile_with_80_recycled_glass_agg",
        "name": "Terrazzo tile with 80% recycled glass aggregate",
        "base_gwp": 0.18,
        "is_green": true,
        "description": "Decorative polished interior floor tile."
      },
      {
        "id": "bamboo_strand_woven_flooring",
        "name": "Bamboo strand woven flooring",
        "base_gwp": 0.21,
        "is_green": true,
        "description": "High-hardness interior bamboo flooring planks."
      },
      {
        "id": "magnesium_oxide_mgo_wallboard_low_embodi",
        "name": "Magnesium oxide (MgO) wallboard, low-embodied carbon",
        "base_gwp": 0.21,
        "is_green": true,
        "description": "Fireproof & mold-resistant interior drywall board."
      },
      {
        "id": "recycled_glass_micro_sphere_lightweight_",
        "name": "Recycled glass micro-sphere lightweight filler",
        "base_gwp": 0.21,
        "is_green": true,
        "description": "Lightweight additive for interior plasters & paints."
      },
      {
        "id": "plant_oil_wood_sealant_and_floor_oil",
        "name": "Plant-oil wood sealant and floor oil",
        "base_gwp": 0.22,
        "is_green": true,
        "description": "Penetrating natural floor protection oil."
      },
      {
        "id": "calcined_gypsum_plasterboard_with_100_re",
        "name": "Calcined gypsum plasterboard with 100% recycled paper facing",
        "base_gwp": 0.22,
        "is_green": true,
        "description": "Standard drywall partition sheet."
      },
      {
        "id": "natural_casein_milk_protein_paint",
        "name": "Natural casein milk protein paint",
        "base_gwp": 0.24,
        "is_green": true,
        "description": "Zero-VOC historic interior wall paint."
      },
      {
        "id": "bamboo_fiber_composite_acoustic_panel",
        "name": "Bamboo fiber composite acoustic panel",
        "base_gwp": 0.24,
        "is_green": true,
        "description": "High-frequency sound absorbing wall panel."
      },
      {
        "id": "natural_linseed_oil_wood_finish_stain",
        "name": "Natural linseed oil wood finish / stain",
        "base_gwp": 0.28,
        "is_green": true,
        "description": "Deep-penetrating interior wood stain."
      },
      {
        "id": "magnesium_oxychloride_cement_board_green",
        "name": "Magnesium oxychloride cement board (green board)",
        "base_gwp": 0.185,
        "is_green": true,
        "description": "Moisture-resistant interior backer board."
      },
      {
        "id": "geopolymer_based_thermal_insulation_tile",
        "name": "Geopolymer based thermal insulation tile",
        "base_gwp": 0.28,
        "is_green": true,
        "description": "Fire-resistant thermal insulation ceiling tile."
      },
      {
        "id": "micro_algae_bio_pigment_interior_wall_pa",
        "name": "Micro-algae bio-pigment interior wall paint",
        "base_gwp": 0.31,
        "is_green": true,
        "description": "Sustainable interior architectural emulsion paint."
      },
      {
        "id": "perlite_expanded_insulation_loose_fill_n",
        "name": "Perlite expanded insulation loose fill, natural",
        "base_gwp": 0.31,
        "is_green": true,
        "description": "Non-combustible attic & partition loose-fill."
      },
      {
        "id": "recycled_tire_rubber_acoustic_underlayme",
        "name": "Recycled tire rubber acoustic underlayment mat",
        "base_gwp": 0.32,
        "is_green": true,
        "description": "Heavy acoustic impact isolation underlayment."
      },
      {
        "id": "pine_resin_bio_polyurethane_board",
        "name": "Pine resin bio-polyurethane board",
        "base_gwp": 0.35,
        "is_green": true,
        "description": "Bio-based rigid insulation board."
      },
      {
        "id": "exfoliated_vermiculite_loose_fill_insula",
        "name": "Exfoliated vermiculite loose fill insulation",
        "base_gwp": 0.35,
        "is_green": true,
        "description": "High-temperature chimney & loft loose-fill insulation."
      },
      {
        "id": "recycled_paper_counter_top_with_bio_resi",
        "name": "Recycled paper counter top with bio-resin (PaperStone)",
        "base_gwp": 0.38,
        "is_green": true,
        "description": "Durable interior solid surface countertop."
      },
      {
        "id": "fibrillated_cellulose_reinforced_calcium",
        "name": "Fibrillated cellulose reinforced calcium silicate board",
        "base_gwp": 0.42,
        "is_green": true,
        "description": "2-hour fire-rated internal partition board."
      },
      {
        "id": "recycled_steel_studs_for_drywall_framing",
        "name": "Recycled steel studs for drywall framing",
        "base_gwp": 0.45,
        "is_green": true,
        "description": "Non-structural interior partition framing studs."
      },
      {
        "id": "sustainably_harvested_natural_latex_foam",
        "name": "Sustainably harvested natural latex foam mattress insulation",
        "base_gwp": 0.45,
        "is_green": true,
        "description": "Hypoallergenic natural acoustic insulation."
      },
      {
        "id": "foamed_cell_glass_insulation_board_100_r",
        "name": "Foamed cell glass insulation board (100% recycled glass cullet)",
        "base_gwp": 0.48,
        "is_green": true,
        "description": "Zero-moisture flat roof & floor insulation board."
      },
      {
        "id": "bio_polyethylene_foam_board_from_sugarca",
        "name": "Bio-polyethylene foam board from sugarcane ethanol",
        "base_gwp": 0.51,
        "is_green": true,
        "description": "Closed-cell acoustic floor underlayment."
      },
      {
        "id": "recycled_corrugated_galvanized_iron_shee",
        "name": "Recycled corrugated galvanized iron sheet",
        "base_gwp": 0.58,
        "is_green": true,
        "description": "Corrugated metal roof covering."
      },
      {
        "id": "ultra_thin_eco_glass_panel_for_interior_",
        "name": "Ultra-thin eco-glass panel for interior partitions",
        "base_gwp": 0.58,
        "is_green": true,
        "description": "Interior office dividing glass wall partition."
      },
      {
        "id": "recycled_polyolefin_cavity_wall_insulati",
        "name": "Recycled polyolefin cavity wall insulation bead",
        "base_gwp": 0.61,
        "is_green": true,
        "description": "Injected cavity wall thermal insulation."
      },
      {
        "id": "recycled_ocean_bound_plastic_ceiling_pan",
        "name": "Recycled ocean-bound plastic ceiling panel",
        "base_gwp": 0.68,
        "is_green": true,
        "description": "Suspended acoustic ceiling grid panel."
      },
      {
        "id": "plant_derived_bio_binder_mineral_wool_in",
        "name": "Plant-derived bio-binder mineral wool insulation batt",
        "base_gwp": 0.72,
        "is_green": true,
        "description": "Formaldehyde-free mineral wool roof insulation."
      },
      {
        "id": "recycled_glass_and_bio_epoxy_solid_surfa",
        "name": "Recycled glass and bio-epoxy solid surface countertop",
        "base_gwp": 0.72,
        "is_green": true,
        "description": "Cast recycled glass interior countertop."
      },
      {
        "id": "recycled_vinyl_composition_tile_vct_floo",
        "name": "Recycled vinyl composition tile (VCT) flooring",
        "base_gwp": 0.76,
        "is_green": true,
        "description": "High-traffic commercial interior flooring tile."
      },
      {
        "id": "recycled_aluminum_expanded_mesh_ceiling_",
        "name": "Recycled aluminum expanded mesh ceiling tile",
        "base_gwp": 0.76,
        "is_green": true,
        "description": "Architectural drop ceiling expanded metal tile."
      },
      {
        "id": "zero_voc_water_based_acrylic_paint",
        "name": "Zero-VOC water-based acrylic paint",
        "base_gwp": 0.82,
        "is_green": true,
        "description": "Low-odor interior wall and ceiling paint."
      },
      {
        "id": "bio_based_polylactic_acid_pla_carpet_fib",
        "name": "Bio-based polylactic acid (PLA) carpet fiber",
        "base_gwp": 0.82,
        "is_green": true,
        "description": "Stain-resistant bio-polymer interior carpet."
      },
      {
        "id": "bio_based_pvc_alternative_polyolefin_fle",
        "name": "Bio-based PVC alternative (Polyolefin) flexible flooring",
        "base_gwp": 0.82,
        "is_green": true,
        "description": "Non-toxic resilient interior sheet flooring."
      },
      {
        "id": "recycled_lead_sheet_for_flashing_95_recy",
        "name": "Recycled lead sheet for flashing (95% recycled)",
        "base_gwp": 0.82,
        "is_green": true,
        "description": "Roof valley and chimney waterproofing flashing."
      },
      {
        "id": "recycled_pet_plastic_insulation_batt_100",
        "name": "Recycled PET plastic insulation batt (100% recycled bottles)",
        "base_gwp": 0.85,
        "is_green": true,
        "description": "Thermal roof rafter and wall insulation batt."
      },
      {
        "id": "low_embodied_carbon_stone_wool_insulatio",
        "name": "Low-embodied carbon stone wool insulation slab",
        "base_gwp": 0.88,
        "is_green": true,
        "description": "Non-combustible fire barrier roof & wall slab."
      },
      {
        "id": "recycled_pet_polyester_fiber_acoustic_ba",
        "name": "Recycled PET polyester fiber acoustic baffle",
        "base_gwp": 0.88,
        "is_green": true,
        "description": "Suspended architectural sound absorbing baffle."
      },
      {
        "id": "bio_based_polyurethane_carpet_cushion_un",
        "name": "Bio-based polyurethane carpet cushion underlay",
        "base_gwp": 0.89,
        "is_green": true,
        "description": "Soft luxury carpet cushion underlayment."
      },
      {
        "id": "recycled_pet_acoustic_wall_felt_board",
        "name": "Recycled PET acoustic wall felt / board",
        "base_gwp": 0.92,
        "is_green": true,
        "description": "Decorative interior acoustic wall felt panel."
      },
      {
        "id": "recycled_pvc_waterproof_roofing_membrane",
        "name": "Recycled PVC waterproof roofing membrane (min 60% scrap)",
        "base_gwp": 0.98,
        "is_green": true,
        "description": "Flat roof single-ply waterproof membrane."
      },
      {
        "id": "recycled_zinc_standing_seam_roofing_pane",
        "name": "Recycled zinc standing seam roofing panel (70% recycled)",
        "base_gwp": 1.05,
        "is_green": true,
        "description": "Long-life standing seam metal roof panel."
      },
      {
        "id": "recycled_copper_sheet_roofing_90_recycle",
        "name": "Recycled copper sheet / roofing (90% recycled)",
        "base_gwp": 1.1,
        "is_green": true,
        "description": "Architectural standing seam copper roof."
      },
      {
        "id": "recycled_carpet_tiles_with_80_recycled_n",
        "name": "Recycled carpet tiles with 80% recycled nylon face & backing",
        "base_gwp": 1.12,
        "is_green": true,
        "description": "Modular commercial office carpet tiles."
      },
      {
        "id": "bio_based_epoxy_floor_resin_coating",
        "name": "Bio-based epoxy floor resin coating",
        "base_gwp": 1.15,
        "is_green": true,
        "description": "Seamless high-gloss bio-epoxy floor coating."
      },
      {
        "id": "soy_based_polyol_rigid_insulation_foam_b",
        "name": "Soy-based polyol rigid insulation foam board",
        "base_gwp": 1.18,
        "is_green": true,
        "description": "Roof and cavity rigid foam insulation."
      },
      {
        "id": "recycled_brass_plumbing_valve_assembly",
        "name": "Recycled brass plumbing valve assembly",
        "base_gwp": 1.18,
        "is_green": true,
        "description": "Interior water distribution and plumbing valves."
      },
      {
        "id": "recycled_brass_pipe_fittings_85_scrap_co",
        "name": "Recycled brass pipe fittings (85% scrap content)",
        "base_gwp": 1.25,
        "is_green": true,
        "description": "Interior domestic plumbing connections."
      },
      {
        "id": "bio_based_polyurethane_spray_foam_insula",
        "name": "Bio-based polyurethane spray foam insulation (soybean oil based)",
        "base_gwp": 1.25,
        "is_green": true,
        "description": "Airtight cavity spray foam roof insulation."
      },
      {
        "id": "recycled_scrap_copper_wiring_insulated_w",
        "name": "Recycled scrap copper wiring, insulated with bio-PVC",
        "base_gwp": 1.32,
        "is_green": true,
        "description": "Interior electrical branch power wiring."
      },
      {
        "id": "bio_based_pir_insulation_board_with_recy",
        "name": "Bio-based PIR insulation board with recycled facing",
        "base_gwp": 1.38,
        "is_green": true,
        "description": "High R-value flat roof thermal insulation board."
      },
      {
        "id": "recycled_bronze_door_hardware_and_fittin",
        "name": "Recycled bronze door hardware and fittings",
        "base_gwp": 1.4,
        "is_green": true,
        "description": "Interior architectural door handles & hinges."
      },
      {
        "id": "tpo_thermoplastic_polyolefin_single_ply_",
        "name": "TPO (Thermoplastic Polyolefin) single-ply roofing membrane",
        "base_gwp": 1.42,
        "is_green": true,
        "description": "White reflective heat-shield flat roof membrane."
      },
      {
        "id": "expanded_polystyrene_eps_with_50_recycle",
        "name": "Expanded Polystyrene (EPS) with 50% recycled content",
        "base_gwp": 1.45,
        "is_green": true,
        "description": "Under-slab and ceiling polystyrene insulation."
      },
      {
        "id": "extruded_polystyrene_xps_with_low_gwp_bl",
        "name": "Extruded Polystyrene (XPS) with low-GWP blowing agent & 30% recycled",
        "base_gwp": 1.65,
        "is_green": true,
        "description": "Moisture-proof inverted flat roof insulation."
      },
      {
        "id": "phase_change_material_pcm_micro_encapsul",
        "name": "Phase Change Material (PCM) micro-encapsulated plasterboard",
        "base_gwp": 1.85,
        "is_green": true,
        "description": "Passive thermal regulating interior drywall."
      },
      {
        "id": "vacuum_insulation_panel_vip_with_fumed_s",
        "name": "Vacuum Insulation Panel (VIP) with fumed silica core",
        "base_gwp": 2.1,
        "is_green": true,
        "description": "Ultra-thin space-saving roof terrace insulation."
      },
      {
        "id": "aerogel_blanket_insulation_ultra_high_th",
        "name": "Aerogel blanket insulation (ultra-high thermal resistance)",
        "base_gwp": 3.4,
        "is_green": true,
        "description": "Ultra-insulating thermal break insulation blanket."
      }
    ]
  }
];

const BuildingLCA = () => {
  const [classes, setClasses] = useState(DEFAULT_CLASSES);
  const [hoveredClass, setHoveredClass] = useState(null);
  const [selectedNormalMaterials, setSelectedNormalMaterials] = useState({
    substructure: 'Concrete (Ready mix - general)',
    superstructure: 'Reinforced Concrete (C30/37 structural)',
    facade: 'Standard Clay Facing Brick',
    roofing_insulation: 'Extruded Polystyrene (XPS) Rigid Foam'
  });
  const [selectedGreenMaterials, setSelectedGreenMaterials] = useState({
    substructure: 'Low-carbon concrete with LC3',
    superstructure: 'Cross-Laminated Timber (CLT)',
    facade: 'Hempcrete block, density 300 kg/m3',
    roofing_insulation: 'Wood fiberboard insulation'
  });

  // Building Parameters
  const [gfa, setGfa] = useState(5000);
  const [buildingType, setBuildingType] = useState('Commercial Multi-Story');
  const [transitDistance, setTransitDistance] = useState(400);
  const [vehicleType, setVehicleType] = useState('Heavy Freight Truck');

  // Climate Parameters
  const [tempAnomaly, setTempAnomaly] = useState(1.2);
  const [extremeEvents, setExtremeEvents] = useState(15.0);
  const [seaLevelRise, setSeaLevelRise] = useState(12.0);
  const [policyScore, setPolicyScore] = useState(65.0);

  // Results & Calculation State
  const [loading, setLoading] = useState(false);
  const [resultNormal, setResultNormal] = useState(null);
  const [resultGreen, setResultGreen] = useState(null);
  const [error, setError] = useState(null);
  const [activeChartTab, setActiveChartTab] = useState('trajectory'); // 'trajectory' | 'stages' | 'classes'
  const [allMaterials, setAllMaterials] = useState([]);

  // Fetch classes & materials on mount
  useEffect(() => {
    const fetchClasses = async () => {
      try {
        const res = await axios.get(`${API}/building/classes`);
        if (res.data?.classes?.length) {
          setClasses(res.data.classes);
        }
      } catch (err) {
        console.warn('Using default building classes:', err);
      }
    };
    
    const fetchMaterials = async () => {
      try {
        const res = await axios.get(`${API}/materials`);
        if (res.data?.materials?.length) {
          setAllMaterials(res.data.materials);
        }
      } catch (err) {
        console.error('Failed to fetch all materials:', err);
      }
    };

    fetchClasses();
    fetchMaterials();
  }, []);

  const handleCalculate = async () => {
    setLoading(true);
    setError(null);
    try {
      const getPayload = (materials) => ({
        substructure: { material_name: materials.substructure },
        superstructure: { material_name: materials.superstructure },
        facade: { material_name: materials.facade },
        roofing_insulation: { material_name: materials.roofing_insulation },
        gross_floor_area_m2: Number(gfa),
        building_type: buildingType,
        transit_distance_km: Number(transitDistance),
        vehicle_type: vehicleType,
        temperature_anomaly: Number(tempAnomaly),
        extreme_weather_events: Number(extremeEvents),
        sea_level_rise: Number(seaLevelRise),
        policy_score: Number(policyScore),
      });

      const [resNormal, resGreen] = await Promise.all([
        axios.post(`${API}/building/calculate`, getPayload(selectedNormalMaterials)),
        axios.post(`${API}/building/calculate`, getPayload(selectedGreenMaterials))
      ]);
      setResultNormal(resNormal.data);
      setResultGreen(resGreen.data);
    } catch (err) {
      console.error('Building LCA error:', err);
      setError(err.response?.data?.detail || 'Failed to calculate whole building LCA. Check connection.');
    } finally {
      setLoading(false);
    }
  };

  // Run initial calculation once mounted and whenever materials change
  useEffect(() => {
    handleCalculate();
  }, [selectedNormalMaterials, selectedGreenMaterials, gfa, transitDistance, vehicleType, tempAnomaly, extremeEvents, seaLevelRise, policyScore]);

  return (
    <div className="wblca-container">
      {/* ── Subheader / Banner ── */}
      <div className="wblca-header-bar">
        <div>
          <h2 className="wblca-title">Whole Building Life Cycle Assessment (WBLCA)</h2>
          <p className="wblca-desc">
            Multi-decade carbon trajectory across <strong>25, 50, and 100 years</strong>. Select 1 material from each functional class to evaluate cradle-to-grave emissions from material procurement (A1-A3), transport (A4), construction (A5), maintenance (B2-B5), dynamic calamity aging (B1/B7), to demolition (C1-C4).
          </p>
        </div>
        <div className="preset-pill-group">
        </div>
      </div>

      <div className="wblca-layout">
        {/* ══ LEFT COLUMN: Material Selection (4 Classes) & Building Specs ══ */}
        <div className="wblca-inputs-col">
          <div className="wblca-card">
            <div className="wblca-card-header">
              <Layers size={18} className="icon-cyan" />
              <div>
                <h3 className="card-heading">Select 4 Building Material Assemblies</h3>
                <p className="card-subheading">Choose 1 material per class. Each class plays a distinct structural or thermal role.</p>
              </div>
            </div>

            <div className="classes-list">
              {classes.map((cls, idx) => {
                const normalOptions = cls.materials.filter(m => !m.is_green).map(m => m.name);
                const greenOptions = cls.materials.filter(m => m.is_green).map(m => m.name);
                const isHovered = hoveredClass === cls.class_id;

                return (
                  <div
                    key={cls.class_id}
                    id={`class-section-${cls.class_id}`}
                    className={`class-section ${isHovered ? `highlighted-by-diagram highlighted-${cls.class_id}` : ''}`}
                    onMouseEnter={() => setHoveredClass(cls.class_id)}
                    onMouseLeave={() => setHoveredClass(null)}
                    style={{
                      marginBottom: '1.5rem',
                      paddingBottom: '1.5rem',
                      borderBottom: '1px solid var(--border-color)',
                      transition: 'all 0.25s cubic-bezier(0.4, 0, 0.2, 1)'
                    }}
                  >
                    <div className="class-header" style={{marginBottom: '1rem'}}>
                      <div className="class-number-badge">{idx + 1}</div>
                      <div>
                        <h4 className="class-title">{cls.class_name}</h4>
                        <p className="class-role">
                          <strong>Role:</strong> {cls.role_in_building}
                        </p>
                      </div>
                    </div>

                    <div className="material-dropdowns-row" style={{ display: 'flex', gap: '1rem', flexDirection: 'column' }}>
                      <div className="dropdown-group" style={{ flex: 1 }}>
                        <label style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-secondary)' }}>Normal Materials</label>
                        <div style={{ marginTop: '0.4rem' }}>
                          <MaterialSelector
                            materials={normalOptions}
                            selected={selectedNormalMaterials[cls.class_id]}
                            onSelect={val => setSelectedNormalMaterials(prev => ({ ...prev, [cls.class_id]: val }))}
                            loading={loading}
                          />
                        </div>
                      </div>
                      <div className="dropdown-group" style={{ flex: 1 }}>
                        <label style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--emerald)' }}>Green Materials</label>
                        <div style={{ 
                          marginTop: '0.4rem', 
                          '--border-color': 'var(--emerald)',
                          '--border-bright': 'var(--emerald)',
                          '--teal': 'var(--emerald)',
                          '--teal-dim': 'rgba(16,185,129,0.1)'
                        }}>
                          <MaterialSelector
                            materials={greenOptions}
                            selected={selectedGreenMaterials[cls.class_id]}
                            onSelect={val => setSelectedGreenMaterials(prev => ({ ...prev, [cls.class_id]: val }))}
                            loading={loading}
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Building Parameters & Climate Controls */}
          <div className="wblca-card">
            <div className="wblca-card-header">
              <Sliders size={18} className="icon-cyan" />
              <div>
                <h3 className="card-heading">Building Scale & Operational Environment</h3>
                <p className="card-subheading">Customize gross floor area, logistics freight, and 100-year calamity exposure.</p>
              </div>
            </div>

            <div className="params-grid">
              <div className="param-item">
                <label className="param-label">
                  Gross Floor Area (GFA): <strong>{gfa.toLocaleString()} m²</strong>
                </label>
                <input
                  type="range"
                  min={500}
                  max={25000}
                  step={250}
                  value={gfa}
                  onChange={e => setGfa(Number(e.target.value))}
                  className="param-slider"
                />
                <div className="param-bounds"><span>500 m²</span><span>25,000 m²</span></div>
              </div>

              <div className="param-item">
                <label className="param-label">
                  Logistics Transit Distance: <strong>{transitDistance} km</strong>
                </label>
                <input
                  type="range"
                  min={50}
                  max={1500}
                  step={50}
                  value={transitDistance}
                  onChange={e => setTransitDistance(Number(e.target.value))}
                  className="param-slider"
                />
                <div className="param-bounds"><span>50 km</span><span>1,500 km</span></div>
              </div>

              <div className="param-item">
                <label className="param-label">
                  Temperature Anomaly: <strong>+{tempAnomaly.toFixed(1)} °C</strong>
                </label>
                <input
                  type="range"
                  min={0.0}
                  max={4.5}
                  step={0.1}
                  value={tempAnomaly}
                  onChange={e => setTempAnomaly(Number(e.target.value))}
                  className="param-slider"
                />
                <div className="param-bounds"><span>0.0 °C</span><span>+4.5 °C</span></div>
              </div>

              <div className="param-item">
                <label className="param-label">
                  Transport Fleet Vehicle:
                </label>
                <select
                  value={vehicleType}
                  onChange={e => setVehicleType(e.target.value)}
                  className="param-select"
                >
                  <option value="Heavy Freight Truck">Heavy Freight Truck (14t, 680 g CO₂/km)</option>
                  <option value="CNG Truck">CNG Medium Truck (970 kg, 120 g CO₂/km)</option>
                  <option value="Diesel Van">Diesel Van (2000 kg, 180 g CO₂/km)</option>
                  <option value="Electric Van">Electric Van (Zero-tailpipe, 40 g CO₂/km)</option>
                </select>
              </div>
            </div>

            <button
              className="calculate-btn"
              onClick={handleCalculate}
              disabled={loading}
            >
              {loading ? (
                <>
                  <Loader2 size={18} className="btn-spinner" />
                  Calculating Whole-Building LCA & 100-Yr Trajectory...
                </>
              ) : (
                <>
                  <Building2 size={18} />
                  Recalculate Whole-Building Lifecycle Carbon
                </>
              )}
            </button>
          </div>
        </div>

        {/* ══ RIGHT COLUMN: Charts, Timeline & Metrics ══ */}
        <div className="wblca-results-col">
          {/* Interactive Architectural Cutaway Model (Sticky Right Column) */}
          <InteractiveBuildingDiagram
            hoveredClass={hoveredClass}
            onHoverClass={setHoveredClass}
            onSelectClass={(classId) => {
              setHoveredClass(classId);
              const el = document.getElementById(`class-section-${classId}`);
              if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' });
            }}
            selectedNormalMaterials={selectedNormalMaterials}
            selectedGreenMaterials={selectedGreenMaterials}
          />

          {error && (
            <div className="wblca-error-box">
              <AlertTriangle size={18} />
              <span>{error}</span>
            </div>
          )}

          {/* KPI Summary Cards */}
          {resultGreen?.summary && resultNormal?.summary && (
            <div className="kpi-grid">
              <div className="kpi-card highlight">
                <span className="kpi-sub">Green Building Total (100-Yr)</span>
                <div className="kpi-value-row">
                  <span className={`kpi-num ${resultGreen.summary.total_100yr_tonnes < 0 ? 'text-emerald' : ''}`}>
                    {resultGreen.summary.total_100yr_tonnes.toLocaleString()}
                  </span>
                  <span className="kpi-unit">t CO₂e</span>
                </div>
                <span className="kpi-footnote">
                  Intensity: <strong>{resultGreen.summary.intensity_kg_co2e_per_m2} kg CO₂e/m²</strong>
                </span>
              </div>

              <div className="kpi-card" style={{ borderColor: 'var(--amber)' }}>
                <span className="kpi-sub">Normal Building Total (100-Yr)</span>
                <div className="kpi-value-row">
                  <span className="kpi-num">{resultNormal.summary.total_100yr_tonnes.toLocaleString()}</span>
                  <span className="kpi-unit">t CO₂e</span>
                </div>
                <span className="kpi-footnote">
                  Intensity: <strong>{resultNormal.summary.intensity_kg_co2e_per_m2} kg CO₂e/m²</strong>
                </span>
              </div>
              
              <div className="kpi-card savings">
                <span className="kpi-sub">Green vs Normal Savings</span>
                <div className="kpi-value-row">
                  <span className="kpi-num text-emerald">
                    -{Math.min(100, Math.round((1 - resultGreen.summary.total_100yr_tonnes / (resultNormal.summary.total_100yr_tonnes || 1)) * 100))}%
                  </span>
                </div>
                <span className="kpi-footnote">
                  Saving <strong>{Math.round(resultNormal.summary.total_100yr_tonnes - resultGreen.summary.total_100yr_tonnes).toLocaleString()} t CO₂e</strong>
                </span>
              </div>
            </div>
          )}

          {/* Interactive Charts Card */}
          <div className="wblca-chart-card">
            <div className="chart-card-header">
              <div>
                <h3 className="chart-heading">
                  {activeChartTab === 'trajectory' && 'Cumulative Building Carbon Trajectory (25, 50 & 100 Years)'}
                  {activeChartTab === 'stages' && 'Whole-Building Lifecycle Stage Breakdown (Procurement to Demolition)'}
                  {activeChartTab === 'classes' && 'Emissions Contribution by Functional Assembly Class'}
                </h3>
                <p className="chart-subheading">
                  {activeChartTab === 'trajectory' && 'Tracking carbon accumulation from Handover (Yr 0) across 25, 50, 75, and 100-year horizons. Note: Transport (A4) and construction (A5) are one-time initial emissions at Year 0; subsequent years accumulate only operational maintenance (B2-B5), weathering degradation (B1/B7), and demolition (C1-C4).'}
                  {activeChartTab === 'stages' && 'Emissions allocated by LCA modules: A1-A3 Procurement, A4 Logistics Transit (One-time), A5 Erection (One-time), B2-B5 Maintenance, B1/B7 Calamity, C1-C4 End of Life.'}
                  {activeChartTab === 'classes' && 'Breakdown of tonnes CO₂e across Substructure, Superstructure, Facade, and Roofing/Insulation.'}
                </p>
              </div>

              <div className="chart-tab-switcher">
                <button
                  className={`chart-tab-btn ${activeChartTab === 'trajectory' ? 'active' : ''}`}
                  onClick={() => setActiveChartTab('trajectory')}
                >
                  <Calendar size={14} /> 25/50/100-Yr Trajectory
                </button>
                <button
                  className={`chart-tab-btn ${activeChartTab === 'stages' ? 'active' : ''}`}
                  onClick={() => setActiveChartTab('stages')}
                >
                  <Layers size={14} /> Lifecycle Stages
                </button>
                <button
                  className={`chart-tab-btn ${activeChartTab === 'classes' ? 'active' : ''}`}
                  onClick={() => setActiveChartTab('classes')}
                >
                  <Building2 size={14} /> Assembly Classes
                </button>
              </div>
            </div>

            <div className="chart-render-wrap" style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
              {resultNormal?.timeline_trajectory && resultGreen?.timeline_trajectory && activeChartTab === 'trajectory' && (
                <div className="chart-block" style={{ width: '100%' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', flexWrap: 'wrap', gap: '0.5rem' }}>
                    <div>
                      <h4 style={{ margin: 0, color: 'var(--text-primary)', fontSize: '1rem', fontWeight: 600 }}>
                        Cumulative Building Carbon Trajectory Comparison (100 Years)
                      </h4>
                      <p style={{ margin: '0.2rem 0 0 0', fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                        One-time upfront logistics (A4) & construction (A5) applied at Handover (Yr 0) + multi-decade aging.
                      </p>
                    </div>
                    <div style={{ display: 'flex', gap: '1rem', fontSize: '0.85rem' }}>
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', color: 'var(--emerald)', fontWeight: 600 }}>
                        <span style={{ width: 10, height: 10, borderRadius: '50%', backgroundColor: '#10b981', display: 'inline-block' }} />
                        Green Assembly
                      </span>
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', color: 'var(--amber)', fontWeight: 600 }}>
                        <span style={{ width: 10, height: 10, borderRadius: '50%', backgroundColor: '#f59e0b', display: 'inline-block' }} />
                        Normal Baseline Assembly
                      </span>
                    </div>
                  </div>
                  <ResponsiveContainer width="100%" height={380}>
                    <AreaChart
                      data={resultGreen.timeline_trajectory.map((gPoint, idx) => {
                        const nPoint = resultNormal.timeline_trajectory[idx];
                        return {
                          year: gPoint.year,
                          label: gPoint.label,
                          green_tonnes: gPoint.cumulative_tonnes,
                          normal_tonnes: nPoint?.cumulative_tonnes ?? null,
                          carbon_avoided: nPoint ? Math.round(nPoint.cumulative_tonnes - gPoint.cumulative_tonnes) : 0,
                        };
                      })}
                      margin={{ top: 20, right: 30, left: 10, bottom: 20 }}
                    >
                      <defs>
                        <linearGradient id="gradGreenCombined" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="#10b981" stopOpacity={0.45} />
                          <stop offset="100%" stopColor="#10b981" stopOpacity={0.02} />
                        </linearGradient>
                        <linearGradient id="gradNormalCombined" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="#f59e0b" stopOpacity={0.35} />
                          <stop offset="100%" stopColor="#f59e0b" stopOpacity={0.02} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(56,90,150,0.2)" vertical={false} />
                      <XAxis dataKey="label" tick={{ fill: 'var(--text-secondary)', fontSize: 12 }} axisLine={false} tickLine={false} />
                      <YAxis 
                        domain={['auto', 'auto']}
                        tick={{ fill: 'var(--text-muted)', fontSize: 11 }} 
                        axisLine={false} 
                        tickLine={false} 
                        tickFormatter={v => Math.abs(v) >= 1000 ? `${(v / 1000).toFixed(1)}k t` : `${Math.round(v)} t`} 
                        label={{ value: 'Tonnes CO₂e', angle: -90, position: 'insideLeft', fill: 'var(--text-muted)', fontSize: 11, dy: 40 }}
                      />
                      <Tooltip
                        content={({ active, payload, label }) => {
                          if (!active || !payload?.length) return null;
                          const data = payload[0].payload;
                          const savingsPct = data.normal_tonnes ? Math.round(((data.normal_tonnes - data.green_tonnes) / data.normal_tonnes) * 100) : 0;
                          return (
                            <div className="wblca-tooltip" style={{ minWidth: '240px' }}>
                              <p className="tooltip-title" style={{ fontWeight: 700, marginBottom: '0.4rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.3rem' }}>
                                {label}
                              </p>
                              <p style={{ color: '#10b981', margin: '4px 0', fontSize: '0.85rem' }}>
                                Green Assembly: <strong>{Number(data.green_tonnes).toLocaleString()} t CO₂e</strong>
                              </p>
                              <p style={{ color: '#f59e0b', margin: '4px 0', fontSize: '0.85rem' }}>
                                Normal Baseline: <strong>{Number(data.normal_tonnes).toLocaleString()} t CO₂e</strong>
                              </p>
                              <p style={{ color: '#38bdf8', marginTop: '6px', paddingTop: '6px', borderTop: '1px solid rgba(255,255,255,0.1)', fontSize: '0.82rem', fontWeight: 600 }}>
                                Net Avoided Carbon: <strong>{Number(data.carbon_avoided).toLocaleString()} t</strong> ({savingsPct > 0 ? `-${savingsPct}%` : '0%'})
                              </p>
                              <p style={{ fontSize: '0.72rem', color: 'var(--text-muted)', margin: '4px 0 0 0' }}>
                                *A4 transport & A5 construction added once at Yr 0.
                              </p>
                            </div>
                          );
                        }}
                      />
                      <Legend verticalAlign="top" height={36} />
                      <Area 
                        type="monotone" 
                        dataKey="normal_tonnes" 
                        name="Normal Baseline Trajectory" 
                        stroke="#f59e0b" 
                        strokeWidth={3} 
                        fill="url(#gradNormalCombined)" 
                        dot={{ r: 5, fill: '#f59e0b' }} 
                      />
                      <Area 
                        type="monotone" 
                        dataKey="green_tonnes" 
                        name="Green Building Trajectory" 
                        stroke="#10b981" 
                        strokeWidth={3} 
                        fill="url(#gradGreenCombined)" 
                        dot={{ r: 5, fill: '#10b981' }} 
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              )}

              {resultGreen?.stage_breakdown && resultNormal?.stage_breakdown && activeChartTab === 'stages' && (
                <div className="chart-block" style={{ width: '100%' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', flexWrap: 'wrap', gap: '0.5rem' }}>
                    <div>
                      <h4 style={{ margin: 0, color: 'var(--text-primary)', fontSize: '1rem', fontWeight: 600 }}>
                        Lifecycle Module Comparison: Green vs Normal (A1 to C4)
                      </h4>
                      <p style={{ margin: '0.2rem 0 0 0', fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                        Side-by-side carbon allocation across all standard EN 15978 / ISO 21930 lifecycle stages.
                      </p>
                    </div>
                    <div style={{ display: 'flex', gap: '1rem', fontSize: '0.85rem' }}>
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', color: 'var(--emerald)', fontWeight: 600 }}>
                        <span style={{ width: 10, height: 10, borderRadius: '2px', backgroundColor: '#10b981', display: 'inline-block' }} />
                        Green Assembly
                      </span>
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', color: 'var(--amber)', fontWeight: 600 }}>
                        <span style={{ width: 10, height: 10, borderRadius: '2px', backgroundColor: '#f59e0b', display: 'inline-block' }} />
                        Normal Baseline
                      </span>
                    </div>
                  </div>
                  <ResponsiveContainer width="100%" height={380}>
                    <BarChart
                      data={Object.keys(resultGreen.stage_breakdown).map((stageKey) => {
                        const greenVal = resultGreen.stage_breakdown[stageKey] || 0;
                        const normVal = resultNormal.stage_breakdown[stageKey] || 0;
                        const shortName = stageKey.split(' ')[0];
                        return {
                          stageKey,
                          shortName,
                          fullName: stageKey,
                          green: greenVal,
                          normal: normVal,
                          difference: Math.round(normVal - greenVal),
                        };
                      })}
                      margin={{ top: 20, right: 30, left: 10, bottom: 20 }}
                      barGap={6}
                    >
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(56,90,150,0.2)" vertical={false} />
                      <XAxis
                        dataKey="shortName"
                        tick={{ fill: 'var(--text-secondary)', fontSize: 12, fontWeight: 600 }}
                        axisLine={false}
                        tickLine={false}
                      />
                      <YAxis
                        domain={['auto', 'auto']}
                        tick={{ fill: 'var(--text-muted)', fontSize: 11 }}
                        axisLine={false}
                        tickLine={false}
                        tickFormatter={v => Math.abs(v) >= 1000 ? `${(v / 1000).toFixed(1)}k t` : `${Math.round(v)} t`}
                        label={{ value: 'Tonnes CO₂e', angle: -90, position: 'insideLeft', fill: 'var(--text-muted)', fontSize: 11, dy: 40 }}
                      />
                      <Tooltip
                        content={({ active, payload }) => {
                          if (!active || !payload?.length) return null;
                          const d = payload[0].payload;
                          const savings = d.normal ? Math.round(((d.normal - d.green) / Math.abs(d.normal)) * 100) : 0;
                          return (
                            <div className="wblca-tooltip" style={{ minWidth: '250px' }}>
                              <p className="tooltip-title" style={{ fontWeight: 700, marginBottom: '0.4rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.3rem' }}>
                                {d.fullName}
                              </p>
                              <p style={{ color: '#10b981', margin: '4px 0', fontSize: '0.85rem' }}>
                                Green Assembly: <strong>{Number(d.green).toLocaleString()} t CO₂e</strong>
                              </p>
                              <p style={{ color: '#f59e0b', margin: '4px 0', fontSize: '0.85rem' }}>
                                Normal Baseline: <strong>{Number(d.normal).toLocaleString()} t CO₂e</strong>
                              </p>
                              <p style={{ color: '#38bdf8', marginTop: '6px', paddingTop: '6px', borderTop: '1px solid rgba(255,255,255,0.1)', fontSize: '0.82rem', fontWeight: 600 }}>
                                Stage Reduction: <strong>{Number(d.difference).toLocaleString()} t</strong> ({savings > 0 ? `-${savings}%` : `${savings}%`})
                              </p>
                            </div>
                          );
                        }}
                      />
                      <Legend verticalAlign="top" height={36} />
                      <Bar dataKey="normal" name="Normal Baseline (t CO₂e)" fill="#f59e0b" radius={[4, 4, 0, 0]} maxBarSize={38} />
                      <Bar dataKey="green" name="Green Assembly (t CO₂e)" fill="#10b981" radius={[4, 4, 0, 0]} maxBarSize={38} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              )}

              {resultGreen?.assemblies && resultNormal?.assemblies && activeChartTab === 'classes' && (
                <div className="chart-block" style={{ width: '100%' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', flexWrap: 'wrap', gap: '0.5rem' }}>
                    <div>
                      <h4 style={{ margin: 0, color: 'var(--text-primary)', fontSize: '1rem', fontWeight: 600 }}>
                        Assembly Class 100-Year Carbon Comparison: Green vs Normal
                      </h4>
                      <p style={{ margin: '0.2rem 0 0 0', fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                        Cradle-to-grave emissions contribution by building structural and envelope subsystem.
                      </p>
                    </div>
                    <div style={{ display: 'flex', gap: '1rem', fontSize: '0.85rem' }}>
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', color: 'var(--emerald)', fontWeight: 600 }}>
                        <span style={{ width: 10, height: 10, borderRadius: '2px', backgroundColor: '#10b981', display: 'inline-block' }} />
                        Green Materials
                      </span>
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', color: 'var(--amber)', fontWeight: 600 }}>
                        <span style={{ width: 10, height: 10, borderRadius: '2px', backgroundColor: '#f59e0b', display: 'inline-block' }} />
                        Normal Materials
                      </span>
                    </div>
                  </div>
                  <ResponsiveContainer width="100%" height={380}>
                    <BarChart
                      data={resultGreen.assemblies.map((gAss, i) => {
                        const nAss = resultNormal.assemblies[i];
                        return {
                          name: gAss.class_name.split(' & ')[0],
                          fullName: gAss.class_name,
                          green_material: gAss.material_name,
                          normal_material: nAss?.material_name,
                          green_gwp: gAss.base_gwp,
                          normal_gwp: nAss?.base_gwp,
                          green_total: gAss.total_100yr_tonnes,
                          normal_total: nAss?.total_100yr_tonnes || 0,
                          savings: Math.round((nAss?.total_100yr_tonnes || 0) - gAss.total_100yr_tonnes),
                        };
                      })}
                      margin={{ top: 20, right: 30, left: 10, bottom: 20 }}
                      barGap={8}
                    >
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(56,90,150,0.2)" vertical={false} />
                      <XAxis
                        dataKey="name"
                        tick={{ fill: 'var(--text-secondary)', fontSize: 12, fontWeight: 600 }}
                        axisLine={false}
                        tickLine={false}
                      />
                      <YAxis
                        domain={['auto', 'auto']}
                        tick={{ fill: 'var(--text-muted)', fontSize: 11 }}
                        axisLine={false}
                        tickLine={false}
                        tickFormatter={v => Math.abs(v) >= 1000 ? `${(v / 1000).toFixed(1)}k t` : `${Math.round(v)} t`}
                        label={{ value: 'Tonnes CO₂e (100-Yr)', angle: -90, position: 'insideLeft', fill: 'var(--text-muted)', fontSize: 11, dy: 40 }}
                      />
                      <Tooltip
                        content={({ active, payload }) => {
                          if (!active || !payload?.length) return null;
                          const d = payload[0].payload;
                          const savingsPct = d.normal_total ? Math.round(((d.normal_total - d.green_total) / Math.abs(d.normal_total)) * 100) : 0;
                          return (
                            <div className="wblca-tooltip" style={{ minWidth: '280px' }}>
                              <p className="tooltip-title" style={{ fontWeight: 700, marginBottom: '0.4rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.3rem' }}>
                                {d.fullName}
                              </p>
                              <div style={{ marginBottom: '6px' }}>
                                <p style={{ color: '#10b981', margin: '2px 0', fontSize: '0.85rem' }}>
                                  <strong>Green:</strong> {d.green_material}
                                </p>
                                <p style={{ color: '#10b981', margin: '2px 0', fontSize: '0.8rem' }}>
                                  Total: <strong>{Number(d.green_total).toLocaleString()} t CO₂e</strong> (GWP: {d.green_gwp} kg/kg)
                                </p>
                              </div>
                              <div style={{ marginBottom: '6px' }}>
                                <p style={{ color: '#f59e0b', margin: '2px 0', fontSize: '0.85rem' }}>
                                  <strong>Normal:</strong> {d.normal_material}
                                </p>
                                <p style={{ color: '#f59e0b', margin: '2px 0', fontSize: '0.8rem' }}>
                                  Total: <strong>{Number(d.normal_total).toLocaleString()} t CO₂e</strong> (GWP: {d.normal_gwp} kg/kg)
                                </p>
                              </div>
                              <p style={{ color: '#38bdf8', marginTop: '6px', paddingTop: '6px', borderTop: '1px solid rgba(255,255,255,0.1)', fontSize: '0.82rem', fontWeight: 600 }}>
                                Net Class Avoided Carbon: <strong>{Number(d.savings).toLocaleString()} t</strong> ({savingsPct > 0 ? `-${savingsPct}%` : `${savingsPct}%`})
                              </p>
                            </div>
                          );
                        }}
                      />
                      <Legend verticalAlign="top" height={36} />
                      <Bar dataKey="normal_total" name="Normal Assembly Total (t CO₂e)" fill="#f59e0b" radius={[4, 4, 0, 0]} maxBarSize={44} />
                      <Bar dataKey="green_total" name="Green Assembly Total (t CO₂e)" fill="#10b981" radius={[4, 4, 0, 0]} maxBarSize={44} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              )}
            </div>
          </div>

          {/* Detailed Assembly Matrix Table */}
          {resultGreen?.assemblies && resultNormal?.assemblies && (
            <div className="wblca-table-card">
              <h4 className="table-heading">Whole-Building Lifecycle Inventory Matrix (Green vs Normal)</h4>
              
              <div className="table-responsive">
                <table className="wblca-table">
                  <thead>
                    <tr>
                      <th>Assembly Class</th>
                      <th>Scenario</th>
                      <th>Selected Material</th>
                      <th>Base GWP</th>
                      <th>A1–A3 (t)</th>
                      <th>Total 100-Yr (t)</th>
                    </tr>
                  </thead>
                  <tbody>
                    {resultGreen.assemblies.map((a, i) => {
                      const n = resultNormal.assemblies[i];
                      return (
                        <React.Fragment key={a.class_id}>
                          <tr>
                            <td rowSpan={2}><strong>{a.class_name}</strong></td>
                            <td style={{color: 'var(--emerald)'}}>Green</td>
                            <td><span className="mat-cell-name">{a.material_name}</span></td>
                            <td className={a.base_gwp < 0 ? 'text-emerald font-semibold' : ''}>{a.base_gwp.toFixed(3)}</td>
                            <td>{a.embodied_A1A3_tonnes.toLocaleString()}</td>
                            <td><strong className={a.total_100yr_tonnes < 0 ? 'text-emerald' : ''}>{a.total_100yr_tonnes.toLocaleString()}</strong></td>
                          </tr>
                          <tr style={{borderBottom: '2px solid var(--border-color)'}}>
                            <td style={{color: 'var(--amber)'}}>Normal</td>
                            <td><span className="mat-cell-name">{n.material_name}</span></td>
                            <td>{n.base_gwp.toFixed(3)}</td>
                            <td>{n.embodied_A1A3_tonnes.toLocaleString()}</td>
                            <td><strong>{n.total_100yr_tonnes.toLocaleString()}</strong></td>
                          </tr>
                        </React.Fragment>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default BuildingLCA;
