import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import MaterialSelector from './MaterialSelector';
import {
  BarChart, Bar, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Cell, ReferenceLine, Legend
} from 'recharts';
import {
  Leaf, Thermometer, Waves, Wind, ShieldCheck,
  AlertTriangle, Loader2, ChevronDown, Search, X,
  TrendingUp, TrendingDown, Minus, FlaskConical,
  Globe, MapPin, Lock, Info, ChevronRight, Zap,
  Truck, Fuel, Bike, Navigation, Scale, Box, CheckCircle2,
  Building2, Calendar, Layers, BarChart3
} from 'lucide-react';
import BuildingLCA from './BuildingLCA.jsx';
import './Dashboard.css';

const API = (import.meta.env.VITE_API_URL || '') + '/api/v1';

/* ── Custom Recharts Tooltip ── */
const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="chart-tooltip">
      <p className="chart-tooltip-label">{label}</p>
      {payload.map((p, i) => {
        if (p.value === null || p.value === undefined) return null;
        const formatted = typeof p.value === 'number' ? p.value.toFixed(4) : p.value;
        return (
          <p key={i} style={{ color: p.color || '#38bdf8', margin: '4px 0', fontSize: '0.8rem' }}>
            <span style={{ display: 'inline-block', width: 8, height: 8, borderRadius: '50%', backgroundColor: p.color || '#38bdf8', marginRight: 6 }} />
            {p.name}: <strong>{formatted} kg CO₂e/kg</strong>
          </p>
        );
      })}
    </div>
  );
};

/* ── Slider Component ── */
const ClimateSlider = ({ icon: Icon, label, unit, value, min, max, step, color, onChange }) => {
  const pct = ((value - min) / (max - min)) * 100;
  return (
    <div className="slider-row">
      <div className="slider-header">
        <div className="slider-icon" style={{ '--icon-color': color }}>
          <Icon size={15} />
        </div>
        <span className="slider-label">{label}</span>
        <span className="slider-value" style={{ color }}>
          {value > 0 && max !== 50 ? '+' : ''}{value.toFixed(1)}
          <span className="slider-unit">{unit}</span>
        </span>
      </div>
      <div className="slider-track-wrap">
        <div className="slider-fill" style={{ width: `${pct}%`, background: color }} />
        <input
          type="range" min={min} max={max} step={step} value={value}
          onChange={e => onChange(parseFloat(e.target.value))}
          className="slider-input"
          style={{ '--thumb-color': color }}
        />
      </div>
      <div className="slider-bounds">
        <span>{min}{unit}</span><span>{max}{unit}</span>
      </div>
    </div>
  );
};

/* ── Hazard Intensity Slider ── */
const HAZARD_PRESETS = [
  { label: 'Inland Baseline',    value: 5,  title: 'Low exposure — continental interior, minimal typhoon/storm risk' },
  { label: 'Urban Average',      value: 15, title: 'Moderate exposure — typical metropolitan area' },
  { label: 'Coastal Hazard Zone', value: 35, title: 'High exposure — coastal / typhoon corridor with storm surge risk' },
];

const HazardSlider = ({ value, onChange }) => {
  const color = 'var(--amber)';
  const min = 0; const max = 50; const step = 0.5;
  const pct = ((value - min) / (max - min)) * 100;
  const [tipOpen, setTipOpen] = useState(false);

  return (
    <div className="slider-row hazard-slider-row">
      <div className="slider-header">
        <div className="slider-icon" style={{ '--icon-color': color }}>
          <AlertTriangle size={15} />
        </div>
        <span className="slider-label">
          Extreme Hazard Intensity Index (<em>H</em><sub>i</sub>)
        </span>
        <button
          className="hazard-info-btn"
          onClick={() => setTipOpen(o => !o)}
          title="What is this index?"
          aria-label="Show index description"
        >
          <Info size={12} />
        </button>
        <span className="slider-value" style={{ color }}>
          {value.toFixed(1)}
          <span className="slider-unit"> / 50</span>
        </span>
      </div>

      {tipOpen && (
        <div className="hazard-tooltip">
          <p className="hazard-tooltip-text">
            A normalized index (0–50) combining regional typhoon frequency,
            heavy precipitation, and coastal storm surge intensity.
          </p>
        </div>
      )}

      <div className="hazard-presets">
        {HAZARD_PRESETS.map(p => (
          <button
            key={p.value}
            className={`hazard-preset-btn ${value === p.value ? 'active' : ''}`}
            onClick={() => onChange(p.value)}
            title={p.title}
          >
            {p.label}
            <span className="hazard-preset-val">{p.value}</span>
          </button>
        ))}
      </div>

      <div className="slider-track-wrap">
        <div className="slider-fill" style={{ width: `${pct}%`, background: color }} />
        <input
          type="range" min={min} max={max} step={step} value={value}
          onChange={e => onChange(parseFloat(e.target.value))}
          className="slider-input"
          style={{ '--thumb-color': color }}
        />
      </div>
      <div className="slider-bounds">
        <span>0 (Calm)</span><span>50 (Catastrophic)</span>
      </div>
    </div>
  );
};

