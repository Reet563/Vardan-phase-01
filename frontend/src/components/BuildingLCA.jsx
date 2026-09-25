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
                const normalOptionsCurated = cls.materials.filter(m => !m.is_green).map(m => m.name);
                const greenOptionsCurated = cls.materials.filter(m => m.is_green).map(m => m.name);
                
                const otherNormal = allMaterials.filter(m => !normalOptionsCurated.includes(m));
                const normalOptions = [...normalOptionsCurated, ...otherNormal];
                
                const otherGreen = allMaterials.filter(m => !greenOptionsCurated.includes(m));
                const greenOptions = [...greenOptionsCurated, ...otherGreen];

                return (
                  <div key={cls.class_id} className="class-section" style={{marginBottom: '1.5rem', paddingBottom: '1.5rem', borderBottom: '1px solid var(--border-color)'}}>
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
          {resultGreen?.summary && resultNormal?.summary && (
            <div className="kpi-grid">
              <div className="kpi-card highlight">
                <span className="kpi-sub">Green Building Total (100-Yr)</span>
                <div className="kpi-value-row">
                  <span className="kpi-num">{resultGreen.summary.total_100yr_tonnes.toLocaleString()}</span>
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
                  <span className="kpi-num text-emerald">-{Math.round((1 - resultGreen.summary.total_100yr_tonnes / resultNormal.summary.total_100yr_tonnes) * 100)}%</span>
                </div>
                <span className="kpi-footnote">
                  Saving <strong>{(resultNormal.summary.total_100yr_tonnes - resultGreen.summary.total_100yr_tonnes).toLocaleString()} t CO₂e</strong>
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

            <div className="chart-render-wrap" style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
              {resultNormal?.timeline_trajectory && resultGreen?.timeline_trajectory && activeChartTab === 'trajectory' && (
                <>
                  <div className="chart-block">
                    <h4 style={{ textAlign: 'center', color: 'var(--emerald)', marginBottom: '1rem' }}>Overall Cumulative Building Carbon Trajectory (100 Years) - Green Materials</h4>
                    <ResponsiveContainer width="100%" height={320}>
                      <AreaChart
                        data={resultGreen.timeline_trajectory}
                        margin={{ top: 20, right: 30, left: 10, bottom: 20 }}
                      >
                        <defs>
                          <linearGradient id="gradGreen" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor="#10b981" stopOpacity={0.6} />
                            <stop offset="100%" stopColor="#10b981" stopOpacity={0.05} />
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="rgba(56,90,150,0.2)" vertical={false} />
                        <XAxis dataKey="label" tick={{ fill: 'var(--text-secondary)', fontSize: 12 }} axisLine={false} tickLine={false} />
                        <YAxis tick={{ fill: 'var(--text-muted)', fontSize: 11 }} axisLine={false} tickLine={false} tickFormatter={v => `${(v / 1000).toFixed(1)}k t`} />
                        <Tooltip contentStyle={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: '8px' }} />
                        <Area type="monotone" dataKey="cumulative_tonnes" name="Green Building Trajectory" stroke="#10b981" strokeWidth={3} fill="url(#gradGreen)" dot={{ r: 5, fill: '#10b981' }} />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                  <div className="chart-block">
                    <h4 style={{ textAlign: 'center', color: 'var(--amber)', marginBottom: '1rem' }}>Overall Cumulative Building Carbon Trajectory (100 Years) - Normal Materials</h4>
                    <ResponsiveContainer width="100%" height={320}>
                      <AreaChart
                        data={resultNormal.timeline_trajectory}
                        margin={{ top: 20, right: 30, left: 10, bottom: 20 }}
                      >
                        <defs>
                          <linearGradient id="gradNormal" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor="#f59e0b" stopOpacity={0.6} />
                            <stop offset="100%" stopColor="#f59e0b" stopOpacity={0.05} />
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="rgba(56,90,150,0.2)" vertical={false} />
                        <XAxis dataKey="label" tick={{ fill: 'var(--text-secondary)', fontSize: 12 }} axisLine={false} tickLine={false} />
                        <YAxis tick={{ fill: 'var(--text-muted)', fontSize: 11 }} axisLine={false} tickLine={false} tickFormatter={v => `${(v / 1000).toFixed(1)}k t`} />
                        <Tooltip contentStyle={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: '8px' }} />
                        <Area type="monotone" dataKey="cumulative_tonnes" name="Normal Building Trajectory" stroke="#f59e0b" strokeWidth={3} fill="url(#gradNormal)" dot={{ r: 5, fill: '#f59e0b' }} />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                </>
              )}

              {resultGreen?.stage_breakdown && activeChartTab === 'stages' && (
                <ResponsiveContainer width="100%" height={360}>
                  <BarChart
                    data={Object.entries(resultGreen.stage_breakdown).map(([stage, val]) => ({
                      stage: stage.split(' (')[0],
                      fullName: stage,
                      tonnes: val,
                    }))}
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
                    <Bar dataKey="tonnes" name="Lifecycle Stage Emissions (Green)" radius={[6, 6, 0, 0]} maxBarSize={60}>
                      {Object.entries(resultGreen.stage_breakdown).map(([stage, val], index) => {
                        const colors = ['#00d4aa', '#38bdf8', '#818cf8', '#a78bfa', '#fbbf24', '#f87171'];
                        return <Cell key={`cell-${index}`} fill={val < 0 ? '#10b981' : colors[index % colors.length]} />;
                      })}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              )}

              {resultGreen?.assemblies && activeChartTab === 'classes' && (
                <ResponsiveContainer width="100%" height={360}>
                  <BarChart
                    data={resultGreen.assemblies.map(a => ({
                      name: a.class_name.split(' & ')[0],
                      material: a.material_name,
                      embodied: a.embodied_A1A3_tonnes,
                      transport: a.transport_A4_tonnes,
                      calamity: a.calamity_climate_B1B7_tonnes,
                      total: a.total_100yr_tonnes,
                    }))}
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
                    <Bar dataKey="embodied" name="Upfront Embodied (Green)" fill="#00d4aa" stackId="a" />
                    <Bar dataKey="transport" name="Logistics Transit (Green)" fill="#38bdf8" stackId="a" />
                    <Bar dataKey="calamity" name="Dynamic Calamity (Green)" fill="#fbbf24" stackId="a" radius={[6, 6, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
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
