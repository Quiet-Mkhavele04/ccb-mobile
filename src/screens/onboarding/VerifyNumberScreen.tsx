import React, {
  useEffect,
  useRef,
  useState,
} from 'react';
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from
  'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

import {
  sendVerificationCode,
  verifyCode,
  VerifyCodeResponse,
} from '../../api/authApi';
import { light } from '../../theme/colors';
import {
  fontFamily,
  fontSize,
} from '../../theme/fonts';
import ProgressDots from
  '../../components/ProgressDots';

const CODE_LENGTH = 6;

type Props = {
  phoneNumber: string;
  onBack: () => void;
  onVerified: (
    result: VerifyCodeResponse
  ) => void;
};

export default function VerifyNumberScreen({
  phoneNumber,
  onBack,
  onVerified,
}: Props) {
  const [digits, setDigits] = useState<
    string[]
  >(Array(CODE_LENGTH).fill(''));

  const [errorMessage, setErrorMessage] =
    useState('');

  const [successMessage, setSuccessMessage] =
    useState('');

  const [secondsLeft, setSecondsLeft] =
    useState(30);

  const [isLoading, setIsLoading] =
    useState(false);

  const inputs = useRef<
    Array<TextInput | null>
  >([]);

  useEffect(() => {
    if (secondsLeft <= 0) {
      return;
    }

    const timer = setTimeout(() => {
      setSecondsLeft(
        current => current - 1
      );
    }, 1000);

    return () => clearTimeout(timer);
  }, [secondsLeft]);

  const submitCode = async (
    code: string
  ) => {
    if (
      code.length !== CODE_LENGTH ||
      isLoading
    ) {
      return;
    }

    try {
      setIsLoading(true);
      setErrorMessage('');
      setSuccessMessage('');

      const result = await verifyCode(
        phoneNumber,
        code
      );

      console.log(
        'Verification result:',
        result
      );

      onVerified(result);
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : 'Unable to verify the code.';

      setErrorMessage(message);
      setDigits(
        Array(CODE_LENGTH).fill('')
      );

      setTimeout(() => {
        inputs.current[0]?.focus();
      }, 100);
    } finally {
      setIsLoading(false);
    }
  };

  const handleChange = (
    text: string,
    index: number
  ) => {
    if (isLoading) {
      return;
    }

    const clean =
      text.replace(/[^0-9]/g, '');

    const next = [...digits];
    next[index] = clean.slice(-1);

    setDigits(next);
    setErrorMessage('');
    setSuccessMessage('');

    if (
      clean &&
      index < CODE_LENGTH - 1
    ) {
      inputs.current[index + 1]?.focus();
    }

    const completedCode = next.join('');

    if (
      completedCode.length === CODE_LENGTH
    ) {
      submitCode(completedCode);
    }
  };

  const handleKeyPress = (
    event: any,
    index: number
  ) => {
    if (
      event.nativeEvent.key ===
        'Backspace' &&
      !digits[index] &&
      index > 0
    ) {
      inputs.current[index - 1]?.focus();
    }
  };

  const handleResend = async () => {
    if (secondsLeft > 0 || isLoading) {
      return;
    }

    try {
      setIsLoading(true);
      setErrorMessage('');
      setSuccessMessage('');

      await sendVerificationCode(
        phoneNumber
      );

      setDigits(
        Array(CODE_LENGTH).fill('')
      );
      setSecondsLeft(30);

      setSuccessMessage(
        'A new verification code was sent.'
      );

      setTimeout(() => {
        inputs.current[0]?.focus();
      }, 100);
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : 'Unable to resend the code.';

      setErrorMessage(message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
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
          current={3}
          color={light.primary}
        />

        <View style={styles.headerSpace} />
      </View>

      <View style={styles.titleBlock}>
        <Text style={styles.title}>
          Enter the code
        </Text>

        <Text style={styles.subtitle}>
          We sent a {CODE_LENGTH}-digit
          code to {phoneNumber}.
        </Text>
      </View>

      <View style={styles.codeRow}>
        {digits.map((digit, index) => (
          <TextInput
            key={index}
            ref={reference => {
              inputs.current[index] =
                reference;
            }}
            style={[
              styles.codeBox,

              errorMessage
                ? styles.codeBoxError
                : undefined,

              digit
                ? styles.codeBoxFilled
                : undefined,
            ]}
            keyboardType="number-pad"
            maxLength={1}
            value={digit}
            editable={!isLoading}
            onChangeText={text =>
              handleChange(text, index)
            }
            onKeyPress={event =>
              handleKeyPress(
                event,
                index
              )
            }
            autoFocus={index === 0}
          />
        ))}
      </View>

      {isLoading ? (
        <ActivityIndicator
          style={styles.loading}
          color={light.primary}
        />
      ) : null}

      {errorMessage ? (
        <Text style={styles.errorText}>
          {errorMessage}
        </Text>
      ) : null}

      {successMessage ? (
        <Text style={styles.successText}>
          {successMessage}
        </Text>
      ) : null}

      <View style={styles.resendRow}>
        {secondsLeft > 0 ? (
          <Text style={styles.resendMuted}>
            Resend code in 0:
            {String(secondsLeft).padStart(
              2,
              '0'
            )}
          </Text>
        ) : (
          <Pressable
            onPress={handleResend}
            disabled={isLoading}
          >
            <Text
              style={styles.resendActive}
            >
              Resend code
            </Text>
          </Pressable>
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
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
    marginBottom: 32,
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

  codeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },

  codeBox: {
    width: 46,
    height: 56,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: light.border,
    backgroundColor: light.card,
    textAlign: 'center',
    fontFamily: fontFamily.semibold,
    fontSize: fontSize.xl,
    color: light.charcoal,
  },

  codeBoxFilled: {
    borderColor: light.primary,
  },

  codeBoxError: {
    borderColor: light.danger,
  },

  loading: {
    marginTop: 18,
  },

  errorText: {
    fontFamily: fontFamily.secondary,
    fontSize: fontSize.sm,
    color: light.danger,
    marginTop: 14,
    textAlign: 'center',
  },

  successText: {
    fontFamily: fontFamily.secondary,
    fontSize: fontSize.sm,
    color: light.primary,
    marginTop: 14,
    textAlign: 'center',
  },

  resendRow: {
    marginTop: 24,
    alignItems: 'center',
  },

  resendMuted: {
    fontFamily: fontFamily.secondary,
    fontSize: fontSize.sm,
    color: light.textSecondary,
  },

  resendActive: {
    fontFamily: fontFamily.semibold,
    fontSize: fontSize.sm,
    color: light.primary,
  },
});