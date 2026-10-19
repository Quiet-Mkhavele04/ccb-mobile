import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';

import Logo from '../../components/Logo';
import { light } from '../../theme/colors';
import { fontFamily, fontSize } from '../../theme/fonts';
import { useLanguage } from '../../i18n/LanguageContext';

type Props = {
  onGetStarted: () => void;
  
};

export default function WelcomeScreen({
  onGetStarted,
  
}: Props) {
  const { t } = useLanguage();

  return (
    <LinearGradient
      colors={[light.primary, light.primaryLight]}
      start={{ x: 0.1, y: 0 }}
      end={{ x: 0.9, y: 1 }}
      style={styles.container}
    >
      {/* subtle geometric pattern accents */}
      <View
        style={[
          styles.dot,
          {
            top: 60,
            left: -20,
            opacity: 0.15,
          },
        ]}
      />

      <View
        style={[
          styles.dot,
          {
            top: 220,
            right: -40,
            opacity: 0.1,
            width: 160,
            height: 160,
          },
        ]}
      />

      <View
        style={[
          styles.dot,
          {
            bottom: 140,
            left: -60,
            opacity: 0.12,
            width: 200,
            height: 200,
          },
        ]}
      />

      <SafeAreaView style={styles.content}>
        <View style={styles.brandBlock}>
          <Logo size={120} />

          <Text style={styles.title}>
            CCB
          </Text>

          <Text style={styles.tagline}>
            Connect. Communicate. Belong.
          </Text>
        </View>

        <View style={styles.actions}>
          <Pressable
            style={styles.primaryButton}
            onPress={onGetStarted}
          >
            <Text style={styles.primaryButtonText}>
              {t('getStarted')}
            </Text>
          </Pressable>

          

          <Pressable style={styles.languageHint}>
            <Text style={styles.languageHintText}>
              🌐 English · isiZulu · Sesotho · isiXhosa
            </Text>
          </Pressable>
        </View>
      </SafeAreaView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },

  dot: {
    position: 'absolute',
    width: 120,
    height: 120,
    borderRadius: 999,
    backgroundColor: light.gold,
  },

  content: {
    flex: 1,
    justifyContent: 'space-between',
    paddingHorizontal: 28,
    paddingVertical: 40,
  },

  brandBlock: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },

  title: {
    fontFamily: fontFamily.bold,
    fontSize: fontSize.xxl,
    color: light.offWhite,
    marginTop: 20,
    letterSpacing: 2,
  },

  tagline: {
    fontFamily: fontFamily.secondary,
    fontSize: fontSize.md,
    color: light.offWhite,
    opacity: 0.9,
    marginTop: 8,
  },

  actions: {
    width: '100%',
  },

  primaryButton: {
    backgroundColor: light.gold,
    borderRadius: 16,
    paddingVertical: 16,
    alignItems: 'center',
    marginBottom: 12,
  },

  primaryButtonText: {
    fontFamily: fontFamily.semibold,
    fontSize: fontSize.md,
    color: light.charcoal,
  },

  secondaryButton: {
    borderRadius: 16,
    paddingVertical: 16,
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: 'rgba(248,246,242,0.5)',
  },

  secondaryButtonText: {
    fontFamily: fontFamily.medium,
    fontSize: fontSize.md,
    color: light.offWhite,
  },

  languageHint: {
    marginTop: 20,
    alignItems: 'center',
  },

  languageHintText: {
    fontFamily: fontFamily.secondary,
    fontSize: fontSize.xs,
    color: 'rgba(248,246,242,0.8)',
  },
});