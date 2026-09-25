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
import './BuildingLCA.css';

const API = (import.meta.env.VITE_API_URL || '') + '/api/v1';

// Fallback curated classes if API request is pending or offline
const DEFAULT_CLASSES = [
  {
    class_id: 'substructure',
    class_name: 'Substructure & Foundation',
    role_in_building: 'Load transfer to bedrock/subgrade soil, ground moisture barrier, seismic foundation integrity',
    lca_significance: 'Heavy mass (~30% building weight), critical upfront embodied carbon (A1-A3), 100-yr permanent lifespan',
    materials: [
      { id: 'rc_ready_found', name: 'Concrete (Ready mix - general)', base_gwp: 0.130, is_green: false, description: 'Standard C25/30 ready-mix concrete for foundation grade slabs.' },
      { id: 'cem_i_found', name: 'Portland cement, general, CEM I', base_gwp: 0.860, is_green: false, description: 'Traditional virgin Portland cement standard foundation mix.' },
      { id: 'lc3_found', name: 'Low-carbon concrete with LC3', base_gwp: 0.095, is_green: true, description: 'Limestone Calcined Clay Cement reducing clinker ratio by up to 50%.', benefits: '40% lower embodied carbon with superior sulfate & chloride durability.' },
      { id: 'ggbs_found', name: 'Recycled glass pozzolan mortar mix', base_gwp: 0.042, is_green: true, description: 'High industrial byproduct replacement foundation binder.', benefits: 'Dramatically lower upfront emissions with excellent moisture resistance.' },
    ]
  },
  {
    class_id: 'superstructure',
    class_name: 'Superstructure & Structural Frame',
    role_in_building: 'Primary gravity structural support (columns, beams, floor slabs) and lateral wind/seismic stability',
    lca_significance: 'Primary driver of structural embodied carbon, highly vulnerable to seismic and temperature fatigue',
    materials: [
      { id: 'steel_virgin', name: 'Structural steel, virgin / BOF', base_gwp: 2.450, is_green: false, description: 'Traditional blast furnace structural steel sections.' },
      { id: 'rc_super', name: 'Reinforced Concrete (C30/37 structural)', base_gwp: 0.165, is_green: false, description: 'Standard reinforced concrete frame with high-tensile steel rebar.' },
      { id: 'clt_timber', name: 'Cross-Laminated Timber (CLT)', base_gwp: -0.610, is_green: true, description: 'Engineered solid wood multi-layer panels providing carbon sequestration.', benefits: 'Net-negative embodied carbon (-0.61 kg CO₂e/kg) storing biogenic carbon.' },
      { id: 'bamboo_glubam', name: 'Bamboo laminated timber beam (Glubam)', base_gwp: 0.180, is_green: true, description: 'Fast-growing structural bamboo composite beams with high tensile capacity.', benefits: 'Rapidly renewable crop, high strength-to-weight ratio.' },
    ]
  },
  {
    class_id: 'facade',
    class_name: 'Enclosure, Facade & Exterior Walls',
    role_in_building: 'Building envelope weatherproofing, thermal insulation barrier, acoustic dampening, solar shielding',
    lca_significance: 'Undergoes repeated renovation/resealing (B4-B5) every 25-30 years, exposed to extreme climate wear',
    materials: [
      { id: 'clay_brick', name: 'Standard Clay Facing Brick', base_gwp: 0.240, is_green: false, description: 'Fired clay external brickwork with Portland mortar backing.' },
      { id: 'curtain_wall', name: 'Double-Glazed Curtain Wall Glass', base_gwp: 1.400, is_green: false, description: 'Aluminum mullion framed double-glazed exterior facade system.' },
      { id: 'hempcrete_wall', name: 'Hempcrete block, density 300 kg/m3', base_gwp: -0.410, is_green: true, description: 'Hemp shiv and lime binder masonry block providing continuous envelope insulation.', benefits: 'Carbon negative biocomposite, breathable, excellent thermal inertia.' },
      { id: 'ceb_clay', name: 'Compressed Earth Block (CEB), unfired natural clay', base_gwp: 0.018, is_green: true, description: 'Unfired clay stabilized with minimal lime, zero high-temperature kiln firing.', benefits: 'Virtually zero upfront carbon footprint with superb thermal mass.' },
    ]
  },
  {
    class_id: 'roofing_insulation',
    class_name: 'Roofing, Insulation & Internal Partitions',
    role_in_building: 'Thermal resistance (R-value), passive interior climate regulation, fireproofing & room division',
    lca_significance: 'Shortest replacement cycle (20-25 yrs), direct impact on operational HVAC energy and end-of-life disposal',
    materials: [
      { id: 'xps_foam', name: 'Extruded Polystyrene (XPS) Rigid Foam', base_gwp: 2.800, is_green: false, description: 'Petrochemical polymer extruded foam insulation boards.' },
      { id: 'mineral_wool', name: 'Stone / Mineral Wool Insulation', base_gwp: 1.250, is_green: false, description: 'Melted rock spun into fiber batts with phenolic resin binder.' },
      { id: 'wood_fiberboard', name: 'Wood fiberboard insulation', base_gwp: -0.450, is_green: true, description: 'Bio-based renewable timber residue insulation board.', benefits: 'Carbon-negative insulation (-0.45 kg CO₂e/kg) with high heat storage capacity.' },
      { id: 'mycelium_board', name: 'Mycelium insulation board', base_gwp: -0.150, is_green: true, description: 'Fungal mycelium grown on agricultural sub-products into rigid boards.', benefits: 'Fully biodegradable, non-toxic, naturally fire resistant.' },
      { id: 'biochar_render', name: 'Bio-char enriched clay render', base_gwp: -0.550, is_green: true, description: 'Internal clay plaster enriched with carbonized biomass bio-char.', benefits: 'Permanently sequesters carbon while regulating indoor humidity.' },
    ]
  }
];

