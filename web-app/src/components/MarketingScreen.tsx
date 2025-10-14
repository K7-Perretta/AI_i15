import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import './MarketingScreen.css';

const MarketingScreen: React.FC = () => {
  const navigate = useNavigate();
  const [campaignType, setCampaignType] = useState<'flyer' | 'social' | 'email' | 'campaign'>('flyer');
  const [prompt, setPrompt] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState('');

  const generateMarketing = async () => {
    if (!prompt.trim()) {
      alert('Please describe what you need.');
      return;
    }

    setLoading(true);
    setResult('');

    try {
      const enhancedPrompt = `Create a ${campaignType} for: ${prompt}`;

      const response = await axios.post(`${process.env.REACT_APP_BACKEND_URL}/api/marketing`, {
        message: enhancedPrompt
      });

      setResult(response.data.content);
    } catch (error) {
      alert('Failed to generate marketing content.');
      console.error('Marketing generation error:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="marketing-container">
      <div className="header">
        <button onClick={() => navigate(-1)} className="back-button">
          ←
        </button>
        <h2 className="header-title">Marketing Tools</h2>
        <div className="placeholder"></div>
      </div>

      <div className="content">
        <div className="type-selector">
          <h3 className="section-title">Campaign Type</h3>
          <div className="type-grid">
            <button
              className={`type-card ${campaignType === 'flyer' ? 'active' : ''}`}
              onClick={() => setCampaignType('flyer')}
            >
              <span className="type-icon">📰</span>
              <span className="type-text">Flyer</span>
            </button>

            <button
              className={`type-card ${campaignType === 'social' ? 'active' : ''}`}
              onClick={() => setCampaignType('social')}
            >
              <span className="type-icon">📱</span>
              <span className="type-text">Social Post</span>
            </button>

            <button
              className={`type-card ${campaignType === 'email' ? 'active' : ''}`}
              onClick={() => setCampaignType('email')}
            >
              <span className="type-icon">✉️</span>
              <span className="type-text">Email</span>
            </button>

            <button
              className={`type-card ${campaignType === 'campaign' ? 'active' : ''}`}
              onClick={() => setCampaignType('campaign')}
            >
              <span className="type-icon">📢</span>
              <span className="type-text">Full Campaign</span>
            </button>
          </div>
        </div>

        <div className="prompt-container">
          <h3 className="section-title">Describe Your Project</h3>
          <textarea
            className="prompt-input"
            placeholder="E.g., Real estate open house this Sunday, modern minimalist style, focus on spacious living and natural light..."
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
          />
        </div>

        <button
          className={`generate-button ${loading || !prompt.trim() ? 'disabled' : ''}`}
          onClick={generateMarketing}
          disabled={loading || !prompt.trim()}
        >
          {loading ? (
            <div className="loading-spinner"></div>
          ) : (
            <>
              <span className="flash-icon">⚡</span>
              <span className="generate-text">Generate Marketing Content</span>
            </>
          )}
        </button>

        {result && (
          <div className="result-container">
            <div className="result-header">
              <span className="checkmark-icon">✅</span>
              <h4 className="result-title">Generated Content</h4>
            </div>
            <div className="result-content">
              {result}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default MarketingScreen;