import React from 'react';
import { Building2, Layers, Sparkles, ShieldCheck } from 'lucide-react';
import './InteractiveBuildingDiagram.css';

const CLASS_CONFIG = {
  roofing_insulation: {
    number: 4,
    name: 'Roofing, Insulation & Partitions',
    color: '#a78bfa',
    glowColor: 'rgba(167, 139, 250, 0.45)',
    className: 'active-roofing'
  },
  facade: {
    number: 3,
    name: 'Enclosure, Facade & Exterior Walls',
    color: '#38bdf8',
    glowColor: 'rgba(56, 189, 248, 0.45)',
    className: 'active-facade'
  },
  superstructure: {
    number: 2,
    name: 'Superstructure & Structural Frame',
    color: '#f59e0b',
    glowColor: 'rgba(245, 158, 11, 0.45)',
    className: 'active-superstructure'
  },
  substructure: {
    number: 1,
    name: 'Substructure & Foundation',
    color: '#10b981',
    glowColor: 'rgba(16, 185, 129, 0.45)',
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
  const activeConfig = hoveredClass ? CLASS_CONFIG[hoveredClass] : null;

  const handleKeyDown = (e, classId) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      onSelectClass?.(classId);
    }
  };

  return (
    <div className="interactive-building-card">
      <div className="building-diagram-header">
        <div className="diagram-title-wrap">
          <Building2 size={16} className="icon-cyan" />
          <div>
            <h4 className="diagram-heading">Interactive Architectural Cutaway Model</h4>
            <p className="diagram-hint">Hover or focus any layer or category below to illuminate corresponding assemblies.</p>
          </div>
        </div>
        <div className="diagram-accessibility-badge">
          <Sparkles size={12} />
          <span>Bi-directional Layer Sync</span>
        </div>
      </div>

      <div className="building-svg-container">
        <svg
          viewBox="0 0 520 340"
          className="building-svg"
          role="img"
          aria-label="Interactive 4-tier architectural building diagram"
        >
          <defs>
            {/* Gradients for Normal State */}
            <linearGradient id="gradRoofDefault" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#2e2d52" />
              <stop offset="100%" stopColor="#1a1a33" />
            </linearGradient>
            <linearGradient id="gradFacadeDefault" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#1e3a5f" />
              <stop offset="100%" stopColor="#0f223d" />
            </linearGradient>
            <linearGradient id="gradSuperDefault" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#45311b" />
              <stop offset="100%" stopColor="#24180a" />
            </linearGradient>
            <linearGradient id="gradSubDefault" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#14382e" />
              <stop offset="100%" stopColor="#091f19" />
            </linearGradient>

            {/* Gradients for Illuminated Active States */}
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

            {/* Structural Column Hatching Pattern */}
            <pattern id="structuralGridPattern" width="16" height="16" patternUnits="userSpaceOnUse">
              <path d="M 0,0 L 16,16 M 16,0 L 0,16" stroke="rgba(255,255,255,0.12)" strokeWidth="1" />
            </pattern>
            {/* Facade Glazing Window Grid */}
            <pattern id="facadeGlazingPattern" width="24" height="20" patternUnits="userSpaceOnUse">
              <rect x="2" y="2" width="20" height="16" rx="2" fill="rgba(56, 189, 248, 0.15)" stroke="rgba(56, 189, 248, 0.4)" strokeWidth="0.8" />
            </pattern>
          </defs>

          {/* ══════════ TIER 4: ROOFING, INSULATION & PARTITIONS (Top) ══════════ */}
          <g
            className={`building-layer-group ${hoveredClass === 'roofing_insulation' ? 'active active-roofing' : (hoveredClass ? 'dimmed' : '')}`}
            onMouseEnter={() => onHoverClass?.('roofing_insulation')}
            onMouseLeave={() => onHoverClass?.(null)}
            onClick={() => onSelectClass?.('roofing_insulation')}
            onKeyDown={(e) => handleKeyDown(e, 'roofing_insulation')}
            tabIndex={0}
            role="button"
            aria-label="Category 4: Roofing, Insulation and Internal Partitions"
            style={{ transformOrigin: '260px 50px' }}
          >
            {/* Sloped Roof Structure & Solar Cap */}
            <polygon
              points="140,45 260,18 380,45 350,85 170,85"
              fill={hoveredClass === 'roofing_insulation' ? 'url(#gradRoofActive)' : 'url(#gradRoofDefault)'}
              stroke={hoveredClass === 'roofing_insulation' ? '#c4b5fd' : '#6d28d9'}
              strokeWidth={hoveredClass === 'roofing_insulation' ? 2.5 : 1.2}
            />
            {/* Solar Panels / Vegetative Roof Pattern Overlay */}
            <polygon points="175,44 260,25 345,44 330,75 190,75" fill="rgba(167, 139, 250, 0.2)" stroke="#a78bfa" strokeWidth="0.75" />
            <line x1="260" y1="25" x2="260" y2="75" stroke="#a78bfa" strokeWidth="1" strokeDasharray="2 2" />
            <line x1="218" y1="35" x2="225" y2="75" stroke="#a78bfa" strokeWidth="1" strokeDasharray="2 2" />
            <line x1="302" y1="35" x2="295" y2="75" stroke="#a78bfa" strokeWidth="1" strokeDasharray="2 2" />

            {/* Acoustic Ceiling & Insulation Slab */}
            <rect
              x="160" y="85" width="200" height="12" rx="2"
              fill={hoveredClass === 'roofing_insulation' ? '#7c3aed' : '#3b0764'}
              stroke={hoveredClass === 'roofing_insulation' ? '#ddd6fe' : '#7c3aed'}
              strokeWidth={hoveredClass === 'roofing_insulation' ? 2 : 1}
            />

            {/* Layer 4 Badge / Text Callout */}
            <rect x="395" y="42" width="115" height="24" rx="4" fill="rgba(15, 23, 42, 0.85)" stroke={hoveredClass === 'roofing_insulation' ? '#a78bfa' : 'rgba(167, 139, 250, 0.3)'} strokeWidth="1" />
            <circle cx="407" cy="54" r="6" fill="#8b5cf6" />
            <text x="407" y="57" textAnchor="middle" fill="#fff" fontSize="8" fontWeight="bold">4</text>
            <text x="420" y="58" fill={hoveredClass === 'roofing_insulation' ? '#c4b5fd' : '#cbd5e1'} fontSize="9.5" fontWeight="600">Roof & Partitions</text>
            <line x1="365" y1="54" x2="395" y2="54" stroke="#a78bfa" strokeWidth="1.2" strokeDasharray="2 2" />
          </g>

          {/* ══════════ TIER 3: ENCLOSURE, FACADE & EXTERIOR WALLS (Upper Mid) ══════════ */}
          <g
            className={`building-layer-group ${hoveredClass === 'facade' ? 'active active-facade' : (hoveredClass ? 'dimmed' : '')}`}
            onMouseEnter={() => onHoverClass?.('facade')}
            onMouseLeave={() => onHoverClass?.(null)}
            onClick={() => onSelectClass?.('facade')}
            onKeyDown={(e) => handleKeyDown(e, 'facade')}
            tabIndex={0}
            role="button"
            aria-label="Category 3: Enclosure, Facade and Exterior Walls"
            style={{ transformOrigin: '260px 135px' }}
          >
            {/* Facade External Box */}
            <rect
              x="160" y="100" width="200" height="72" rx="3"
              fill={hoveredClass === 'facade' ? 'url(#gradFacadeActive)' : 'url(#gradFacadeDefault)'}
              stroke={hoveredClass === 'facade' ? '#7dd3fc' : '#0369a1'}
              strokeWidth={hoveredClass === 'facade' ? 2.5 : 1.2}
            />
            {/* Window & Curtain Wall Pattern */}
            <rect x="168" y="106" width="184" height="60" fill="url(#facadeGlazingPattern)" />
            {/* Louvers / Sunshades */}
            <line x1="160" y1="120" x2="360" y2="120" stroke={hoveredClass === 'facade' ? '#38bdf8' : 'rgba(56, 189, 248, 0.4)'} strokeWidth="1.5" />
            <line x1="160" y1="140" x2="360" y2="140" stroke={hoveredClass === 'facade' ? '#38bdf8' : 'rgba(56, 189, 248, 0.4)'} strokeWidth="1.5" />
            <line x1="160" y1="160" x2="360" y2="160" stroke={hoveredClass === 'facade' ? '#38bdf8' : 'rgba(56, 189, 248, 0.4)'} strokeWidth="1.5" />

            {/* Layer 3 Badge / Text Callout */}
            <rect x="10" y="122" width="125" height="24" rx="4" fill="rgba(15, 23, 42, 0.85)" stroke={hoveredClass === 'facade' ? '#38bdf8' : 'rgba(56, 189, 248, 0.3)'} strokeWidth="1" />
            <circle cx="22" cy="134" r="6" fill="#0284c7" />
            <text x="22" y="137" textAnchor="middle" fill="#fff" fontSize="8" fontWeight="bold">3</text>
            <text x="35" y="138" fill={hoveredClass === 'facade' ? '#7dd3fc' : '#cbd5e1'} fontSize="9.5" fontWeight="600">Facade & Enclosure</text>
            <line x1="135" y1="134" x2="160" y2="134" stroke="#38bdf8" strokeWidth="1.2" strokeDasharray="2 2" />
          </g>

          {/* ══════════ TIER 2: SUPERSTRUCTURE & STRUCTURAL FRAME (Lower Mid) ══════════ */}
          <g
            className={`building-layer-group ${hoveredClass === 'superstructure' ? 'active active-superstructure' : (hoveredClass ? 'dimmed' : '')}`}
            onMouseEnter={() => onHoverClass?.('superstructure')}
            onMouseLeave={() => onHoverClass?.(null)}
            onClick={() => onSelectClass?.('superstructure')}
            onKeyDown={(e) => handleKeyDown(e, 'superstructure')}
            tabIndex={0}
            role="button"
            aria-label="Category 2: Superstructure and Structural Frame"
            style={{ transformOrigin: '260px 210px' }}
          >
            {/* Structural Core Frame */}
            <rect
              x="160" y="175" width="200" height="70" rx="3"
              fill={hoveredClass === 'superstructure' ? 'url(#gradSuperActive)' : 'url(#gradSuperDefault)'}
              stroke={hoveredClass === 'superstructure' ? '#fcd34d' : '#b45309'}
              strokeWidth={hoveredClass === 'superstructure' ? 2.5 : 1.2}
            />
            {/* Structural Columns & Beams */}
            <rect x="175" y="178" width="16" height="64" fill={hoveredClass === 'superstructure' ? '#f59e0b' : '#78350f'} rx="1" />
            <rect x="252" y="178" width="16" height="64" fill={hoveredClass === 'superstructure' ? '#f59e0b' : '#78350f'} rx="1" />
            <rect x="329" y="178" width="16" height="64" fill={hoveredClass === 'superstructure' ? '#f59e0b' : '#78350f'} rx="1" />
            {/* Cross-Bracing / Shear Trusses */}
            <line x1="191" y1="178" x2="252" y2="242" stroke={hoveredClass === 'superstructure' ? '#fbbf24' : 'rgba(245, 158, 11, 0.4)'} strokeWidth="1.5" />
            <line x1="252" y1="178" x2="191" y2="242" stroke={hoveredClass === 'superstructure' ? '#fbbf24' : 'rgba(245, 158, 11, 0.4)'} strokeWidth="1.5" />
            <line x1="268" y1="178" x2="329" y2="242" stroke={hoveredClass === 'superstructure' ? '#fbbf24' : 'rgba(245, 158, 11, 0.4)'} strokeWidth="1.5" />
            <line x1="329" y1="178" x2="268" y2="242" stroke={hoveredClass === 'superstructure' ? '#fbbf24' : 'rgba(245, 158, 11, 0.4)'} strokeWidth="1.5" />

            {/* Layer 2 Badge / Text Callout */}
            <rect x="395" y="198" width="115" height="24" rx="4" fill="rgba(15, 23, 42, 0.85)" stroke={hoveredClass === 'superstructure' ? '#f59e0b' : 'rgba(245, 158, 11, 0.3)'} strokeWidth="1" />
            <circle cx="407" cy="210" r="6" fill="#d97706" />
            <text x="407" y="213" textAnchor="middle" fill="#fff" fontSize="8" fontWeight="bold">2</text>
            <text x="420" y="214" fill={hoveredClass === 'superstructure' ? '#fcd34d' : '#cbd5e1'} fontSize="9.5" fontWeight="600">Structural Frame</text>
            <line x1="360" y1="210" x2="395" y2="210" stroke="#f59e0b" strokeWidth="1.2" strokeDasharray="2 2" />
          </g>

          {/* ══════════ TIER 1: SUBSTRUCTURE & FOUNDATION (Bottom / Ground) ══════════ */}
          <g
            className={`building-layer-group ${hoveredClass === 'substructure' ? 'active active-substructure' : (hoveredClass ? 'dimmed' : '')}`}
            onMouseEnter={() => onHoverClass?.('substructure')}
            onMouseLeave={() => onHoverClass?.(null)}
            onClick={() => onSelectClass?.('substructure')}
            onKeyDown={(e) => handleKeyDown(e, 'substructure')}
            tabIndex={0}
            role="button"
            aria-label="Category 1: Substructure and Foundation"
            style={{ transformOrigin: '260px 290px' }}
          >
            {/* Ground Level Line */}
            <line x1="80" y1="248" x2="440" y2="248" stroke="#10b981" strokeWidth="1.5" strokeDasharray="4 3" />
            <text x="90" y="244" fill="#10b981" fontSize="8" fontWeight="600">GRADE LEVEL</text>

            {/* Foundation Slab */}
            <rect
              x="130" y="250" width="260" height="24" rx="2"
              fill={hoveredClass === 'substructure' ? 'url(#gradSubActive)' : 'url(#gradSubDefault)'}
              stroke={hoveredClass === 'substructure' ? '#6ee7b7' : '#047857'}
              strokeWidth={hoveredClass === 'substructure' ? 2.5 : 1.2}
            />
            {/* Deep Foundation Piles into Subgrade/Bedrock */}
            <rect x="150" y="274" width="22" height="52" rx="2" fill={hoveredClass === 'substructure' ? '#059669' : '#064e3b'} stroke="#10b981" strokeWidth="0.8" />
            <rect x="249" y="274" width="22" height="52" rx="2" fill={hoveredClass === 'substructure' ? '#059669' : '#064e3b'} stroke="#10b981" strokeWidth="0.8" />
            <rect x="348" y="274" width="22" height="52" rx="2" fill={hoveredClass === 'substructure' ? '#059669' : '#064e3b'} stroke="#10b981" strokeWidth="0.8" />

            {/* Bedrock Strata Hatching */}
            <path d="M 120,326 L 400,326" stroke="#047857" strokeWidth="1.5" strokeDasharray="3 3" />
            <text x="260" y="336" textAnchor="middle" fill="#6ee7b7" fontSize="8">SUBTERRANEAN BEDROCK & DAMP-PROOF BARRIER</text>

            {/* Layer 1 Badge / Text Callout */}
            <rect x="10" y="270" width="125" height="24" rx="4" fill="rgba(15, 23, 42, 0.85)" stroke={hoveredClass === 'substructure' ? '#10b981' : 'rgba(16, 185, 129, 0.3)'} strokeWidth="1" />
            <circle cx="22" cy="282" r="6" fill="#059669" />
            <text x="22" y="285" textAnchor="middle" fill="#fff" fontSize="8" fontWeight="bold">1</text>
            <text x="35" y="286" fill={hoveredClass === 'substructure' ? '#6ee7b7' : '#cbd5e1'} fontSize="9.5" fontWeight="600">Foundation & Piles</text>
            <line x1="135" y1="282" x2="150" y2="282" stroke="#10b981" strokeWidth="1.2" strokeDasharray="2 2" />
          </g>
        </svg>
      </div>

      {/* Live Information Bar for the Active / Hovered Assembly */}
      {activeConfig && (
        <div
          className="diagram-active-info-bar"
          style={{
            '--active-border': activeConfig.color,
            '--active-bg': activeConfig.color
          }}
        >
          <div className="active-info-left">
            <span className="active-class-pill">Tier {activeConfig.number}</span>
            <span className="active-class-title">{activeConfig.name}</span>
          </div>
          <div className="active-info-materials">
            <div className="mat-item-badge green">
              <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#10b981' }} />
              <span>Green: <strong>{selectedGreenMaterials[hoveredClass] || 'Selected'}</strong></span>
            </div>
            <div className="mat-item-badge normal">
              <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#f59e0b' }} />
              <span>Normal: <strong>{selectedNormalMaterials[hoveredClass] || 'Selected'}</strong></span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default InteractiveBuildingDiagram;
