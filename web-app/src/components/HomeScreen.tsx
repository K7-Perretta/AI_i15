import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './HomeScreen.css';

const HomeScreen: React.FC = () => {
  const navigate = useNavigate();
  const [hasName, setHasName] = useState<boolean | null>(null);
  const [aiName, setAiName] = useState('');

  useEffect(() => {
    checkAIName();
  }, []);

  const checkAIName = async () => {
    try {
      const cachedName = localStorage.getItem('ai_name');
      if (cachedName) {
        setAiName(cachedName);
        setHasName(true);
      } else {
        // Check backend
        const response = await fetch(`${process.env.REACT_APP_BACKEND_URL}/api/name`);
        const data = await response.json();
        if (data.has_name) {
          setAiName(data.name);
          localStorage.setItem('ai_name', data.name);
          setHasName(true);
        } else {
          setHasName(false);
        }
      }
    } catch (error) {
      console.log('Error checking AI name:', error);
      setHasName(false);
    }
  };

  if (hasName === null) {
    return (
      <div className="container">
        <div className="loading-text">Loading...</div>
      </div>
    );
  }

  if (!hasName) {
    return (
      <div className="container">
        <div className="header">
          <div className="sparkles-icon">✨</div>
          <h1 className="title">Welcome!</h1>
          <p className="subtitle">Let's get to know each other</p>
        </div>

        <button
          className="primary-button"
          onClick={() => navigate('/onboarding')}
        >
          Start First Conversation
        </button>
      </div>
    );
  }

  return (
    <div className="scroll-container">
      <div className="scroll-content">
        <div className="header">
          <div className="sparkles-icon">✨</div>
          <h1 className="welcome-text">Hello! I'm {aiName}</h1>
          <p className="tagline">Your AI Companion</p>
        </div>

        <div className="grid">
          <div
            className="card card-primary"
            onClick={() => navigate('/chat')}
          >
            <div className="card-icon">💬</div>
            <h3 className="card-title">Chat</h3>
            <p className="card-description">Have a conversation</p>
          </div>

          <div
            className="card card-secondary"
            onClick={() => navigate('/voice')}
          >
            <div className="card-icon">🎤</div>
            <h3 className="card-title">Voice</h3>
            <p className="card-description">Talk with AI voice</p>
          </div>

          <div
            className="card card-tertiary"
            onClick={() => navigate('/tools')}
          >
            <div className="card-icon">🔧</div>
            <h3 className="card-title">Tools</h3>
            <p className="card-description">Image, code, research</p>
          </div>

          <div
            className="card card-quaternary"
            onClick={() => navigate('/history')}
          >
            <div className="card-icon">⏰</div>
            <h3 className="card-title">History</h3>
            <p className="card-description">Past conversations</p>
          </div>

          <div
            className="card card-quinary"
            onClick={() => navigate('/marketing')}
          >
            <div className="card-icon">📢</div>
            <h3 className="card-title">Marketing</h3>
            <p className="card-description">Campaigns & flyers</p>
          </div>

          <div
            className="card card-senary"
            onClick={() => navigate('/settings')}
          >
            <div className="card-icon">⚙️</div>
            <h3 className="card-title">Settings</h3>
            <p className="card-description">API keys & more</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HomeScreen;