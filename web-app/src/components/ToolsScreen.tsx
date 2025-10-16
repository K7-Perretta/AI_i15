import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { api } from '../config';
import './ToolsScreen.css';

const ToolsScreen: React.FC = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'image' | 'code' | 'research' | 'document' | 'real-estate' | 'business' | 'personal' | 'automation'>('image');
  const [prompt, setPrompt] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);

  const generateImage = async () => {
    if (!prompt.trim()) return;

    setLoading(true);
    setResult(null);

    try {
      const response = await axios.post(
        api('/api/image/generate'),
        {
          prompt,
          size: '1024x1024'
        }
      );

      setResult({ type: 'image', data: response.data.image_base64 });
    } catch (error: any) {
      alert('Failed to generate image. Please check your API keys.');
      console.error('Image generation error:', error);
    } finally {
      setLoading(false);
    }
  };

  const generateCode = async () => {
    if (!prompt.trim()) return;

    setLoading(true);
    setResult(null);

    try {
      const response = await axios.post(
        api('/api/code'),
        { message: prompt }
      );

      setResult({ type: 'code', data: response.data.code });
    } catch (error: any) {
      alert('Failed to generate code.');
      console.error('Code generation error:', error);
    } finally {
      setLoading(false);
    }
  };

  const conductResearch = async () => {
    if (!prompt.trim()) return;

    setLoading(true);
    setResult(null);

    try {
      const response = await axios.post(
        api('/api/research'),
        {
          query: prompt,
          source: 'perplexity'
        }
      );

      setResult({ type: 'research', data: response.data });
    } catch (error: any) {
      try {
        const response = await axios.post(
          api('/api/research'),
          {
            query: prompt,
            source: 'web'
          }
        );
        setResult({ type: 'research', data: response.data });
      } catch (fallbackError) {
        alert('All research methods failed.');
      }
    } finally {
      setLoading(false);
    }
  };

  const analyzeRealEstate = async () => {
    if (!prompt.trim()) return;

    setLoading(true);
    setResult(null);

    try {
      const response = await axios.post(
        api('/api/real-estate/analyze'),
        { message: prompt }
      );

      setResult({ type: 'real-estate', data: response.data.analysis });
    } catch (error: any) {
      alert('Real estate analysis failed.');
      console.error('Real estate analysis error:', error);
    } finally {
      setLoading(false);
    }
  };

  const businessStrategy = async () => {
    if (!prompt.trim()) return;

    setLoading(true);
    setResult(null);

    try {
      const response = await axios.post(
        api('/api/business/strategy'),
        { message: prompt }
      );

      setResult({ type: 'business', data: response.data.strategy });
    } catch (error: any) {
      alert('Business strategy analysis failed.');
      console.error('Business strategy error:', error);
    } finally {
      setLoading(false);
    }
  };

  const personalDevelopment = async () => {
    if (!prompt.trim()) return;

    setLoading(true);
    setResult(null);

    try {
      const response = await axios.post(
        api('/api/personal/development'),
        { message: prompt }
      );

      setResult({ type: 'personal', data: response.data.guidance });
    } catch (error: any) {
      alert('Personal development guidance failed.');
      console.error('Personal development error:', error);
    } finally {
      setLoading(false);
    }
  };

  const taskAutomation = async () => {
    if (!prompt.trim()) return;

    setLoading(true);
    setResult(null);

    try {
      const response = await axios.post(
        api('/api/task/automation'),
        { message: prompt }
      );

      setResult({ type: 'automation', data: response.data.automation_plan });
    } catch (error: any) {
      alert('Task automation planning failed.');
      console.error('Task automation error:', error);
    } finally {
      setLoading(false);
    }
  };

  const analyzeDocument = async () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*,.pdf';
    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) return;

      setLoading(true);

      const formData = new FormData();
      formData.append('image', file);
      formData.append('prompt', prompt || 'Analyze this document and provide a detailed summary.');

      try {
        const response = await axios.post(
          api('/api/document/analyze'),
          formData
        );

        setResult({ type: 'document', data: response.data.analysis });
      } catch (error) {
        alert('Failed to analyze document.');
        console.error('Document analysis error:', error);
      } finally {
        setLoading(false);
      }
    };
    input.click();
  };

  const handleAction = () => {
    switch (activeTab) {
      case 'image':
        generateImage();
        break;
      case 'code':
        generateCode();
        break;
      case 'research':
        conductResearch();
        break;
      case 'document':
        analyzeDocument();
        break;
      case 'real-estate':
        analyzeRealEstate();
        break;
      case 'business':
        businessStrategy();
        break;
      case 'personal':
        personalDevelopment();
        break;
      case 'automation':
        taskAutomation();
        break;
    }
  };

  const renderResult = () => {
    if (!result) return null;

    switch (result.type) {
      case 'image':
        return (
          <div className="result-container">
            <img
              src={`data:image/png;base64,${result.data}`}
              alt="Generated"
              className="generated-image"
            />
          </div>
        );
      case 'code':
      case 'document':
      case 'research':
      case 'real-estate':
      case 'business':
      case 'personal':
      case 'automation':
        return (
          <div className="result-container">
            <div className="text-result">
              {typeof result.data === 'string'
                ? result.data
                : (result.data.result || JSON.stringify(result.data, null, 2))}
            </div>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className="tools-container">
      <div className="header">
        <button onClick={() => navigate(-1)} className="back-button">
          ←
        </button>
        <h2 className="header-title">AI Tools</h2>
        <div className="placeholder"></div>
      </div>

      <div className="tab-container">
        <button
          className={`tab ${activeTab === 'image' ? 'active' : ''}`}
          onClick={() => setActiveTab('image')}
        >
          <span className="tab-icon">🖼️</span>
          <span className="tab-text">Image</span>
        </button>

        <button
          className={`tab ${activeTab === 'code' ? 'active' : ''}`}
          onClick={() => setActiveTab('code')}
        >
          <span className="tab-icon">💻</span>
          <span className="tab-text">Code</span>
        </button>

        <button
          className={`tab ${activeTab === 'research' ? 'active' : ''}`}
          onClick={() => setActiveTab('research')}
        >
          <span className="tab-icon">🔍</span>
          <span className="tab-text">Research</span>
        </button>

        <button
          className={`tab ${activeTab === 'document' ? 'active' : ''}`}
          onClick={() => setActiveTab('document')}
        >
          <span className="tab-icon">📄</span>
          <span className="tab-text">Document</span>
        </button>
      </div>

      <div className="content">
        <div className="prompt-container">
          <h3 className="label">
            {activeTab === 'image' && 'Describe the image you want to generate'}
            {activeTab === 'code' && 'Describe the code you need or ask a coding question'}
            {activeTab === 'research' && 'What do you want to research?'}
            {activeTab === 'document' && 'Upload a document to analyze (optional: add specific questions)'}
            {activeTab === 'real-estate' && 'Describe the property or market you want to analyze'}
            {activeTab === 'business' && 'Describe your business goals, challenges, or opportunities'}
            {activeTab === 'personal' && 'What personal development goals or challenges are you facing?'}
            {activeTab === 'automation' && 'Describe the tasks or processes you want to automate'}
          </h3>
          <textarea
            className="prompt-input"
            placeholder={`Enter your ${activeTab === 'document' ? 'question (optional)' : activeTab === 'real-estate' ? 'property details' : activeTab === 'business' ? 'business goals' : activeTab === 'personal' ? 'development goals' : activeTab === 'automation' ? 'tasks to automate' : 'prompt'}...`}
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
          />
        </div>

        <button
          className={`generate-button ${loading ? 'disabled' : ''}`}
          onClick={handleAction}
          disabled={loading || ((activeTab !== 'document' && activeTab !== 'real-estate' && activeTab !== 'business' && activeTab !== 'personal' && activeTab !== 'automation') && !prompt.trim())}
        >
          {loading ? (
            <div className="loading-spinner"></div>
          ) : (
            <>
              <span className="flash-icon">⚡</span>
              <span className="generate-text">
                {activeTab === 'image' && 'Generate Image'}
                {activeTab === 'code' && 'Generate Code'}
                {activeTab === 'research' && 'Start Research'}
                {activeTab === 'document' && 'Upload & Analyze'}
                {activeTab === 'real-estate' && 'Analyze Real Estate'}
                {activeTab === 'business' && 'Business Strategy'}
                {activeTab === 'personal' && 'Personal Development'}
                {activeTab === 'automation' && 'Task Automation'}
              </span>
            </>
          )}
        </button>

        {renderResult()}
      </div>
    </div>
  );
};

export default ToolsScreen;