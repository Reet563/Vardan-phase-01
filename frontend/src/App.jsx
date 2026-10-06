import React, { useState } from 'react';
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

  if (!inDashboard) {
    return <WelcomeLanding onEnterDashboard={handleLaunch} />;
  }

  return (
    <Dashboard 
      onBackToLanding={handleBackToLanding}
      defaultTab={initialTab}
    />
  );
}