/* ── Metric Card ── */
const MetricCard = ({ label, value, unit, icon: Icon, color, delta, subtitle }) => {
  const TrendIcon = delta > 0 ? TrendingUp : delta < 0 ? TrendingDown : Minus;
  return (
    <div className="metric-card" style={{ '--card-accent': color }}>
      <div className="metric-top">
        <span className="metric-label">{label}</span>
        <div className="metric-icon" style={{ background: `${color}18`, color }}>
          <Icon size={16} />
        </div>
      </div>
      <div className="metric-value">
        {value !== null && value !== undefined ? (
          <>
            <span className="metric-number">{value.toFixed(4)}</span>
            <span className="metric-unit">{unit}</span>
          </>
        ) : (
          <span className="metric-placeholder">—</span>
        )}
      </div>
      {subtitle && (
        <div className="metric-subtitle">{subtitle}</div>
      )}
      {delta !== undefined && value !== null && value !== undefined && (
        <div className="metric-delta" style={{ color: delta > 0 ? 'var(--rose)' : delta < 0 ? 'var(--teal)' : 'var(--text-muted)' }}>
          <TrendIcon size={12} />
          <span>{delta > 0 ? '+' : ''}{delta.toFixed(4)} vs baseline</span>
        </div>
      )}
    </div>
  );
};

/* ── Region / Model Selector ── */
const REGIONS = [
  {
    id: 'global',
    label: 'Global Baseline (ICE V5)',
    icon: Globe,
    active: true,
    phase: 'Phase 1',
  },
];

const RegionSelector = () => {
  const current = REGIONS[0];
  const CurrentIcon = current.icon;

  return (
    <div className="region-selector">
      <div className="region-btn" style={{ cursor: 'default' }}>
        <CurrentIcon size={13} />
        <span className="region-btn-label">{current.label}</span>
      </div>
    </div>
  );
};

/* ── Vehicle Fleet Specifications ── */
const FLEET_VEHICLES = [
  {
    type: 'Electric Van',
    icon: Zap,
    curbKg: 1500,
    baseRate: 40.0,
    badge: 'EV Zero-Tailpipe',
    accent: 'var(--teal)',
    desc: 'Light Commercial EV (1,500 kg curb, 40 g/km)',
  },
  {
    type: 'Diesel Van',
    icon: Truck,
    curbKg: 2000,
    baseRate: 180.0,
    badge: 'Standard Diesel',
    accent: 'var(--amber)',
    desc: 'Heavy Transport Van (2,000 kg curb, 180 g/km)',
  },
  {
    type: 'CNG Truck',
    icon: Fuel,
    curbKg: 970,
    baseRate: 120.0,
    badge: 'Clean Natural Gas',
    accent: 'var(--cyan)',
    desc: 'Medium Utility Truck (970 kg curb, 120 g/km)',
  },
  {
    type: 'Bike',
    icon: Bike,
    curbKg: 120,
    baseRate: 25.0,
    badge: 'Micro Logistics',
    accent: 'var(--rose)',
    desc: 'Cargo Two-Wheeler (120 kg curb, 25 g/km)',
  },
];


