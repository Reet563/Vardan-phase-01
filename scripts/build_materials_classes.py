import json
import re

substructure_normal = [
    ("Portland cement, general, CEM I", 0.860, "Traditional virgin Portland cement standard foundation footing mix."),
    ("Concrete (Ready mix - general)", 0.130, "Standard C25/30 ready-mix concrete for foundation grade slabs."),
    ("Concrete (C25/30 standard foundation mix)", 0.145, "Standard reinforced foundation concrete with standard Portland binder."),
    ("Precast concrete foundation piles", 0.180, "Factory-cured high-density concrete driven piles."),
    ("Heavy unreinforced footing concrete", 0.125, "Mass gravity foundation pad without steel reinforcement."),
    ("Virgin aggregate & crushed gravel mix", 0.055, "Quarried virgin rock and crushed gravel sub-base bedding."),
    ("Asphaltic foundation moisture seal", 0.450, "Petroleum bitumen damp-proof foundation coating.")
]

substructure_green = [
    ('Carbon-negative olivine mineralized aggregate concrete', -0.0450, 'Carbon-mineralizing permanent foundation footings.'),
    ('Carbon negative synthetic limestone aggregate concrete', -0.0150, 'Sub-base mass concrete & grade slabs.'),
    ('Bio-asphalt binder, 100% microalgae/tall oil derived', 0.0950, 'Sub-slab moisture & subterranean damp-proof barrier.'),
    ('Bio-asphalt waterproof membrane coating', 0.1800, 'Foundation wall damp-proof tanking coating.'),
    ('Recycled rubber asphalt waterproofing membrane', 0.5200, 'Basement retaining wall waterproofing sheet.'),
    ('Natural hydraulic lime waterproofing slurry', 0.1400, 'Subgrade masonry & foundation waterproofing barrier.'),
    ('Crumb rubber modified asphalt emulsion sealant', 0.4200, 'Foundation expansion joint & crack sealant.'),
    ('Recycled aggregate concrete C25/30 (100% recycled coarse aggregate)', 0.0740, 'Foundation grade slabs and mass concrete footings.'),
    ('Recycled brick aggregate concrete C20/25', 0.0610, 'Unreinforced ground bedding and pad footings.'),
    ('Low-carbon concrete with LC3 (Limestone Calcined Clay Cement)', 0.0950, 'General foundation grade slabs and basement walls.'),
    ('Geopolymer concrete (100% Fly Ash & GGBS activated)', 0.0520, 'Sulfate & chloride-resistant foundation piles.'),
    ('Volcanic ash pozzolan natural hydraulic lime concrete', 0.0450, 'Mass foundation bedding & subgrade fill.'),
    ('Micro-algae infused self-healing concrete', 0.0880, 'Waterproof underground basement retaining walls.'),
    ('Dredged sediment aggregate lightweight concrete', 0.0550, 'Subgrade void filling and non-structural bedding.'),
    ('Low-binder roller compacted eco-concrete (RCC)', 0.0550, 'Heavy ground slabs and subgrade base courses.'),
    ('Sulfur-polymer concrete made with industrial byproduct sulfur', 0.0680, 'High chemical/acid-resistant foundation concrete.'),
    ('Pervious eco-concrete with recycled aggregate (permeable)', 0.0650, 'Ground stormwater infiltration & perimeter drainage slabs.'),
    ('Ceramic waste coarse aggregate concrete', 0.0640, 'Foundation concrete mix using crushed ceramic scrap.'),
    ('Copper slag blended eco-concrete', 0.0720, 'High-density foundation gravity footing concrete.'),
    ('Calcined paper sludge hydraulic cement binder', 0.0490, 'Soil stabilization and sub-base hydraulic binder.'),
    ('Calcined clay and slag blended low-emissions binder', 0.0650, 'Low-heat foundation mass concrete binder.'),
    ('Alkali-activated fly ash-metakaolin geopolymer mortar', 0.0760, 'Substructure masonry and foundation bed jointing.'),
    ('Recycled glass pozzolan mortar mix', 0.0420, 'Moisture-resistant foundation bedding mortar.'),
    ('Recycled glass foam insulating gravel', 0.1800, 'Thermal insulating load-bearing sub-slab gravel bed.'),
    ('Pumice stone lightweight insulating aggregate', 0.0820, 'Sub-slab lightweight drainage fill and footing insulation.'),
    ('100% Recycled glass aggregate for terrazzo/landscaping', 0.0250, 'Subgrade pipe bedding and drainage layer.'),
    ('Coir fiber geotextile matting for ground stabilization', -0.3800, 'Subgrade soil reinforcement and ground stabilization.'),
    ('Natural jute geotextile erosion control mat', -0.3200, 'Foundation excavation slope & embankment stabilization.'),
    ('Bio-based PLA geogrid for soil stabilization', 0.6800, 'High-tensile subgrade structural soil reinforcement.'),
    ('100% Recycled Polypropylene (PP) drainage board', 0.5800, 'Subterranean basement wall drainage dimple sheet.'),
    ('Recycled HDPE corrugated drainage pipe', 0.5400, 'Foundation perimeter French drainage and groundwater collection.'),
    ('Bio-polyethylene water pipes (sugarcane feedstock)', 0.8200, 'Subgrade building water supply and utility conduits.'),
    ('Recycled cast iron drain pipe and fittings', 0.6200, 'Subgrade heavy wastewater and soil plumbing.'),
    ('100% Recycled plastic interlocking paver tile', 0.4800, 'Ground-level exterior perimeter drainage paving.'),
    ('Recycled polyolefin turf protection grid', 0.4900, 'Permeable ground reinforcement & driveway grid.'),
    ('Red mud geopolymer paving brick', 0.0350, 'Ground walkway and perimeter hardscaping brick.'),
    ('Alkali-activated red mud-fly ash eco-paver', 0.0390, 'Ground-level heavy interlocking pavement.'),
    ('100% Recycled container glass paving pavers', 0.1200, 'Ground pathway permeable pavement.'),
    ('Recycled tire rubber playground safety tile', 0.3800, 'Ground surface impact-absorbing exterior tile.')
]

