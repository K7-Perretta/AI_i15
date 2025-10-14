import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { api } from '../config';
import './SettingsScreen.css';

interface APIKey {
  name: string;
  placeholder: string;
  value: string;
}

const SettingsScreen: React.FC = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [aiName, setAiName] = useState('');
  const [keys, setKeys] = useState<APIKey[]>([
    { name: 'OpenAI', placeholder: 'sk-...', value: '' },
    { name: 'Anthropic', placeholder: 'sk-ant-...', value: '' },
    { name: 'IBM Watsonx', placeholder: 'your-key...', value: '' },
    { name: 'AIMLAPI', placeholder: 'your-key...', value: '' },
    { name: 'Groq', placeholder: 'gsk-...', value: '' },
    { name: 'Mistral', placeholder: 'your-key...', value: '' },
    { name: 'Perplexity', placeholder: 'pplx-...', value: '' },
    { name: 'Tavily', placeholder: 'tvly-...', value: '' },
    { name: 'ElevenLabs', placeholder: 'sk-...', value: '' },
    { name: 'Replicate', placeholder: 'r8-...', value: '' },
  ]);
  const [customKeys, setCustomKeys] = useState<{ name: string; value: string }[]>([]);

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    setLoading(true);
    try {
      // Load AI name
      const name = localStorage.getItem('ai_name');
      if (name) setAiName(name);

      // Load API keys (masked)
      const response = await axios.get(api('/api/settings/keys'));
      const maskedKeys = response.data.keys;

      setKeys([
        { name: 'OpenAI', placeholder: 'sk-...', value: maskedKeys.openai || '' },
        { name: 'Anthropic', placeholder: 'sk-ant-...', value: maskedKeys.anthropic || '' },
        { name: 'IBM Watsonx', placeholder: 'your-key...', value: maskedKeys.ibm_watsonx || '' },
        { name: 'AIMLAPI', placeholder: 'your-key...', value: maskedKeys.aimlapi || '' },
        { name: 'Groq', placeholder: 'gsk-...', value: maskedKeys.groq || '' },
        { name: 'Mistral', placeholder: 'your-key...', value: maskedKeys.mistral || '' },
        { name: 'Perplexity', placeholder: 'pplx-...', value: maskedKeys.perplexity || '' },
        { name: 'Tavily', placeholder: 'tvly-...', value: maskedKeys.tavily || '' },
        { name: 'ElevenLabs', placeholder: 'sk-...', value: maskedKeys.elevenlabs || '' },
        { name: 'Replicate', placeholder: 'r8-...', value: maskedKeys.replicate || '' },
      ]);

      if (response.data.custom_keys) {
        const customKeyArray = Object.entries(response.data.custom_keys).map(([name, value]) => ({
          name,
          value: value as string
        }));
        setCustomKeys(customKeyArray);
      }
    } catch (error) {
      console.error('Error loading settings:', error);
    } finally {
      setLoading(false);
    }
  };

  const saveAPIKeys = async () => {
    setSaving(true);
    try {
      const isMasked = (v: string) => v.includes('***') || v.includes('...');

      const keyData: any = {};

      // Only send values that the user actually edited (not masked placeholders)
      keys.forEach(key => {
        if (key.value && !isMasked(key.value)) {
          const keyName = key.name
            .toLowerCase()
            .replace('ibm watsonx', 'ibm_watsonx')
            .replace('aimlapi', 'aimlapi')
            .replace('elevenlabs', 'elevenlabs')
            .replace('replicate', 'replicate');

          if (keyName === 'anthropic') keyData.anthropic = key.value;
          else if (keyName === 'ibm_watsonx') keyData.ibm_watsonx = key.value;
          else if (keyName === 'aimlapi') keyData.aimlapi = key.value;
          else if (keyName === 'groq') keyData.groq = key.value;
          else if (keyName === 'mistral') keyData.mistral = key.value;
          else if (keyName === 'elevenlabs') keyData.elevenlabs = key.value;
          else if (keyName === 'replicate') keyData.replicate = key.value;
          else if (keyName === 'openai') keyData.openai = key.value;
          else keyData[keyName] = key.value;
        }
      });

      const customKeyObj: any = {};
      customKeys.forEach(key => {
        if (key.value && !isMasked(key.value)) {
          customKeyObj[key.name] = key.value;
        }
      });

      await axios.post(api('/api/settings/keys'), {
        ...keyData,
        custom_keys: customKeyObj
      });

      alert('API keys updated successfully!');
      loadSettings();
    } catch (error) {
      alert('Failed to update API keys.');
      console.error('Error saving keys:', error);
    } finally {
      setSaving(false);
    }
  };

  const updateKey = (index: number, value: string) => {
    const newKeys = [...keys];
    newKeys[index].value = value;
    setKeys(newKeys);
  };

  const addCustomKey = () => {
    const name = prompt('Add Custom API Key', 'Enter a name for this key (e.g., "Video Generation", "Payment Gateway")');
    if (name) {
      setCustomKeys([...customKeys, { name, value: '' }]);
    }
  };

  const updateCustomKey = (index: number, value: string) => {
    const newCustomKeys = [...customKeys];
    newCustomKeys[index].value = value;
    setCustomKeys(newCustomKeys);
  };

  const removeCustomKey = (index: number) => {
    const newCustomKeys = customKeys.filter((_, i) => i !== index);
    setCustomKeys(newCustomKeys);
  };

  if (loading) {
    return (
      <div className="settings-container">
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <p className="loading-text">Loading settings...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="settings-container">
      <div className="header">
        <button onClick={() => navigate(-1)} className="back-button">
          ←
        </button>
        <h2 className="header-title">Settings</h2>
        <div className="placeholder"></div>
      </div>

      <div className="content">
        <div className="section">
          <div className="section-header">
            <span className="section-icon">👤</span>
            <h3 className="section-title">AI Profile</h3>
          </div>
          <div className="info-card">
            <div className="info-label">AI Name</div>
            <div className="info-value">{aiName || 'Not set'}</div>
          </div>
        </div>

        <div className="section">
          <div className="section-header">
            <span className="section-icon">🔑</span>
            <h3 className="section-title">API Keys</h3>
          </div>
          <p className="section-description">
            Manage your API keys. Existing keys are masked for security.
          </p>

          {keys.map((key, index) => (
            <div key={index} className="key-input">
              <label className="key-label">{key.name}</label>
              <input
                className="input"
                type="password"
                placeholder={key.placeholder}
                value={key.value}
                onChange={(e) => updateKey(index, e.target.value)}
              />
            </div>
          ))}

          {customKeys.length > 0 && (
            <div className="custom-keys-container">
              <h4 className="custom-keys-title">Custom Keys</h4>
              {customKeys.map((key, index) => (
                <div key={index} className="key-input">
                  <div className="key-label-row">
                    <label className="key-label">{key.name}</label>
                    <button onClick={() => removeCustomKey(index)} className="remove-button">
                      🗑️
                    </button>
                  </div>
                  <input
                    className="input"
                    type="password"
                    placeholder="Enter API key"
                    value={key.value}
                    onChange={(e) => updateCustomKey(index, e.target.value)}
                  />
                </div>
              ))}
            </div>
          )}

          <button className="add-key-button" onClick={addCustomKey}>
            <span className="add-icon">➕</span>
            <span className="add-text">Add Custom API Key</span>
          </button>

          <button
            className={`save-button ${saving ? 'disabled' : ''}`}
            onClick={saveAPIKeys}
            disabled={saving}
          >
            {saving ? (
              <div className="loading-spinner"></div>
            ) : (
              <>
                <span className="save-icon">💾</span>
                <span className="save-text">Save API Keys</span>
              </>
            )}
          </button>
        </div>

        <div className="section">
          <div className="section-header">
            <span className="section-icon">ℹ️</span>
            <h3 className="section-title">About</h3>
          </div>
          <div className="info-card">
            <p className="info-text">
              Your AI Companion - Powered by GPT-4o, DALL-E 3, and advanced research tools.
              {'\n\n'}Version 1.0.0
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SettingsScreen;