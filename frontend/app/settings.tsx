import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface APIKey {
  name: string;
  placeholder: string;
  value: string;
}

export default function SettingsScreen() {
  const router = useRouter();
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
      const name = await AsyncStorage.getItem('ai_name');
      if (name) setAiName(name);

      // Load API keys (masked)
      const response = await axios.get(`${process.env.EXPO_PUBLIC_BACKEND_URL}/api/settings/keys`);
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
      const keyData: any = {};
      
      keys.forEach(key => {
        if (key.value && !key.value.includes('***')) {
          const keyName = key.name.toLowerCase().replace('ibm watsonx', 'ibm_watsonx').replace('aimlapi', 'aimlapi').replace('elevenlabs', 'elevenlabs').replace('replicate', 'replicate');
          if (keyName === 'anthropic') keyData.anthropic = key.value;
          else if (keyName === 'ibm_watsonx') keyData.ibm_watsonx = key.value;
          else if (keyName === 'aimlapi') keyData.aimlapi = key.value;
          else if (keyName === 'groq') keyData.groq = key.value;
          else if (keyName === 'mistral') keyData.mistral = key.value;
          else if (keyName === 'elevenlabs') keyData.elevenlabs = key.value;
          else if (keyName === 'replicate') keyData.replicate = key.value;
          else keyData[keyName] = key.value;
        }
      });

      const customKeyObj: any = {};
      customKeys.forEach(key => {
        if (key.value && !key.value.includes('***')) {
          customKeyObj[key.name] = key.value;
        }
      });

      await axios.post(`${process.env.EXPO_PUBLIC_BACKEND_URL}/api/settings/keys`, {
        ...keyData,
        custom_keys: customKeyObj
      });

      Alert.alert('Success', 'API keys updated successfully!');
      loadSettings();
    } catch (error) {
      Alert.alert('Error', 'Failed to update API keys.');
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
    Alert.prompt(
      'Add Custom API Key',
      'Enter a name for this key (e.g., "Video Generation", "Payment Gateway")',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Add',
          onPress: (name) => {
            if (name) {
              setCustomKeys([...customKeys, { name, value: '' }]);
            }
          },
        },
      ]
    );
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
      <View style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#6C63FF" />
          <Text style={styles.loadingText}>Loading settings...</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#1A1A2E" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Settings</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView style={styles.content} contentContainerStyle={styles.contentContainer}>
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Ionicons name="person-circle" size={24} color="#6C63FF" />
            <Text style={styles.sectionTitle}>AI Profile</Text>
          </View>
          <View style={styles.infoCard}>
            <Text style={styles.infoLabel}>AI Name</Text>
            <Text style={styles.infoValue}>{aiName || 'Not set'}</Text>
          </View>
        </View>

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Ionicons name="key" size={24} color="#6C63FF" />
            <Text style={styles.sectionTitle}>API Keys</Text>
          </View>
          <Text style={styles.sectionDescription}>
            Manage your API keys. Existing keys are masked for security.
          </Text>

          {keys.map((key, index) => (
            <View key={index} style={styles.keyInput}>
              <Text style={styles.keyLabel}>{key.name}</Text>
              <TextInput
                style={styles.input}
                placeholder={key.placeholder}
                value={key.value}
                onChangeText={(value) => updateKey(index, value)}
                secureTextEntry
                placeholderTextColor="#9CA3AF"
              />
            </View>
          ))}

          {customKeys.length > 0 && (
            <View style={styles.customKeysContainer}>
              <Text style={styles.customKeysTitle}>Custom Keys</Text>
              {customKeys.map((key, index) => (
                <View key={index} style={styles.keyInput}>
                  <View style={styles.keyLabelRow}>
                    <Text style={styles.keyLabel}>{key.name}</Text>
                    <TouchableOpacity onPress={() => removeCustomKey(index)}>
                      <Ionicons name="trash" size={20} color="#EF4444" />
                    </TouchableOpacity>
                  </View>
                  <TextInput
                    style={styles.input}
                    placeholder="Enter API key"
                    value={key.value}
                    onChangeText={(value) => updateCustomKey(index, value)}
                    secureTextEntry
                    placeholderTextColor="#9CA3AF"
                  />
                </View>
              ))}
            </View>
          )}

          <TouchableOpacity style={styles.addKeyButton} onPress={addCustomKey}>
            <Ionicons name="add-circle-outline" size={20} color="#6C63FF" />
            <Text style={styles.addKeyText}>Add Custom API Key</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.saveButton, saving && styles.saveButtonDisabled]}
            onPress={saveAPIKeys}
            disabled={saving}
          >
            {saving ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <>
                <Ionicons name="save" size={20} color="#fff" />
                <Text style={styles.saveButtonText}>Save API Keys</Text>
              </>
            )}
          </TouchableOpacity>
        </View>

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Ionicons name="information-circle" size={24} color="#6C63FF" />
            <Text style={styles.sectionTitle}>About</Text>
          </View>
          <View style={styles.infoCard}>
            <Text style={styles.infoText}>
              Your AI Companion - Powered by GPT-4o, DALL-E 3, and advanced research tools.
              {' \n\n'}Version 1.0.0
            </Text>
          </View>
        </View>
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
  content: {
    flex: 1,
  },
  contentContainer: {
    padding: 24,
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#6B7280',
  },
  section: {
    marginBottom: 32,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1A1A2E',
    marginLeft: 8,
  },
  sectionDescription: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 16,
    lineHeight: 20,
  },
  infoCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  infoLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#6B7280',
    marginBottom: 4,
  },
  infoValue: {
    fontSize: 16,
    color: '#1A1A2E',
  },
  infoText: {
    fontSize: 14,
    color: '#1A1A2E',
    lineHeight: 22,
  },
  keyInput: {
    marginBottom: 16,
  },
  keyLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1A1A2E',
    marginBottom: 8,
  },
  keyLabelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 12,
    fontSize: 14,
    color: '#1A1A2E',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  customKeysContainer: {
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  customKeysTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6B7280',
    marginBottom: 16,
  },
  addKeyButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    marginBottom: 16,
  },
  addKeyText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6C63FF',
    marginLeft: 8,
  },
  saveButton: {
    backgroundColor: '#6C63FF',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 12,
  },
  saveButtonDisabled: {
    opacity: 0.5,
  },
  saveButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
});

