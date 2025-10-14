import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Image,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as DocumentPicker from 'expo-document-picker';
import * as FileSystem from 'expo-file-system';
import axios from 'axios';

export default function ToolsScreen() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<'image' | 'code' | 'research' | 'document' | 'real-estate' | 'business' | 'personal' | 'automation'>('image');
  const [prompt, setPrompt] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);

  const generateImage = async () => {
    if (!prompt.trim()) return;
    
    setLoading(true);
    setResult(null);
    
    try {
      const response = await axios.post(`${process.env.EXPO_PUBLIC_BACKEND_URL}/api/image/generate`, {
        prompt,
        size: '1024x1024'
      });
      
      setResult({ type: 'image', data: response.data.image_base64 });
    } catch (error: any) {
      Alert.alert('Error', 'Failed to generate image. Please check your API keys.');
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
      const response = await axios.post(`${process.env.EXPO_PUBLIC_BACKEND_URL}/api/code`, {
        message: prompt
      });
      
      setResult({ type: 'code', data: response.data.code });
    } catch (error: any) {
      Alert.alert('Error', 'Failed to generate code.');
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
      const response = await axios.post(`${process.env.EXPO_PUBLIC_BACKEND_URL}/api/research`, {
        query: prompt,
        source: 'perplexity'
      });

      setResult({ type: 'research', data: response.data });
    } catch (error: any) {
      Alert.alert('Error', 'Research failed. Trying alternative method...');
      try {
        const response = await axios.post(`${process.env.EXPO_PUBLIC_BACKEND_URL}/api/research`, {
          query: prompt,
          source: 'web'
        });
        setResult({ type: 'research', data: response.data });
      } catch (fallbackError) {
        Alert.alert('Error', 'All research methods failed.');
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
      const response = await axios.post(`${process.env.EXPO_PUBLIC_BACKEND_URL}/api/real-estate/analyze`, {
        message: prompt
      });

      setResult({ type: 'real-estate', data: response.data.analysis });
    } catch (error: any) {
      Alert.alert('Error', 'Real estate analysis failed.');
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
      const response = await axios.post(`${process.env.EXPO_PUBLIC_BACKEND_URL}/api/business/strategy`, {
        message: prompt
      });

      setResult({ type: 'business', data: response.data.strategy });
    } catch (error: any) {
      Alert.alert('Error', 'Business strategy analysis failed.');
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
      const response = await axios.post(`${process.env.EXPO_PUBLIC_BACKEND_URL}/api/personal/development`, {
        message: prompt
      });

      setResult({ type: 'personal', data: response.data.guidance });
    } catch (error: any) {
      Alert.alert('Error', 'Personal development guidance failed.');
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
      const response = await axios.post(`${process.env.EXPO_PUBLIC_BACKEND_URL}/api/task/automation`, {
        message: prompt
      });

      setResult({ type: 'automation', data: response.data.automation_plan });
    } catch (error: any) {
      Alert.alert('Error', 'Task automation planning failed.');
      console.error('Task automation error:', error);
    } finally {
      setLoading(false);
    }
  };

  const analyzeDocument = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: ['image/*', 'application/pdf'],
        copyToCacheDirectory: true
      });

      if (result.canceled) return;

      const file = result.assets[0];
      setLoading(true);

      // Read file as base64
      const base64 = await FileSystem.readAsStringAsync(file.uri, {
        encoding: FileSystem.EncodingType.Base64,
      });

      const response = await axios.post(`${process.env.EXPO_PUBLIC_BACKEND_URL}/api/document/analyze`, {
        image_base64: base64,
        prompt: prompt || 'Analyze this document and provide a detailed summary.'
      });

      setResult({ type: 'document', data: response.data.analysis });
    } catch (error) {
      Alert.alert('Error', 'Failed to analyze document.');
      console.error('Document analysis error:', error);
    } finally {
      setLoading(false);
    }
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
          <View style={styles.resultContainer}>
            <Image
              source={{ uri: `data:image/png;base64,${result.data}` }}
              style={styles.generatedImage}
              resizeMode="contain"
            />
          </View>
        );
      case 'code':
      case 'document':
      case 'research':
      case 'real-estate':
      case 'business':
      case 'personal':
      case 'automation':
        return (
          <View style={styles.resultContainer}>
            <ScrollView style={styles.textResultScroll}>
              <Text style={styles.resultText}>
                {typeof result.data === 'string' ? result.data : result.data.result || result.data}
              </Text>
            </ScrollView>
          </View>
        );
      default:
        return null;
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#1A1A2E" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>AI Tools</Text>
        <View style={styles.placeholder} />
      </View>

      <View style={styles.tabContainer}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'image' && styles.activeTab]}
          onPress={() => setActiveTab('image')}
        >
          <Ionicons name="image" size={20} color={activeTab === 'image' ? '#6C63FF' : '#6B7280'} />
          <Text style={[styles.tabText, activeTab === 'image' && styles.activeTabText]}>Image</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tab, activeTab === 'code' && styles.activeTab]}
          onPress={() => setActiveTab('code')}
        >
          <Ionicons name="code-slash" size={20} color={activeTab === 'code' ? '#6C63FF' : '#6B7280'} />
          <Text style={[styles.tabText, activeTab === 'code' && styles.activeTabText]}>Code</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tab, activeTab === 'research' && styles.activeTab]}
          onPress={() => setActiveTab('research')}
        >
          <Ionicons name="search" size={20} color={activeTab === 'research' ? '#6C63FF' : '#6B7280'} />
          <Text style={[styles.tabText, activeTab === 'research' && styles.activeTabText]}>Research</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tab, activeTab === 'document' && styles.activeTab]}
          onPress={() => setActiveTab('document')}
        >
          <Ionicons name="document-text" size={20} color={activeTab === 'document' ? '#6C63FF' : '#6B7280'} />
          <Text style={[styles.tabText, activeTab === 'document' && styles.activeTabText]}>Document</Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content} contentContainerStyle={styles.contentContainer}>
        <View style={styles.promptContainer}>
          <Text style={styles.label}>
              {activeTab === 'image' && 'Describe the image you want to generate'}
              {activeTab === 'code' && 'Describe the code you need or ask a coding question'}
              {activeTab === 'research' && 'What do you want to research?'}
              {activeTab === 'document' && 'Upload a document to analyze (optional: add specific questions)'}
              {activeTab === 'real-estate' && 'Describe the property or market you want to analyze'}
              {activeTab === 'business' && 'Describe your business goals, challenges, or opportunities'}
              {activeTab === 'personal' && 'What personal development goals or challenges are you facing?'}
              {activeTab === 'automation' && 'Describe the tasks or processes you want to automate'}
            </Text>
          <TextInput
            style={styles.promptInput}
            placeholder={`Enter your ${activeTab === 'document' ? 'question (optional)' : activeTab === 'real-estate' ? 'property details' : activeTab === 'business' ? 'business goals' : activeTab === 'personal' ? 'development goals' : activeTab === 'automation' ? 'tasks to automate' : 'prompt'}...`}
            value={prompt}
            onChangeText={setPrompt}
            multiline
            placeholderTextColor="#9CA3AF"
          />
        </View>

        <TouchableOpacity
          style={[styles.generateButton, loading && styles.generateButtonDisabled]}
          onPress={handleAction}
          disabled={loading || ((activeTab !== 'document' && activeTab !== 'real-estate' && activeTab !== 'business' && activeTab !== 'personal' && activeTab !== 'automation') && !prompt.trim())}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <>
              <Ionicons name="flash" size={20} color="#fff" />
              <Text style={styles.generateButtonText}>
                {activeTab === 'image' && 'Generate Image'}
                {activeTab === 'code' && 'Generate Code'}
                {activeTab === 'research' && 'Start Research'}
                {activeTab === 'document' && 'Upload & Analyze'}
                {activeTab === 'real-estate' && 'Analyze Real Estate'}
                {activeTab === 'business' && 'Business Strategy'}
                {activeTab === 'personal' && 'Personal Development'}
                {activeTab === 'automation' && 'Task Automation'}
              </Text>
            </>
          )}
        </TouchableOpacity>

        {renderResult()}
      </ScrollView>
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
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  tab: {
    flex: 1,
    flexDirection: 'column',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  activeTab: {
    borderBottomColor: '#6C63FF',
  },
  tabText: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 4,
  },
  activeTabText: {
    color: '#6C63FF',
    fontWeight: '600',
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    padding: 24,
  },
  promptContainer: {
    marginBottom: 24,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1A1A2E',
    marginBottom: 12,
  },
  promptInput: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    fontSize: 15,
    color: '#1A1A2E',
    minHeight: 120,
    textAlignVertical: 'top',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  generateButton: {
    backgroundColor: '#6C63FF',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 12,
    marginBottom: 24,
  },
  generateButtonDisabled: {
    opacity: 0.5,
  },
  generateButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  resultContainer: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  generatedImage: {
    width: '100%',
    height: 300,
    borderRadius: 8,
  },
  textResultScroll: {
    maxHeight: 400,
  },
  resultText: {
    fontSize: 14,
    color: '#1A1A2E',
    lineHeight: 22,
  },
});
