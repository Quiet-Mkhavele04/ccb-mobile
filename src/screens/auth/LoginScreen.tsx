import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  Pressable,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';

import { light } from '../../theme/colors';
import { fontFamily, fontSize } from '../../theme/fonts';

type Props = {
  onBack: () => void;
  onLoginSuccess: (data: any) => void;
};

export default function LoginScreen({ onBack, onLoginSuccess }: Props) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    if (!email.trim() || !password) {
      Alert.alert('Missing information', 'Please enter your email and password.');
      return;
    }

    try {
      setLoading(true);

      const response = await fetch(
        'http://192.168.0.150:5234/api/Auth/login',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            email: email.trim(),
            password,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        Alert.alert(
          'Login failed',
          data.message || 'Invalid email or password.'
        );
        return;
      }

      console.log('LOGIN SUCCESS:', data);

      onLoginSuccess(data);
    } catch (error) {
      console.error('LOGIN ERROR:', error);

      Alert.alert(
        'Connection error',
        'Could not connect to the CCB server.'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <LinearGradient
      colors={[light.primary, light.primaryLight]}
      style={styles.container}
    >
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.content}>

          <Pressable onPress={onBack} style={styles.backButton}>
            <Text style={styles.backText}>‹ Back</Text>
          </Pressable>

          <View style={styles.header}>
            <Text style={styles.title}>Welcome back</Text>
            <Text style={styles.subtitle}>
              Log in to your CCB account
            </Text>
          </View>

          <View style={styles.form}>

            <Text style={styles.label}>Email</Text>

            <TextInput
              style={styles.input}
              placeholder="Enter your email"
              placeholderTextColor="rgba(248,246,242,0.55)"
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
            />

            <Text style={styles.label}>Password</Text>

            <TextInput
              style={styles.input}
              placeholder="Enter your password"
              placeholderTextColor="rgba(248,246,242,0.55)"
              value={password}
              onChangeText={setPassword}
              secureTextEntry
              autoCapitalize="none"
            />

            <Pressable
              style={styles.loginButton}
              onPress={handleLogin}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color={light.charcoal} />
              ) : (
                <Text style={styles.loginButtonText}>
                  Log In
                </Text>
              )}
            </Pressable>

          </View>

        </View>
      </SafeAreaView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },

  safeArea: {
    flex: 1,
  },

  content: {
    flex: 1,
    paddingHorizontal: 28,
    paddingVertical: 24,
  },

  backButton: {
    paddingVertical: 8,
  },

  backText: {
    color: light.offWhite,
    fontFamily: fontFamily.medium,
    fontSize: fontSize.md,
  },

  header: {
    marginTop: 50,
    marginBottom: 40,
  },

  title: {
    color: light.offWhite,
    fontFamily: fontFamily.bold,
    fontSize: fontSize.xxl,
  },

  subtitle: {
    color: light.offWhite,
    opacity: 0.8,
    fontFamily: fontFamily.secondary,
    fontSize: fontSize.md,
    marginTop: 8,
  },

  form: {
    width: '100%',
  },

  label: {
    color: light.offWhite,
    fontFamily: fontFamily.medium,
    fontSize: fontSize.sm,
    marginBottom: 8,
    marginTop: 16,
  },

  input: {
    backgroundColor: 'rgba(248,246,242,0.12)',
    borderWidth: 1,
    borderColor: 'rgba(248,246,242,0.3)',
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 15,
    color: light.offWhite,
    fontFamily: fontFamily.secondary,
    fontSize: fontSize.md,
  },

  loginButton: {
    backgroundColor: light.gold,
    borderRadius: 16,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 30,
  },

  loginButtonText: {
    color: light.charcoal,
    fontFamily: fontFamily.semibold,
    fontSize: fontSize.md,
  },
});