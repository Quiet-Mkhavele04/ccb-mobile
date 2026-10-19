import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

import { light } from '../../theme/colors';
import { fontFamily, fontSize } from '../../theme/fonts';
import ProgressDots from '../../components/ProgressDots';

type Props = {
  onBack: () => void;
  onContinue: (languageCode: string) => void;
};

export default function LanguageSelectScreen({
  onBack,
  onContinue,
}: Props) {
  const handleContinue = () => {
    onContinue('en');
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Pressable
          onPress={onBack}
          hitSlop={12}
          accessibilityRole="button"
          accessibilityLabel="Go back"
        >
          <Ionicons
            name="chevron-back"
            size={24}
            color={light.charcoal}
          />
        </Pressable>

        <ProgressDots
          total={5}
          current={1}
          color={light.primary}
        />

        <View style={styles.headerPlaceholder} />
      </View>

      <View style={styles.content}>
        <View style={styles.titleBlock}>
          <Text style={styles.title}>
            Choose your language
          </Text>

          <Text style={styles.subtitle}>
            Select the language you want to use in CCB.
          </Text>
        </View>

        <View style={styles.languageCard}>
          <Text style={styles.languageLabel}>
            English
          </Text>

          <Ionicons
            name="checkmark-circle"
            size={22}
            color={light.primary}
          />
        </View>
      </View>

      <View style={styles.footer}>
        <Pressable
          style={({ pressed }) => [
            styles.continueButton,
            pressed && styles.continueButtonPressed,
          ]}
          onPress={handleContinue}
          accessibilityRole="button"
          accessibilityLabel="Continue using English"
        >
          <Text style={styles.continueButtonText}>
            Continue
          </Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: light.offWhite,
  },

  header: {
    height: 64,
    paddingHorizontal: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },

  headerPlaceholder: {
    width: 24,
  },

  content: {
    flex: 1,
    paddingHorizontal: 24,
  },

  titleBlock: {
    paddingTop: 24,
    paddingBottom: 20,
  },

  title: {
    fontFamily: fontFamily.bold,
    fontSize: fontSize.xxl,
    color: light.charcoal,
    marginBottom: 10,
  },

  subtitle: {
    fontFamily: fontFamily.regular,
    fontSize: fontSize.md,
    color: light.textSecondary,
    lineHeight: 22,
  },

  languageCard: {
    minHeight: 74,
    borderWidth: 2,
    borderColor: light.primary,
    borderRadius: 14,
    backgroundColor: light.offWhite,
    paddingHorizontal: 18,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },

  languageLabel: {
    fontFamily: fontFamily.medium,
    fontSize: fontSize.md,
    color: light.primary,
  },

  footer: {
    paddingHorizontal: 24,
    paddingBottom: 24,
  },

  continueButton: {
    height: 56,
    borderRadius: 16,
    backgroundColor: light.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },

  continueButtonPressed: {
    opacity: 0.85,
  },

  continueButtonText: {
    fontFamily: fontFamily.bold,
    fontSize: fontSize.md,
    color: light.offWhite,
  },
});