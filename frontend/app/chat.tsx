import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

export default function ChatScreen() {
  const router = useRouter();
  const scrollViewRef = useRef<ScrollView>(null);
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
      const name = await AsyncStorage.getItem('ai_name');
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
      const response = await axios.post(`${process.env.EXPO_PUBLIC_BACKEND_URL}/api/chat`, {
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
        scrollViewRef.current?.scrollToEnd({ animated: true });
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

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={90}
    >
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#1A1A2E" />
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle}>{aiName}</Text>
          <Text style={styles.headerSubtitle}>AI Companion</Text>
        </View>
        <View style={styles.headerRight}>
          <TouchableOpacity
            onPress={() => setShowProviderSelector(!showProviderSelector)}
            style={styles.providerButton}
          >
            <Ionicons name="settings" size={20} color="#6C63FF" />
          </TouchableOpacity>
          <TouchableOpacity onPress={startNewConversation} style={styles.newChatButton}>
            <Ionicons name="add" size={24} color="#6C63FF" />
          </TouchableOpacity>
        </View>
      </View>

      {showProviderSelector && (
        <View style={styles.providerSelector}>
          <Text style={styles.providerTitle}>AI Provider</Text>
          <View style={styles.providerOptions}>
            <TouchableOpacity
              style={[styles.providerOption, preferredProvider === 'openai' && styles.providerOptionActive]}
              onPress={() => setPreferredProvider('openai')}
            >
              <Text style={[styles.providerText, preferredProvider === 'openai' && styles.providerTextActive]}>OpenAI GPT-4</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.providerOption, preferredProvider === 'anthropic' && styles.providerOptionActive]}
              onPress={() => setPreferredProvider('anthropic')}
            >
              <Text style={[styles.providerText, preferredProvider === 'anthropic' && styles.providerTextActive]}>Anthropic Claude</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.providerOption, preferredProvider === 'emergent_llm' && styles.providerOptionActive]}
              onPress={() => setPreferredProvider('emergent_llm')}
            >
              <Text style={[styles.providerText, preferredProvider === 'emergent_llm' && styles.providerTextActive]}>Emergent LLM</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.providerOption, preferredProvider === 'ibm_watsonx' && styles.providerOptionActive]}
              onPress={() => setPreferredProvider('ibm_watsonx')}
            >
              <Text style={[styles.providerText, preferredProvider === 'ibm_watsonx' && styles.providerTextActive]}>IBM Watsonx</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.providerOption, preferredProvider === 'aimlapi' && styles.providerOptionActive]}
              onPress={() => setPreferredProvider('aimlapi')}
            >
              <Text style={[styles.providerText, preferredProvider === 'aimlapi' && styles.providerTextActive]}>AIMLAPI</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.providerOption, preferredProvider === 'groq' && styles.providerOptionActive]}
              onPress={() => setPreferredProvider('groq')}
            >
              <Text style={[styles.providerText, preferredProvider === 'groq' && styles.providerTextActive]}>Groq</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.providerOption, preferredProvider === 'mistral' && styles.providerOptionActive]}
              onPress={() => setPreferredProvider('mistral')}
            >
              <Text style={[styles.providerText, preferredProvider === 'mistral' && styles.providerTextActive]}>Mistral</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      <ScrollView
        ref={scrollViewRef}
        style={styles.messagesContainer}
        contentContainerStyle={styles.messagesContent}
        onContentSizeChange={() => scrollViewRef.current?.scrollToEnd({ animated: true })}
      >
        {messages.length === 0 ? (
          <View style={styles.emptyState}>
            <Ionicons name="chatbubbles-outline" size={64} color="#D1D5DB" />
            <Text style={styles.emptyText}>Start a conversation with {aiName}</Text>
            <Text style={styles.emptySubtext}>Ask anything - I'm here to help!</Text>
          </View>
        ) : (
          messages.map((message, index) => (
            <View
              key={index}
              style={[
                styles.messageBubble,
                message.role === 'user' ? styles.userBubble : styles.aiBubble
              ]}
            >
              <Text
                style={[
                  styles.messageText,
                  message.role === 'user' ? styles.userText : styles.aiText
                ]}
              >
                {message.content}
              </Text>
            </View>
          ))
        )}
        {loading && (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="small" color="#6C63FF" />
            <Text style={styles.loadingText}>Thinking...</Text>
          </View>
        )}
      </ScrollView>

      <View style={styles.inputContainer}>
        <View style={styles.inputWrapper}>
          <TextInput
            style={styles.input}
            placeholder="Type a message..."
            value={inputText}
            onChangeText={setInputText}
            multiline
            maxLength={2000}
            placeholderTextColor="#9CA3AF"
          />
          <TouchableOpacity
            style={[styles.sendButton, (!inputText.trim() || loading) && styles.sendButtonDisabled]}
            onPress={sendMessage}
            disabled={!inputText.trim() || loading}
          >
            <Ionicons name="send" size={20} color="#fff" />
          </TouchableOpacity>
        </View>
      </View>
    </KeyboardAvoidingView>
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
  headerCenter: {
    flex: 1,
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1A1A2E',
  },
  headerSubtitle: {
    fontSize: 12,
    color: '#6B7280',
  },
  newChatButton: {
    padding: 8,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  providerButton: {
    padding: 8,
    marginRight: 8,
  },
  providerSelector: {
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  providerTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1A1A2E',
    marginBottom: 8,
  },
  providerOptions: {
    flexDirection: 'row',
    gap: 8,
  },
  providerOption: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    backgroundColor: '#F9FAFB',
  },
  providerOptionActive: {
    backgroundColor: '#6C63FF',
    borderColor: '#6C63FF',
  },
  providerText: {
    fontSize: 12,
    color: '#6B7280',
  },
  providerTextActive: {
    color: '#fff',
  },
  messagesContainer: {
    flex: 1,
  },
  messagesContent: {
    padding: 16,
    flexGrow: 1,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 64,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#6B7280',
    marginTop: 16,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#9CA3AF',
    marginTop: 8,
  },
  messageBubble: {
    maxWidth: '80%',
    borderRadius: 16,
    padding: 12,
    marginBottom: 12,
  },
  userBubble: {
    alignSelf: 'flex-end',
    backgroundColor: '#6C63FF',
    borderBottomRightRadius: 4,
  },
  aiBubble: {
    alignSelf: 'flex-start',
    backgroundColor: '#fff',
    borderBottomLeftRadius: 4,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  messageText: {
    fontSize: 15,
    lineHeight: 22,
  },
  userText: {
    color: '#fff',
  },
  aiText: {
    color: '#1A1A2E',
  },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
  },
  loadingText: {
    marginLeft: 8,
    fontSize: 14,
    color: '#6B7280',
  },
  inputContainer: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'flex-end',
  },
  input: {
    flex: 1,
    backgroundColor: '#F3F4F6',
    borderRadius: 24,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 15,
    maxHeight: 100,
    marginRight: 8,
    color: '#1A1A2E',
  },
  sendButton: {
    backgroundColor: '#6C63FF',
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sendButtonDisabled: {
    opacity: 0.5,
  },
});