/* ══════════════════════════════════════════════════════════════
   Main Dashboard
══════════════════════════════════════════════════════════════ */
export default function Dashboard() {
  const [materials, setMaterials]   = useState([]);
  const [matLoading, setMatLoading] = useState(true);
  const [selected, setSelected]     = useState('');

  /* Climate Parameters */
  const [params, setParams] = useState({
    extreme_weather_events: 15.0,
    temperature_anomaly:    1.2,
    sea_level_rise:         12.0,
    policy_score:           65.0,
  });

  /* Transportation Parameters (LCA Stage A4) */
  const [transportActive, setTransportActive] = useState(true);
  const [transportParams, setTransportParams] = useState({
    vehicle_type:   'Diesel Van',
    distance_km:    50.0,
    load_weight_kg: 1000.0,
  });

  const [result, setResult]         = useState(null);
  const [altResult, setAltResult]   = useState(null);
  const [predicting, setPredicting] = useState(false);
  const [error, setError]           = useState(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  
  const [mainTab, setMainTab]       = useState('material'); // 'material' | 'building'
  const [chartMode, setChartMode]   = useState('stages');   // 'stages' | 'trajectory'

  const [alternatives, setAlternatives] = useState([]);
  const [selectedAlternative, setSelectedAlternative] = useState('');

  /* Fetch material list on mount */
  useEffect(() => {
    axios.get(`${API}/materials`)
      .then(r => { setMaterials(r.data.materials); setMatLoading(false); })
      .catch(() => { setError('Could not reach the backend. Is FastAPI running on port 8000?'); setMatLoading(false); });
  }, []);

  /* Fetch alternatives when material selected */
  useEffect(() => {
    if (!selected) {
      setAlternatives([]);
      setSelectedAlternative('');
      return;
    }
    axios.get(`${API}/materials/${encodeURIComponent(selected)}/alternatives`)
      .then(r => setAlternatives(r.data.alternatives))
      .catch(e => console.error("Failed to fetch alternatives", e));
  }, [selected]);

  /* Client-side live estimate of transport emissions */
  const selectedVehicleObj = FLEET_VEHICLES.find(v => v.type === transportParams.vehicle_type) || FLEET_VEHICLES[1];
  const totalWeight = selectedVehicleObj.curbKg + transportParams.load_weight_kg;
  const weightFactor = totalWeight / selectedVehicleObj.curbKg;
  const estTransportEmissionsG = selectedVehicleObj.baseRate * transportParams.distance_km * weightFactor;
  const estTransportEmissionsKg = estTransportEmissionsG / 1000.0;
  const estPerKgTransportCo2e = transportParams.load_weight_kg > 0 ? (estTransportEmissionsKg / transportParams.load_weight_kg) : 0;

  /* Trigger prediction */
  const predict = async () => {
    if (!selected) return;
    setPredicting(true);
    setError(null);
    try {
      const payload = {
        material_name: selected,
        ...params,
        transport: transportActive ? {
          vehicle_type: transportParams.vehicle_type,
          distance_km: transportParams.distance_km,
          load_weight_kg: transportParams.load_weight_kg,
        } : null,
      };

      const req1 = axios.post(`${API}/predict`, payload);
      let req2 = null;
      if (selectedAlternative) {
        req2 = axios.post(`${API}/predict`, { ...payload, material_name: selectedAlternative });
      }

      if (req2) {
        const [res1, res2] = await Promise.all([req1, req2]);
        setResult(res1.data);
        setAltResult(res2.data);
      } else {
        const res = await req1;
        setResult(res.data);
        setAltResult(null);
      }
    } catch (e) {
      setError(e.response?.data?.detail || 'Prediction failed. Check the backend logs.');
      setResult(null);
      setAltResult(null);
    } finally {
      setPredicting(false);
    }
  };

  /* Chart data building */
  let chartData = [];
  if (result) {
    if (result.transport) {
      chartData = [
        {
          name: '1. Upfront Embodied\n(A1–A3)',
          shortName: 'A1–A3 Embodied',
          Original: Number(result.base_gwp_A1A3 ?? 0),
          ...(altResult ? { Alternative: Number(altResult.base_gwp_A1A3 ?? 0) } : {}),
        },
        {
          name: '2. Logistics Transit\n(A4)',
          shortName: 'A4 Transport',
          Original: Number(result.transport.per_kg_transport_co2e ?? 0),
          ...(altResult?.transport ? { Alternative: Number(altResult.transport.per_kg_transport_co2e ?? 0) } : {}),
        },
        {
          name: '3. 100-yr Dynamic\n(B1–B7 Calamity)',
          shortName: '100-yr Calamity',
          Original: Number(result.predicted_100yr_gwp ?? 0),
          ...(altResult ? { Alternative: Number(altResult.predicted_100yr_gwp ?? 0) } : {}),
        },
        {
          name: '4. Total Lifecycle\n(Cradle-to-Lifespan)',
          shortName: 'Net Lifecycle',
          Original: Number(result.total_lifecycle_carbon || (result.predicted_100yr_gwp + result.transport.per_kg_transport_co2e)),
          ...(altResult ? { Alternative: Number(altResult.total_lifecycle_carbon || (altResult.predicted_100yr_gwp + (altResult.transport?.per_kg_transport_co2e || 0))) } : {}),
        },
      ];
    } else {
      chartData = [
        {
          name: 'Baseline GWP\n(A1–A3)',
          shortName: 'Baseline A1-A3',
          Original: Number(result.base_gwp_A1A3 ?? 0),
          ...(altResult ? { Alternative: Number(altResult.base_gwp_A1A3 ?? 0) } : {}),
        },
        {
          name: 'Predicted 100-yr\nDynamic GWP',
          shortName: '100-yr Predicted',
          Original: Number(result.predicted_100yr_gwp ?? 0),
          ...(altResult ? { Alternative: Number(altResult.predicted_100yr_gwp ?? 0) } : {}),
        },
      ];
    }
  }

  /* 100-Year Dynamic Trajectory Data */
  let trajectoryData = [];
  if (result) {
    const origBase = Number(result.base_gwp_A1A3 ?? 0);
    const origTransport = Number(result.transport?.per_kg_transport_co2e ?? 0);
    const origPred = Number(result.predicted_100yr_gwp ?? origBase);
    const origPenalty = Math.max(0, origPred - origBase);
    const origYr0 = origBase + origTransport;

    const altBase = altResult ? Number(altResult.base_gwp_A1A3 ?? 0) : null;
    const altTransport = altResult?.transport ? Number(altResult.transport.per_kg_transport_co2e ?? 0) : 0;
    const altPred = altResult ? Number(altResult.predicted_100yr_gwp ?? altBase) : null;
    const altPenalty = altPred !== null ? Math.max(0, altPred - altBase) : 0;
    const altYr0 = altBase !== null ? altBase + altTransport : null;

    trajectoryData = [
      {
        year: 'Year 0 (Handover)',
        stage: 'As-Built (A1-A4)',
        Original: Number(origYr0.toFixed(4)),
        ...(altYr0 !== null ? { Alternative: Number(altYr0.toFixed(4)) } : {})
      },
      {
        year: 'Year 25 (Horizon I)',
        stage: '25-yr Horizon',
        Original: Number((origYr0 + origPenalty * 0.25).toFixed(4)),
        ...(altYr0 !== null ? { Alternative: Number((altYr0 + altPenalty * 0.25).toFixed(4)) } : {})
      },
      {
        year: 'Year 50 (Renovation)',
        stage: '50-yr Horizon',
        Original: Number((origYr0 + origPenalty * 0.50).toFixed(4)),
        ...(altYr0 !== null ? { Alternative: Number((altYr0 + altPenalty * 0.50).toFixed(4)) } : {})
      },
      {
        year: 'Year 75 (Refit)',
        stage: '75-yr Horizon',
        Original: Number((origYr0 + origPenalty * 0.75).toFixed(4)),
        ...(altYr0 !== null ? { Alternative: Number((altYr0 + altPenalty * 0.75).toFixed(4)) } : {})
      },
      {
        year: 'Year 100 (End of Life)',
        stage: '100-yr Lifespan',
        Original: Number((origYr0 + origPenalty).toFixed(4)),
        ...(altYr0 !== null ? { Alternative: Number((altYr0 + altPenalty).toFixed(4)) } : {})
      },
    ];
  }

  const penalty = result ? result.calamity_carbon_penalty : undefined;

  return (
    <div className="dashboard">

      {/* ── Header ── */}
      <header className="header">
        <div className="header-brand">
          <div className="header-logo">
            <Leaf size={22} />
          </div>
          <div className="header-title-group">
            <div className="header-title-row">
              <h1 className="header-title">Project Vardan</h1>
              <span className="phase-badge">
                <Zap size={11} />
                Phase 3: Universal Baseline Engine
                <span className="phase-badge-active">Active</span>
              </span>
            </div>
            <p className="header-sub">GWP Intelligence Engine · ICE V5 Database · LCA Stage A1–A4 & B1–B7</p>
          </div>
        </div>

        {/* ── Tab Switcher: Material vs Whole Building ── */}
        <nav className="header-nav-tabs">
          <button
            className={`nav-tab-btn ${mainTab === 'material' ? 'active' : ''}`}
            onClick={() => setMainTab('material')}
          >
            <FlaskConical size={14} /> Material LCA & Alternatives
          </button>
          <button
            className={`nav-tab-btn ${mainTab === 'building' ? 'active' : ''}`}
            onClick={() => setMainTab('building')}
          >
            <Building2 size={14} /> Complete Building LCA (100 years)
          </button>
        </nav>

        <div className="header-right">
          <RegionSelector />
          <div className="header-badge">
            <span className="badge-dot" />
            API Live
          </div>
          <button
            className="info-btn"
            onClick={() => setDrawerOpen(o => !o)}
            title="View Phase 2 Roadmap"
          >
            <Info size={16} />
          </button>
        </div>
      </header>

      {mainTab === 'building' ? (
        <main className="main-building-wrap">
          <BuildingLCA />
        </main>
      ) : (
        <main className="main-grid">

        {/* ══ LEFT PANEL: Controls ══ */}
        <aside className="panel panel-controls">

          <section className="panel-section">
            <h2 className="section-title">
              <FlaskConical size={15} /> 1. Material Selection (A1–A3)
            </h2>
            <MaterialSelector
              materials={materials}
              selected={selected}
              onSelect={setSelected}
              loading={matLoading}
            />
            <p className="section-hint">{materials.length} ICE V5 materials available</p>

            {alternatives.length > 0 && (
              <div className="alternatives-wrap">
                <h3 className="alternatives-title">🌿 Green Alternatives (Optional)</h3>
                <p className="alternatives-desc">Select an alternative to compare emissions.</p>
                <div className="alternatives-list">
                  {alternatives.map(alt => (
                    <div 
                      key={alt.material_name} 
                      className={`alternative-card ${selectedAlternative === alt.material_name ? 'selected' : ''}`}
                      onClick={() => setSelectedAlternative(alt.material_name === selectedAlternative ? '' : alt.material_name)}
                    >
                      <div className="alt-name">{alt.material_name}</div>
                      <div className="alt-carbon">{alt.embodied_carbon.toFixed(3)} kgCO₂e/kg</div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </section>

          <div className="divider" />

          {/* Section 2: Transportation & Logistics (LCA A4) */}
          <section className="panel-section transport-panel-section">
            <div className="section-header-row">
              <h2 className="section-title">
                <Truck size={15} /> 2. Transport Logistics (A4)
              </h2>
              <label className="toggle-switch-wrap" title="Toggle Transportation Emissions Calculation">
                <input
                  type="checkbox"
                  checked={transportActive}
                  onChange={e => setTransportActive(e.target.checked)}
                  className="toggle-checkbox"
                />
                <span className="toggle-slider" />
                <span className="toggle-label">{transportActive ? 'Active' : 'Off'}</span>
              </label>
            </div>

            {transportActive ? (
              <div className="transport-controls-wrap">
                {/* Fleet Grid */}
                <div className="fleet-grid">
                  {FLEET_VEHICLES.map(v => {
                    const VIcon = v.icon;
                    const isSelected = transportParams.vehicle_type === v.type;
                    return (
                      <button
                        key={v.type}
                        className={`fleet-card ${isSelected ? 'active' : ''}`}
                        onClick={() => setTransportParams(p => ({ ...p, vehicle_type: v.type }))}
                        style={{ '--vehicle-accent': v.accent }}
                      >
                        <div className="fleet-card-top">
                          <div className="fleet-card-icon">
                            <VIcon size={16} />
                          </div>
                          <span className="fleet-card-rate">{v.baseRate} g/km</span>
                        </div>
                        <div className="fleet-card-title">{v.type}</div>
                        <div className="fleet-card-curb">Curb: {v.curbKg.toLocaleString()} kg</div>
                      </button>
                    );
                  })}
                </div>

                {/* Distance Slider */}
                <div className="transport-slider-block">
                  <div className="transport-slider-header">
                    <span className="transport-param-label">
                      <Navigation size={13} /> Transit Distance
                    </span>
                    <span className="transport-param-val" style={{ color: 'var(--amber)' }}>
                      {transportParams.distance_km.toFixed(0)} <span className="param-unit">km</span>
                    </span>
                  </div>

                  <div className="slider-track-wrap">
                    <div
                      className="slider-fill"
                      style={{ width: `${(transportParams.distance_km / 400) * 100}%`, background: 'var(--amber)' }}
                    />
                    <input
                      type="range" min={0} max={400} step={1}
                      value={transportParams.distance_km}
                      onChange={e => setTransportParams(p => ({ ...p, distance_km: parseFloat(e.target.value) }))}
                      className="slider-input"
                      style={{ '--thumb-color': 'var(--amber)' }}
                    />
                  </div>
                  <div className="slider-bounds">
                    <span>0 km</span><span>400 km</span>
                  </div>
                </div>

                {/* Payload Weight Slider */}
                <div className="transport-slider-block">
                  <div className="transport-slider-header">
                    <span className="transport-param-label">
                      <Scale size={13} /> Cargo Batch Weight
                    </span>
                    <span className="transport-param-val" style={{ color: 'var(--teal)' }}>
                      {transportParams.load_weight_kg.toLocaleString()} <span className="param-unit">kg</span>
                    </span>
                  </div>

                  <div className="slider-track-wrap">
                    <div
                      className="slider-fill"
                      style={{ width: `${(transportParams.load_weight_kg / 5000) * 100}%`, background: 'var(--teal)' }}
                    />
                    <input
                      type="range" min={10} max={5000} step={10}
                      value={transportParams.load_weight_kg}
                      onChange={e => setTransportParams(p => ({ ...p, load_weight_kg: parseFloat(e.target.value) }))}
                      className="slider-input"
                      style={{ '--thumb-color': 'var(--teal)' }}
                    />
                  </div>
                  <div className="slider-bounds">
                    <span>10 kg</span><span>5,000 kg</span>
                  </div>
                </div>

                {/* Live Transport Math Pill */}
                <div className="transport-live-pill">
                  <div className="pill-item">
                    <span className="pill-lbl">Weight Factor:</span>
                    <span className="pill-val">{weightFactor.toFixed(3)}×</span>
                  </div>
                  <div className="pill-divider" />
                  <div className="pill-item">
                    <span className="pill-lbl">Est. Trip CO₂:</span>
                    <span className="pill-val text-amber">{estTransportEmissionsKg.toFixed(2)} kg</span>
                  </div>
                  <div className="pill-divider" />
                  <div className="pill-item">
                    <span className="pill-lbl">Normalized:</span>
                    <span className="pill-val text-teal">{estPerKgTransportCo2e.toFixed(4)} kg/kg</span>
                  </div>
                </div>
              </div>
            ) : (
              <div className="transport-disabled-note">
                <Truck size={14} className="muted-icon" />
                <span>Transportation carbon calculation bypassed (Cradle-to-Gate only).</span>
              </div>
            )}
          </section>

          <div className="divider" />

          {/* Section 3: Climate Sliders */}
          <section className="panel-section">
            <h2 className="section-title">
              <Wind size={15} /> 3. Climate Calamity Parameters (B1–B7)
            </h2>

            {/* Educational Callout */}
            <div className="mitigation-callout">
              <div className="mitigation-callout-header">
                <div className="mitigation-callout-icon">
                  <Info size={13} />
                </div>
                <span className="mitigation-callout-title">
                  Climate Mitigation vs. Regional Adaptation
                </span>
              </div>
              <p className="mitigation-callout-body">
                Selecting low-carbon materials directly mitigates upfront emissions (A1–A3)
                and clean fleets reduce transit emissions (A4). These sliders stress-test how
                well your structure <em>adapts</em> to local environmental degradation over its{' '}
                <strong>100-year operational lifespan</strong>.
              </p>
            </div>

            <div className="sliders-stack">
              <HazardSlider
                value={params.extreme_weather_events}
                onChange={v => setParams(p => ({ ...p, extreme_weather_events: v }))}
              />
              <ClimateSlider
                icon={Thermometer} label="Temperature Anomaly"
                unit="°C" color="var(--rose)"
                value={params.temperature_anomaly} min={-2.0} max={5.0} step={0.1}
                onChange={v => setParams(p => ({ ...p, temperature_anomaly: v }))}
              />
              <ClimateSlider
                icon={Waves} label="Sea Level Rise"
                unit=" cm" color="var(--cyan)"
                value={params.sea_level_rise} min={-5.0} max={50.0} step={0.5}
                onChange={v => setParams(p => ({ ...p, sea_level_rise: v }))}
              />
              <ClimateSlider
                icon={ShieldCheck} label="Grid Decarbonisation Score"
                unit="" color="var(--teal)"
                value={params.policy_score} min={0} max={100} step={1}
                onChange={v => setParams(p => ({ ...p, policy_score: v }))}
              />
            </div>
          </section>

          <div className="divider" />

          {/* Predict Button */}
          <button
            className={`predict-btn ${predicting ? 'loading' : ''}`}
            onClick={predict}
            disabled={!selected || predicting}
          >
            {predicting ? (
              <><Loader2 size={18} className="spin" /> Running Full Lifecycle Model…</>
            ) : (
              <><TrendingUp size={18} /> Calculate Full Lifecycle Carbon</>
            )}
          </button>

          {error && (
            <div className="error-banner">
              <AlertTriangle size={14} />
              <span>{error}</span>
            </div>
          )}
        </aside>

        {/* ══ RIGHT PANEL: Results ══ */}
        <section className="panel panel-results">

          {/* Metric Cards Grid */}
          <div className={`metrics-grid ${result?.transport ? 'grid-4-cols' : ''}`}>
            <MetricCard
              label="Initial Embodied Carbon (A1–A3)"
              value={result?.base_gwp_A1A3 ?? null}
              unit="kg CO₂e/kg"
              icon={Leaf}
              color="var(--teal)"
              subtitle="Cradle-to-Gate Manufacturing"
            />
            {result?.transport && (
              <MetricCard
                label="Transport Carbon (A4)"
                value={result.transport.per_kg_transport_co2e}
                unit="kg CO₂e/kg"
                icon={Truck}
                color="var(--amber)"
                subtitle={`${result.transport.vehicle_type} · ${result.transport.co2_emissions_kg.toFixed(2)} kg trip CO₂`}
              />
            )}
            <MetricCard
              label="Predicted 100-Yr Dynamic GWP"
              value={result?.predicted_100yr_gwp ?? null}
              unit="kg CO₂e/kg"
              icon={TrendingUp}
              color="var(--cyan)"
              delta={penalty}
              subtitle="Operational Degradation & Calamity"
            />
            {result?.transport ? (
              <MetricCard
                label="Net 100-Yr Project Footprint"
                value={result.total_lifecycle_carbon}
                unit="kg CO₂e/kg"
                icon={CheckCircle2}
                color="var(--violet)"
                subtitle="A1–A3 + A4 + B1–B7 Combined"
              />
            ) : (
              <MetricCard
                label="Calamity & Repair Penalty"
                value={result?.calamity_carbon_penalty ?? null}
                unit="kg CO₂e/kg"
                icon={AlertTriangle}
                color={penalty !== undefined ? (penalty > 0 ? 'var(--rose)' : 'var(--teal)') : 'var(--amber)'}
                subtitle="Attributed Climate Burden"
              />
            )}
          </div>

          {/* Chart Section */}
          <div className="chart-card">
            <div className="chart-header">
              <div>
                <h2 className="chart-title">Lifecycle Carbon Footprint Trajectory</h2>
                <p className="chart-subtitle">
                  {chartMode === 'stages'
                    ? 'Modular breakdown across material manufacturing (A1–A3), transit (A4), and 100-year operational lifespan'
                    : 'Dynamic cumulative emissions across Year 0, 25, 50, 75, and 100-year operational horizons'}
                </p>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
                {result && (
                  <div className="chart-view-toggle">
                    <button
                      className={`chart-toggle-btn ${chartMode === 'stages' ? 'active' : ''}`}
                      onClick={() => setChartMode('stages')}
                      title="View Modular Stage Breakdown"
                    >
                      <Layers size={13} style={{ marginRight: 4 }} /> Stage Breakdown
                    </button>
                    <button
                      className={`chart-toggle-btn ${chartMode === 'trajectory' ? 'active' : ''}`}
                      onClick={() => setChartMode('trajectory')}
                      title="View 100-Year Dynamic Trajectory"
                    >
                      <Calendar size={13} style={{ marginRight: 4 }} /> 100-Yr Trajectory
                    </button>
                  </div>
                )}
                {result && (
                  <span className="chart-material-tag">{result.material_name}</span>
                )}
              </div>
            </div>

            {result ? (
              chartMode === 'stages' ? (
                <ResponsiveContainer width="100%" height={320}>
                  <BarChart data={chartData} barCategoryGap="30%" margin={{ top: 20, right: 30, left: 10, bottom: 20 }}>
                    <defs>
                      <linearGradient id="gradBaseline" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#00d4aa" stopOpacity={0.9} />
                        <stop offset="100%" stopColor="#00d4aa" stopOpacity={0.4} />
                      </linearGradient>
                      <linearGradient id="gradTransport" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#fbbf24" stopOpacity={0.9} />
                        <stop offset="100%" stopColor="#fbbf24" stopOpacity={0.4} />
                      </linearGradient>
                      <linearGradient id="gradPredicted" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#38bdf8" stopOpacity={0.9} />
                        <stop offset="100%" stopColor="#38bdf8" stopOpacity={0.4} />
                      </linearGradient>
                      <linearGradient id="gradTotal" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#a78bfa" stopOpacity={0.9} />
                        <stop offset="100%" stopColor="#a78bfa" stopOpacity={0.4} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(56,90,150,0.2)" vertical={false} />
                    <XAxis
                      dataKey="shortName"
                      tick={{ fill: 'var(--text-secondary)', fontSize: 12, fontFamily: 'Inter' }}
                      axisLine={false} tickLine={false}
                    />
                    <YAxis
                      domain={['auto', 'auto']}
                      tick={{ fill: 'var(--text-muted)', fontSize: 11, fontFamily: 'Inter' }}
                      axisLine={false} tickLine={false}
                      tickFormatter={v => (typeof v === 'number' ? v.toFixed(3) : v)}
                      label={{ value: 'kg CO₂e / kg', angle: -90, position: 'insideLeft', fill: 'var(--text-muted)', fontSize: 11, dy: 50 }}
                    />
                    <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(56,90,150,0.1)' }} />
                    <Legend verticalAlign="top" height={36} wrapperStyle={{ paddingBottom: 10 }} />
                    <Bar dataKey="Original" name={result.material_name} fill="url(#gradTotal)" radius={[8, 8, 0, 0]} maxBarSize={60} />
                    {altResult && (
                      <Bar dataKey="Alternative" name={altResult.material_name} fill="url(#gradBaseline)" radius={[8, 8, 0, 0]} maxBarSize={60} />
                    )}
                    {typeof result.base_gwp_A1A3 === 'number' && (
                      <ReferenceLine
                        y={result.base_gwp_A1A3}
                        stroke="rgba(0,212,170,0.5)"
                        strokeDasharray="6 3"
                        label={{ value: 'A1-A3 Base', fill: 'var(--teal)', fontSize: 11, position: 'right' }}
                      />
                    )}
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <ResponsiveContainer width="100%" height={320}>
                  <AreaChart data={trajectoryData} margin={{ top: 20, right: 30, left: 10, bottom: 20 }}>
                    <defs>
                      <linearGradient id="gradTrajOrig" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#a78bfa" stopOpacity={0.8} />
                        <stop offset="100%" stopColor="#a78bfa" stopOpacity={0.05} />
                      </linearGradient>
                      <linearGradient id="gradTrajAlt" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#00d4aa" stopOpacity={0.8} />
                        <stop offset="100%" stopColor="#00d4aa" stopOpacity={0.05} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(56,90,150,0.2)" vertical={false} />
                    <XAxis
                      dataKey="year"
                      tick={{ fill: 'var(--text-secondary)', fontSize: 11, fontFamily: 'Inter' }}
                      axisLine={false} tickLine={false}
                    />
                    <YAxis
                      domain={['auto', 'auto']}
                      tick={{ fill: 'var(--text-muted)', fontSize: 11, fontFamily: 'Inter' }}
                      axisLine={false} tickLine={false}
                      tickFormatter={v => (typeof v === 'number' ? v.toFixed(3) : v)}
                      label={{ value: 'Cumulative kg CO₂e / kg', angle: -90, position: 'insideLeft', fill: 'var(--text-muted)', fontSize: 11, dy: 60 }}
                    />
                    <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(56,90,150,0.1)' }} />
                    <Legend verticalAlign="top" height={36} wrapperStyle={{ paddingBottom: 10 }} />
                    <Area
                      type="monotone"
                      dataKey="Original"
                      name={result.material_name}
                      stroke="#a78bfa"
                      strokeWidth={3}
                      fill="url(#gradTrajOrig)"
                      dot={{ r: 4, fill: '#a78bfa' }}
                    />
                    {altResult && (
                      <Area
                        type="monotone"
                        dataKey="Alternative"
                        name={altResult.material_name}
                        stroke="#00d4aa"
                        strokeWidth={2.5}
                        fill="url(#gradTrajAlt)"
                        dot={{ r: 4, fill: '#00d4aa' }}
                      />
                    )}
                  </AreaChart>
                </ResponsiveContainer>
              )
            ) : (
              <div className="chart-empty">
                <div className="chart-empty-icon">
                  <TrendingUp size={40} />
                </div>
                <p className="chart-empty-title">No prediction calculated yet</p>
                <p className="chart-empty-hint">
                  Select a material, configure transportation & climate parameters, then click
                  <strong> Calculate Full Lifecycle Carbon</strong>.
                </p>
              </div>
            )}
          </div>

          {/* Transport Detailed Calculation Card */}
          {result?.transport && (
            <div className="transport-detail-card">
              <div className="transport-detail-header">
                <div className="transport-detail-title-group">
                  <Truck size={17} className="text-amber" />
                  <h3 className="transport-detail-title">LCA Stage A4 — Transport & Fleet Calculation Breakdown</h3>
                </div>
                <span className="vehicle-badge">{result.transport.vehicle_type}</span>
              </div>
              <div className="transport-calc-grid">
                <div className="calc-item">
                  <span className="calc-lbl">Vehicle Curb Weight</span>
                  <span className="calc-val">{result.transport.vehicle_weight_kg.toLocaleString()} kg</span>
                </div>
                <div className="calc-item">
                  <span className="calc-lbl">Material Cargo Load</span>
                  <span className="calc-val">{result.transport.load_weight_kg.toLocaleString()} kg</span>
                </div>
                <div className="calc-item">
                  <span className="calc-lbl">Total Gross Weight</span>
                  <span className="calc-val">{result.transport.total_weight_kg.toLocaleString()} kg</span>
                </div>
                <div className="calc-item">
                  <span className="calc-lbl">Transit Distance</span>
                  <span className="calc-val">{result.transport.distance_km} km</span>
                </div>
                <div className="calc-item">
                  <span className="calc-lbl">Base Emission Rate</span>
                  <span className="calc-val">{result.transport.base_emission_g_per_km} g/km</span>
                </div>
                <div className="calc-item">
                  <span className="calc-lbl">Load Weight Factor</span>
                  <span className="calc-val text-amber">{result.transport.weight_factor.toFixed(3)}×</span>
                </div>
                <div className="calc-item highlight-calc">
                  <span className="calc-lbl">Total Trip CO₂ Emissions</span>
                  <span className="calc-val text-amber">{result.transport.co2_emissions_kg.toFixed(2)} kg ({result.transport.co2_emissions_g.toLocaleString()} g)</span>
                </div>
                <div className="calc-item highlight-calc">
                  <span className="calc-lbl">Normalized per kg Material</span>
                  <span className="calc-val text-teal">{result.transport.per_kg_transport_co2e.toFixed(4)} kg CO₂e / kg</span>
                </div>
              </div>
            </div>
          )}

          {/* Footer note */}
          {result && (
            <div className="result-footer">
              <span>Model: Random Forest Regressor · ICE V5 Database · EN 15978 LCA Modules A1–A4 & B1–B7 · {new Date().toLocaleTimeString()}</span>
            </div>
          )}

        </section>
      </main>
      )}

      {/* ── Model Architecture Footer Banner ── */}
      <footer className="roadmap-banner">
        <div className="roadmap-banner-inner">
          <div className="roadmap-banner-icon"><Globe size={15} /></div>
          <p className="roadmap-banner-text">
            <strong>Current system</strong> delivers universal 100-year dynamic GWP and fleet transportation accounting (LCA Stage A1–A4) across global construction materials.
          </p>
          <button className="roadmap-banner-cta" onClick={() => setDrawerOpen(true)}>
            View Model Info <ChevronRight size={13} />
          </button>
        </div>
      </footer>

      {/* ── Model Architecture Info Drawer ── */}
      {drawerOpen && (
        <>
          <div className="drawer-overlay" onClick={() => setDrawerOpen(false)} />
          <aside className="drawer">
            <div className="drawer-header">
              <div className="drawer-title-group">
                <Globe size={18} className="drawer-icon" />
                <h2 className="drawer-title">Model Architecture & LCA Scope</h2>
              </div>
              <button className="drawer-close" onClick={() => setDrawerOpen(false)}>
                <X size={18} />
              </button>
            </div>

            <div className="drawer-body">
              {/* Universal Baseline */}
              <div className="drawer-phase active">
                <div className="drawer-phase-header">
                  <span className="drawer-phase-dot active" />
                  <span className="drawer-phase-label">Active Engine</span>
                </div>
                <h3 className="drawer-phase-title">Universal Baseline & Transportation Engine</h3>
                <p className="drawer-phase-desc">
                  Full lifecycle carbon prediction across 259 ICE V5 construction
                  materials, logistics fleet emissions (LCA Stage A4), and 100-year dynamic GWP
                  stress-testing via a trained Random Forest Regressor.
                </p>
                <div className="drawer-tags">
                  <span className="drawer-tag teal">ICE V5 Database</span>
                  <span className="drawer-tag teal">Random Forest</span>
                  <span className="drawer-tag teal">LCA Stage A1–A4</span>
                  <span className="drawer-tag teal">Logistics Fleet</span>
                </div>
              </div>
            </div>
          </aside>
        </>
      )}
    </div>
  );
}