superstructure_normal = [
    ("Structural steel, virgin / BOF", 2.450, "Traditional blast furnace-basic oxygen furnace structural steel sections."),
    ("Reinforced Concrete (C30/37 structural)", 0.165, "Standard reinforced concrete frame with high tensile rebar."),
    ("Structural steel sections & heavy rebar", 1.720, "Standard hot-rolled structural steel beams and columns."),
    ("Precast concrete beams and columns", 0.235, "Heavy precast concrete structural frame assemblies."),
    ("High-strength structural steel I-beams", 2.200, "Heavy structural flange I-beams for long-span construction."),
    ("Standard post-tensioned concrete slab", 0.190, "Cast-in-place concrete floor slab with steel tendons.")
]

superstructure_green = [
    ('Bio-char impregnated structural timber post', -0.8900, 'Heavy structural columns with extreme biogenic carbon storage.'),
    ('Recycled reclaimed barn timber beam', -0.8200, 'Heavy structural timber girders and post-and-beam framing.'),
    ('Hardwood timber beam, European oak, sustainably managed', -0.7200, 'High-capacity structural beams and architectural trusses.'),
    ('Softwood framing timber, kiln dried, FSC certified', -0.6800, 'Primary structural framing studs and joists.'),
    ('Dowel-Laminated Timber (DLT) 100% wood structural panel', -0.6700, 'Adhesive-free mass timber floor and roof structural slabs.'),
    ('Nail-Laminated Timber (NLT) panel without adhesive', -0.6500, 'Heavy mass timber structural floor and ceiling decks.'),
    ('Cross-Laminated Timber (CLT), FSC certified softwood (incl. carbon storage)', -0.6100, 'Structural multi-story load-bearing shear walls & floor slabs.'),
    ('FSC Douglas fir structural glulam posts', -0.5900, 'High-load structural glulam columns.'),
    ('Glued Laminated Timber (Glulam), FSC certified (incl. carbon storage)', -0.5800, 'Long-span structural arched beams and primary frame girders.'),
    ('Mass Plywood Panel (MPP) structural engineered timber', -0.5600, 'Massive structural engineered timber columns and core walls.'),
    ('Lightweight structural timber hollow core slab', -0.5500, 'Long-span pre-fabricated structural floor cassettes.'),
    ('Laminated Veneer Lumber (LVL), sustainably managed pine', -0.5400, 'High-strength structural framing headers, rim boards & beams.'),
    ('Timber I-joist with OSB web and solid wood flanges', -0.5200, 'Lightweight high-stiffness structural floor & roof joists.'),
    ('Parallel Strand Lumber (PSL), eco-certified spruce', -0.5100, 'Heavy-duty structural columns and long-span beams.'),
    ('Kempas / Keruing timber substitute - Eucalyptus timber (FSC)', -0.4900, 'Dense structural hardwood framing.'),
    ('FSC Laminated Strand Lumber (LSL)', -0.4800, 'Engineered structural studs, headers, and rim boards.'),
    ('Bio-resin laminated veneer lumber panel', -0.4600, 'Bio-bonded structural load-bearing timber panels.'),
    ('Sustainably harvested rattan structural framing element', -0.2100, 'Rapidly renewable lightweight structural framework.'),
    ('Engineered bamboo-timber hybrid structural joist', -0.1200, 'High tensile-strength hybrid floor and ceiling joists.'),
    ('Bio-char infused concrete slab (carbon storing)', -0.0250, 'Carbon-sequestering elevated reinforced structural floor slab.'),
    ('Cross-laminated bamboo timber structural panel', 0.0800, 'Multi-layer structural bamboo wall and floor panels.'),
    ('Engineered bamboo structural I-joist', 0.0950, 'High strength-to-weight structural floor joists.'),
    ('Bamboo laminated timber beam (Glubam)', 0.1800, 'High tensile structural beams and portal frames.'),
    ('Low-carbon green steel (Hydrogen Direct Reduced Iron - H2-DRI)', 0.1800, 'Zero-coal primary structural steel I-beams and columns.'),
    ('100% Recycled content structural steel (EAF process, renewable energy)', 0.3500, 'Heavy structural steel columns, girders, and trusses.'),
    ('Decarbonized EAF steel structural tube section', 0.3800, 'Hollow structural steel (HSS) columns and spatial trusses.'),
    ('Recycled steel rebar (Electric Arc Furnace, 98% recycled)', 0.4200, 'Reinforcing rebar for structural concrete columns & beams.'),
    ('Recycled steel rebar with epoxy coating', 0.5100, 'Corrosion-resistant structural rebar for slabs and beams.'),
    ('Recycled steel wire mesh for concrete reinforcement', 0.4100, 'Welded wire reinforcement mesh for structural slabs.'),
    ('Recycled steel decking sheet for composite floors', 0.4800, 'Profiled structural steel floor decking for composite slabs.'),
    ('Green-certified steel cable for tension structures', 0.4900, 'Structural tensile stay cables, bracing, and suspension ties.'),
    ('Low-emission primary steel (biomass reductant blast furnace)', 0.8500, 'Heavy structural steel plate and section profiles.'),
    ('Recycled aluminum structural beam I-profile', 0.7200, 'Lightweight high-strength architectural structural beams.'),
    ('Flax-epoxy natural fiber composite structural rod', 0.8800, 'Non-corrosive structural reinforcement rebar substitute.'),
    ('Bio-epoxy carbon fiber composite rod', 2.8500, 'Ultra-high tensile post-tensioning tendons & structural reinforcement.'),
    ('Recycled aggregate concrete C35/45 with 50% GGBS', 0.0590, 'High-strength structural concrete frame (columns and slabs).'),
    ('Low-carbon concrete 70% GGBS replacement (C32/40)', 0.0680, 'Structural frame concrete with low hydration heat.'),
    ('Low-carbon concrete 50% Fly Ash replacement (C30/37)', 0.0820, 'Standard reinforced structural concrete frame.'),
    ('Alkali-activated slag (AAS) structural concrete', 0.0580, 'Clinker-free structural columns and core walls.'),
    ('Seawater & sea-sand geopolymer structural concrete', 0.0510, 'Non-potable water structural reinforced geopolymer frame.'),
    ('Carbon-injected ready-mix concrete 30 MPa', 0.1050, 'Mineralized CO2 structural ready-mix concrete.'),
    ('Clay-calcined cement concrete C30/37', 0.0880, 'Low-clinker structural floor slabs and columns.'),
    ('Nanocellulose reinforced low-carbon concrete mix', 0.0980, 'High flexural-strength structural concrete frame.'),
    ('Ultra-low cement SCC (Self-Consolidating Concrete)', 0.0890, 'Heavily reinforced congested column and beam cast-in-place.'),
    ('Basalt fiber reinforced low-carbon concrete slab', 0.1120, 'Crack-resistant structural composite suspended floor slabs.'),
    ('Ultra-high performance bio-concrete with hemp fibers', 0.1150, 'Ductile ultra-high performance structural components.'),
    ('Silica fume enhanced low-binder concrete C50/60', 0.1280, 'High-rise high-capacity structural columns and transfer girders.')
]

