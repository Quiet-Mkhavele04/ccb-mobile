import React, {
  useCallback,
  useState,
} from 'react';

import {
  ActivityIndicator,
  Alert,
  FlatList,
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
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
  getPaymentTransactions,
  getWallet,
  PaymentTransaction,
} from '../../api/paymentsApi';

import {
  light,
} from '../../theme/colors';

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

export default function PaymentsScreen() {
  const navigation =
    useNavigation<PaymentsNavProp>();

  const [
    balance,
    setBalance,
  ] = useState(0);

  const [
    transactions,
    setTransactions,
  ] = useState<
    PaymentTransaction[]
  >([]);

  const [
    loading,
    setLoading,
  ] = useState(true);

  const [
    refreshing,
    setRefreshing,
  ] = useState(false);

  const [
    toppingUp,
    setToppingUp,
  ] = useState(false);

  const [
    error,
    setError,
  ] = useState<string | null>(
    null
  );

  const load = useCallback(
    async (
      showLoader = true
    ) => {
      if (showLoader) {
        setLoading(true);
      }

      setError(null);

      try {
        const [
          walletResponse,
          transactionResponse,
        ] = await Promise.all([
          getWallet(),
          getPaymentTransactions(),
        ]);

        setBalance(
          walletResponse
            .wallet
            .balance
        );

        setTransactions(
          transactionResponse
            .transactions
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

  function handleRefresh() {
    setRefreshing(true);
    void load(false);
  }

  function handleTopUp() {
    Alert.alert(
      'Add demo funds',
      'Add R200.00 to your development wallet?',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Add funds',

          onPress: async () => {
            setToppingUp(true);

            try {
              const response =
                await addDemoFunds(
                  200
                );

              setBalance(
                response
                  .walletBalance
              );

              Alert.alert(
                'Funds added',
                'R200.00 was added to your demo wallet.'
              );

              await load(false);
            } catch (
              topUpError
            ) {
              Alert.alert(
                'Could not add funds',

                topUpError
                  instanceof Error
                  ? topUpError.message
                  : 'Please try again.'
              );
            } finally {
              setToppingUp(
                false
              );
            }
          },
        },
      ]
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

      <FlatList
        data={transactions}
        keyExtractor={(item) =>
          String(
            item.transactionId
          )
        }
        contentContainerStyle={
          styles.list
        }
        showsVerticalScrollIndicator={
          false
        }
        refreshControl={
          <RefreshControl
            refreshing={
              refreshing
            }
            onRefresh={
              handleRefresh
            }
            tintColor={
              light.primary
            }
          />
        }
        ListHeaderComponent={
          <View>
            <LinearGradient
              colors={[
                light.primary,
                light.primaryLight,
              ]}
              start={{
                x: 0,
                y: 0,
              }}
              end={{
                x: 1,
                y: 1,
              }}
              style={
                styles.walletCard
              }
            >
              <Text
                style={
                  styles.walletLabel
                }
              >
                Wallet balance
              </Text>

              <Text
                style={
                  styles.walletBalance
                }
              >
                R
                {balance.toLocaleString(
                  'en-ZA',
                  {
                    minimumFractionDigits:
                      2,

                    maximumFractionDigits:
                      2,
                  }
                )}
              </Text>

              <Text
                style={
                  styles.walletHint
                }
              >
                Development wallet ·
                ZAR
              </Text>
            </LinearGradient>

            <View
              style={
                styles.actionsRow
              }
            >
              <QuickAction
                icon="arrow-up-circle"
                label="Send"
                onPress={() =>
                  navigation.navigate(
                    'SendMoney',
                    {
                      mode: 'send',
                    }
                  )
                }
              />

              <QuickAction
                icon="arrow-down-circle"
                label="Request"
                onPress={() =>
                  navigation.navigate(
                    'SendMoney',
                    {
                      mode:
                        'request',
                    }
                  )
                }
              />

              <QuickAction
                icon="add-circle"
                label={
                  toppingUp
                    ? 'Adding...'
                    : 'Top Up'
                }
                disabled={
                  toppingUp
                }
                onPress={
                  handleTopUp
                }
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
              <Pressable
                style={
                  styles.errorCard
                }
                onPress={() =>
                  void load()
                }
              >
                <Ionicons
                  name="alert-circle-outline"
                  size={20}
                  color={
                    light.danger
                  }
                />

                <View
                  style={{
                    flex: 1,
                  }}
                >
                  <Text
                    style={
                      styles.errorText
                    }
                  >
                    {error}
                  </Text>

                  <Text
                    style={
                      styles.retryText
                    }
                  >
                    Tap to retry
                  </Text>
                </View>
              </Pressable>
            )}

            <Text
              style={
                styles.sectionLabel
              }
            >
              Transaction history
            </Text>
          </View>
        }
        renderItem={({ item }) => (
          <TransactionRow
            transaction={item}
          />
        )}
        ListEmptyComponent={
          loading ? (
            <ActivityIndicator
              color={light.primary}
              style={
                styles.loader
              }
            />
          ) : (
            <Text
              style={
                styles.emptyText
              }
            >
              No transactions yet.
            </Text>
          )
        }
      />
    </SafeAreaView>
  );
}

function QuickAction({
  icon,
  label,
  disabled = false,
  onPress,
}: {
  icon:
    keyof typeof Ionicons.glyphMap;

  label: string;
  disabled?: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      style={[
        styles.actionItem,

        disabled &&
          styles.disabledAction,
      ]}
      disabled={disabled}
      onPress={onPress}
    >
      <View
        style={
          styles.actionCircle
        }
      >
        <Ionicons
          name={icon}
          size={24}
          color={light.primary}
        />
      </View>

      <Text
        style={
          styles.actionLabel
        }
      >
        {label}
      </Text>
    </Pressable>
  );
}

function TransactionRow({
  transaction,
}: {
  transaction:
    PaymentTransaction;
}) {
  const isSent =
    transaction.direction ===
    'sent';

  const date =
    new Date(
      transaction
        .transactionDate
    );

  return (
    <View
      style={
        styles.transactionRow
      }
    >
      <View
        style={[
          styles.transactionIcon,

          {
            backgroundColor:
              isSent
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

      <View
        style={
          styles.transactionDetails
        }
      >
        <Text
          style={
            styles.transactionCounterparty
          }
          numberOfLines={1}
        >
          {transaction.counterparty ||
            'CCB user'}
        </Text>

        <Text
          style={
            styles.transactionTime
          }
        >
          {date.toLocaleString(
            'en-ZA'
          )}
        </Text>

        {transaction.reference && (
          <Text
            style={
              styles.referenceText
            }
            numberOfLines={1}
          >
            {
              transaction.reference
            }
          </Text>
        )}
      </View>

      <View
        style={
          styles.amountColumn
        }
      >
        <Text
          style={[
            styles.transactionAmount,

            isSent
              ? styles.amountSent
              : styles.amountReceived,
          ]}
        >
          {isSent ? '-' : '+'}R
          {transaction.amount.toFixed(
            2
          )}
        </Text>

        <Text
          style={
            styles.statusText
          }
        >
          {transaction.status}
        </Text>
      </View>
    </View>
  );
}

const styles =
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor:
        light.offWhite,
    },

    header: {
      paddingHorizontal: 20,
      paddingTop: 8,
    },

    title: {
      fontFamily:
        fontFamily.bold,
      fontSize: fontSize.xl,
      color: light.charcoal,
    },

    list: {
      paddingHorizontal: 20,
      paddingBottom: 30,
      flexGrow: 1,
    },

    walletCard: {
      borderRadius: 20,
      padding: 22,
      marginTop: 16,
    },

    walletLabel: {
      fontFamily:
        fontFamily.medium,
      fontSize: fontSize.sm,
      color:
        'rgba(248,246,242,0.85)',
    },

    walletBalance: {
      fontFamily:
        fontFamily.bold,
      fontSize: fontSize.xxl,
      color: light.offWhite,
      marginTop: 6,
    },

    walletHint: {
      fontFamily:
        fontFamily.secondary,
      fontSize: fontSize.xs,
      color:
        'rgba(248,246,242,0.75)',
      marginTop: 10,
    },

    actionsRow: {
      flexDirection: 'row',
      justifyContent:
        'space-between',
      marginTop: 20,
    },

    actionItem: {
      alignItems: 'center',
      width: 70,
    },

    disabledAction: {
      opacity: 0.5,
    },

    actionCircle: {
      width: 52,
      height: 52,
      borderRadius: 26,
      backgroundColor:
        '#EAF3EF',
      alignItems: 'center',
      justifyContent:
        'center',
    },

    actionLabel: {
      fontFamily:
        fontFamily.medium,
      fontSize: fontSize.xs,
      color: light.charcoal,
      marginTop: 6,
      textAlign: 'center',
    },

    errorCard: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 10,
      backgroundColor:
        '#FDEAEA',
      borderRadius: 12,
      padding: 12,
      marginTop: 20,
    },

    errorText: {
      fontFamily:
        fontFamily.medium,
      fontSize: fontSize.sm,
      color: light.danger,
    },

    retryText: {
      fontFamily:
        fontFamily.secondary,
      fontSize: fontSize.xs,
      color:
        light.textSecondary,
      marginTop: 2,
    },

    sectionLabel: {
      fontFamily:
        fontFamily.semibold,
      fontSize: fontSize.sm,
      color:
        light.textSecondary,
      marginTop: 26,
      marginBottom: 10,
    },

    loader: {
      marginTop: 30,
    },

    transactionRow: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor:
        light.card,
      borderRadius: 14,
      borderWidth: 1,
      borderColor:
        light.border,
      padding: 12,
      marginBottom: 10,
    },

    transactionIcon: {
      width: 36,
      height: 36,
      borderRadius: 18,
      alignItems: 'center',
      justifyContent:
        'center',
    },

    transactionDetails: {
      flex: 1,
      marginLeft: 12,
      marginRight: 8,
    },

    transactionCounterparty: {
      fontFamily:
        fontFamily.semibold,
      fontSize: fontSize.sm,
      color: light.charcoal,
    },

    transactionTime: {
      fontFamily:
        fontFamily.secondary,
      fontSize: fontSize.xs,
      color:
        light.textSecondary,
      marginTop: 2,
    },

    referenceText: {
      fontFamily:
        fontFamily.secondary,
      fontSize: fontSize.xs,
      color:
        light.textSecondary,
      marginTop: 2,
    },

    amountColumn: {
      alignItems: 'flex-end',
    },

    transactionAmount: {
      fontFamily:
        fontFamily.semibold,
      fontSize: fontSize.sm,
    },

    amountSent: {
      color: light.danger,
    },

    amountReceived: {
      color: light.primary,
    },

    statusText: {
      fontFamily:
        fontFamily.secondary,
      fontSize: fontSize.xs,
      color:
        light.textSecondary,
      marginTop: 3,
    },

    emptyText: {
      fontFamily:
        fontFamily.secondary,
      fontSize: fontSize.sm,
      color:
        light.textSecondary,
      textAlign: 'center',
      marginTop: 30,
    },
  });