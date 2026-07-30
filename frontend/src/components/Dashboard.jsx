import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Cell, ReferenceLine
} from 'recharts';
import {
  Leaf, Thermometer, Waves, Wind, ShieldCheck,
  AlertTriangle, Loader2, ChevronDown, Search, X,
  TrendingUp, TrendingDown, Minus, FlaskConical,
  Globe, MapPin, Lock, Info, ChevronRight, Zap
} from 'lucide-react';
import './Dashboard.css';

const API = (import.meta.env.VITE_API_URL || '') + '/api/v1';

/* ── Custom Recharts Tooltip ── */
const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="chart-tooltip">
      <p className="chart-tooltip-label">{label}</p>
      {payload.map((p, i) => (
        <p key={i} style={{ color: p.color }}>
          {p.name}: <strong>{p.value.toFixed(4)} kg CO₂e/kg</strong>
        </p>
      ))}
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

/* ── Hazard Intensity Slider (specialised first slider) ── */
const HAZARD_PRESETS = [
  { label: 'Inland Baseline',    value: 5,  title: 'Low exposure — continental interior, minimal typhoon/storm risk' },
  { label: 'Urban Average',      value: 15, title: 'Moderate exposure — typical metropolitan area' },
  { label: 'Coastal Hazard Zone', value: 35, title: 'High exposure — coastal / typhoon corridor with storm surge risk' },
];