facade_normal = [
    ("Standard Clay Facing Brick", 0.240, "Fired clay external brickwork with Portland mortar backing."),
    ("Double-Glazed Curtain Wall Glass", 1.400, "Aluminum mullion framed double-glazed exterior facade system."),
    ("Aluminum composite panel (ACP) cladding", 6.800, "Extruded aluminum bonded architectural cladding panels."),
    ("Standard concrete masonry unit (CMU)", 0.180, "Portland-based hollow core concrete masonry blocks."),
    ("Fired terracotta rainscreen tile", 0.550, "High-temperature kiln fired exterior rainscreen tiles."),
    ("Extruded aluminum window framing", 4.500, "Anodized aluminum framing for facade window openings."),
    ("Standard Portland cement exterior stucco", 0.320, "Portland cement three-coat exterior render finish.")
]

facade_green = [
    ('Sustainably harvested cedar shingles and siding', -0.7500, 'Weather-resistant exterior timber rainscreen and siding.'),
    ('Larch timber cladding board, untreated natural durability', -0.6400, 'Naturally rot-resistant exterior facade rainscreen.'),
    ('Hempcrete block, density 300 kg/m3', -0.4100, 'Monolithic breathable exterior envelope wall block.'),
    ('Hempcrete wall panel, prefabricated', -0.3800, 'Fast-erect thermal exterior envelope cassette panel.'),
    ('Giant reed (Arundo donax) structural panel', -0.3600, 'Bio-composite exterior wall and cladding panel.'),
    ('Charred wood cladding (Shou Sugi Ban style) pine', -0.3200, 'Fire and rot-resistant decorative exterior facade cladding.'),
    ('Hemp-lime modular structural block, dried', -0.3100, 'Breathable external envelope masonry block.'),
    ('Structural Insulated Panel (SIP) with OSB and bio-polyol core', -0.2900, 'Complete high-performance exterior wall envelope panel.'),
    ('Thermally modified wood cladding (ThermoWood pine)', -0.2200, 'Dimensionally stable exterior cladding.'),
    ('Acetylated wood decking (Accoya Radiata Pine)', -0.1800, 'High-durability exterior facade siding and louvers.'),
    ('Furfurylated wood cladding (Kebony softwood)', -0.1500, 'Modified high-density exterior wood rainscreen.'),
    ('Papercrete block, recycled paper pulp & lime', -0.1100, 'Lightweight insulating exterior infill block.'),
    ('Lime-hemp thermal insulation render', -0.0800, 'Continuous exterior insulating facade render.'),
    ('Cob building material (clay, sand, straw mix)', -0.0350, 'Traditional thermal mass exterior envelope wall.'),
    ('Adobe earth brick, sun-dried with straw binder', -0.0150, 'Zero-kiln sun-dried exterior wall brick.'),
    ('Compressed Earth Block (CEB), unfired natural clay', 0.0180, 'High-density unfired exterior masonry wall block.'),
    ('Rammed earth block, unstabilized natural clay', 0.0220, 'Natural clay exterior thermal mass block.'),
    ('Bio-cement block using microbial-induced calcite precipitation (MICP)', 0.0280, 'Bacteria-mineralized exterior bio-masonry block.'),
    ('Carbonated steel slag aggregate block', 0.0280, 'CO2-cured exterior masonry building block.'),
    ('Compressed Earth Block with recycled fly ash binder', 0.0320, 'Stabilized exterior masonry wall unit.'),
    ('Bio-mineralized concrete block (bacteria-cured)', 0.0380, 'Self-healing exterior masonry wall block.'),
    ('Municipal solid waste incineration ash brick', 0.0380, 'Circular exterior facing masonry brick.'),
    ('Sugarcane bagasse ash aggregate block', 0.0420, 'Eco-composite exterior masonry wall block.'),
    ('Compressed Earth Block (CEB), 5% lime binder', 0.0450, 'Water-resistant exterior stabilized earth block.'),
    ('Geopolymer concrete aggregate block, hollow', 0.0480, 'Hollow core exterior envelope masonry block.'),
    ('Cellular lightweight geopolymer block', 0.0520, 'Low-density thermal exterior infill block.'),
    ('Foundry sand aggregate eco-concrete block', 0.0580, 'Exterior concrete masonry unit (CMU).'),
    ('Cast earth block using alkali-activated binder', 0.0620, 'High-strength stabilized earth facade block.'),
    ('Carbon-sequestered concrete block (mineralized CO2)', 0.0620, 'Mineralized CO2 exterior CMU block.'),
    ('Rice husk ash blended cement block (20% RHA)', 0.0640, 'Lightweight exterior wall masonry block.'),
    ('Rubberized concrete block (crumb tire aggregate 10%)', 0.0670, 'Impact and seismic-resistant exterior block.'),
    ('Plastic waste aggregate concrete block (15% PET replacing sand)', 0.0710, 'Recycled plastic exterior masonry block.'),
    ('Hydrated lime and pozzolan heritage repair mortar', 0.0850, 'Breathable exterior masonry pointing and repair mortar.'),
    ('Calcined clay masonry unit with organic pore formers', 0.0920, 'Insulated exterior fired clay facing block.'),
    ('Expanded glass lightweight aggregate concrete block', 0.1100, 'High-thermal-insulation exterior facade block.'),
    ('Hydraulic lime plaster render with hemp fibers', 0.1200, 'Weatherproof breathable exterior facade stucco.'),
    ('Expanded clay aggregate (LECA) low-density eco-block', 0.1350, 'Lightweight thermal insulating envelope block.'),
    ('Low-energy fired clay facing brick (biomass kiln fuel)', 0.1400, 'Traditional exterior aesthetic facing brick.'),
    ('Glass-fiber reinforced geopolymer panel (GFRG)', 0.1450, 'Lightweight exterior architectural facade panel.'),
    ('Autoclaved Aerated Concrete (AAC) with recycled fly ash', 0.1600, 'Fireproof lightweight exterior wall blocks.'),
    ('Recycled content ceramic wall tile (min 50% post-industrial waste)', 0.2800, 'Exterior rainscreen architectural ceramic facade tile.'),
    ('Ultra-thin eco-porcelain slab tile', 0.3500, 'Large-format exterior porcelain rainscreen cladding.'),
    ('Wood-plastic composite (WPC) with 100% recycled sawdust & HDPE', 0.3800, 'Weatherproof exterior cladding slats & louvers.'),
    ('Recycled plastic composite fence post', 0.4200, 'Exterior perimeter screen and boundary posts.'),
    ('Wood-plastic composite (WPC) with 70% recycled bio-HDPE', 0.4200, 'Bio-polymer exterior rainscreen siding.'),
    ('Recycled steel wire rope for green facade trellis', 0.4600, 'Vertical green wall trellis & climbing plant cables.'),
    ('Bio-composite decking board (rice husk + recycled PVC)', 0.5100, 'Exterior facade rainscreen board and sun deck.'),
    ('Sintered recycled glass tiles for cladding', 0.5200, 'Glossy non-porous exterior architectural cladding tile.'),
    ('Silicate emulsion exterior paint, low VOC', 0.5800, 'Breathable mineral exterior facade paint.'),
    ('Cast recycled glass structural block', 0.6100, 'Translucent light-transmitting exterior facade block.'),
    ('Bio-epoxy resin matrix with flax woven composite', 0.6200, 'Bio-composite exterior architectural panel.'),
    ('Recycled HDPE plastic lumber deck board', 0.6200, 'Weatherproof exterior siding & facade batten.'),
    ('Low-carbon float glass (powered by hydrogen/electricity)', 0.6200, 'Standard exterior window & curtain wall glazing.'),
    ('Recycled aluminum sheet (95% post-consumer scrap)', 0.6500, 'Formed exterior architectural cladding panels.'),
    ('Natural mineral silicate masonry paint', 0.6500, 'Weather-resistant exterior masonry coating.'),
    ('Low-iron eco-glass solar collector cover', 0.7100, 'High-transmittance building-envelope solar thermal glazing.'),
    ('Bio-based poly lactic acid (PLA) 3D printed architectural element', 0.7800, 'Custom exterior facade shading screens & brise-soleils.'),
    ('Solar control low-E double glass unit with 50% recycled cullet', 0.7800, 'High-efficiency thermal solar control window glazing.'),
    ('Recycled aluminum louvers and sunshades', 0.7900, 'Exterior solar shading louvers & brise-soleil systems.'),
    ('Hydro CIRCAL 75R recycled aluminum profile (min 75% post-consumer)', 0.8500, 'Curtain wall mullions, transoms & window frames.'),
    ('Ultralight foamed aluminum insulation panel (70% recycled)', 0.9200, 'Non-combustible exterior facade sandwich core.'),
    ('Recycled PET structural foam core for sandwich panels', 0.9500, 'Lightweight core for insulated facade panels.'),
    ('Bio-polyurethane joint sealant', 0.9500, 'Exterior facade panel weatherproofing joint sealant.'),
    ('Recycled aluminum honeycomb composite cladding panel', 1.0800, 'Ultra-flat exterior rainscreen cassette panels.'),
    ('Vacuum insulated glass (VIG) unit, low carbon glass', 1.1500, 'Ultra-high R-value slimline exterior window glazing.'),
    ('Hydro-powered low-carbon aluminum window frame profile', 1.2200, 'Thermally broken exterior window framing.'),
    ('Recycled stainless steel sheet 304 grade (85% scrap)', 1.3500, 'Durable architectural stainless facade cladding.'),
    ('Electro-chromic dynamic smart glass window panel', 1.4500, 'Dynamic solar tinting facade window glazing.'),
    ('Photovoltaic integrated glass panel (BIPV double glazed)', 1.8500, 'Electricity-generating building envelope facade glass.'),
    ('Low-carbon primary aluminum (powered by 100% hydro power)', 1.8500, 'Structural curtain wall framing members.'),
    ('Aerogel infused double glazing unit frame', 1.9500, 'Super-insulated thermal bridge-free window frame.'),
    ('Recycled nickel alloy architectural mesh', 2.1000, 'Exterior decorative architectural solar shading mesh.'),
    ('Recycled titanium sheet for architectural facade', 3.2000, 'Extreme-durability architectural feature facade cladding.')
]

