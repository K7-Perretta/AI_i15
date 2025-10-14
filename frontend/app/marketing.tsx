import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import axios from 'axios';

export default function MarketingScreen() {
  const router = useRouter();
  const [campaignType, setCampaignType] = useState<'flyer' | 'social' | 'email' | 'campaign'>('flyer');
  const [prompt, setPrompt] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState('');

  const generateMarketing = async () => {
    if (!prompt.trim()) {
      Alert.alert('Input Required', 'Please describe what you need.');
      return;
    }

    setLoading(true);
    setResult('');

    try {
      const enhancedPrompt = `Create a ${campaignType} for: ${prompt}`;
      
      const response = await axios.post(`${process.env.EXPO_PUBLIC_BACKEND_URL}/api/marketing`, {
        message: enhancedPrompt
      });

      setResult(response.data.content);
    } catch (error) {
      Alert.alert('Error', 'Failed to generate marketing content.');
      console.error('Marketing generation error:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#1A1A2E" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Marketing Tools</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView style={styles.content} contentContainerStyle={styles.contentContainer}>
        <View style={styles.typeSelector}>
          <Text style={styles.sectionTitle}>Campaign Type</Text>
          <View style={styles.typeGrid}>
            <TouchableOpacity
              style={[styles.typeCard, campaignType === 'flyer' && styles.typeCardActive]}
              onPress={() => setCampaignType('flyer')}
            >
              <Ionicons name="newspaper" size={32} color={campaignType === 'flyer' ? '#6C63FF' : '#6B7280'} />
              <Text style={[styles.typeText, campaignType === 'flyer' && styles.typeTextActive]}>Flyer</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.typeCard, campaignType === 'social' && styles.typeCardActive]}
              onPress={() => setCampaignType('social')}
            >
              <Ionicons name="share-social" size={32} color={campaignType === 'social' ? '#6C63FF' : '#6B7280'} />
              <Text style={[styles.typeText, campaignType === 'social' && styles.typeTextActive]}>Social Post</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.typeCard, campaignType === 'email' && styles.typeCardActive]}
              onPress={() => setCampaignType('email')}
            >
              <Ionicons name="mail" size={32} color={campaignType === 'email' ? '#6C63FF' : '#6B7280'} />
              <Text style={[styles.typeText, campaignType === 'email' && styles.typeTextActive]}>Email</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.typeCard, campaignType === 'campaign' && styles.typeCardActive]}
              onPress={() => setCampaignType('campaign')}
            >
              <Ionicons name="megaphone" size={32} color={campaignType === 'campaign' ? '#6C63FF' : '#6B7280'} />
              <Text style={[styles.typeText, campaignType === 'campaign' && styles.typeTextActive]}>Full Campaign</Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.promptContainer}>
          <Text style={styles.sectionTitle}>Describe Your Project</Text>
          <TextInput
            style={styles.promptInput}
            placeholder="E.g., Real estate open house this Sunday, modern minimalist style, focus on spacious living and natural light..."
            value={prompt}
            onChangeText={setPrompt}
            multiline
            placeholderTextColor="#9CA3AF"
          />
        </View>

        <TouchableOpacity
          style={[styles.generateButton, (loading || !prompt.trim()) && styles.generateButtonDisabled]}
          onPress={generateMarketing}
          disabled={loading || !prompt.trim()}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <>
              <Ionicons name="flash" size={20} color="#fff" />
              <Text style={styles.generateButtonText}>Generate Marketing Content</Text>
            </>
          )}
        </TouchableOpacity>

        {result ? (
          <View style={styles.resultContainer}>
            <View style={styles.resultHeader}>
              <Ionicons name="checkmark-circle" size={24} color="#10B981" />
              <Text style={styles.resultHeaderText}>Generated Content</Text>
            </View>
            <ScrollView style={styles.resultScroll}>
              <Text style={styles.resultText}>{result}</Text>
            </ScrollView>
          </View>
        ) : null}
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
  typeSelector: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1A1A2E',
    marginBottom: 16,
  },
  typeGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  typeCard: {
    width: '48%',
    aspectRatio: 1.5,
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#E5E7EB',
  },
  typeCardActive: {
    borderColor: '#6C63FF',
    backgroundColor: '#F0EBFF',
  },
  typeText: {
    marginTop: 8,
    fontSize: 14,
    fontWeight: '600',
    color: '#6B7280',
  },
  typeTextActive: {
    color: '#6C63FF',
  },
  promptContainer: {
    marginBottom: 24,
  },
  promptInput: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    fontSize: 15,
    color: '#1A1A2E',
    minHeight: 150,
    textAlignVertical: 'top',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  generateButton: {
    backgroundColor: '#9B59B6',
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
  resultHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  resultHeaderText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1A1A2E',
    marginLeft: 8,
  },
  resultScroll: {
    maxHeight: 400,
  },
  resultText: {
    fontSize: 14,
    color: '#1A1A2E',
    lineHeight: 22,
  },
});
