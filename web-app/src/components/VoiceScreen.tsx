import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import './VoiceScreen.css';

const VoiceScreen: React.FC = () => {
  const navigate = useNavigate();
  const [recording, setRecording] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [aiName, setAiName] = useState('AI');
  const [transcription, setTranscription] = useState('');
  const [aiResponse, setAiResponse] = useState('');
  const [isPlaying, setIsPlaying] = useState(false);
  const [mediaRecorder, setMediaRecorder] = useState<MediaRecorder | null>(null);
  const [audioChunks, setAudioChunks] = useState<Blob[]>([]);

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

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      const chunks: Blob[] = [];

      recorder.ondataavailable = (event) => {
        chunks.push(event.data);
      };

      recorder.onstop = async () => {
        const audioBlob = new Blob(chunks, { type: 'audio/webm' });
        await processAudio(audioBlob);
        stream.getTracks().forEach(track => track.stop());
      };

      setMediaRecorder(recorder);
      setAudioChunks(chunks);
      recorder.start();
      setRecording(true);
      setTranscription('');
      setAiResponse('');
    } catch (error) {
      console.error('Failed to start recording:', error);
      alert('Failed to start recording. Please check microphone permissions.');
    }
  };

  const stopRecording = () => {
    if (mediaRecorder && recording) {
      mediaRecorder.stop();
      setRecording(false);
      setIsProcessing(true);
    }
  };

  const processAudio = async (audioBlob: Blob) => {
    try {
      // Step 1: Transcribe audio
      const formData = new FormData();
      formData.append('audio', audioBlob, 'recording.webm');

      const transcribeResponse = await axios.post(
        `${process.env.REACT_APP_BACKEND_URL}/api/voice/transcribe`,
        formData,
        {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        }
      );

      const transcribedText = transcribeResponse.data.text;
      setTranscription(transcribedText);

      // Step 2: Get AI response
      const chatResponse = await axios.post(`${process.env.REACT_APP_BACKEND_URL}/api/chat`, {
        message: transcribedText,
        use_fallback: false
      });

      const aiText = chatResponse.data.response;
      setAiResponse(aiText);

      // Step 3: Convert to speech
      const ttsFormData = new FormData();
      ttsFormData.append('text', aiText);
      ttsFormData.append('voice', 'nova');

      const ttsResponse = await axios.post(
        `${process.env.REACT_APP_BACKEND_URL}/api/voice/speak`,
        ttsFormData,
        {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
          responseType: 'blob'
        }
      );

      // Play audio
      await playAudio(ttsResponse.data);
    } catch (error) {
      console.error('Process audio error:', error);
      alert('Failed to process voice. Please check your API keys.');
    } finally {
      setIsProcessing(false);
    }
  };

  const playAudio = async (audioBlob: Blob) => {
    try {
      const audioUrl = URL.createObjectURL(audioBlob);
      const audio = new Audio(audioUrl);

      setIsPlaying(true);

      audio.onended = () => {
        setIsPlaying(false);
        URL.revokeObjectURL(audioUrl);
      };

      await audio.play();
    } catch (error) {
      console.error('Play audio error:', error);
      alert('Failed to play audio response.');
      setIsPlaying(false);
    }
  };

  return (
    <div className="voice-container">
      <div className="header">
        <button onClick={() => navigate(-1)} className="back-button">
          ←
        </button>
        <h2 className="header-title">Voice Mode</h2>
        <div className="placeholder"></div>
      </div>

      <div className="content">
        <div className="waveform-container">
          {recording ? (
            <div className="recording-indicator">
              <div className="pulse-outer">
                <div className="pulse-inner">
                  <div className="mic-icon">🎤</div>
                </div>
              </div>
              <p className="recording-text">Listening...</p>
            </div>
          ) : isProcessing ? (
            <div className="processing-container">
              <div className="loading-spinner"></div>
              <p className="processing-text">Processing...</p>
            </div>
          ) : (
            <div className="idle-container">
              <div className="mic-outline-icon">🎤</div>
              <p className="idle-text">Tap to speak with {aiName}</p>
            </div>
          )}
        </div>

        {transcription ? (
          <div className="transcription-container">
            <p className="transcription-label">You said:</p>
            <p className="transcription-text">{transcription}</p>
          </div>
        ) : null}

        {aiResponse ? (
          <div className="response-container">
            <p className="response-label">{aiName} says:</p>
            <p className="response-text">{aiResponse}</p>
            {isPlaying && (
              <div className="playing-indicator">
                <span className="volume-icon">🔊</span>
                <p className="playing-text">Playing...</p>
              </div>
            )}
          </div>
        ) : null}
      </div>

      <div className="footer">
        <button
          className={`record-button ${recording ? 'active' : ''}`}
          onClick={recording ? stopRecording : startRecording}
          disabled={isProcessing}
        >
          {recording ? '⏹️' : '🎤'}
        </button>
        <p className="instruction-text">
          {recording ? 'Tap to stop' : 'Tap to start speaking'}
        </p>
      </div>
    </div>
  );
};

export default VoiceScreen;