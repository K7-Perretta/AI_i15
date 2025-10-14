import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import './ChatScreen.css';

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

const ChatScreen: React.FC = () => {
  const navigate = useNavigate();
  const scrollViewRef = useRef<HTMLDivElement>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState('');
  const [loading, setLoading] = useState(false);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [aiName, setAiName] = useState('AI');
  const [useFallback, setUseFallback] = useState(false);
  const [preferredProvider, setPreferredProvider] = useState<string>('openai');
  const [showProviderSelector, setShowProviderSelector] = useState(false);

  useEffect(() => {
    loadAIName();
  }, []);

  const loadAIName = async () => {
    try {
      const name = localStorage.getItem('ai_name');
      if (name) setAiName(name);
    } catch (error) {
      console.log('Error loading AI name:', error);
    }
  };

  const sendMessage = async () => {
    if (!inputText.trim() || loading) return;

    const userMessage: Message = { role: 'user', content: inputText };
    setMessages(prev => [...prev, userMessage]);
    setInputText('');
    setLoading(true);

    try {
      const response = await axios.post(`${process.env.REACT_APP_BACKEND_URL}/api/chat`, {
        message: inputText,
        conversation_id: conversationId,
        use_fallback: useFallback,
        preferred_provider: preferredProvider
      });

      const aiMessage: Message = {
        role: 'assistant',
        content: response.data.response
      };

      setMessages(prev => [...prev, aiMessage]);
      setConversationId(response.data.conversation_id);

      setTimeout(() => {
        scrollViewRef.current?.scrollTo({
          top: scrollViewRef.current.scrollHeight,
          behavior: 'smooth'
        });
      }, 100);
    } catch (error: any) {
      console.error('Error:', error);
      const errorMessage: Message = {
        role: 'assistant',
        content: 'Sorry, I encountered an error. Please try again.'
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setLoading(false);
    }
  };

  const startNewConversation = () => {
    setMessages([]);
    setConversationId(null);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  return (
    <div className="chat-container">
      <div className="header">
        <button onClick={() => navigate(-1)} className="back-button">
          ←
        </button>
        <div className="header-center">
          <h2 className="header-title">{aiName}</h2>
          <p className="header-subtitle">AI Companion</p>
        </div>
        <div className="header-right">
          <button
            onClick={() => setShowProviderSelector(!showProviderSelector)}
            className="provider-button"
          >
            ⚙️
          </button>
          <button onClick={startNewConversation} className="new-chat-button">
            ➕
          </button>
        </div>
      </div>

      {showProviderSelector && (
        <div className="provider-selector">
          <h3 className="provider-title">AI Provider</h3>
          <div className="provider-options">
            <button
              className={`provider-option ${preferredProvider === 'openai' ? 'active' : ''}`}
              onClick={() => setPreferredProvider('openai')}
            >
              OpenAI GPT-4
            </button>
            <button
              className={`provider-option ${preferredProvider === 'anthropic' ? 'active' : ''}`}
              onClick={() => setPreferredProvider('anthropic')}
            >
              Anthropic Claude
            </button>
            <button
              className={`provider-option ${preferredProvider === 'emergent_llm' ? 'active' : ''}`}
              onClick={() => setPreferredProvider('emergent_llm')}
            >
              Emergent LLM
            </button>
            <button
              className={`provider-option ${preferredProvider === 'ibm_watsonx' ? 'active' : ''}`}
              onClick={() => setPreferredProvider('ibm_watsonx')}
            >
              IBM Watsonx
            </button>
            <button
              className={`provider-option ${preferredProvider === 'aimlapi' ? 'active' : ''}`}
              onClick={() => setPreferredProvider('aimlapi')}
            >
              AIMLAPI
            </button>
            <button
              className={`provider-option ${preferredProvider === 'groq' ? 'active' : ''}`}
              onClick={() => setPreferredProvider('groq')}
            >
              Groq
            </button>
            <button
              className={`provider-option ${preferredProvider === 'mistral' ? 'active' : ''}`}
              onClick={() => setPreferredProvider('mistral')}
            >
              Mistral
            </button>
          </div>
        </div>
      )}

      <div
        ref={scrollViewRef}
        className="messages-container"
      >
        {messages.length === 0 ? (
          <div className="empty-state">
            <div className="chat-icon">💬</div>
            <h3 className="empty-text">Start a conversation with {aiName}</h3>
            <p className="empty-subtext">Ask anything - I'm here to help!</p>
          </div>
        ) : (
          messages.map((message, index) => (
            <div
              key={index}
              className={`message-bubble ${message.role === 'user' ? 'user-bubble' : 'ai-bubble'}`}
            >
              <p className={`message-text ${message.role === 'user' ? 'user-text' : 'ai-text'}`}>
                {message.content}
              </p>
            </div>
          ))
        )}
        {loading && (
          <div className="loading-container">
            <div className="loading-spinner"></div>
            <p className="loading-text">Thinking...</p>
          </div>
        )}
      </div>

      <div className="input-container">
        <div className="input-wrapper">
          <textarea
            className="input"
            placeholder="Type a message..."
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            onKeyPress={handleKeyPress}
            rows={1}
          />
          <button
            className={`send-button ${(!inputText.trim() || loading) ? 'disabled' : ''}`}
            onClick={sendMessage}
            disabled={!inputText.trim() || loading}
          >
            ➤
          </button>
        </div>
      </div>
    </div>
  );
};

export default ChatScreen;