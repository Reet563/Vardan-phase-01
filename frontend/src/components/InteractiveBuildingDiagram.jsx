import React, { useState } from 'react';
import { Building2, Sparkles, ChevronDown, ChevronUp, Eye, ShieldCheck, ArrowRight } from 'lucide-react';
import './InteractiveBuildingDiagram.css';

const CLASS_CONFIG = {
  roofing_insulation: {
    number: 4,
    name: 'Roofing & Partitions',
    fullName: 'Roofing, Insulation & Partitions',
    color: '#a78bfa',
    glowColor: 'rgba(167, 139, 250, 0.55)',
    className: 'active-roofing'
  },
  facade: {
    number: 3,
    name: 'Facade & Envelope',
    fullName: 'Enclosure, Facade & Exterior Walls',
    color: '#38bdf8',
    glowColor: 'rgba(56, 189, 248, 0.55)',
    className: 'active-facade'
  },
  superstructure: {
    number: 2,
    name: 'Structural Frame',
    fullName: 'Superstructure & Structural Frame',
    color: '#f59e0b',
    glowColor: 'rgba(245, 158, 11, 0.55)',
    className: 'active-superstructure'
  },
  substructure: {
    number: 1,
    name: 'Substructure & Foundation',
    fullName: 'Substructure & Foundation',
    color: '#10b981',
    glowColor: 'rgba(16, 185, 129, 0.55)',
    className: 'active-substructure'
  }
};