const HazardSlider = ({ value, onChange }) => {
  const color = 'var(--amber)';
  const min = 0; const max = 50; const step = 0.5;
  const pct = ((value - min) / (max - min)) * 100;
  const [tipOpen, setTipOpen] = React.useState(false);

  return (
    <div className="slider-row hazard-slider-row">

      {/* Header row */}
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

      {/* Collapsible info tooltip */}
      {tipOpen && (
        <div className="hazard-tooltip">
          <p className="hazard-tooltip-text">
            A normalized index (0–50) combining regional typhoon frequency,
            heavy precipitation, and coastal storm surge intensity.
          </p>
        </div>
      )}

      {/* Quick preset buttons */}
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

      {/* Slider track */}
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
const MetricCard = ({ label, value, unit, icon: Icon, color, delta }) => {
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
        {value !== null ? (
          <>
            <span className="metric-number">{value.toFixed(4)}</span>
            <span className="metric-unit">{unit}</span>
          </>
        ) : (
          <span className="metric-placeholder">—</span>
        )}
      </div>
      {delta !== undefined && value !== null && (
        <div className="metric-delta" style={{ color: delta > 0 ? 'var(--rose)' : delta < 0 ? 'var(--teal)' : 'var(--text-muted)' }}>
          <TrendIcon size={12} />
          <span>{delta > 0 ? '+' : ''}{delta.toFixed(4)} vs baseline</span>
        </div>
      )}
    </div>
  );
};

/* ── Searchable Material Dropdown ── */
const MaterialSelector = ({ materials, selected, onSelect, loading }) => {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const ref = useRef(null);

  const filtered = materials.filter(m =>
    m.toLowerCase().includes(query.toLowerCase())
  ).slice(0, 80);

  useEffect(() => {
    const handler = e => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  return (
    <div className="selector-wrap" ref={ref}>
      <button className="selector-btn" onClick={() => setOpen(o => !o)} disabled={loading}>
        <div className="selector-btn-inner">
          <FlaskConical size={16} className="selector-icon" />
          <span className={selected ? 'selector-text' : 'selector-placeholder'}>
            {loading ? 'Loading materials…' : selected || 'Search and select a material…'}
          </span>
        </div>
        <ChevronDown size={16} className={`selector-chevron ${open ? 'open' : ''}`} />
      </button>

      {open && (
        <div className="selector-dropdown">
          <div className="selector-search-wrap">
            <Search size={14} className="selector-search-icon" />
            <input
              autoFocus
              className="selector-search"
              placeholder="Type to filter materials…"
              value={query}
              onChange={e => setQuery(e.target.value)}
            />
            {query && (
              <button className="selector-clear" onClick={() => setQuery('')}>
                <X size={13} />
              </button>
            )}
          </div>
          <div className="selector-list">
            {filtered.length === 0 ? (
              <div className="selector-empty">No materials match "{query}"</div>
            ) : filtered.map(m => (
              <button
                key={m}
                className={`selector-item ${m === selected ? 'active' : ''}`}
                onClick={() => { onSelect(m); setOpen(false); setQuery(''); }}
              >
                {m}
              </button>
            ))}
          </div>
          <div className="selector-footer">
            {filtered.length} of {materials.length} materials
          </div>
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
  {
    id: 'japan',
    label: 'Japan Localized (JIS / JSCE)',
    icon: MapPin,
    active: false,
    phase: 'Phase 2',
  },
];

const RegionSelector = () => {
  const [open, setOpen] = useState(false);
  const [selected, setSelected] = useState('global');
  const ref = useRef(null);

  useEffect(() => {
    const h = e => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  }, []);

  const current = REGIONS.find(r => r.id === selected);
  const CurrentIcon = current.icon;

  return (
    <div className="region-selector" ref={ref}>
      <button className="region-btn" onClick={() => setOpen(o => !o)}>
        <CurrentIcon size={13} />
        <span className="region-btn-label">{current.label}</span>
        <ChevronDown size={12} className={`selector-chevron ${open ? 'open' : ''}`} />
      </button>

      {open && (
        <div className="region-dropdown">
          <p className="region-dropdown-title">Model Regionalization</p>
          {REGIONS.map(r => {
            const RIcon = r.icon;
            return (
              <button
                key={r.id}
                className={`region-item ${
                  r.id === selected ? 'active' : ''
                } ${!r.active ? 'disabled' : ''}`}
                onClick={() => { if (r.active) { setSelected(r.id); setOpen(false); } }}
                disabled={!r.active}
              >
                <div className="region-item-left">
                  <RIcon size={14} />
                  <span>{r.label}</span>
                </div>
                {r.id === selected && r.active && (
                  <span className="region-tag selected">Selected</span>
                )}
                {!r.active && (
                  <span className="region-tag upcoming">{r.phase} Under Development</span>
                )}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
};

/* ══════════════════════════════════════════════════════════════
   Main Dashboard
══════════════════════════════════════════════════════════════ */
export default function Dashboard() {
  const [materials, setMaterials]   = useState([]);
  const [matLoading, setMatLoading] = useState(true);
  const [selected, setSelected]     = useState('');

  const [params, setParams] = useState({
    extreme_weather_events: 15.0,
    temperature_anomaly:    1.2,
    sea_level_rise:         12.0,
    policy_score:           65.0,
  });

  const [result, setResult]       = useState(null);
  const [predicting, setPredicting] = useState(false);
  const [error, setError]         = useState(null);
  const [drawerOpen, setDrawerOpen] = useState(false);

  /* Fetch material list on mount */
  useEffect(() => {
    axios.get(`${API}/materials`)
      .then(r => { setMaterials(r.data.materials); setMatLoading(false); })
      .catch(() => { setError('Could not reach the backend. Is FastAPI running on port 8000?'); setMatLoading(false); });
  }, []);

  /* Trigger prediction */
  const predict = async () => {
    if (!selected) return;
    setPredicting(true);
    setError(null);
    try {
      const { data } = await axios.post(`${API}/predict`, {
        material_name: selected,
        ...params,
      });
      setResult(data);
    } catch (e) {
      setError(e.response?.data?.detail || 'Prediction failed. Check the backend logs.');
      setResult(null);
    } finally {
      setPredicting(false);
    }
  };

  const chartData = result ? [
    { name: 'Baseline GWP\n(A1–A3)', value: result.base_gwp_A1A3,         shortName: 'Baseline' },
    { name: 'Predicted 100-yr\nDynamic GWP',  value: result.predicted_100yr_gwp, shortName: '100-yr Predicted' },
  ] : [];

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
                Phase 1: Universal Baseline Engine
                <span className="phase-badge-active">Active</span>
              </span>
            </div>
            <p className="header-sub">GWP Intelligence Engine · ICE V5 Database</p>
          </div>
        </div>

        <div className="header-right">
          {/* ── Model Regionalization Selector ── */}
          <RegionSelector />

          {/* ── API Live Badge ── */}
          <div className="header-badge">
            <span className="badge-dot" />
            API Live
          </div>

          {/* ── Roadmap Info Trigger ── */}
          <button
            className="info-btn"
            onClick={() => setDrawerOpen(o => !o)}
            title="View Phase 2 Roadmap"
          >
            <Info size={16} />
          </button>
        </div>
      </header>

      <main className="main-grid">

        {/* ══ LEFT PANEL: Controls ══ */}
        <aside className="panel panel-controls">

          {/* Material Selector */}
          <section className="panel-section">
            <h2 className="section-title">
              <FlaskConical size={15} /> Material Selection
            </h2>
            <MaterialSelector
              materials={materials}
              selected={selected}
              onSelect={setSelected}
              loading={matLoading}
            />
            <p className="section-hint">{materials.length} ICE V5 materials available</p>
          </section>

          <div className="divider" />

          {/* Climate Sliders */}
          <section className="panel-section">
            <h2 className="section-title">
              <Wind size={15} /> Climate Calamity Parameters
            </h2>

            {/* ── Educational Callout ── */}
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
                Selecting low-carbon materials (e.g., Fly Ash or Slag) directly
                mitigates upfront manufacturing emissions (A1–A3 GWP). However,
                because atmospheric CO₂ has a century-long residence time, global
                climate hazards will remain elevated. These sliders stress-test how
                well your structure{' '}
                <em>adapts</em> to local environmental degradation — sea surges,
                extreme weather, and thermal stress — over its{' '}
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
              <><Loader2 size={18} className="spin" /> Running Model…</>
            ) : (
              <><TrendingUp size={18} /> Predict 100-yr GWP</>
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

          {/* Metric Cards */}
          <div className="metrics-grid">
            <MetricCard
              label="Initial Embodied Carbon (A1–A3)"
              value={result?.base_gwp_A1A3 ?? null}
              unit="kg CO₂e/kg"
              icon={Leaf}
              color="var(--teal)"
            />
            <MetricCard
              label="Predicted 100-Year Dynamic GWP"
              value={result?.predicted_100yr_gwp ?? null}
              unit="kg CO₂e/kg"
              icon={TrendingUp}
              color="var(--cyan)"
              delta={penalty}
            />
            <MetricCard
              label="Calamity & Repair Carbon Penalty"
              value={result?.calamity_carbon_penalty ?? null}
              unit="kg CO₂e/kg"
              icon={AlertTriangle}
              color={penalty !== undefined ? (penalty > 0 ? 'var(--rose)' : 'var(--teal)') : 'var(--amber)'}
            />
          </div>

          {/* Chart */}
          <div className="chart-card">
            <div className="chart-header">
              <h2 className="chart-title">GWP Trajectory Comparison</h2>
              {result && (
                <span className="chart-material-tag">{result.material_name}</span>
              )}
            </div>

            {result ? (
              <ResponsiveContainer width="100%" height={320}>
                <BarChart data={chartData} barCategoryGap="35%" margin={{ top: 20, right: 30, left: 10, bottom: 20 }}>
                  <defs>
                    <linearGradient id="gradBaseline" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#00d4aa" stopOpacity={0.9} />
                      <stop offset="100%" stopColor="#00d4aa" stopOpacity={0.4} />
                    </linearGradient>
                    <linearGradient id="gradPredicted" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#38bdf8" stopOpacity={0.9} />
                      <stop offset="100%" stopColor="#38bdf8" stopOpacity={0.4} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(56,90,150,0.2)" vertical={false} />
                  <XAxis
                    dataKey="shortName"
                    tick={{ fill: 'var(--text-secondary)', fontSize: 13, fontFamily: 'Inter' }}
                    axisLine={false} tickLine={false}
                  />
                  <YAxis
                    tick={{ fill: 'var(--text-muted)', fontSize: 11, fontFamily: 'Inter' }}
                    axisLine={false} tickLine={false}
                    tickFormatter={v => v.toFixed(3)}
                    label={{ value: 'kg CO₂e / kg', angle: -90, position: 'insideLeft', fill: 'var(--text-muted)', fontSize: 11, dy: 50 }}
                  />
                  <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(56,90,150,0.1)' }} />
                  <Bar dataKey="value" name="GWP" radius={[8, 8, 0, 0]} maxBarSize={100}>
                    <Cell fill="url(#gradBaseline)" />
                    <Cell fill="url(#gradPredicted)" />
                  </Bar>
                  <ReferenceLine
                    y={result.base_gwp_A1A3}
                    stroke="rgba(0,212,170,0.4)"
                    strokeDasharray="6 3"
                    label={{ value: 'Baseline', fill: 'var(--teal)', fontSize: 11, position: 'right' }}
                  />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="chart-empty">
                <div className="chart-empty-icon">
                  <TrendingUp size={40} />
                </div>
                <p className="chart-empty-title">No prediction yet</p>
                <p className="chart-empty-hint">
                  Select a material, adjust the climate parameters, then click
                  <strong> Predict 100-yr GWP</strong>.
                </p>
              </div>
            )}
          </div>

          {/* Footer note */}
          {result && (
            <div className="result-footer">
              <span>Model: Random Forest Regressor · ICE V5 Database · {new Date().toLocaleTimeString()}</span>
            </div>
          )}

        </section>
      </main>

      {/* ── Phase 2 Roadmap Footer Banner ── */}
      <footer className="roadmap-banner">
        <div className="roadmap-banner-inner">
          <div className="roadmap-banner-icon"><Globe size={15} /></div>
          <p className="roadmap-banner-text">
            <strong>Current system</strong> demonstrates the generic 100-year dynamic GWP framework using global ICE V5 baselines.
            <span className="roadmap-phase2-note">
              &nbsp;Phase 2 actively calibrates parameters for Japanese climate hazard matrices
              (salt corrosion, seismic stress) and local JIS / JSCE material standards.
            </span>
          </p>
          <button className="roadmap-banner-cta" onClick={() => setDrawerOpen(true)}>
            View Roadmap <ChevronRight size={13} />
          </button>
        </div>
      </footer>

      {/* ── Phase 2 Roadmap Drawer ── */}
      {drawerOpen && (
        <>
          <div className="drawer-overlay" onClick={() => setDrawerOpen(false)} />
          <aside className="drawer">
            <div className="drawer-header">
              <div className="drawer-title-group">
                <Globe size={18} className="drawer-icon" />
                <h2 className="drawer-title">Model Regionalization Roadmap</h2>
              </div>
              <button className="drawer-close" onClick={() => setDrawerOpen(false)}>
                <X size={18} />
              </button>
            </div>

            <div className="drawer-body">
              {/* Phase 1 */}
              <div className="drawer-phase active">
                <div className="drawer-phase-header">
                  <span className="drawer-phase-dot active" />
                  <span className="drawer-phase-label">Phase 1 — Active</span>
                </div>
                <h3 className="drawer-phase-title">Universal Baseline Engine</h3>
                <p className="drawer-phase-desc">
                  Generic 100-year dynamic GWP prediction across 259 ICE V5 construction
                  materials. Combines embodied carbon baselines with global climate-scenario
                  parameters (extreme weather events, temperature anomaly, sea-level rise,
                  policy decarbonisation score) via a Random Forest Regressor.
                </p>
                <div className="drawer-tags">
                  <span className="drawer-tag teal">ICE V5 Database</span>
                  <span className="drawer-tag teal">Random Forest</span>
                  <span className="drawer-tag teal">Global Baseline</span>
                </div>
              </div>

              <div className="drawer-connector" />

              {/* Phase 2 */}
              <div className="drawer-phase">
                <div className="drawer-phase-header">
                  <span className="drawer-phase-dot" />
                  <span className="drawer-phase-label">Phase 2 — Under Development</span>
                </div>
                <h3 className="drawer-phase-title">
                  <MapPin size={15} /> Japan Localized Engine
                </h3>
                <p className="drawer-phase-desc">
                  Calibration of hazard parameters for the Japanese built environment.
                  Incorporates salt-induced corrosion accelerants from coastal proximity,
                  seismic stress fatigue cycles, and humidity-driven carbonation rates into
                  the GWP penalty model.
                </p>
                <div className="drawer-feature-list">
                  {[
                    'JIS A 5308 / JSCE-G standards material library',
                    'Salt corrosion hazard matrix (coastal zoning)',
                    'Seismic stress fatigue calibration (JMA scale)',
                    'Humidity & freeze-thaw carbonation modelling',
                    'J-Credit Scheme & Tokyo Cap-and-Trade integration',
                  ].map(f => (
                    <div key={f} className="drawer-feature">
                      <Lock size={11} className="drawer-feature-lock" />
                      <span>{f}</span>
                    </div>
                  ))}
                </div>
                <div className="drawer-tags">
                  <span className="drawer-tag amber">JIS Standards</span>
                  <span className="drawer-tag amber">JSCE</span>
                  <span className="drawer-tag amber">Seismic Hazard</span>
                  <span className="drawer-tag amber">Salt Corrosion</span>
                </div>
              </div>
            </div>
          </aside>
        </>
      )}
    </div>
  );
}
