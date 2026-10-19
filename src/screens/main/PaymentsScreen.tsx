import React, { useCallback, useState } from 'react';
import { View, Text, StyleSheet, FlatList, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { light } from '../../theme/colors';
import { fontFamily, fontSize } from '../../theme/fonts';
import { getTransactions, getWalletBalance, topUpWallet, Transaction } from '../../db/database';
import type { RootStackParamList } from '../../navigation/RootNavigator';

type PaymentsNavProp = NativeStackNavigationProp<RootStackParamList, 'MainTabs'>;

export default function PaymentsScreen() {
  const navigation = useNavigation<PaymentsNavProp>();
  const [balance, setBalance] = useState(0);
  const [transactions, setTransactions] = useState<Transaction[]>([]);

  const load = useCallback(() => {
    setBalance(getWalletBalance());
    setTransactions(getTransactions());
  }, []);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  const handleTopUp = () => {
    topUpWallet(200);
    load();
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <Text style={styles.title}>Payments</Text>
      </View>

      <FlatList
        data={transactions}
        keyExtractor={(t) => String(t.id)}
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
        ListHeaderComponent={
          <View>
            {/* Wallet card */}
            <LinearGradient
              colors={[light.primary, light.primaryLight]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.walletCard}
            >
              <Text style={styles.walletLabel}>Wallet balance</Text>
              <Text style={styles.walletBalance}>
                R{balance.toLocaleString('en-ZA', { minimumFractionDigits: 2 })}
              </Text>
              <Text style={styles.walletHint}>Tap Top Up to add demo funds</Text>
            </LinearGradient>

            {/* Quick actions */}
            <View style={styles.actionsRow}>
              <QuickAction
                icon="arrow-up-circle"
                label="Send"
                onPress={() => navigation.navigate('SendMoney', { mode: 'send' })}
              />
              <QuickAction
                icon="arrow-down-circle"
                label="Request"
                onPress={() => navigation.navigate('SendMoney', { mode: 'request' })}
              />
              <QuickAction icon="add-circle" label="Top Up" onPress={handleTopUp} />
              <QuickAction icon="receipt" label="Pay Bill" onPress={() => {}} />
            </View>

            <Text style={styles.sectionLabel}>Transaction history</Text>
          </View>
        }
        renderItem={({ item }) => <TransactionRow transaction={item} />}
        ListEmptyComponent={
          <Text style={styles.emptyText}>No transactions yet.</Text>
        }
      />
    </SafeAreaView>
  );
}

function QuickAction({
  icon,
  label,
  onPress,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  onPress: () => void;
}) {
  return (
    <Pressable style={styles.actionItem} onPress={onPress}>
      <View style={styles.actionCircle}>
        <Ionicons name={icon} size={24} color={light.primary} />
      </View>
      <Text style={styles.actionLabel}>{label}</Text>
    </Pressable>
  );
}

function TransactionRow({ transaction }: { transaction: Transaction }) {
  const isSent = transaction.direction === 'sent';
  return (
    <View style={styles.transactionRow}>
      <View
        style={[
          styles.transactionIcon,
          { backgroundColor: isSent ? '#FDEAEA' : '#EAF3EF' },
        ]}
      >
        <Ionicons
          name={isSent ? 'arrow-up' : 'arrow-down'}
          size={16}
          color={isSent ? light.danger : light.primary}
        />
      </View>
      <View style={{ flex: 1, marginLeft: 12 }}>
        <Text style={styles.transactionCounterparty} numberOfLines={1}>
          {transaction.counterparty}
        </Text>
        <Text style={styles.transactionTime}>{transaction.timestamp}</Text>
      </View>
      <Text style={[styles.transactionAmount, isSent ? styles.amountSent : styles.amountReceived]}>
        {isSent ? '-' : '+'}R{transaction.amount.toFixed(2)}
      </Text>
    </View>
  );
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
  list: {
    paddingHorizontal: 20,
    paddingBottom: 30,
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
  sectionLabel: {
    fontFamily: fontFamily.semibold,
    fontSize: fontSize.sm,
    color: light.textSecondary,
    marginTop: 26,
    marginBottom: 10,
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
  },
  amountSent: {
    color: light.danger,
  },
  amountReceived: {
    color: light.primary,
  },
  emptyText: {
    fontFamily: fontFamily.secondary,
    fontSize: fontSize.sm,
    color: light.textSecondary,
    textAlign: 'center',
    marginTop: 30,
  },
});