const InteractiveBuildingDiagram = ({
  hoveredClass,
  onHoverClass,
  onSelectClass,
  selectedNormalMaterials = {},
  selectedGreenMaterials = {}
}) => {
  const [isCollapsed, setIsCollapsed] = useState(false);

  const handleKeyDown = (e, classId) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      onSelectClass?.(classId);
    }
  };

  const activeConfig = hoveredClass ? CLASS_CONFIG[hoveredClass] : null;

  return (
    <div className={`interactive-building-card sticky-companion ${isCollapsed ? 'collapsed' : ''}`}>
      {/* ── Compact Header with Collapse Toggle ── */}
      <div className="building-diagram-header">
        <div className="diagram-title-wrap">
          <Building2 size={16} className="icon-cyan" />
          <h4 className="diagram-heading">Architectural Assembly Cutaway</h4>
          <span className="diagram-a11y-pill">
            <Sparkles size={11} /> Live Hover Sync
          </span>
        </div>

        <div className="diagram-header-actions">
          {activeConfig && (
            <span
              className="active-indicator-tag"
              style={{ color: activeConfig.color, borderColor: activeConfig.color }}
            >
              Tier {activeConfig.number}: {activeConfig.name}
            </span>
          )}
          <button
            type="button"
            className="collapse-toggle-btn"
            onClick={() => setIsCollapsed(!isCollapsed)}
            aria-label={isCollapsed ? 'Expand architectural model' : 'Collapse architectural model'}
            title={isCollapsed ? 'Expand model' : 'Collapse model'}
          >
            {isCollapsed ? <ChevronDown size={14} /> : <ChevronUp size={14} />}
          </button>
        </div>
      </div>

      {!isCollapsed && (
        <div className="diagram-body-layout">
          {/* ── Left/Center: Vector Cutaway Model (Compact Aspect Ratio) ── */}
          <div className="building-svg-wrapper">
            <svg
              viewBox="0 0 460 260"
              className="building-svg-compact"
              role="img"
              aria-label="Interactive 4-tier architectural cutaway diagram with accessible lighting"
            >
              <defs>
                {/* Default Ambient Gradients */}
                <linearGradient id="gradRoofDefault" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#2e2d52" />
                  <stop offset="100%" stopColor="#18182e" />
                </linearGradient>
                <linearGradient id="gradFacadeDefault" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#1e3a5f" />
                  <stop offset="100%" stopColor="#0f2038" />
                </linearGradient>
                <linearGradient id="gradSuperDefault" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#45311b" />
                  <stop offset="100%" stopColor="#24180a" />
                </linearGradient>
                <linearGradient id="gradSubDefault" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#14382e" />
                  <stop offset="100%" stopColor="#091f19" />
                </linearGradient>

                {/* Illuminated Vibrant Active Gradients */}
                <linearGradient id="gradRoofActive" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#8b5cf6" />
                  <stop offset="100%" stopColor="#4c1d95" />
                </linearGradient>
                <linearGradient id="gradFacadeActive" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#0284c7" />
                  <stop offset="100%" stopColor="#0369a1" />
                </linearGradient>
                <linearGradient id="gradSuperActive" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#d97706" />
                  <stop offset="100%" stopColor="#78350f" />
                </linearGradient>
                <linearGradient id="gradSubActive" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#059669" />
                  <stop offset="100%" stopColor="#064e3b" />
                </linearGradient>

                {/* Glazing Window Grid Pattern */}
                <pattern id="glazingPatternCompact" width="18" height="15" patternUnits="userSpaceOnUse">
                  <rect x="1.5" y="1.5" width="15" height="12" rx="1.5" fill="rgba(56, 189, 248, 0.16)" stroke="rgba(56, 189, 248, 0.45)" strokeWidth="0.75" />
                </pattern>
              </defs>

              {/* ══════════ TIER 4: ROOFING & PARTITIONS ══════════ */}
              <g
                className={`building-layer-group ${hoveredClass === 'roofing_insulation' ? 'active active-roofing' : (hoveredClass ? 'dimmed' : '')}`}
                onMouseEnter={() => onHoverClass?.('roofing_insulation')}
                onMouseLeave={() => onHoverClass?.(null)}
                onClick={() => onSelectClass?.('roofing_insulation')}
                onKeyDown={(e) => handleKeyDown(e, 'roofing_insulation')}
                tabIndex={0}
                role="button"
                aria-label="Category 4: Roofing, Insulation and Internal Partitions"
              >
                {/* Sloped Roof */}
                <polygon
                  points="110,38 230,14 350,38 325,68 135,68"
                  fill={hoveredClass === 'roofing_insulation' ? 'url(#gradRoofActive)' : 'url(#gradRoofDefault)'}
                  stroke={hoveredClass === 'roofing_insulation' ? '#c4b5fd' : '#6d28d9'}
                  strokeWidth={hoveredClass === 'roofing_insulation' ? 2.2 : 1.2}
                />
                {/* Solar Overlays */}
                <line x1="230" y1="18" x2="230" y2="64" stroke="#a78bfa" strokeWidth="1" strokeDasharray="2 2" />
                <line x1="190" y1="28" x2="195" y2="64" stroke="#a78bfa" strokeWidth="1" strokeDasharray="2 2" />
                <line x1="270" y1="28" x2="265" y2="64" stroke="#a78bfa" strokeWidth="1" strokeDasharray="2 2" />

                {/* Ceiling & Insulation Layer */}
                <rect
                  x="130" y="68" width="200" height="10" rx="2"
                  fill={hoveredClass === 'roofing_insulation' ? '#7c3aed' : '#3b0764'}
                  stroke={hoveredClass === 'roofing_insulation' ? '#ddd6fe' : '#7c3aed'}
                  strokeWidth={hoveredClass === 'roofing_insulation' ? 1.8 : 1}
                />
                {/* Tier 4 Callout Badge */}
                <circle cx="365" cy="45" r="9" fill={hoveredClass === 'roofing_insulation' ? '#8b5cf6' : '#2e2d52'} stroke="#a78bfa" strokeWidth="1.2" />
                <text x="365" y="48.5" textAnchor="middle" fill="#fff" fontSize="9" fontWeight="bold">4</text>
              </g>

              {/* ══════════ TIER 3: FACADE & ENCLOSURE ══════════ */}
              <g
                className={`building-layer-group ${hoveredClass === 'facade' ? 'active active-facade' : (hoveredClass ? 'dimmed' : '')}`}
                onMouseEnter={() => onHoverClass?.('facade')}
                onMouseLeave={() => onHoverClass?.(null)}
                onClick={() => onSelectClass?.('facade')}
                onKeyDown={(e) => handleKeyDown(e, 'facade')}
                tabIndex={0}
                role="button"
                aria-label="Category 3: Enclosure, Facade and Exterior Walls"
              >
                <rect
                  x="130" y="82" width="200" height="56" rx="3"
                  fill={hoveredClass === 'facade' ? 'url(#gradFacadeActive)' : 'url(#gradFacadeDefault)'}
                  stroke={hoveredClass === 'facade' ? '#7dd3fc' : '#0369a1'}
                  strokeWidth={hoveredClass === 'facade' ? 2.2 : 1.2}
                />
                <rect x="136" y="86" width="188" height="48" fill="url(#glazingPatternCompact)" />
                {/* Tier 3 Callout Badge */}
                <circle cx="95" cy="110" r="9" fill={hoveredClass === 'facade' ? '#0284c7' : '#1e3a5f'} stroke="#38bdf8" strokeWidth="1.2" />
                <text x="95" y="113.5" textAnchor="middle" fill="#fff" fontSize="9" fontWeight="bold">3</text>
              </g>

              {/* ══════════ TIER 2: STRUCTURAL FRAME ══════════ */}
              <g
                className={`building-layer-group ${hoveredClass === 'superstructure' ? 'active active-superstructure' : (hoveredClass ? 'dimmed' : '')}`}
                onMouseEnter={() => onHoverClass?.('superstructure')}
                onMouseLeave={() => onHoverClass?.(null)}
                onClick={() => onSelectClass?.('superstructure')}
                onKeyDown={(e) => handleKeyDown(e, 'superstructure')}
                tabIndex={0}
                role="button"
                aria-label="Category 2: Superstructure and Structural Frame"
              >
                <rect
                  x="130" y="142" width="200" height="54" rx="3"
                  fill={hoveredClass === 'superstructure' ? 'url(#gradSuperActive)' : 'url(#gradSuperDefault)'}
                  stroke={hoveredClass === 'superstructure' ? '#fcd34d' : '#b45309'}
                  strokeWidth={hoveredClass === 'superstructure' ? 2.2 : 1.2}
                />
                {/* Structural Columns */}
                <rect x="144" y="145" width="12" height="48" fill={hoveredClass === 'superstructure' ? '#f59e0b' : '#78350f'} rx="1" />
                <rect x="224" y="145" width="12" height="48" fill={hoveredClass === 'superstructure' ? '#f59e0b' : '#78350f'} rx="1" />
                <rect x="304" y="145" width="12" height="48" fill={hoveredClass === 'superstructure' ? '#f59e0b' : '#78350f'} rx="1" />
                {/* Shear Cross-Bracing */}
                <line x1="156" y1="145" x2="224" y2="193" stroke={hoveredClass === 'superstructure' ? '#fbbf24' : 'rgba(245, 158, 11, 0.35)'} strokeWidth="1.2" />
                <line x1="224" y1="145" x2="156" y2="193" stroke={hoveredClass === 'superstructure' ? '#fbbf24' : 'rgba(245, 158, 11, 0.35)'} strokeWidth="1.2" />
                <line x1="236" y1="145" x2="304" y2="193" stroke={hoveredClass === 'superstructure' ? '#fbbf24' : 'rgba(245, 158, 11, 0.35)'} strokeWidth="1.2" />
                <line x1="304" y1="145" x2="236" y2="193" stroke={hoveredClass === 'superstructure' ? '#fbbf24' : 'rgba(245, 158, 11, 0.35)'} strokeWidth="1.2" />
                {/* Tier 2 Callout Badge */}
                <circle cx="365" cy="168" r="9" fill={hoveredClass === 'superstructure' ? '#d97706' : '#45311b'} stroke="#f59e0b" strokeWidth="1.2" />
                <text x="365" y="171.5" textAnchor="middle" fill="#fff" fontSize="9" fontWeight="bold">2</text>
              </g>

              {/* ══════════ TIER 1: SUBSTRUCTURE & FOUNDATION ══════════ */}
              <g
                className={`building-layer-group ${hoveredClass === 'substructure' ? 'active active-substructure' : (hoveredClass ? 'dimmed' : '')}`}
                onMouseEnter={() => onHoverClass?.('substructure')}
                onMouseLeave={() => onHoverClass?.(null)}
                onClick={() => onSelectClass?.('substructure')}
                onKeyDown={(e) => handleKeyDown(e, 'substructure')}
                tabIndex={0}
                role="button"
                aria-label="Category 1: Substructure and Foundation"
              >
                {/* Ground Line */}
                <line x1="60" y1="200" x2="400" y2="200" stroke="#10b981" strokeWidth="1.2" strokeDasharray="3 2" />
                <text x="68" y="196" fill="#10b981" fontSize="7" fontWeight="bold">GRADE LEVEL</text>
                {/* Footing Slab */}
                <rect
                  x="110" y="201" width="240" height="18" rx="2"
                  fill={hoveredClass === 'substructure' ? 'url(#gradSubActive)' : 'url(#gradSubDefault)'}
                  stroke={hoveredClass === 'substructure' ? '#6ee7b7' : '#047857'}
                  strokeWidth={hoveredClass === 'substructure' ? 2.2 : 1.2}
                />
                {/* Piles */}
                <rect x="130" y="219" width="16" height="34" rx="2" fill={hoveredClass === 'substructure' ? '#059669' : '#064e3b'} stroke="#10b981" strokeWidth="0.75" />
                <rect x="222" y="219" width="16" height="34" rx="2" fill={hoveredClass === 'substructure' ? '#059669' : '#064e3b'} stroke="#10b981" strokeWidth="0.75" />
                <rect x="314" y="219" width="16" height="34" rx="2" fill={hoveredClass === 'substructure' ? '#059669' : '#064e3b'} stroke="#10b981" strokeWidth="0.75" />
                {/* Bedrock line */}
                <path d="M 90,253 L 370,253" stroke="#047857" strokeWidth="1.2" strokeDasharray="2 2" />
                {/* Tier 1 Callout Badge */}
                <circle cx="95" cy="226" r="9" fill={hoveredClass === 'substructure' ? '#059669' : '#14382e'} stroke="#10b981" strokeWidth="1.2" />
                <text x="95" y="229.5" textAnchor="middle" fill="#fff" fontSize="9" fontWeight="bold">1</text>
              </g>
            </svg>
          </div>

          {/* ── Right/Companion: Compact 4-Tier Interactive Status Legend ── */}
          <div className="diagram-compact-legend">
            {Object.entries(CLASS_CONFIG).map(([classId, config]) => {
              const isHovered = hoveredClass === classId;
              const normalMat = selectedNormalMaterials[classId] || 'Default Normal';
              const greenMat = selectedGreenMaterials[classId] || 'Default Green';

              return (
                <div
                  key={classId}
                  className={`legend-tier-item ${isHovered ? 'active' : ''}`}
                  onMouseEnter={() => onHoverClass?.(classId)}
                  onMouseLeave={() => onHoverClass?.(null)}
                  onClick={() => onSelectClass?.(classId)}
                  style={{
                    '--tier-color': config.color,
                    '--tier-glow': config.glowColor
                  }}
                >
                  <div className="legend-tier-badge" style={{ background: config.color }}>
                    {config.number}
                  </div>
                  <div className="legend-tier-text">
                    <div className="legend-tier-name">{config.name}</div>
                    <div className="legend-tier-mats">
                      <span className="mat-tag green" title={`Green: ${greenMat}`}>
                        {greenMat}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

export default InteractiveBuildingDiagram;
