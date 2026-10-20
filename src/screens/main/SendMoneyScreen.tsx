import React, { useEffect, useState } from 'react';

import {
  ActivityIndicator,
  Alert,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';

import Avatar from '../../components/Avatar';
import { getMyContacts, Contact } from '../../api/contactsApi';

import {
  confirmTransfer,
  getPaymentPinStatus,
  savePaymentPin,
  startTransfer,
  TransferChallenge,
} from '../../api/paymentsApi';

import { light } from '../../theme/colors';
import { fontFamily, fontSize } from '../../theme/fonts';
import type { RootStackParamList } from '../../navigation/RootNavigator';

type SendMoneyRouteProp = RouteProp<RootStackParamList, 'SendMoney'>;
type SendMoneyNavProp = NativeStackNavigationProp<RootStackParamList, 'SendMoney'>;

type Stage =
  | 'loading'
  | 'setup-pin'
  | 'contact'
  | 'amount'
  | 'pin'
  | 'otp'
  | 'success';

export default function SendMoneyScreen() {
  const navigation = useNavigation<SendMoneyNavProp>();
  const route = useRoute<SendMoneyRouteProp>();
  const mode = route.params?.mode || 'send';

  const [stage, setStage] = useState<Stage>('loading');
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [selectedContact, setSelectedContact] = useState<Contact | null>(null);
  const [amount, setAmount] = useState('');
  const [reference, setReference] = useState('');
  const [pin, setPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  const [otp, setOtp] = useState('');
  const [challenge, setChallenge] = useState<TransferChallenge | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const numericAmount = Number.parseFloat(amount.replace(',', '.')) || 0;

  useEffect(() => {
    void loadScreen();
  }, []);

  async function loadScreen() {
    setError(null);

    try {
      if (mode === 'request') {
        setStage('contact');
      }

      const [contactsResponse, pinResponse] = await Promise.all([
        getMyContacts(),
        getPaymentPinStatus(),
      ]);

      setContacts(
        contactsResponse.contacts.filter(contact => contact.profileId !== null)
      );

      setStage(pinResponse.hasPin ? 'contact' : 'setup-pin');
    } catch (loadError) {
      setError(
        loadError instanceof Error
          ? loadError.message
          : 'Could not load the payment screen.'
      );

      setStage('contact');
    }
  }

  async function handleSavePin() {
    if (!/^\d{4}$/.test(pin)) {
      setError('Enter a four-digit payment PIN.');
      return;
    }

    if (pin !== confirmPin) {
      setError('The payment PINs do not match.');
      return;
    }

    setBusy(true);
    setError(null);

    try {
      await savePaymentPin(pin, confirmPin);
      setPin('');
      setConfirmPin('');
      setStage('contact');

      Alert.alert(
        'PIN created',
        'Your payment PIN was saved successfully.'
      );
    } catch (saveError) {
      setError(
        saveError instanceof Error
          ? saveError.message
          : 'Could not save the payment PIN.'
      );
    } finally {
      setBusy(false);
    }
  }

  function handleAmountContinue() {
    if (!selectedContact?.profileId) {
      setError('Choose a valid CCB contact.');
      return;
    }

    if (numericAmount <= 0) {
      setError('Enter an amount greater than zero.');
      return;
    }

    if (mode === 'request') {
      Alert.alert(
        'Coming soon',
        'Secure money requests will be connected in the next payment update.'
      );
      return;
    }

    setError(null);
    setPin('');
    setStage('pin');
  }

  async function handleStartTransfer() {
    if (!selectedContact?.profileId || !/^\d{4}$/.test(pin)) {
      setError('Enter your four-digit payment PIN.');
      return;
    }

    setBusy(true);
    setError(null);

    try {
      const response = await startTransfer(
        selectedContact.profileId,
        numericAmount,
        reference.trim() || null,
        pin
      );

      setChallenge(response);
      setPin('');
      setOtp('');
      setStage('otp');
    } catch (transferError) {
      setError(
        transferError instanceof Error
          ? transferError.message
          : 'Could not start the transfer.'
      );
    } finally {
      setBusy(false);
    }
  }

  async function handleConfirmTransfer() {
    if (!challenge || !/^\d{6}$/.test(otp)) {
      setError('Enter the six-digit verification code.');
      return;
    }

    setBusy(true);
    setError(null);

    try {
      await confirmTransfer(challenge.challengeId, otp);
      setStage('success');
    } catch (confirmError) {
      setError(
        confirmError instanceof Error
          ? confirmError.message
          : 'Could not confirm the transfer.'
      );
    } finally {
      setBusy(false);
    }
  }

  function handleBack() {
    setError(null);

    if (stage === 'amount') {
      setSelectedContact(null);
      setStage('contact');
      return;
    }

    if (stage === 'pin') {
      setPin('');
      setStage('amount');
      return;
    }

    if (stage === 'otp') {
      setOtp('');
      setChallenge(null);
      setStage('pin');
      return;
    }

    navigation.goBack();
  }

  if (stage === 'loading') {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.centeredState}>
          <ActivityIndicator size="large" color={light.primary} />
          <Text style={styles.loadingText}>Loading payments...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (stage === 'success' && selectedContact) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.successState}>
          <View style={styles.successCircle}>
            <Ionicons name="checkmark" size={40} color={light.offWhite} />
          </View>

          <Text style={styles.successTitle}>Money sent!</Text>

          <Text style={styles.successDetail}>
            R{numericAmount.toFixed(2)} was sent to {selectedContact.name}.
          </Text>

          {reference.trim() ? (
            <Text style={styles.successReference}>
              Reference: {reference.trim()}
            </Text>
          ) : null}

          <Pressable
            style={styles.primaryButton}
            onPress={() => navigation.goBack()}
          >
            <Text style={styles.primaryButtonText}>Back to Payments</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <Pressable onPress={handleBack} hitSlop={12}>
          <Ionicons name="chevron-back" size={24} color={light.charcoal} />
        </Pressable>

        <Text style={styles.headerTitle}>
          {mode === 'send' ? 'Send money' : 'Request money'}
        </Text>

        <View style={styles.headerSpacer} />
      </View>

      <KeyboardAvoidingView
        style={styles.keyboardArea}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        {stage === 'setup-pin' && (
          <View style={styles.formSection}>
            <View style={styles.securityIcon}>
              <Ionicons name="shield-checkmark" size={34} color={light.primary} />
            </View>

            <Text style={styles.formTitle}>Create a payment PIN</Text>
            <Text style={styles.formSubtitle}>
              Use a new four-digit PIN. Do not use your bank-card PIN.
            </Text>

            <TextInput
              style={styles.codeInput}
              value={pin}
              onChangeText={value => setPin(value.replace(/\D/g, '').slice(0, 4))}
              placeholder="••••"
              placeholderTextColor={light.textSecondary}
              keyboardType="number-pad"
              secureTextEntry
              maxLength={4}
            />

            <TextInput
              style={styles.codeInput}
              value={confirmPin}
              onChangeText={value =>
                setConfirmPin(value.replace(/\D/g, '').slice(0, 4))
              }
              placeholder="Confirm PIN"
              placeholderTextColor={light.textSecondary}
              keyboardType="number-pad"
              secureTextEntry
              maxLength={4}
            />

            <ErrorMessage message={error} />

            <SubmitButton
              label="Save payment PIN"
              busy={busy}
              disabled={pin.length !== 4 || confirmPin.length !== 4}
              onPress={() => void handleSavePin()}
            />
          </View>
        )}

        {stage === 'contact' && (
          <View style={styles.flexArea}>
            <Text style={styles.sectionLabel}>Choose a CCB contact</Text>

            <ErrorMessage message={error} />

            <FlatList
              data={contacts}
              keyExtractor={contact => String(contact.contactId)}
              contentContainerStyle={styles.contactList}
              keyboardShouldPersistTaps="handled"
              renderItem={({ item }) => (
                <Pressable
                  style={styles.contactRow}
                  onPress={() => {
                    setSelectedContact(item);
                    setError(null);
                    setStage('amount');
                  }}
                >
                  <Avatar
                    name={item.name}
                    color={item.avatarColor || light.primary}
                    size={44}
                  />

                  <View style={styles.contactDetails}>
                    <Text style={styles.contactName}>{item.name}</Text>
                    <Text style={styles.contactHint}>CCB wallet user</Text>
                  </View>

                  <Ionicons
                    name="chevron-forward"
                    size={20}
                    color={light.textSecondary}
                  />
                </Pressable>
              )}
              ListEmptyComponent={
                <Text style={styles.emptyText}>
                  No linked CCB contacts are available.
                </Text>
              }
            />
          </View>
        )}

        {stage === 'amount' && selectedContact && (
          <View style={styles.formSection}>
            <View style={styles.selectedContactRow}>
              <Avatar
                name={selectedContact.name}
                color={selectedContact.avatarColor || light.primary}
                size={48}
              />

              <Text style={styles.selectedContactName}>{selectedContact.name}</Text>

              <Pressable
                onPress={() => {
                  setSelectedContact(null);
                  setStage('contact');
                }}
                hitSlop={10}
              >
                <Text style={styles.changeLink}>Change</Text>
              </Pressable>
            </View>

            <Text style={styles.amountLabel}>
              {mode === 'send' ? 'Amount to send' : 'Amount to request'}
            </Text>

            <View style={styles.amountInputRow}>
              <Text style={styles.currencySymbol}>R</Text>
              <TextInput
                style={styles.amountInput}
                placeholder="0.00"
                placeholderTextColor={light.textSecondary}
                keyboardType="decimal-pad"
                value={amount}
                onChangeText={setAmount}
                autoFocus
              />
            </View>

            <TextInput
              style={styles.referenceInput}
              placeholder="Reference (optional)"
              placeholderTextColor={light.textSecondary}
              value={reference}
              onChangeText={setReference}
              maxLength={100}
            />

            <ErrorMessage message={error} />

            <SubmitButton
              label={`${mode === 'send' ? 'Continue with' : 'Request'} R${
                numericAmount ? numericAmount.toFixed(2) : '0.00'
              }`}
              disabled={numericAmount <= 0}
              onPress={handleAmountContinue}
            />
          </View>
        )}

        {stage === 'pin' && selectedContact && (
          <View style={styles.formSection}>
            <View style={styles.securityIcon}>
              <Ionicons name="lock-closed" size={32} color={light.primary} />
            </View>

            <Text style={styles.formTitle}>Confirm with your PIN</Text>
            <Text style={styles.formSubtitle}>
              Sending R{numericAmount.toFixed(2)} to {selectedContact.name}
            </Text>

            <TextInput
              style={styles.codeInput}
              value={pin}
              onChangeText={value => setPin(value.replace(/\D/g, '').slice(0, 4))}
              placeholder="••••"
              placeholderTextColor={light.textSecondary}
              keyboardType="number-pad"
              secureTextEntry
              maxLength={4}
              autoFocus
            />

            <ErrorMessage message={error} />

            <SubmitButton
              label="Send verification code"
              busy={busy}
              disabled={pin.length !== 4}
              onPress={() => void handleStartTransfer()}
            />
          </View>
        )}

        {stage === 'otp' && challenge && (
          <View style={styles.formSection}>
            <View style={styles.securityIcon}>
              <Ionicons name="phone-portrait-outline" size={32} color={light.primary} />
            </View>

            <Text style={styles.formTitle}>Verification code</Text>
            <Text style={styles.formSubtitle}>
              Enter the six-digit code to complete this payment. It expires in five
              minutes.
            </Text>

            {challenge.developmentCode && (
              <View style={styles.developmentCodeCard}>
                <Text style={styles.developmentCodeLabel}>Development code</Text>
                <Text style={styles.developmentCode}>
                  {challenge.developmentCode}
                </Text>
              </View>
            )}

            <TextInput
              style={styles.otpInput}
              value={otp}
              onChangeText={value => setOtp(value.replace(/\D/g, '').slice(0, 6))}
              placeholder="000000"
              placeholderTextColor={light.textSecondary}
              keyboardType="number-pad"
              maxLength={6}
              autoFocus
            />

            <ErrorMessage message={error} />

            <SubmitButton
              label={`Confirm R${numericAmount.toFixed(2)}`}
              busy={busy}
              disabled={otp.length !== 6}
              onPress={() => void handleConfirmTransfer()}
            />
          </View>
        )}
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

function ErrorMessage({ message }: { message: string | null }) {
  if (!message) return null;

  return (
    <View style={styles.errorCard}>
      <Ionicons name="alert-circle-outline" size={18} color={light.danger} />
      <Text style={styles.errorText}>{message}</Text>
    </View>
  );
}

function SubmitButton({
  label,
  busy = false,
  disabled = false,
  onPress,
}: {
  label: string;
  busy?: boolean;
  disabled?: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      style={[
        styles.primaryButton,
        (busy || disabled) && styles.primaryButtonDisabled,
      ]}
      disabled={busy || disabled}
      onPress={onPress}
    >
      {busy ? (
        <ActivityIndicator color={light.offWhite} />
      ) : (
        <Text style={styles.primaryButtonText}>{label}</Text>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: light.offWhite },
  keyboardArea: { flex: 1 },
  flexArea: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 8,
  },
  headerTitle: {
    fontFamily: fontFamily.semibold,
    fontSize: fontSize.md,
    color: light.charcoal,
  },
  headerSpacer: { width: 24 },
  centeredState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    fontFamily: fontFamily.secondary,
    fontSize: fontSize.sm,
    color: light.textSecondary,
    marginTop: 12,
  },
  formSection: { flex: 1, paddingHorizontal: 24, paddingTop: 32 },
  securityIcon: {
    width: 68,
    height: 68,
    borderRadius: 34,
    backgroundColor: '#EAF3EF',
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'center',
    marginBottom: 18,
  },
  formTitle: {
    fontFamily: fontFamily.bold,
    fontSize: fontSize.xl,
    color: light.charcoal,
    textAlign: 'center',
  },
  formSubtitle: {
    fontFamily: fontFamily.secondary,
    fontSize: fontSize.sm,
    color: light.textSecondary,
    textAlign: 'center',
    lineHeight: 21,
    marginTop: 8,
    marginBottom: 24,
  },
  codeInput: {
    backgroundColor: light.card,
    borderWidth: 1,
    borderColor: light.border,
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 15,
    fontFamily: fontFamily.semibold,
    fontSize: fontSize.lg,
    color: light.charcoal,
    textAlign: 'center',
    letterSpacing: 8,
    marginBottom: 12,
  },
  otpInput: {
    backgroundColor: light.card,
    borderWidth: 1,
    borderColor: light.border,
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 15,
    fontFamily: fontFamily.bold,
    fontSize: 28,
    color: light.charcoal,
    textAlign: 'center',
    letterSpacing: 10,
    marginBottom: 12,
  },
  primaryButton: {
    backgroundColor: light.primary,
    borderRadius: 16,
    paddingVertical: 16,
    paddingHorizontal: 24,
    alignItems: 'center',
    marginTop: 18,
  },
  primaryButtonDisabled: { opacity: 0.45 },
  primaryButtonText: {
    fontFamily: fontFamily.semibold,
    fontSize: fontSize.md,
    color: light.offWhite,
  },
  errorCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#FDEAEA',
    borderRadius: 12,
    padding: 12,
    marginTop: 8,
  },
  errorText: {
    flex: 1,
    fontFamily: fontFamily.medium,
    fontSize: fontSize.sm,
    color: light.danger,
  },
  sectionLabel: {
    fontFamily: fontFamily.semibold,
    fontSize: fontSize.sm,
    color: light.textSecondary,
    paddingHorizontal: 20,
    marginTop: 12,
    marginBottom: 8,
  },
  contactList: { paddingHorizontal: 20, paddingBottom: 20 },
  contactRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: light.card,
    borderWidth: 1,
    borderColor: light.border,
    borderRadius: 14,
    padding: 12,
    marginBottom: 10,
  },
  contactDetails: { flex: 1, marginLeft: 12 },
  contactName: {
    fontFamily: fontFamily.semibold,
    fontSize: fontSize.md,
    color: light.charcoal,
  },
  contactHint: {
    fontFamily: fontFamily.secondary,
    fontSize: fontSize.xs,
    color: light.textSecondary,
    marginTop: 2,
  },
  emptyText: {
    fontFamily: fontFamily.secondary,
    fontSize: fontSize.sm,
    color: light.textSecondary,
    textAlign: 'center',
    marginTop: 32,
  },
  selectedContactRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 30,
  },
  selectedContactName: {
    flex: 1,
    fontFamily: fontFamily.semibold,
    fontSize: fontSize.md,
    color: light.charcoal,
  },
  changeLink: {
    fontFamily: fontFamily.medium,
    fontSize: fontSize.sm,
    color: light.primary,
  },
  amountLabel: {
    fontFamily: fontFamily.medium,
    fontSize: fontSize.sm,
    color: light.textSecondary,
    textAlign: 'center',
  },
  amountInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 12,
    marginBottom: 24,
  },
  currencySymbol: {
    fontFamily: fontFamily.semibold,
    fontSize: fontSize.xxl,
    color: light.charcoal,
    marginRight: 4,
  },
  amountInput: {
    fontFamily: fontFamily.bold,
    fontSize: 44,
    color: light.charcoal,
    minWidth: 120,
    textAlign: 'center',
  },
  referenceInput: {
    backgroundColor: light.card,
    borderWidth: 1,
    borderColor: light.border,
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontFamily: fontFamily.secondary,
    fontSize: fontSize.md,
    color: light.charcoal,
  },
  developmentCodeCard: {
    backgroundColor: '#FFF6E6',
    borderRadius: 14,
    padding: 14,
    alignItems: 'center',
    marginBottom: 18,
  },
  developmentCodeLabel: {
    fontFamily: fontFamily.medium,
    fontSize: fontSize.xs,
    color: light.textSecondary,
  },
  developmentCode: {
    fontFamily: fontFamily.bold,
    fontSize: fontSize.xl,
    color: light.charcoal,
    letterSpacing: 6,
    marginTop: 4,
  },
  successState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 30,
  },
  successCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: light.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  successTitle: {
    fontFamily: fontFamily.bold,
    fontSize: fontSize.xl,
    color: light.charcoal,
  },
  successDetail: {
    fontFamily: fontFamily.secondary,
    fontSize: fontSize.sm,
    color: light.textSecondary,
    marginTop: 8,
    textAlign: 'center',
  },
  successReference: {
    fontFamily: fontFamily.medium,
    fontSize: fontSize.sm,
    color: light.textSecondary,
    marginTop: 6,
  },
});
