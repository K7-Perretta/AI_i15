import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { api } from '../config';
import './OnboardingScreen.css';

const BRANDING_CONTEXT =
  "Italian heritage; American raised; sophistication, class, luxury; " +
  "resilience of a diamond; strength; fight; high-end. Palette: " +
  "Scarlet Red #CE2B37, Sacramento Green #043927, Metallic Gold #D4AF37, " +
  "Midnight Blue #191970, Pearl White #FFFDFA, Black #000000.";

const OnboardingScreen: React.FC = () => {
  const navigate = useNavigate();
  const [mode, setMode] = useState<'choose' | 'manual'>('choose');
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);

  const handleChoose = async () => {
    setLoading(true);
    try {
      const res = await axios.post(api('/api/name/choose'), { branding: BRANDING_CONTEXT }, { withCredentials: false });
      const chosen = (res?.data?.name || '').trim();
      if (chosen) {
        localStorage.setItem('ai_name', chosen);
        navigate('/');
      } else {
        alert('Could not get a name automatically. You can choose one manually.');
        setMode('manual');
      }
    } catch (error: any) {
      console.error('Error choosing AI name:', error?.response || error);
      const msg =
        (error?.response?.data && (error.response.data.detail || JSON.stringify(error.response.data))) ||
        error?.message ||
        'Unknown error';
      alert(`Failed to choose AI name: ${msg}`);
      setMode('manual');
    } finally {
      setLoading(false);
    }
  };

  const handleManual = async () => {
    if (!name.trim()) return;
    setLoading(true);
    try {
      const formData = new FormData();
      formData.append('name', name.trim());
      await axios.post(api('/api/name/set'), formData, { withCredentials: false });
      localStorage.setItem('ai_name', name.trim());
      navigate('/');
    } catch (error: any) {
      console.error('Error setting AI name:', error?.response || error);
      const msg =
        (error?.response?.data && (error.response.data.detail || JSON.stringify(error.response.data))) ||
        error?.message ||
        'Unknown error';
      alert(`Failed to set AI name: ${msg}`);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && mode === 'manual' && name.trim()) {
      handleManual();
    }
  };

  return (
    <div className="onboarding-container">
      <div className="onboarding-content">
        <div className="logo-section">
          <div className="sparkles-icon">💎</div>
          <h1 className="title">Welcome to Your AI Companion</h1>
          <p className="subtitle">Let her choose her name, or set one yourself</p>
        </div>

        <div className="form-section">
          <div className="step-indicator">
            <div className={`step ${mode === 'choose' ? 'active' : ''}`}>1</div>
            <div className="step-line"></div>
            <div className={`step ${mode === 'manual' ? 'active' : ''}`}>2</div>
          </div>

          {mode === 'choose' ? (
            <div className="question-card">
              <h2 className="question">Shall she choose her name?</h2>
              <p className="description">
                Based on your luxury brand identity, she'll pick a refined, elegant name.
              </p>

              <button
                className={`submit-button ${loading ? 'disabled' : ''}`}
                onClick={handleChoose}
                disabled={loading}
              >
                {loading ? <div className="loading-spinner"></div> : 'Let her choose'}
              </button>

              <p className="description" style={{ textAlign: 'center', marginTop: 12 }}>
                Prefer to choose it yourself?{' '}
                <a
                  href="#manual"
                  onClick={(e) => {
                    e.preventDefault();
                    setMode('manual');
                  }}
                >
                  Switch to manual entry
                </a>
              </p>
            </div>
          ) : (
            <div className="question-card">
              <h2 className="question">What should her name be?</h2>
              <p className="description">You can change this later in Settings.</p>

              <input
                type="text"
                className="name-input"
                placeholder="Enter a name..."
                value={name}
                onChange={(e) => setName(e.target.value)}
                onKeyPress={handleKeyPress}
                autoFocus
              />

              <button
                className={`submit-button ${loading || !name.trim() ? 'disabled' : ''}`}
                onClick={handleManual}
                disabled={loading || !name.trim()}
              >
                {loading ? <div className="loading-spinner"></div> : 'Continue'}
              </button>

              <p className="description" style={{ textAlign: 'center', marginTop: 12 }}>
                Want her to decide?{' '}
                <a
                  href="#choose"
                  onClick={(e) => {
                    e.preventDefault();
                    setMode('choose');
                  }}
                >
                  Let her choose
                </a>
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default OnboardingScreen;