roofing_normal = [
    ("Extruded Polystyrene (XPS) Rigid Foam", 2.800, "Petrochemical polymer extruded foam insulation boards."),
    ("Stone / Mineral Wool Insulation", 1.250, "Melted rock spun into fiber batts with phenolic resin binder."),
    ("Polyurethane (PUR/PIR) foam insulation", 3.200, "High-performance closed-cell synthetic polymer foam boards."),
    ("Bituminous roofing felt & asphalt membrane", 0.950, "Petrochemical asphalt waterproof roof membrane sheet."),
    ("Standard gypsum plasterboard", 0.280, "Standard virgin gypsum interior partition wallboard."),
    ("Fiberglass batt insulation", 1.350, "Spun glass fiber thermal batts with polymer binder."),
    ("Expanded Polystyrene (EPS) board", 2.400, "Expanded polystyrene bead insulation.")
]

roofing_green = [
    ('FSC Chestnut timber shakes for roofing', -0.6900, 'Renewable carbon-storing roof shingles and shakes.'),
    ('Straw bale, dense agricultural residue', -0.6500, 'Thick high-insulation attic and wall thermal fill.'),
    ('FSC Pine flooring boards, solid wood tongue & groove', -0.6300, 'Solid interior timber flooring.'),
    ('Bio-char enriched clay render', -0.5500, 'Moisture-buffering interior wall plaster finish.'),
    ('Compressed straw wall panel (Stramit)', -0.5200, 'Non-loadbearing interior dividing wallboard.'),
    ('Wood fiberboard insulation, soft density', -0.4500, 'Flexible thermal insulation between roof rafters.'),
    ('Poplar plywood, low-density sustainable plantation', -0.4500, 'Interior wall lining and built-in joinery.'),
    ('Reed matting thermal acoustic ceiling panel', -0.4200, 'Natural suspended acoustic ceiling board.'),
    ('Flexible wood fiber batt insulation', -0.4100, 'Cavity friction-fit acoustic & thermal insulation batt.'),
    ('Recycled wood palette particleboard panel', -0.4100, 'Interior partition sub-panel.'),
    ('Oriented Strand Board (OSB/3), bio-resin bound (incl. storage)', -0.4200, 'Internal partition sheathing & roof decking substrate.'),
    ('Wood fiberboard insulation, rigid tongue & groove', -0.3900, 'Continuous over-rafter roof & floor insulation board.'),
    ('Plywood, PEFC certified European beech', -0.3800, 'Interior decorative wall paneling & cabinetry.'),
    ('High density wood fiber underlayment board', -0.3700, 'Acoustic floor underlayment & roof sarking.'),
    ('FSC certified Birch plywood 18mm', -0.3500, 'Interior partition joinery and underlayment.'),
    ('Cork board insulation, 100% expanded natural cork', -0.3500, 'Thermal roof insulation & acoustic wall lining.'),
    ('Sunflower stalk eco-insulation board', -0.3400, 'Rigid bio-based interior insulation board.'),
    ('Compressed wood particleboard, low-formaldehyde E0 grade', -0.3100, 'Interior furniture core & room partition board.'),
    ('Coconut coir thermal & acoustic board', -0.3100, 'Acoustic soundproofing partition board.'),
    ('Sugarcane bagasse particleboard', -0.2900, 'Interior acoustic ceiling and dividing panel.'),
    ('Cork flooring tile, high density', -0.2800, 'Resilient acoustic natural floor tile.'),
    ('Date palm fiber thermal insulation mat', -0.2800, 'Natural thermal loft and ceiling insulation mat.'),
    ('Medium Density Fiberboard (MDF), bio-based binder', -0.2800, 'Interior architectural mouldings & partitions.'),
    ('Corn cob acoustic tile', -0.2700, 'Sound-absorbing ceiling and wall tile.'),
    ('Kenaf fiber composite board', -0.2500, 'Interior decorative acoustic partition board.'),
    ('Compressed cork-wood sandwich acoustic floor panel', -0.2200, 'Acoustic impact-damping subfloor panel.'),
    ('Hemp insulation batts, 100% natural fiber', -0.2200, 'Non-itchy thermal cavity insulation batts.'),
    ('Flax fiber insulation panel', -0.2100, 'Natural fiber roof rafter & stud cavity insulation.'),
    ('Seaweed/Alginate insulation panel', -0.2100, 'Naturally flame-retardant roof insulation board.'),
    ('Jute fiber thermal insulation roll', -0.1900, 'Loft & stud cavity roll insulation.'),
    ('Lignin-based binding agent for boards', -0.1800, 'Formaldehyde-free binder for interior boards.'),
    ('Cellulose insulation, loose-fill recycled newsprint', -0.1800, 'Blown attic & roof cavity thermal insulation.'),
    ('Mycelium insulation board, grown on agricultural waste', -0.1500, 'Biodegradable acoustic & thermal insulation board.'),
    ('Linoleum flooring, 100% bio-based (linseed oil, cork, jute)', -0.1500, 'Durable bio-based resilient floor sheet.'),
    ('Recycled paper honey-comb core partition board', -0.1500, 'Ultra-lightweight interior room divider core.'),
    ('Mycelium-based acoustical ceiling baffle', -0.1400, 'Suspended acoustic sound baffle.'),
    ('Mycelium structural acoustic panel', -0.1200, 'Decorative interior acoustic wall panel.'),
    ('Natural cork acoustic wall wallpaper', -0.1200, 'Sound-absorbing decorative cork wall covering.'),
    ('Bio-resin hemp fiber corrugated roof sheet', -0.1100, 'Lightweight bio-composite roofing sheet.'),
    ('Algae-based acoustic insulation panel', -0.0950, 'Acoustic wall absorption board.'),
    ('Algae-based bio-foam insulation', -0.0800, 'Bio-polyol expanding cavity insulation foam.'),
    ('Recycled textile waste (cotton/jeans) insulation batt', -0.0500, 'Acoustic sound-absorbing wall insulation batt.'),
    ('Unfired clay indoor building brick', 0.0240, 'Interior acoustic & humidity-buffering partition wall.'),
    ('Foamed eco-concrete, 800 kg/m3 density, 40% fly ash', 0.0780, 'Lightweight roof slope screed & partition block.'),
    ('Cellulose-based eco-wallpaper, unbleached', 0.0800, 'Breathable chemical-free interior wall covering.'),
    ('Rice husk ash insulation block', 0.0850, 'Interior thermal cavity insulation block.'),
    ('Natural clay plaster finish, zero synthetic binders', 0.0850, 'Breathable VOC-free interior wall plaster finish.'),
    ('Wood wool cement board, acoustic & thermal insulation', 0.0850, 'High-durability acoustic ceiling & wall panel.'),
    ('Recycled rubber and cork acoustic floor underlayment', 0.1100, 'Sound-dampening underlayment under hardwood.'),
    ('Chalk and clay traditional distemper paint', 0.1100, 'Matte breathable interior ceiling and wall paint.'),
    ('Volcanic pozzolan mortar for tile adhesive', 0.1100, 'Non-toxic floor and wall tile bonding adhesive.'),
    ('Sheep\'s wool insulation batts, treated with borate', 0.1200, 'Moisture-regulating roof and wall insulation batt.'),
    ('Sisal fiber reinforced gypsum board', 0.1400, 'High-impact interior partition wallboard.'),
    ('Beeswax natural timber polish finish', 0.1500, 'Non-toxic natural wood floor & furniture sealant.'),
    ('Bamboo plywood panel, 19mm', 0.1600, 'Interior cabinetry & wall lining panel.'),
    ('Synthetic FGD gypsum plasterboard (100% recycled industrial gypsum)', 0.1800, 'Recycled drywall partition board.'),
    ('Fly ash bio-composite acoustic tile', 0.1800, 'Suspended acoustic ceiling tile.'),
    ('Terrazzo tile with 80% recycled glass aggregate', 0.1800, 'Decorative polished interior floor tile.'),
    ('Bamboo strand woven flooring', 0.2100, 'High-hardness interior bamboo flooring planks.'),
    ('Magnesium oxide (MgO) wallboard, low-embodied carbon', 0.2100, 'Fireproof & mold-resistant interior drywall board.'),
    ('Recycled glass micro-sphere lightweight filler', 0.2100, 'Lightweight additive for interior plasters & paints.'),
    ('Plant-oil wood sealant and floor oil', 0.2200, 'Penetrating natural floor protection oil.'),
    ('Calcined gypsum plasterboard with 100% recycled paper facing', 0.2200, 'Standard drywall partition sheet.'),
    ('Natural casein milk protein paint', 0.2400, 'Zero-VOC historic interior wall paint.'),
    ('Bamboo fiber composite acoustic panel', 0.2400, 'High-frequency sound absorbing wall panel.'),
    ('Natural linseed oil wood finish / stain', 0.2800, 'Deep-penetrating interior wood stain.'),
    ('Magnesium oxychloride cement board (green board)', 0.1850, 'Moisture-resistant interior backer board.'),
    ('Geopolymer based thermal insulation tile', 0.2800, 'Fire-resistant thermal insulation ceiling tile.'),
    ('Micro-algae bio-pigment interior wall paint', 0.3100, 'Sustainable interior architectural emulsion paint.'),
    ('Perlite expanded insulation loose fill, natural', 0.3100, 'Non-combustible attic & partition loose-fill.'),
    ('Recycled tire rubber acoustic underlayment mat', 0.3200, 'Heavy acoustic impact isolation underlayment.'),
    ('Pine resin bio-polyurethane board', 0.3500, 'Bio-based rigid insulation board.'),
    ('Exfoliated vermiculite loose fill insulation', 0.3500, 'High-temperature chimney & loft loose-fill insulation.'),
    ('Recycled paper counter top with bio-resin (PaperStone)', 0.3800, 'Durable interior solid surface countertop.'),
    ('Fibrillated cellulose reinforced calcium silicate board', 0.4200, '2-hour fire-rated internal partition board.'),
    ('Recycled steel studs for drywall framing', 0.4500, 'Non-structural interior partition framing studs.'),
    ('Sustainably harvested natural latex foam mattress insulation', 0.4500, 'Hypoallergenic natural acoustic insulation.'),
    ('Foamed cell glass insulation board (100% recycled glass cullet)', 0.4800, 'Zero-moisture flat roof & floor insulation board.'),
    ('Bio-polyethylene foam board from sugarcane ethanol', 0.5100, 'Closed-cell acoustic floor underlayment.'),
    ('Recycled corrugated galvanized iron sheet', 0.5800, 'Corrugated metal roof covering.'),
    ('Ultra-thin eco-glass panel for interior partitions', 0.5800, 'Interior office dividing glass wall partition.'),
    ('Recycled polyolefin cavity wall insulation bead', 0.6100, 'Injected cavity wall thermal insulation.'),
    ('Recycled ocean-bound plastic ceiling panel', 0.6800, 'Suspended acoustic ceiling grid panel.'),
    ('Plant-derived bio-binder mineral wool insulation batt', 0.7200, 'Formaldehyde-free mineral wool roof insulation.'),
    ('Recycled glass and bio-epoxy solid surface countertop', 0.7200, 'Cast recycled glass interior countertop.'),
    ('Recycled vinyl composition tile (VCT) flooring', 0.7600, 'High-traffic commercial interior flooring tile.'),
    ('Recycled aluminum expanded mesh ceiling tile', 0.7600, 'Architectural drop ceiling expanded metal tile.'),
    ('Zero-VOC water-based acrylic paint', 0.8200, 'Low-odor interior wall and ceiling paint.'),
    ('Bio-based polylactic acid (PLA) carpet fiber', 0.8200, 'Stain-resistant bio-polymer interior carpet.'),
    ('Bio-based PVC alternative (Polyolefin) flexible flooring', 0.8200, 'Non-toxic resilient interior sheet flooring.'),
    ('Recycled lead sheet for flashing (95% recycled)', 0.8200, 'Roof valley and chimney waterproofing flashing.'),
    ('Recycled PET plastic insulation batt (100% recycled bottles)', 0.8500, 'Thermal roof rafter and wall insulation batt.'),
    ('Low-embodied carbon stone wool insulation slab', 0.8800, 'Non-combustible fire barrier roof & wall slab.'),
    ('Recycled PET polyester fiber acoustic baffle', 0.8800, 'Suspended architectural sound absorbing baffle.'),
    ('Bio-based polyurethane carpet cushion underlay', 0.8900, 'Soft luxury carpet cushion underlayment.'),
    ('Recycled PET acoustic wall felt / board', 0.9200, 'Decorative interior acoustic wall felt panel.'),
    ('Recycled PVC waterproof roofing membrane (min 60% scrap)', 0.9800, 'Flat roof single-ply waterproof membrane.'),
    ('Recycled zinc standing seam roofing panel (70% recycled)', 1.0500, 'Long-life standing seam metal roof panel.'),
    ('Recycled copper sheet / roofing (90% recycled)', 1.1000, 'Architectural standing seam copper roof.'),
    ('Recycled carpet tiles with 80% recycled nylon face & backing', 1.1200, 'Modular commercial office carpet tiles.'),
    ('Bio-based epoxy floor resin coating', 1.1500, 'Seamless high-gloss bio-epoxy floor coating.'),
    ('Soy-based polyol rigid insulation foam board', 1.1800, 'Roof and cavity rigid foam insulation.'),
    ('Recycled brass plumbing valve assembly', 1.1800, 'Interior water distribution and plumbing valves.'),
    ('Recycled brass pipe fittings (85% scrap content)', 1.2500, 'Interior domestic plumbing connections.'),
    ('Bio-based polyurethane spray foam insulation (soybean oil based)', 1.2500, 'Airtight cavity spray foam roof insulation.'),
    ('Recycled scrap copper wiring, insulated with bio-PVC', 1.3200, 'Interior electrical branch power wiring.'),
    ('Bio-based PIR insulation board with recycled facing', 1.3800, 'High R-value flat roof thermal insulation board.'),
    ('Recycled bronze door hardware and fittings', 1.4000, 'Interior architectural door handles & hinges.'),
    ('TPO (Thermoplastic Polyolefin) single-ply roofing membrane', 1.4200, 'White reflective heat-shield flat roof membrane.'),
    ('Expanded Polystyrene (EPS) with 50% recycled content', 1.4500, 'Under-slab and ceiling polystyrene insulation.'),
    ('Extruded Polystyrene (XPS) with low-GWP blowing agent & 30% recycled', 1.6500, 'Moisture-proof inverted flat roof insulation.'),
    ('Phase Change Material (PCM) micro-encapsulated plasterboard', 1.8500, 'Passive thermal regulating interior drywall.'),
    ('Vacuum Insulation Panel (VIP) with fumed silica core', 2.1000, 'Ultra-thin space-saving roof terrace insulation.'),
    ('Aerogel blanket insulation (ultra-high thermal resistance)', 3.4000, 'Ultra-insulating thermal break insulation blanket.')
]

