import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Image } from 'react-native';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';

export default function HomeScreen() {
  const router = useRouter();
  const [hasName, setHasName] = useState<boolean | null>(null);
  const [aiName, setAiName] = useState('');

  useEffect(() => {
    checkAIName();
  }, []);

  const checkAIName = async () => {
    try {
      const cachedName = await AsyncStorage.getItem('ai_name');
      if (cachedName) {
        setAiName(cachedName);
        setHasName(true);
      } else {
        // Check backend
        const response = await fetch(`${process.env.EXPO_PUBLIC_BACKEND_URL}/api/name`);
        const data = await response.json();
        if (data.has_name) {
          setAiName(data.name);
          await AsyncStorage.setItem('ai_name', data.name);
          setHasName(true);
        } else {
          setHasName(false);
        }
      }
    } catch (error) {
      console.log('Error checking AI name:', error);
      setHasName(false);
    }
  };

  if (hasName === null) {
    return (
      <View style={styles.container}>
        <Text style={styles.loadingText}>Loading...</Text>
      </View>
    );
  }

  if (!hasName) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <Ionicons name="sparkles" size={60} color="#6C63FF" />
          <Text style={styles.title}>Welcome!</Text>
          <Text style={styles.subtitle}>Let's get to know each other</Text>
        </View>

        <TouchableOpacity
          style={styles.primaryButton}
          onPress={() => router.push('/onboarding')}
        >
          <Text style={styles.primaryButtonText}>Start First Conversation</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <ScrollView style={styles.scrollContainer} contentContainerStyle={styles.scrollContent}>
      <View style={styles.header}>
        <Ionicons name="sparkles" size={48} color="#6C63FF" />
        <Text style={styles.welcomeText}>Hello! I'm {aiName}</Text>
        <Text style={styles.tagline}>Your AI Companion</Text>
      </View>

      <View style={styles.grid}>
        <TouchableOpacity
          style={[styles.card, styles.cardPrimary]}
          onPress={() => router.push('/chat')}
        >
          <Ionicons name="chatbubbles" size={32} color="#fff" />
          <Text style={styles.cardTitle}>Chat</Text>
          <Text style={styles.cardDescription}>Have a conversation</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.card, styles.cardSecondary]}
          onPress={() => router.push('/voice')}
        >
          <Ionicons name="mic" size={32} color="#fff" />
          <Text style={styles.cardTitle}>Voice</Text>
          <Text style={styles.cardDescription}>Talk with AI voice</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.card, styles.cardTertiary]}
          onPress={() => router.push('/tools')}
        >
          <Ionicons name="apps" size={32} color="#fff" />
          <Text style={styles.cardTitle}>Tools</Text>
          <Text style={styles.cardDescription}>Image, code, research</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.card, styles.cardQuaternary]}
          onPress={() => router.push('/history')}
        >
          <Ionicons name="time" size={32} color="#fff" />
          <Text style={styles.cardTitle}>History</Text>
          <Text style={styles.cardDescription}>Past conversations</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.card, styles.cardQuinary]}
          onPress={() => router.push('/marketing')}
        >
          <Ionicons name="megaphone" size={32} color="#fff" />
          <Text style={styles.cardTitle}>Marketing</Text>
          <Text style={styles.cardDescription}>Campaigns & flyers</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.card, styles.cardSenary]}
          onPress={() => router.push('/settings')}
        >
          <Ionicons name="settings" size={32} color="#fff" />
          <Text style={styles.cardTitle}>Settings</Text>
          <Text style={styles.cardDescription}>API keys & more</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F7FA',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  scrollContainer: {
    flex: 1,
    backgroundColor: '#F5F7FA',
  },
  scrollContent: {
    padding: 24,
  },
  header: {
    alignItems: 'center',
    marginBottom: 32,
    marginTop: 48,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#1A1A2E',
    marginTop: 16,
  },
  subtitle: {
    fontSize: 16,
    color: '#6B7280',
    marginTop: 8,
  },
  welcomeText: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#1A1A2E',
    marginTop: 12,
  },
  tagline: {
    fontSize: 16,
    color: '#6B7280',
    marginTop: 4,
  },
  loadingText: {
    fontSize: 18,
    color: '#6B7280',
  },
  primaryButton: {
    backgroundColor: '#6C63FF',
    paddingHorizontal: 32,
    paddingVertical: 16,
    borderRadius: 12,
    marginTop: 24,
  },
  primaryButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  card: {
    width: '48%',
    aspectRatio: 1,
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cardPrimary: {
    backgroundColor: '#6C63FF',
  },
  cardSecondary: {
    backgroundColor: '#FF6B9D',
  },
  cardTertiary: {
    backgroundColor: '#4ECDC4',
  },
  cardQuaternary: {
    backgroundColor: '#FFA500',
  },
  cardQuinary: {
    backgroundColor: '#9B59B6',
  },
  cardSenary: {
    backgroundColor: '#34495E',
  },
  cardTitle: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
    marginTop: 12,
  },
  cardDescription: {
    color: 'rgba(255, 255, 255, 0.8)',
    fontSize: 12,
    marginTop: 4,
    textAlign: 'center',
  },
});