const BuildingLCA = () => {
  const [classes, setClasses] = useState(DEFAULT_CLASSES);
  const [selectedMaterials, setSelectedMaterials] = useState({
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
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const [activeChartTab, setActiveChartTab] = useState('trajectory'); // 'trajectory' | 'stages' | 'classes'

  // Fetch classes on mount
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
    fetchClasses();
    // Run initial calculation
    handleCalculate();
  }, []);

  const handleSelectMaterial = (classId, materialName) => {
    setSelectedMaterials(prev => ({
      ...prev,
      [classId]: materialName
    }));
  };

  const handleCalculate = async () => {
    setLoading(true);
    setError(null);
    try {
      const payload = {
        substructure: { material_name: selectedMaterials.substructure },
        superstructure: { material_name: selectedMaterials.superstructure },
        facade: { material_name: selectedMaterials.facade },
        roofing_insulation: { material_name: selectedMaterials.roofing_insulation },
        gross_floor_area_m2: Number(gfa),
        building_type: buildingType,
        transit_distance_km: Number(transitDistance),
        vehicle_type: vehicleType,
        temperature_anomaly: Number(tempAnomaly),
        extreme_weather_events: Number(extremeEvents),
        sea_level_rise: Number(seaLevelRise),
        policy_score: Number(policyScore),
      };

      const res = await axios.post(`${API}/building/calculate`, payload);
      setResult(res.data);
    } catch (err) {
      console.error('Building LCA error:', err);
      setError(err.response?.data?.detail || 'Failed to calculate whole building LCA. Check connection.');
    } finally {
      setLoading(false);
    }
  };

  // Preset scenarios
  const applyPreset = (presetName) => {
    if (presetName === 'deep-green') {
      setSelectedMaterials({
        substructure: 'Low-carbon concrete with LC3',
        superstructure: 'Cross-Laminated Timber (CLT)',
        facade: 'Hempcrete block, density 300 kg/m3',
        roofing_insulation: 'Wood fiberboard insulation'
      });
    } else if (presetName === 'conventional') {
      setSelectedMaterials({
        substructure: 'Portland cement, general, CEM I',
        superstructure: 'Structural steel, virgin / BOF',
        facade: 'Standard Clay Facing Brick',
        roofing_insulation: 'Extruded Polystyrene (XPS) Rigid Foam'
      });
    } else if (presetName === 'hybrid') {
      setSelectedMaterials({
        substructure: 'Concrete (Ready mix - general)',
        superstructure: 'Bamboo laminated timber beam (Glubam)',
        facade: 'Double-Glazed Curtain Wall Glass',
        roofing_insulation: 'Mycelium insulation board'
      });
    }
  };

  // Stage Breakdown Chart Data
  const stageChartData = result?.stage_breakdown ? Object.entries(result.stage_breakdown).map(([stage, val]) => ({
    stage: stage.split(' (')[0],
    fullName: stage,
    tonnes: val,
  })) : [];

  // Class Breakdown Chart Data
  const classChartData = result?.assemblies ? result.assemblies.map(a => ({
    name: a.class_name.split(' & ')[0],
    material: a.material_name,
    embodied: a.embodied_A1A3_tonnes,
    transport: a.transport_A4_tonnes,
    calamity: a.calamity_climate_B1B7_tonnes,
    total: a.total_100yr_tonnes,
  })) : [];

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
          <span className="preset-label">Quick Presets:</span>
          <button className="preset-pill green" onClick={() => applyPreset('deep-green')}>
            <Leaf size={13} /> Deep Green Bio-Building
          </button>
          <button className="preset-pill" onClick={() => applyPreset('hybrid')}>
            <Sparkles size={13} /> Modern Hybrid
          </button>
          <button className="preset-pill warning" onClick={() => applyPreset('conventional')}>
            Conventional Baseline
          </button>
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
                const currentSelected = selectedMaterials[cls.class_id];
                return (
                  <div key={cls.class_id} className="class-section">
                    <div className="class-header">
                      <div className="class-number-badge">{idx + 1}</div>
                      <div>
                        <h4 className="class-title">{cls.class_name}</h4>
                        <p className="class-role">
                          <strong>Role:</strong> {cls.role_in_building}
                        </p>
                        <p className="class-lca-note">
                          <strong>LCA Impact:</strong> {cls.lca_significance}
                        </p>
                      </div>
                    </div>

                    <div className="material-options-grid">
                      {cls.materials.map(mat => {
                        const isSelected = currentSelected === mat.name;
                        return (
                          <div
                            key={mat.id || mat.name}
                            className={`mat-option-card ${isSelected ? 'selected' : ''} ${mat.is_green ? 'green-tier' : ''}`}
                            onClick={() => handleSelectMaterial(cls.class_id, mat.name)}
                          >
                            <div className="mat-card-top">
                              <span className="mat-name">{mat.name}</span>
                              {isSelected && <CheckCircle2 size={16} className="check-icon" />}
                            </div>

                            <div className="mat-stats-row">
                              <span className={`gwp-tag ${mat.base_gwp < 0 ? 'carbon-negative' : mat.is_green ? 'green' : 'standard'}`}>
                                {mat.base_gwp < 0 ? '🌱 Carbon Negative: ' : 'Base GWP: '}
                                <strong>{mat.base_gwp.toFixed(3)}</strong> kg CO₂e/kg
                              </span>
                              {mat.is_green && (
                                <span className="eco-badge">
                                  <Leaf size={11} /> Green Material
                                </span>
                              )}
                            </div>

                            <p className="mat-desc">{mat.description}</p>
                            {mat.benefits && (
                              <p className="mat-benefits">
                                <Sparkles size={11} /> {mat.benefits}
                              </p>
                            )}
                          </div>
                        );
                      })}
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
                  Calculate Whole-Building Lifecycle Carbon
                </>
              )}
            </button>
          </div>
        </div>

        {/* ══ RIGHT COLUMN: Charts, Timeline & Metrics ══ */}
        <div className="wblca-results-col">
          {error && (
            <div className="wblca-error-box">
              <AlertTriangle size={18} />
              <span>{error}</span>
            </div>
          )}

          {/* KPI Summary Cards */}
          {result?.summary && (
            <div className="kpi-grid">
              <div className="kpi-card highlight">
                <span className="kpi-sub">Total 100-Year Building Carbon</span>
                <div className="kpi-value-row">
                  <span className="kpi-num">{result.summary.total_100yr_tonnes.toLocaleString()}</span>
                  <span className="kpi-unit">t CO₂e</span>
                </div>
                <span className="kpi-footnote">
                  Intensity: <strong>{result.summary.intensity_kg_co2e_per_m2} kg CO₂e/m²</strong>
                </span>
              </div>

              <div className="kpi-card savings">
                <span className="kpi-sub">Carbon Avoided vs Baseline</span>
                <div className="kpi-value-row">
                  <span className="kpi-num text-emerald">-{result.summary.carbon_savings_percentage}%</span>
                  <span className="kpi-unit text-emerald">({result.summary.carbon_savings_tonnes.toLocaleString()} t)</span>
                </div>
                <span className="kpi-footnote">
                  vs Conventional Baseline ({result.summary.baseline_100yr_tonnes.toLocaleString()} t)
                </span>
              </div>

              <div className="kpi-card">
                <span className="kpi-sub">Upfront Embodied (A1–A5)</span>
                <div className="kpi-value-row">
                  <span className="kpi-num">
                    {(result.summary.upfront_embodied_A1A3_tonnes + result.summary.transport_A4_tonnes + result.summary.construction_A5_tonnes).toFixed(1)}
                  </span>
                  <span className="kpi-unit">t CO₂e</span>
                </div>
                <span className="kpi-footnote">
                  Handover footprint at Year 0
                </span>
              </div>

              <div className="kpi-card">
                <span className="kpi-sub">Dynamic Calamity Burden (B1/B7)</span>
                <div className="kpi-value-row">
                  <span className="kpi-num text-amber">
                    +{result.summary.calamity_climate_B1B7_tonnes.toFixed(1)}
                  </span>
                  <span className="kpi-unit">t CO₂e</span>
                </div>
                <span className="kpi-footnote">
                  100-yr climate degradation risk surcharge
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
                  {activeChartTab === 'trajectory' && 'Tracking carbon accumulation from Handover (Yr 0) across 25, 50, 75, and 100-year horizons.'}
                  {activeChartTab === 'stages' && 'Emissions allocated by LCA modules: A1-A3 Procurement, A4 Logistics, A5 Erection, B2-B5 Maintenance, B1/B7 Calamity, C1-C4 End of Life.'}
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

            <div className="chart-render-wrap">
              {result?.timeline_trajectory && activeChartTab === 'trajectory' && (
                <ResponsiveContainer width="100%" height={360}>
                  <AreaChart
                    data={result.timeline_trajectory}
                    margin={{ top: 20, right: 30, left: 10, bottom: 20 }}
                  >
                    <defs>
                      <linearGradient id="gradSelected" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#00d4aa" stopOpacity={0.6} />
                        <stop offset="100%" stopColor="#00d4aa" stopOpacity={0.05} />
                      </linearGradient>
                      <linearGradient id="gradBaseline" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#f43f5e" stopOpacity={0.4} />
                        <stop offset="100%" stopColor="#f43f5e" stopOpacity={0.05} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(56,90,150,0.2)" vertical={false} />
                    <XAxis
                      dataKey="label"
                      tick={{ fill: 'var(--text-secondary)', fontSize: 12 }}
                      axisLine={false}
                      tickLine={false}
                    />
                    <YAxis
                      domain={['auto', 'auto']}
                      tick={{ fill: 'var(--text-muted)', fontSize: 11 }}
                      axisLine={false}
                      tickLine={false}
                      tickFormatter={v => `${(v / 1000).toFixed(1)}k t`}
                      label={{ value: 'Cumulative Tonnes CO₂e', angle: -90, position: 'insideLeft', fill: 'var(--text-muted)', fontSize: 11, dy: 60 }}
                    />
                    <Tooltip
                      content={({ active, payload, label }) => {
                        if (!active || !payload?.length) return null;
                        return (
                          <div className="wblca-tooltip">
                            <p className="tooltip-title">{label}</p>
                            {payload.map((p, i) => (
                              <p key={i} style={{ color: p.color, margin: '3px 0' }}>
                                <span className="tooltip-dot" style={{ backgroundColor: p.color }} />
                                {p.name}: <strong>{Number(p.value).toLocaleString()} t CO₂e</strong>
                              </p>
                            ))}
                            {payload[0] && payload[1] && (
                              <p className="tooltip-avoided">
                                🌿 Carbon Avoided: <strong>{Math.max(0, payload[1].value - payload[0].value).toLocaleString()} t CO₂e</strong>
                              </p>
                            )}
                          </div>
                        );
                      }}
                    />
                    <Legend verticalAlign="top" height={36} wrapperStyle={{ paddingBottom: 10 }} />
                    <Area
                      type="monotone"
                      dataKey="cumulative_tonnes"
                      name="Your Selected Building Design"
                      stroke="#00d4aa"
                      strokeWidth={3}
                      fill="url(#gradSelected)"
                      dot={{ r: 5, fill: '#00d4aa', strokeWidth: 2, stroke: '#0d1525' }}
                    />
                    <Area
                      type="monotone"
                      dataKey="baseline_cumulative_tonnes"
                      name="Conventional Baseline Building"
                      stroke="#f43f5e"
                      strokeWidth={2}
                      strokeDasharray="5 5"
                      fill="url(#gradBaseline)"
                      dot={{ r: 4, fill: '#f43f5e' }}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              )}

              {result?.stage_breakdown && activeChartTab === 'stages' && (
                <ResponsiveContainer width="100%" height={360}>
                  <BarChart
                    data={stageChartData}
                    margin={{ top: 20, right: 30, left: 10, bottom: 20 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(56,90,150,0.2)" vertical={false} />
                    <XAxis
                      dataKey="stage"
                      tick={{ fill: 'var(--text-secondary)', fontSize: 11 }}
                      axisLine={false}
                      tickLine={false}
                    />
                    <YAxis
                      domain={['auto', 'auto']}
                      tick={{ fill: 'var(--text-muted)', fontSize: 11 }}
                      axisLine={false}
                      tickLine={false}
                      tickFormatter={v => `${v.toFixed(0)} t`}
                      label={{ value: 'Tonnes CO₂e', angle: -90, position: 'insideLeft', fill: 'var(--text-muted)', fontSize: 11, dy: 40 }}
                    />
                    <Tooltip
                      content={({ active, payload }) => {
                        if (!active || !payload?.length) return null;
                        const data = payload[0].payload;
                        return (
                          <div className="wblca-tooltip">
                            <p className="tooltip-title">{data.fullName}</p>
                            <p style={{ color: payload[0].color }}>
                              Emissions: <strong>{Number(data.tonnes).toLocaleString()} tonnes CO₂e</strong>
                            </p>
                          </div>
                        );
                      }}
                    />
                    <Bar dataKey="tonnes" name="Lifecycle Stage Emissions" radius={[6, 6, 0, 0]} maxBarSize={60}>
                      {stageChartData.map((entry, index) => {
                        const colors = ['#00d4aa', '#38bdf8', '#818cf8', '#a78bfa', '#fbbf24', '#f87171'];
                        return <Cell key={`cell-${index}`} fill={entry.tonnes < 0 ? '#10b981' : colors[index % colors.length]} />;
                      })}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              )}

              {result?.assemblies && activeChartTab === 'classes' && (
                <ResponsiveContainer width="100%" height={360}>
                  <BarChart
                    data={classChartData}
                    margin={{ top: 20, right: 30, left: 10, bottom: 20 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(56,90,150,0.2)" vertical={false} />
                    <XAxis
                      dataKey="name"
                      tick={{ fill: 'var(--text-secondary)', fontSize: 12 }}
                      axisLine={false}
                      tickLine={false}
                    />
                    <YAxis
                      domain={['auto', 'auto']}
                      tick={{ fill: 'var(--text-muted)', fontSize: 11 }}
                      axisLine={false}
                      tickLine={false}
                      tickFormatter={v => `${v.toFixed(0)} t`}
                      label={{ value: 'Tonnes CO₂e', angle: -90, position: 'insideLeft', fill: 'var(--text-muted)', fontSize: 11, dy: 40 }}
                    />
                    <Tooltip
                      content={({ active, payload }) => {
                        if (!active || !payload?.length) return null;
                        const d = payload[0].payload;
                        return (
                          <div className="wblca-tooltip">
                            <p className="tooltip-title">{d.name}</p>
                            <p className="tooltip-sub">Material: {d.material}</p>
                            <p style={{ color: '#00d4aa' }}>Upfront Embodied: <strong>{d.embodied} t</strong></p>
                            <p style={{ color: '#38bdf8' }}>Transport A4: <strong>{d.transport} t</strong></p>
                            <p style={{ color: '#fbbf24' }}>Calamity Surcharge: <strong>{d.calamity} t</strong></p>
                            <p style={{ color: '#fff', borderTop: '1px solid rgba(255,255,255,0.1)', paddingTop: 4, marginTop: 4 }}>
                              Total 100-Yr Impact: <strong>{d.total} t</strong>
                            </p>
                          </div>
                        );
                      }}
                    />
                    <Legend verticalAlign="top" height={36} />
                    <Bar dataKey="embodied" name="Upfront Embodied (A1-A3)" fill="#00d4aa" stackId="a" />
                    <Bar dataKey="transport" name="Logistics Transit (A4)" fill="#38bdf8" stackId="a" />
                    <Bar dataKey="calamity" name="Dynamic Calamity (B1/B7)" fill="#fbbf24" stackId="a" radius={[6, 6, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>

          {/* Detailed Assembly Matrix Table */}
          {result?.assemblies && (
            <div className="wblca-table-card">
              <h4 className="table-heading">Whole-Building Lifecycle Inventory Matrix</h4>
              <p className="table-sub">Detailed stage-by-stage carbon accountancy per assembly class over 100 years.</p>
              
              <div className="table-responsive">
                <table className="wblca-table">
                  <thead>
                    <tr>
                      <th>Assembly Class</th>
                      <th>Selected Material</th>
                      <th>Mass (t)</th>
                      <th>Base GWP</th>
                      <th>A1–A3 (t)</th>
                      <th>A4 Transit (t)</th>
                      <th>Maintenance (t)</th>
                      <th>Calamity (t)</th>
                      <th>Total 100-Yr (t)</th>
                    </tr>
                  </thead>
                  <tbody>
                    {result.assemblies.map(a => (
                      <tr key={a.class_id}>
                        <td><strong>{a.class_name}</strong></td>
                        <td>
                          <span className="mat-cell-name">{a.material_name}</span>
                        </td>
                        <td>{a.mass_tonnes.toLocaleString()}</td>
                        <td className={a.base_gwp < 0 ? 'text-emerald font-semibold' : ''}>
                          {a.base_gwp.toFixed(3)}
                        </td>
                        <td className={a.embodied_A1A3_tonnes < 0 ? 'text-emerald font-semibold' : ''}>
                          {a.embodied_A1A3_tonnes.toLocaleString()}
                        </td>
                        <td>{a.transport_A4_tonnes.toLocaleString()}</td>
                        <td>{a.maintenance_B2B5_tonnes.toLocaleString()}</td>
                        <td className="text-amber">+{a.calamity_climate_B1B7_tonnes.toLocaleString()}</td>
                        <td>
                          <strong className={a.total_100yr_tonnes < 0 ? 'text-emerald' : ''}>
                            {a.total_100yr_tonnes.toLocaleString()}
                          </strong>
                        </td>
                      </tr>
                    ))}
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
