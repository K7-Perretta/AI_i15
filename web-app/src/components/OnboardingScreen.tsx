import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { API_BASE } from '../config';
import './OnboardingScreen.css';

const OnboardingScreen: React.FC = () => {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (!name.trim()) return;

    setLoading(true);
    try {
      const formData = new FormData();
      formData.append('name', name.trim());

      await axios.post(`${API_BASE}/api/name/set`, formData, { withCredentials: false });

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
    if (e.key === 'Enter' && name.trim()) {
      handleSubmit();
    }
  };

  return (
    <div className="onboarding-container">
      <div className="onboarding-content">
        <div className="logo-section">
          <div className="sparkles-icon">✨</div>
          <h1 className="title">Welcome to Your AI Companion</h1>
          <p className="subtitle">Let's get to know each other</p>
        </div>

        <div className="form-section">
          <div className="step-indicator">
            <div className="step">1</div>
            <div className="step-line"></div>
            <div className="step">2</div>
          </div>

          <div className="question-card">
            <h2 className="question">What should I call you?</h2>
            <p className="description">
              This will be your AI companion's name. You can change it later in settings.
            </p>

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
              onClick={handleSubmit}
              disabled={loading || !name.trim()}
            >
              {loading ? (
                <div className="loading-spinner"></div>
              ) : (
                'Continue'
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OnboardingScreen;