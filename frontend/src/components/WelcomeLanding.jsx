import React from 'react';
import { 
  Leaf, 
  ShieldAlert, 
  Truck, 
  Cpu, 
  ArrowRight, 
  FileCheck,
  Building2,
  Sparkles,
  FlaskConical,
  BarChart3,
  Layers,
  ChevronRight
} from 'lucide-react';
import './WelcomeLanding.css';

const WelcomeLanding = ({ onEnterDashboard }) => {
  return (
    <div className="landing-container">
      {/* Background ambient lighting effects */}
      <div className="landing-glow-top" />
      <div className="landing-glow-center" />

      {/* HERO BANNER SECTION */}
      <header className="landing-hero-section">
        <div className="landing-badge">
          <Leaf size={15} /> Universal Materials Intelligence & Climate Resilience Platform
        </div>

        <h1 className="landing-main-title">
          Dynamic 100-Year Life Cycle Assessment for <br />
          <span className="text-emerald-glow">Sustainable Civil Engineering</span>
        </h1>

        <p className="landing-hero-description">
          Project Vardan is an <strong>EN 15978</strong> and <strong>ISO 21930</strong> compliant LCA platform that quantifies, simulates, and optimizes the carbon footprint of construction materials and whole buildings under 100-year dynamic climate stress.
        </p>

        {/* LAUNCH DASHBOARD PRIMARY BUTTON */}
        <div className="landing-cta-wrap">
          <button
            onClick={() => onEnterDashboard?.('material')}
            className="landing-launch-btn"
          >
            <Sparkles size={18} /> Launch Vardan Intelligence Engine <ArrowRight size={20} />
          </button>
        </div>

        {/* MODULE QUICK JUMP PILLS */}
        <div className="module-pills-row">
          <button 
            className="module-pill-card"
            onClick={() => onEnterDashboard?.('material')}
          >
            <div className="pill-card-icon emerald">
              <FlaskConical size={18} />
            </div>
            <div className="pill-card-text">
              <span className="pill-card-title">1. Material LCA & Green Alternatives</span>
              <span className="pill-card-desc">Compare 259+ ICE V5 materials & low-carbon EPDs</span>
            </div>
            <ChevronRight size={16} className="pill-arrow" />
          </button>

          <button 
            className="module-pill-card"
            onClick={() => onEnterDashboard?.('building')}
          >
            <div className="pill-card-icon cyan">
              <Building2 size={18} />
            </div>
            <div className="pill-card-text">
              <span className="pill-card-title">2. Complete Building LCA (100 Years)</span>
              <span className="pill-card-desc">Substructure, Superstructure, Facade & Roofing cutaway</span>
            </div>
            <ChevronRight size={16} className="pill-arrow" />
          </button>
        </div>

        {/* COMPLIANCE & STANDARDS BADGES */}
        <div className="standards-badges-row">
          <span className="standard-item">
            <FileCheck size={16} color="#34d399" /> ICE V5 Benchmark (259+ Materials)
          </span>
          <span className="standard-item">
            <FileCheck size={16} color="#34d399" /> EN 15978 Structural Standard
          </span>
          <span className="standard-item">
            <FileCheck size={16} color="#34d399" /> ISO 21930 Sustainability Metric
          </span>
        </div>
      </header>

      {/* PROBLEM / MOTIVATION CARDS */}
      <section className="landing-features-section">
        <h2 className="section-heading-emerald">
          Why Was Project Vardan Created?
        </h2>
        <p className="section-subheading-muted">
          Traditional Life Cycle Assessment tools rely on static spreadsheets that fail to capture real-world environmental stress and dynamic decay.
        </p>

        <div className="problem-grid">
          <div className="problem-card">
            <div className="icon-wrapper red">
              <ShieldAlert color="#f87171" size={24} />
            </div>
            <h3 className="problem-card-title">The Static Spreadsheet Trap</h3>
            <p className="problem-card-desc">
              Legacy LCA platforms evaluate embodied carbon as a fixed number from static EPD spreadsheets, ignoring 100-year decay curves, weathering deterioration, and regional climate penalties.
            </p>
          </div>

          <div className="problem-card">
            <div className="icon-wrapper emerald">
              <Truck color="#34d399" size={24} />
            </div>
            <h3 className="problem-card-title">The Stage A4 Transit Blind Spot</h3>
            <p className="problem-card-desc">
              Freight logistics alter sustainability rankings. Vardan dynamically calculates transit distance (0–400 km), load payload, and vehicle fleet emissions in real-time.
            </p>
          </div>

          <div className="problem-card">
            <div className="icon-wrapper green">
              <Cpu color="#10b981" size={24} />
            </div>
            <h3 className="problem-card-title">Whitebox Explainable AI</h3>
            <p className="problem-card-desc">
              Instead of unverified black-box scores, Vardan integrates a Decision Tree Whitebox Model to explain the chemical and physical reasons why green alternatives outperform conventional options.
            </p>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="landing-footer">
        <span>Project Vardan · Universal Materials Intelligence & 100-Year Climate Resilience</span>
      </footer>
    </div>
  );
};

export default WelcomeLanding;
