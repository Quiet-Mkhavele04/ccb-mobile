import React, {
  useCallback,
  useState,
} from 'react';

import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

import {
  SafeAreaView,
} from 'react-native-safe-area-context';

import {
  LinearGradient,
} from 'expo-linear-gradient';

import {
  Ionicons,
} from '@expo/vector-icons';

import {
  useFocusEffect,
  useNavigation,
} from '@react-navigation/native';

import type {
  NativeStackNavigationProp,
} from '@react-navigation/native-stack';

import {
  addDemoFunds,
  cancelPaymentRequest,
  confirmTransfer,
  declinePaymentRequest,
  getPaymentRequests,
  getPaymentTransactions,
  getWallet,
  PaymentRequest,
  PaymentTransaction,
  startPaymentRequestPayment,
  TransferChallenge,
} from '../../api/paymentsApi';

import { light } from '../../theme/colors';
import {
  fontFamily,
  fontSize,
} from '../../theme/fonts';

import type {
  RootStackParamList,
} from '../../navigation/RootNavigator';

type PaymentsNavProp =
  NativeStackNavigationProp<
    RootStackParamList,
    'MainTabs'
  >;

type PaymentStage =
  | 'pin'
  | 'otp';

export default function PaymentsScreen() {
  const navigation =
    useNavigation<PaymentsNavProp>();

  const [balance, setBalance] =
    useState(0);

  const [currency, setCurrency] =
    useState('ZAR');

  const [transactions, setTransactions] =
    useState<PaymentTransaction[]>([]);

  const [requests, setRequests] =
    useState<PaymentRequest[]>([]);

  const [loading, setLoading] =
    useState(true);

  const [refreshing, setRefreshing] =
    useState(false);

  const [busy, setBusy] =
    useState(false);

  const [error, setError] =
    useState<string | null>(null);

  const [selectedRequest, setSelectedRequest] =
    useState<PaymentRequest | null>(null);

  const [paymentStage, setPaymentStage] =
    useState<PaymentStage>('pin');

  const [pin, setPin] =
    useState('');

  const [otp, setOtp] =
    useState('');

  const [challenge, setChallenge] =
    useState<TransferChallenge | null>(null);

  const load = useCallback(
    async (showLoader = true) => {
      if (showLoader) {
        setLoading(true);
      }

      setError(null);

      try {
        const [
          walletResponse,
          transactionsResponse,
          requestsResponse,
        ] = await Promise.all([
          getWallet(),
          getPaymentTransactions(),
          getPaymentRequests(),
        ]);

        setBalance(
          walletResponse.wallet.balance
        );

        setCurrency(
          walletResponse.wallet.currency
        );

        setTransactions(
          transactionsResponse.transactions
        );

        setRequests(
          requestsResponse.requests
        );
      } catch (loadError) {
        setError(
          loadError instanceof Error
            ? loadError.message
            : 'Could not load payments.'
        );
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    []
  );

  useFocusEffect(
    useCallback(() => {
      void load();
    }, [load])
  );

  async function handleRefresh() {
    setRefreshing(true);
    await load(false);
  }

  async function handleTopUp() {
    setBusy(true);

    try {
      await addDemoFunds(200);
      await load(false);

      Alert.alert(
        'Demo funds added',
        'R200.00 was added to your demo wallet.'
      );
    } catch (topUpError) {
      Alert.alert(
        'Could not add funds',
        getErrorMessage(topUpError)
      );
    } finally {
      setBusy(false);
    }
  }

  function openPayment(
    paymentRequest: PaymentRequest
  ) {
    setSelectedRequest(paymentRequest);
    setPaymentStage('pin');
    setPin('');
    setOtp('');
    setChallenge(null);
  }

  function closePayment() {
    if (busy) {
      return;
    }

    setSelectedRequest(null);
    setPaymentStage('pin');
    setPin('');
    setOtp('');
    setChallenge(null);
  }

  async function handleStartRequestPayment() {
    if (
      !selectedRequest ||
      !/^\d{4}$/.test(pin)
    ) {
      Alert.alert(
        'PIN required',
        'Enter your four-digit payment PIN.'
      );
      return;
    }

    setBusy(true);

    try {
      const response =
        await startPaymentRequestPayment(
          selectedRequest.paymentRequestId,
          pin
        );

      setChallenge(response);
      setPin('');
      setOtp('');
      setPaymentStage('otp');
    } catch (paymentError) {
      Alert.alert(
        'Could not start payment',
        getErrorMessage(paymentError)
      );
    } finally {
      setBusy(false);
    }
  }

  async function handleConfirmRequestPayment() {
    if (
      !challenge ||
      !/^\d{6}$/.test(otp)
    ) {
      Alert.alert(
        'Code required',
        'Enter the six-digit verification code.'
      );
      return;
    }

    setBusy(true);

    try {
      await confirmTransfer(
        challenge.challengeId,
        otp
      );

      closePaymentAfterSuccess();
      await load(false);

      Alert.alert(
        'Payment complete',
        'The money request was paid successfully.'
      );
    } catch (paymentError) {
      Alert.alert(
        'Could not complete payment',
        getErrorMessage(paymentError)
      );
    } finally {
      setBusy(false);
    }
  }

  function closePaymentAfterSuccess() {
    setSelectedRequest(null);
    setPaymentStage('pin');
    setPin('');
    setOtp('');
    setChallenge(null);
  }

  function confirmDecline(
    paymentRequest: PaymentRequest
  ) {
    Alert.alert(
      'Decline request?',
      `Decline the R${paymentRequest.amount.toFixed(2)} request from ${paymentRequest.requesterName || 'this user'}?`,
      [
        {
          text: 'Keep',
          style: 'cancel',
        },
        {
          text: 'Decline',
          style: 'destructive',
          onPress: () => {
            void handleDecline(
              paymentRequest.paymentRequestId
            );
          },
        },
      ]
    );
  }

  async function handleDecline(
    paymentRequestId: number
  ) {
    setBusy(true);

    try {
      await declinePaymentRequest(
        paymentRequestId
      );

      await load(false);
    } catch (declineError) {
      Alert.alert(
        'Could not decline request',
        getErrorMessage(declineError)
      );
    } finally {
      setBusy(false);
    }
  }

  function confirmCancel(
    paymentRequest: PaymentRequest
  ) {
    Alert.alert(
      'Cancel request?',
      `Cancel your R${paymentRequest.amount.toFixed(2)} request to ${paymentRequest.payerName || 'this user'}?`,
      [
        {
          text: 'Keep',
          style: 'cancel',
        },
        {
          text: 'Cancel request',
          style: 'destructive',
          onPress: () => {
            void handleCancel(
              paymentRequest.paymentRequestId
            );
          },
        },
      ]
    );
  }

  async function handleCancel(
    paymentRequestId: number
  ) {
    setBusy(true);

    try {
      await cancelPaymentRequest(
        paymentRequestId
      );

      await load(false);
    } catch (cancelError) {
      Alert.alert(
        'Could not cancel request',
        getErrorMessage(cancelError)
      );
    } finally {
      setBusy(false);
    }
  }

  if (loading) {
    return (
      <SafeAreaView
        style={styles.container}
        edges={['top']}
      >
        <View style={styles.centeredState}>
          <ActivityIndicator
            size="large"
            color={light.primary}
          />

          <Text style={styles.loadingText}>
            Loading payments...
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView
      style={styles.container}
      edges={['top']}
    >
      <View style={styles.header}>
        <Text style={styles.title}>
          Payments
        </Text>
      </View>

      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => {
              void handleRefresh();
            }}
            tintColor={light.primary}
            colors={[light.primary]}
          />
        }
      >
        <LinearGradient
          colors={[
            light.primary,
            light.primaryLight,
          ]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.walletCard}
        >
          <Text style={styles.walletLabel}>
            Wallet balance
          </Text>

          <Text style={styles.walletBalance}>
            R{formatMoney(balance)}
          </Text>

          <Text style={styles.walletHint}>
            {currency} demo wallet
          </Text>
        </LinearGradient>

        <View style={styles.actionsRow}>
          <QuickAction
            icon="arrow-up-circle"
            label="Send"
            onPress={() =>
              navigation.navigate(
                'SendMoney',
                { mode: 'send' }
              )
            }
          />

          <QuickAction
            icon="arrow-down-circle"
            label="Request"
            onPress={() =>
              navigation.navigate(
                'SendMoney',
                { mode: 'request' }
              )
            }
          />

          <QuickAction
            icon="add-circle"
            label="Top Up"
            disabled={busy}
            onPress={() => {
              void handleTopUp();
            }}
          />

          <QuickAction
            icon="receipt"
            label="Pay Bill"
            onPress={() =>
              Alert.alert(
                'Coming soon',
                'Bill payments will be added later.'
              )
            }
          />
        </View>

        {error && (
          <View style={styles.errorCard}>
            <Ionicons
              name="alert-circle-outline"
              size={18}
              color={light.danger}
            />

            <Text style={styles.errorText}>
              {error}
            </Text>
          </View>
        )}

        <View style={styles.sectionHeader}>
          <Text style={styles.sectionLabel}>
            Money requests
          </Text>

          {requests.length > 0 && (
            <Text style={styles.sectionCount}>
              {requests.length}
            </Text>
          )}
        </View>

        {requests.length === 0 ? (
          <EmptyCard
            icon="mail-open-outline"
            text="No money requests yet."
          />
        ) : (
          requests.map(paymentRequest => (
            <PaymentRequestCard
              key={paymentRequest.paymentRequestId}
              paymentRequest={paymentRequest}
              disabled={busy}
              onPay={() =>
                openPayment(paymentRequest)
              }
              onDecline={() =>
                confirmDecline(paymentRequest)
              }
              onCancel={() =>
                confirmCancel(paymentRequest)
              }
            />
          ))
        )}

        <Text style={styles.sectionLabel}>
          Transaction history
        </Text>

        {transactions.length === 0 ? (
          <EmptyCard
            icon="receipt-outline"
            text="No transactions yet."
          />
        ) : (
          transactions.map(transaction => (
            <TransactionRow
              key={transaction.transactionId}
              transaction={transaction}
            />
          ))
        )}
      </ScrollView>

      <Modal
        visible={selectedRequest !== null}
        transparent
        animationType="slide"
        onRequestClose={closePayment}
      >
        <KeyboardAvoidingView
          style={styles.modalBackdrop}
          behavior={
            Platform.OS === 'ios'
              ? 'padding'
              : 'height'
          }
        >
          <Pressable
            style={styles.modalDismissArea}
            onPress={closePayment}
          />

          <View style={styles.modalSheet}>
            <View style={styles.modalHandle} />

            <View style={styles.modalHeader}>
              <View>
                <Text style={styles.modalTitle}>
                  {paymentStage === 'pin'
                    ? 'Pay request'
                    : 'Verification code'}
                </Text>

                {selectedRequest && (
                  <Text style={styles.modalSubtitle}>
                    R{formatMoney(selectedRequest.amount)} to{' '}
                    {selectedRequest.requesterName || 'CCB user'}
                  </Text>
                )}
              </View>

              <Pressable
                onPress={closePayment}
                hitSlop={10}
                disabled={busy}
              >
                <Ionicons
                  name="close"
                  size={24}
                  color={light.charcoal}
                />
              </Pressable>
            </View>

            {paymentStage === 'pin' ? (
              <>
                <Text style={styles.inputLabel}>
                  Payment PIN
                </Text>

                <TextInput
                  style={styles.secureInput}
                  value={pin}
                  onChangeText={value =>
                    setPin(
                      value
                        .replace(/\D/g, '')
                        .slice(0, 4)
                    )
                  }
                  placeholder="••••"
                  placeholderTextColor={light.textSecondary}
                  keyboardType="number-pad"
                  secureTextEntry
                  maxLength={4}
                  autoFocus
                />

                <PrimaryButton
                  label="Send verification code"
                  busy={busy}
                  disabled={pin.length !== 4}
                  onPress={() => {
                    void handleStartRequestPayment();
                  }}
                />
              </>
            ) : (
              <>
                <Text style={styles.codeHelp}>
                  Enter the six-digit code. It expires in five minutes.
                </Text>

                {challenge?.developmentCode && (
                  <View style={styles.developmentCard}>
                    <Text style={styles.developmentLabel}>
                      Development code
                    </Text>

                    <Text style={styles.developmentCode}>
                      {challenge.developmentCode}
                    </Text>
                  </View>
                )}

                <TextInput
                  style={styles.otpInput}
                  value={otp}
                  onChangeText={value =>
                    setOtp(
                      value
                        .replace(/\D/g, '')
                        .slice(0, 6)
                    )
                  }
                  placeholder="000000"
                  placeholderTextColor={light.textSecondary}
                  keyboardType="number-pad"
                  maxLength={6}
                  autoFocus
                />

                <PrimaryButton
                  label="Confirm payment"
                  busy={busy}
                  disabled={otp.length !== 6}
                  onPress={() => {
                    void handleConfirmRequestPayment();
                  }}
                />
              </>
            )}
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </SafeAreaView>
  );
}

function QuickAction({
  icon,
  label,
  disabled = false,
  onPress,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  disabled?: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      style={styles.actionItem}
      disabled={disabled}
      onPress={onPress}
    >
      <View
        style={[
          styles.actionCircle,
          disabled && styles.disabled,
        ]}
      >
        <Ionicons
          name={icon}
          size={24}
          color={light.primary}
        />
      </View>

      <Text style={styles.actionLabel}>
        {label}
      </Text>
    </Pressable>
  );
}

function PaymentRequestCard({
  paymentRequest,
  disabled,
  onPay,
  onDecline,
  onCancel,
}: {
  paymentRequest: PaymentRequest;
  disabled: boolean;
  onPay: () => void;
  onDecline: () => void;
  onCancel: () => void;
}) {
  const incoming =
    paymentRequest.direction === 'incoming';

  const pending =
    paymentRequest.status === 'Pending';

  const personName = incoming
    ? paymentRequest.requesterName
    : paymentRequest.payerName;

  return (
    <View style={styles.requestCard}>
      <View style={styles.requestTopRow}>
        <View
          style={[
            styles.requestIcon,
            incoming
              ? styles.incomingRequestIcon
              : styles.outgoingRequestIcon,
          ]}
        >
          <Ionicons
            name={
              incoming
                ? 'arrow-down'
                : 'arrow-up'
            }
            size={18}
            color={
              incoming
                ? light.primary
                : light.gold
            }
          />
        </View>

        <View style={styles.requestDetails}>
          <Text
            style={styles.requestName}
            numberOfLines={1}
          >
            {incoming
              ? `From ${personName || 'CCB user'}`
              : `To ${personName || 'CCB user'}`}
          </Text>

          <Text style={styles.requestMeta}>
            {formatDate(paymentRequest.createdAt)}
          </Text>
        </View>

        <View style={styles.requestAmountArea}>
          <Text style={styles.requestAmount}>
            R{formatMoney(paymentRequest.amount)}
          </Text>

          <Text
            style={[
              styles.statusText,
              getStatusStyle(
                paymentRequest.status
              ),
            ]}
          >
            {paymentRequest.status}
          </Text>
        </View>
      </View>

      {paymentRequest.reference && (
        <Text style={styles.requestReference}>
          {paymentRequest.reference}
        </Text>
      )}

      {pending && incoming && (
        <View style={styles.requestActions}>
          <Pressable
            style={styles.secondaryButton}
            disabled={disabled}
            onPress={onDecline}
          >
            <Text style={styles.secondaryButtonText}>
              Decline
            </Text>
          </Pressable>

          <Pressable
            style={styles.payButton}
            disabled={disabled}
            onPress={onPay}
          >
            <Text style={styles.payButtonText}>
              Pay
            </Text>
          </Pressable>
        </View>
      )}

      {pending && !incoming && (
        <Pressable
          style={styles.cancelButton}
          disabled={disabled}
          onPress={onCancel}
        >
          <Text style={styles.cancelButtonText}>
            Cancel request
          </Text>
        </Pressable>
      )}
    </View>
  );
}

function TransactionRow({
  transaction,
}: {
  transaction: PaymentTransaction;
}) {
  const isSent =
    transaction.direction === 'sent';

  return (
    <View style={styles.transactionRow}>
      <View
        style={[
          styles.transactionIcon,
          {
            backgroundColor: isSent
              ? '#FDEAEA'
              : '#EAF3EF',
          },
        ]}
      >
        <Ionicons
          name={
            isSent
              ? 'arrow-up'
              : 'arrow-down'
          }
          size={16}
          color={
            isSent
              ? light.danger
              : light.primary
          }
        />
      </View>

      <View style={styles.transactionDetails}>
        <Text
          style={styles.transactionCounterparty}
          numberOfLines={1}
        >
          {transaction.counterparty || 'CCB user'}
        </Text>

        <Text style={styles.transactionTime}>
          {formatDate(
            transaction.transactionDate
          )}
          {transaction.reference
            ? ` • ${transaction.reference}`
            : ''}
        </Text>
      </View>

      <Text
        style={[
          styles.transactionAmount,
          isSent
            ? styles.amountSent
            : styles.amountReceived,
        ]}
      >
        {isSent ? '-' : '+'}R
        {formatMoney(transaction.amount)}
      </Text>
    </View>
  );
}

function EmptyCard({
  icon,
  text,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  text: string;
}) {
  return (
    <View style={styles.emptyCard}>
      <Ionicons
        name={icon}
        size={24}
        color={light.textSecondary}
      />

      <Text style={styles.emptyText}>
        {text}
      </Text>
    </View>
  );
}

function PrimaryButton({
  label,
  busy,
  disabled,
  onPress,
}: {
  label: string;
  busy: boolean;
  disabled: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      style={[
        styles.primaryButton,
        (busy || disabled) && styles.disabled,
      ]}
      disabled={busy || disabled}
      onPress={onPress}
    >
      {busy ? (
        <ActivityIndicator
          color={light.offWhite}
        />
      ) : (
        <Text style={styles.primaryButtonText}>
          {label}
        </Text>
      )}
    </Pressable>
  );
}

function formatMoney(value: number) {
  return value.toLocaleString(
    'en-ZA',
    {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }
  );
}

function formatDate(value: string) {
  return new Date(value).toLocaleString(
    'en-ZA',
    {
      day: '2-digit',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit',
    }
  );
}

function getStatusStyle(
  status: PaymentRequest['status']
) {
  if (status === 'Paid') {
    return styles.statusPaid;
  }

  if (status === 'Pending') {
    return styles.statusPending;
  }

  return styles.statusClosed;
}

function getErrorMessage(error: unknown) {
  return error instanceof Error
    ? error.message
    : 'Something went wrong.';
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: light.offWhite,
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 8,
  },
  title: {
    fontFamily: fontFamily.bold,
    fontSize: fontSize.xl,
    color: light.charcoal,
  },
  content: {
    paddingHorizontal: 20,
    paddingBottom: 36,
  },
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
  walletCard: {
    borderRadius: 20,
    padding: 22,
    marginTop: 16,
  },
  walletLabel: {
    fontFamily: fontFamily.medium,
    fontSize: fontSize.sm,
    color: 'rgba(248,246,242,0.85)',
  },
  walletBalance: {
    fontFamily: fontFamily.bold,
    fontSize: fontSize.xxl,
    color: light.offWhite,
    marginTop: 6,
  },
  walletHint: {
    fontFamily: fontFamily.secondary,
    fontSize: fontSize.xs,
    color: 'rgba(248,246,242,0.75)',
    marginTop: 10,
  },
  actionsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 20,
  },
  actionItem: {
    alignItems: 'center',
    width: 70,
  },
  actionCircle: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: '#EAF3EF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionLabel: {
    fontFamily: fontFamily.medium,
    fontSize: fontSize.xs,
    color: light.charcoal,
    marginTop: 6,
    textAlign: 'center',
  },
  errorCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#FDEAEA',
    borderRadius: 12,
    padding: 12,
    marginTop: 20,
  },
  errorText: {
    flex: 1,
    fontFamily: fontFamily.medium,
    fontSize: fontSize.sm,
    color: light.danger,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  sectionLabel: {
    fontFamily: fontFamily.semibold,
    fontSize: fontSize.sm,
    color: light.textSecondary,
    marginTop: 26,
    marginBottom: 10,
  },
  sectionCount: {
    fontFamily: fontFamily.semibold,
    fontSize: fontSize.xs,
    color: light.primary,
    backgroundColor: '#EAF3EF',
    borderRadius: 99,
    paddingHorizontal: 8,
    paddingVertical: 3,
    marginTop: 16,
    marginLeft: 8,
  },
  requestCard: {
    backgroundColor: light.card,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: light.border,
    padding: 14,
    marginBottom: 10,
  },
  requestTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  requestIcon: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
  },
  incomingRequestIcon: {
    backgroundColor: '#EAF3EF',
  },
  outgoingRequestIcon: {
    backgroundColor: '#FFF6E6',
  },
  requestDetails: {
    flex: 1,
    marginLeft: 12,
  },
  requestName: {
    fontFamily: fontFamily.semibold,
    fontSize: fontSize.sm,
    color: light.charcoal,
  },
  requestMeta: {
    fontFamily: fontFamily.secondary,
    fontSize: fontSize.xs,
    color: light.textSecondary,
    marginTop: 3,
  },
  requestAmountArea: {
    alignItems: 'flex-end',
    marginLeft: 10,
  },
  requestAmount: {
    fontFamily: fontFamily.bold,
    fontSize: fontSize.sm,
    color: light.charcoal,
  },
  statusText: {
    fontFamily: fontFamily.medium,
    fontSize: 11,
    marginTop: 3,
  },
  statusPending: {
    color: light.gold,
  },
  statusPaid: {
    color: light.primary,
  },
  statusClosed: {
    color: light.textSecondary,
  },
  requestReference: {
    fontFamily: fontFamily.secondary,
    fontSize: fontSize.xs,
    color: light.textSecondary,
    marginTop: 10,
  },
  requestActions: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 14,
  },
  secondaryButton: {
    flex: 1,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: light.border,
    borderRadius: 12,
    paddingVertical: 11,
  },
  secondaryButtonText: {
    fontFamily: fontFamily.semibold,
    fontSize: fontSize.sm,
    color: light.danger,
  },
  payButton: {
    flex: 1,
    alignItems: 'center',
    backgroundColor: light.primary,
    borderRadius: 12,
    paddingVertical: 11,
  },
  payButtonText: {
    fontFamily: fontFamily.semibold,
    fontSize: fontSize.sm,
    color: light.offWhite,
  },
  cancelButton: {
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: light.border,
    paddingTop: 12,
    marginTop: 12,
  },
  cancelButtonText: {
    fontFamily: fontFamily.semibold,
    fontSize: fontSize.sm,
    color: light.danger,
  },
  transactionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: light.card,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: light.border,
    padding: 12,
    marginBottom: 10,
  },
  transactionIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  transactionDetails: {
    flex: 1,
    marginLeft: 12,
  },
  transactionCounterparty: {
    fontFamily: fontFamily.semibold,
    fontSize: fontSize.sm,
    color: light.charcoal,
  },
  transactionTime: {
    fontFamily: fontFamily.secondary,
    fontSize: fontSize.xs,
    color: light.textSecondary,
    marginTop: 2,
  },
  transactionAmount: {
    fontFamily: fontFamily.semibold,
    fontSize: fontSize.sm,
    marginLeft: 8,
  },
  amountSent: {
    color: light.danger,
  },
  amountReceived: {
    color: light.primary,
  },
  emptyCard: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: light.card,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: light.border,
    padding: 24,
  },
  emptyText: {
    fontFamily: fontFamily.secondary,
    fontSize: fontSize.sm,
    color: light.textSecondary,
    textAlign: 'center',
    marginTop: 8,
  },
  modalBackdrop: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0,0,0,0.35)',
  },
  modalDismissArea: {
    flex: 1,
  },
  modalSheet: {
    backgroundColor: light.offWhite,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 24,
    paddingTop: 10,
    paddingBottom: 34,
  },
  modalHandle: {
    width: 42,
    height: 4,
    borderRadius: 2,
    backgroundColor: light.border,
    alignSelf: 'center',
    marginBottom: 18,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: 22,
  },
  modalTitle: {
    fontFamily: fontFamily.bold,
    fontSize: fontSize.lg,
    color: light.charcoal,
  },
  modalSubtitle: {
    fontFamily: fontFamily.secondary,
    fontSize: fontSize.sm,
    color: light.textSecondary,
    marginTop: 4,
  },
  inputLabel: {
    fontFamily: fontFamily.medium,
    fontSize: fontSize.sm,
    color: light.textSecondary,
    textAlign: 'center',
    marginBottom: 10,
  },
  secureInput: {
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
  },
  codeHelp: {
    fontFamily: fontFamily.secondary,
    fontSize: fontSize.sm,
    color: light.textSecondary,
    textAlign: 'center',
    marginBottom: 16,
  },
  developmentCard: {
    backgroundColor: '#FFF6E6',
    borderRadius: 14,
    padding: 14,
    alignItems: 'center',
    marginBottom: 16,
  },
  developmentLabel: {
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
  },
  primaryButton: {
    backgroundColor: light.primary,
    borderRadius: 14,
    paddingVertical: 15,
    alignItems: 'center',
    marginTop: 16,
  },
  primaryButtonText: {
    fontFamily: fontFamily.semibold,
    fontSize: fontSize.md,
    color: light.offWhite,
  },
  disabled: {
    opacity: 0.45,
  },
});
