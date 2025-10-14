import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import './HistoryScreen.css';

interface Conversation {
  _id: string;
  messages: Array<{ role: string; content: string }>;
  created_at: string;
  updated_at: string;
}

const HistoryScreen: React.FC = () => {
  const navigate = useNavigate();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadConversations();
  }, []);

  const loadConversations = async () => {
    try {
      const response = await axios.get(`${process.env.REACT_APP_BACKEND_URL}/api/conversations`);
      setConversations(response.data.conversations);
    } catch (error) {
      console.error('Error loading conversations:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - date.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays} days ago`;
    return date.toLocaleDateString();
  };

  const getConversationPreview = (conv: Conversation) => {
    const userMessages = conv.messages.filter(m => m.role === 'user');
    if (userMessages.length === 0) return 'New conversation';
    return userMessages[0].content.slice(0, 100) + (userMessages[0].content.length > 100 ? '...' : '');
  };

  return (
    <div className="history-container">
      <div className="header">
        <button onClick={() => navigate(-1)} className="back-button">
          ←
        </button>
        <h2 className="header-title">Conversation History</h2>
        <button onClick={loadConversations} className="refresh-button">
          🔄
        </button>
      </div>

      <div className="content">
        {loading ? (
          <div className="loading-container">
            <div className="loading-spinner"></div>
            <p className="loading-text">Loading conversations...</p>
          </div>
        ) : conversations.length === 0 ? (
          <div className="empty-state">
            <div className="chat-icon">💬</div>
            <h3 className="empty-text">No conversations yet</h3>
            <p className="empty-subtext">Start chatting to see your history here</p>
          </div>
        ) : (
          conversations.map((conv) => (
            <div
              key={conv._id}
              className="conversation-card"
              onClick={() => {
                navigate('/chat');
              }}
            >
              <div className="conversation-icon">
                💬
              </div>
              <div className="conversation-content">
                <p className="conversation-preview">
                  {getConversationPreview(conv)}
                </p>
                <p className="conversation-date">
                  {formatDate(conv.updated_at)}
                </p>
              </div>
              <div className="chevron">›</div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default HistoryScreen;