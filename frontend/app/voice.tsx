import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Audio } from 'expo-av';
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function VoiceScreen() {
  const router = useRouter();
  const [recording, setRecording] = useState<Audio.Recording | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [aiName, setAiName] = useState('AI');
  const [transcription, setTranscription] = useState('');
  const [aiResponse, setAiResponse] = useState('');
  const [sound, setSound] = useState<Audio.Sound | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);

  useEffect(() => {
    loadAIName();
    requestPermissions();
    
    return () => {
      if (sound) {
        sound.unloadAsync();
      }
    };
  }, []);

  const loadAIName = async () => {
    try {
      const name = await AsyncStorage.getItem('ai_name');
      if (name) setAiName(name);
    } catch (error) {
      console.log('Error loading AI name:', error);
    }
  };

  const requestPermissions = async () => {
    try {
      const { status } = await Audio.requestPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission Required', 'Microphone access is required for voice features.');
      }
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
      });
    } catch (error) {
      console.error('Permission error:', error);
    }
  };

  const startRecording = async () => {
    try {
      const { recording } = await Audio.Recording.createAsync(
        Audio.RecordingOptionsPresets.HIGH_QUALITY
      );
      setRecording(recording);
      setIsRecording(true);
      setTranscription('');
      setAiResponse('');
    } catch (error) {
      console.error('Failed to start recording:', error);
      Alert.alert('Error', 'Failed to start recording. Please try again.');
    }
  };

  const stopRecording = async () => {
    if (!recording) return;

    try {
      setIsRecording(false);
      setIsProcessing(true);
      
      await recording.stopAndUnloadAsync();
      const uri = recording.getURI();
      
      if (uri) {
        await processAudio(uri);
      }
      
      setRecording(null);
    } catch (error) {
      console.error('Failed to stop recording:', error);
      Alert.alert('Error', 'Failed to process recording.');
      setIsProcessing(false);
    }
  };

  const processAudio = async (uri: string) => {
    try {
      // Step 1: Transcribe audio
      const formData = new FormData();
      formData.append('audio', {
        uri,
        type: 'audio/m4a',
        name: 'recording.m4a',
      } as any);

      const transcribeResponse = await axios.post(
        `${process.env.EXPO_PUBLIC_BACKEND_URL}/api/voice/transcribe`,
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
      const chatResponse = await axios.post(`${process.env.EXPO_PUBLIC_BACKEND_URL}/api/chat`, {
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
        `${process.env.EXPO_PUBLIC_BACKEND_URL}/api/voice/speak`,
        ttsFormData,
        {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        }
      );

      // Play audio
      await playAudio(ttsResponse.data.audio_base64);
    } catch (error) {
      console.error('Process audio error:', error);
      Alert.alert('Error', 'Failed to process voice. Please check your API keys.');
    } finally {
      setIsProcessing(false);
    }
  };

  const playAudio = async (base64Audio: string) => {
    try {
      if (sound) {
        await sound.unloadAsync();
      }

      // Convert base64 to audio file
      const { sound: newSound } = await Audio.Sound.createAsync(
        { uri: `data:audio/mp3;base64,${base64Audio}` },
        { shouldPlay: true }
      );

      setSound(newSound);
      setIsPlaying(true);

      newSound.setOnPlaybackStatusUpdate((status) => {
        if (status.isLoaded && status.didJustFinish) {
          setIsPlaying(false);
        }
      });
    } catch (error) {
      console.error('Play audio error:', error);
      Alert.alert('Error', 'Failed to play audio response.');
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#1A1A2E" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Voice Mode</Text>
        <View style={styles.placeholder} />
      </View>

      <View style={styles.content}>
        <View style={styles.waveformContainer}>
          {isRecording ? (
            <View style={styles.recordingIndicator}>
              <View style={styles.pulseOuter}>
                <View style={styles.pulseInner}>
                  <Ionicons name="mic" size={48} color="#fff" />
                </View>
              </View>
              <Text style={styles.recordingText}>Listening...</Text>
            </View>
          ) : isProcessing ? (
            <View style={styles.processingContainer}>
              <ActivityIndicator size="large" color="#6C63FF" />
              <Text style={styles.processingText}>Processing...</Text>
            </View>
          ) : (
            <View style={styles.idleContainer}>
              <Ionicons name="mic-outline" size={80} color="#D1D5DB" />
              <Text style={styles.idleText}>Tap to speak with {aiName}</Text>
            </View>
          )}
        </View>

        {transcription ? (
          <View style={styles.transcriptionContainer}>
            <Text style={styles.transcriptionLabel}>You said:</Text>
            <Text style={styles.transcriptionText}>{transcription}</Text>
          </View>
        ) : null}

        {aiResponse ? (
          <View style={styles.responseContainer}>
            <Text style={styles.responseLabel}>{aiName} says:</Text>
            <Text style={styles.responseText}>{aiResponse}</Text>
            {isPlaying && (
              <View style={styles.playingIndicator}>
                <Ionicons name="volume-high" size={16} color="#6C63FF" />
                <Text style={styles.playingText}>Playing...</Text>
              </View>
            )}
          </View>
        ) : null}
      </View>

      <View style={styles.footer}>
        <TouchableOpacity
          style={[styles.recordButton, isRecording && styles.recordButtonActive]}
          onPress={isRecording ? stopRecording : startRecording}
          disabled={isProcessing}
        >
          <Ionicons
            name={isRecording ? 'stop' : 'mic'}
            size={32}
            color="#fff"
          />
        </TouchableOpacity>
        <Text style={styles.instructionText}>
          {isRecording ? 'Tap to stop' : 'Tap to start speaking'}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F7FA',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 56,
    paddingBottom: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1A1A2E',
  },
  placeholder: {
    width: 40,
  },
  content: {
    flex: 1,
    padding: 24,
  },
  waveformContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  recordingIndicator: {
    alignItems: 'center',
  },
  pulseOuter: {
    width: 160,
    height: 160,
    borderRadius: 80,
    backgroundColor: 'rgba(108, 99, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  pulseInner: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: '#6C63FF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  recordingText: {
    marginTop: 24,
    fontSize: 18,
    fontWeight: '600',
    color: '#6C63FF',
  },
  processingContainer: {
    alignItems: 'center',
  },
  processingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#6B7280',
  },
  idleContainer: {
    alignItems: 'center',
  },
  idleText: {
    marginTop: 16,
    fontSize: 16,
    color: '#9CA3AF',
    textAlign: 'center',
  },
  transcriptionContainer: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginTop: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  transcriptionLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#6B7280',
    marginBottom: 8,
  },
  transcriptionText: {
    fontSize: 15,
    color: '#1A1A2E',
    lineHeight: 22,
  },
  responseContainer: {
    backgroundColor: '#F0EBFF',
    borderRadius: 12,
    padding: 16,
    marginTop: 12,
    borderWidth: 1,
    borderColor: '#E0D7FF',
  },
  responseLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#6C63FF',
    marginBottom: 8,
  },
  responseText: {
    fontSize: 15,
    color: '#1A1A2E',
    lineHeight: 22,
  },
  playingIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 12,
  },
  playingText: {
    marginLeft: 8,
    fontSize: 12,
    color: '#6C63FF',
    fontWeight: '600',
  },
  footer: {
    alignItems: 'center',
    paddingVertical: 32,
  },
  recordButton: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: '#6C63FF',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#6C63FF',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  recordButtonActive: {
    backgroundColor: '#FF6B9D',
  },
  instructionText: {
    marginTop: 16,
    fontSize: 14,
    color: '#6B7280',
  },
});
