import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import HomeScreen from './components/HomeScreen';
import ChatScreen from './components/ChatScreen';
import VoiceScreen from './components/VoiceScreen';
import ToolsScreen from './components/ToolsScreen';
import HistoryScreen from './components/HistoryScreen';
import MarketingScreen from './components/MarketingScreen';
import SettingsScreen from './components/SettingsScreen';
import OnboardingScreen from './components/OnboardingScreen';
import './App.css';

function App() {
  return (
    <Router>
      <div className="App">
        <Routes>
          <Route path="/" element={<HomeScreen />} />
          <Route path="/chat" element={<ChatScreen />} />
          <Route path="/voice" element={<VoiceScreen />} />
          <Route path="/tools" element={<ToolsScreen />} />
          <Route path="/history" element={<HistoryScreen />} />
          <Route path="/marketing" element={<MarketingScreen />} />
          <Route path="/settings" element={<SettingsScreen />} />
          <Route path="/onboarding" element={<OnboardingScreen />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;
