import React, { useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from
  'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

import { sendVerificationCode } from
  '../../api/authApi';
import { light } from '../../theme/colors';
import {
  fontFamily,
  fontSize,
} from '../../theme/fonts';
import ProgressDots from
  '../../components/ProgressDots';

type Props = {
  onBack: () => void;
  onContinue: (
    fullPhoneNumber: string
  ) => void;
};

export default function PhoneNumberScreen({
  onBack,
  onContinue,
}: Props) {
  const [number, setNumber] = useState('');
  const [isLoading, setIsLoading] =
    useState(false);
  const [errorMessage, setErrorMessage] =
    useState('');

  const digitsOnly =
    number.replace(/[^0-9]/g, '');

  // Accept either:
  // 82 123 4567
  // 082 123 4567
  const nationalNumber =
    digitsOnly.startsWith('0')
      ? digitsOnly.slice(1)
      : digitsOnly;

  const isValid =
    nationalNumber.length === 9 &&
    /^[6-8]/.test(nationalNumber);

  const handleNumberChange = (
    value: string
  ) => {
    setNumber(value);
    setErrorMessage('');
  };

  const handleContinue = async () => {
    if (!isValid || isLoading) {
      return;
    }

    const fullPhoneNumber =
      `+27${nationalNumber}`;

    try {
      setIsLoading(true);
      setErrorMessage('');

      const result =
        await sendVerificationCode(
          fullPhoneNumber
        );

      console.log(
        'Send-code result:',
        result
      );

      onContinue(result.phone);
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : 'Unable to send the code.';

      setErrorMessage(message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.keyboardContainer}
      behavior={
        Platform.OS === 'ios'
          ? 'padding'
          : undefined
      }
    >
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <Pressable
            onPress={onBack}
            hitSlop={12}
            disabled={isLoading}
          >
            <Ionicons
              name="chevron-back"
              size={24}
              color={light.charcoal}
            />
          </Pressable>

          <ProgressDots
            total={5}
            current={2}
            color={light.primary}
          />

          <View style={styles.headerSpace} />
        </View>

        <View style={styles.titleBlock}>
          <Text style={styles.title}>
            What's your number?
          </Text>

          <Text style={styles.subtitle}>
            We'll send you a one-time code
            to verify it's really you.
          </Text>
        </View>

        <View style={styles.inputRow}>
          <View style={styles.countryCode}>
            <Text style={styles.flag}>
              🇿🇦
            </Text>

            <Text
              style={styles.countryCodeText}
            >
              +27
            </Text>
          </View>

          <TextInput
            style={[
              styles.input,
              errorMessage
                ? styles.inputError
                : undefined,
            ]}
            placeholder="82 123 4567"
            placeholderTextColor={
              light.textSecondary
            }
            keyboardType="number-pad"
            value={number}
            onChangeText={handleNumberChange}
            maxLength={12}
            autoFocus
            editable={!isLoading}
          />
        </View>

        {errorMessage ? (
          <Text style={styles.errorText}>
            {errorMessage}
          </Text>
        ) : null}

        <View style={styles.footer}>
          <Pressable
            style={[
              styles.continueButton,
              (!isValid || isLoading) &&
                styles.continueButtonDisabled,
            ]}
            onPress={handleContinue}
            disabled={!isValid || isLoading}
          >
            {isLoading ? (
              <ActivityIndicator
                color={light.offWhite}
              />
            ) : (
              <Text
                style={
                  styles.continueButtonText
                }
              >
                Send Code
              </Text>
            )}
          </Pressable>
        </View>
      </SafeAreaView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  keyboardContainer: {
    flex: 1,
  },

  container: {
    flex: 1,
    backgroundColor: light.offWhite,
    paddingHorizontal: 24,
  },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 12,
    paddingBottom: 8,
  },

  headerSpace: {
    width: 24,
  },

  titleBlock: {
    marginTop: 32,
    marginBottom: 28,
  },

  title: {
    fontFamily: fontFamily.bold,
    fontSize: fontSize.xl,
    color: light.charcoal,
  },

  subtitle: {
    fontFamily: fontFamily.secondary,
    fontSize: fontSize.sm,
    color: light.textSecondary,
    marginTop: 8,
    lineHeight: 20,
  },

  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },

  countryCode: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: light.card,
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 16,
    borderWidth: 1.5,
    borderColor: light.border,
  },

  flag: {
    fontSize: 18,
  },

  countryCodeText: {
    fontFamily: fontFamily.semibold,
    fontSize: fontSize.md,
    color: light.charcoal,
  },

  input: {
    flex: 1,
    backgroundColor: light.card,
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderWidth: 1.5,
    borderColor: light.border,
    fontFamily: fontFamily.medium,
    fontSize: fontSize.md,
    color: light.charcoal,
  },

  inputError: {
    borderColor: light.danger,
  },

  errorText: {
    marginTop: 12,
    fontFamily: fontFamily.secondary,
    fontSize: fontSize.sm,
    color: light.danger,
  },

  footer: {
    position: 'absolute',
    bottom: 30,
    left: 24,
    right: 24,
  },

  continueButton: {
    backgroundColor: light.primary,
    borderRadius: 16,
    minHeight: 56,
    alignItems: 'center',
    justifyContent: 'center',
  },

  continueButtonDisabled: {
    opacity: 0.4,
  },

  continueButtonText: {
    fontFamily: fontFamily.semibold,
    fontSize: fontSize.md,
    color: light.offWhite,
  },
});