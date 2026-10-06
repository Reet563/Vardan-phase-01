import React, { useState } from 'react';
import ParticleBackground from './components/ParticleBackground.jsx';
import WelcomeLanding from './components/WelcomeLanding.jsx';
import Dashboard from './components/Dashboard.jsx';
import './index.css';

export default function App() {
  const [inDashboard, setInDashboard] = useState(false);
  const [initialTab, setInitialTab] = useState('material');

  const handleLaunch = (tab = 'material') => {
    setInitialTab(tab);
    setInDashboard(true);
  };

  const handleBackToLanding = () => {
    setInDashboard(false);
  };

  return (
    <div className="app-root-container" style={{ position: 'relative', minHeight: '100vh', background: '#090d16' }}>
      {/* Interactive Connecting Particle Background (Active on Front Page & Both Dashboard Pages) */}
      <ParticleBackground />

      <div style={{ position: 'relative', zIndex: 1 }}>
        {!inDashboard ? (
          <WelcomeLanding onEnterDashboard={handleLaunch} />
        ) : (
          <Dashboard 
            onBackToLanding={handleBackToLanding}
            defaultTab={initialTab}
          />
        )}
      </div>
    </div>
  );
}