def make_id(name):
    clean = re.sub(r'[^a-zA-Z0-9_]', '_', name.lower())
    clean = re.sub(r'_+', '_', clean).strip('_')
    return clean[:40]

classes_data = [
    {
        "class_id": "substructure",
        "class_name": "Substructure & Foundation",
        "role_in_building": "Load transfer to bedrock/soil, moisture barrier, seismic footing foundation",
        "lca_significance": "Heavy mass (~30% building weight), critical upfront embodied carbon (A1-A3), 100-yr permanent lifespan",
        "default_mass_ratio_kg_per_m2": 300.0,
        "normal": substructure_normal,
        "green": substructure_green
    },
    {
        "class_id": "superstructure",
        "class_name": "Superstructure & Structural Frame",
        "role_in_building": "Primary structural gravity support (columns, beams, slabs) and lateral wind/earthquake stability",
        "lca_significance": "Primary driver of structural embodied carbon, highly vulnerable to seismic and temperature fatigue",
        "default_mass_ratio_kg_per_m2": 500.0,
        "normal": superstructure_normal,
        "green": superstructure_green
    },
    {
        "class_id": "facade",
        "class_name": "Enclosure, Facade & Exterior Walls",
        "role_in_building": "Building envelope weatherproofing, thermal insulation barrier, acoustic dampening, solar shielding",
        "lca_significance": "Undergoes repeated renovation/resealing (B4-B5) every 25-30 years, exposed to extreme climate wear",
        "default_mass_ratio_kg_per_m2": 160.0,
        "normal": facade_normal,
        "green": facade_green
    },
    {
        "class_id": "roofing_insulation",
        "class_name": "Roofing, Insulation & Internal Partitions",
        "role_in_building": "Thermal resistance (R-value), passive interior climate regulation, fireproofing & room division",
        "lca_significance": "Shortest replacement cycle (20-25 yrs), direct impact on operational HVAC energy and end-of-life disposal",
        "default_mass_ratio_kg_per_m2": 60.0,
        "normal": roofing_normal,
        "green": roofing_green
    }
]

# Write building_service.py
with open("backend/app/services/building_service.py", "w", encoding="utf-8") as f:
    f.write('''"""
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
''')
    for c in classes_data:
        f.write(f'''    MaterialClassDefinition(
        class_id="{c['class_id']}",
        class_name="{c['class_name']}",
        role_in_building="{c['role_in_building']}",
        lca_significance="{c['lca_significance']}",
        default_mass_ratio_kg_per_m2={c['default_mass_ratio_kg_per_m2']},
        materials=[
''')
            # Normal materials
        for name, gwp, desc in c['normal']:
            mat_id = make_id(name)
            f.write(f'''            MaterialClassItem(
                id="{mat_id}",
                name={json.dumps(name)},
                base_gwp={gwp},
                is_green=False,
                description={json.dumps(desc)}
            ),
''')
            # Green materials
        for name, gwp, desc in c['green']:
            mat_id = make_id(name)
            f.write(f'''            MaterialClassItem(
                id="{mat_id}",
                name={json.dumps(name)},
                base_gwp={gwp},
                is_green=True,
                description={json.dumps(desc)}
            ),
''')
        f.write('''        ]
    ),
''')
    f.write('''
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
''')

print("Successfully generated building_service.py with all 275+ materials!")
