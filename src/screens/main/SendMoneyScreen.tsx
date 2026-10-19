import React, { useState } from 'react';
import { View, Text, StyleSheet, Pressable, TextInput, FlatList } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import Avatar from '../../components/Avatar';
import { light } from '../../theme/colors';
import { fontFamily, fontSize } from '../../theme/fonts';
import { getChatList, sendMoney, requestMoney, ChatListItem } from '../../db/database';
import type { RootStackParamList } from '../../navigation/RootNavigator';

type SendMoneyRouteProp = RouteProp<RootStackParamList, 'SendMoney'>;
type SendMoneyNavProp = NativeStackNavigationProp<RootStackParamList, 'SendMoney'>;

export default function SendMoneyScreen() {
  const navigation = useNavigation<SendMoneyNavProp>();
  const route = useRoute<SendMoneyRouteProp>();
  const mode = route.params?.mode || 'send';

  const [contacts] = useState<ChatListItem[]>(() => getChatList());
  const [selectedContact, setSelectedContact] = useState<ChatListItem | null>(null);
  const [amount, setAmount] = useState('');
  const [done, setDone] = useState(false);

  const numericAmount = parseFloat(amount) || 0;
  const canConfirm = selectedContact !== null && numericAmount > 0;

  const handleConfirm = () => {
    if (!selectedContact || !canConfirm) return;
    if (mode === 'send') {
      sendMoney(selectedContact.name, numericAmount);
    } else {
      requestMoney(selectedContact.name, numericAmount);
    }
    setDone(true);
  };

  if (done && selectedContact) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.successState}>
          <View style={styles.successCircle}>
            <Ionicons name="checkmark" size={40} color={light.offWhite} />
          </View>
          <Text style={styles.successTitle}>
            {mode === 'send' ? 'Money sent!' : 'Request sent!'}
          </Text>
          <Text style={styles.successDetail}>
            {mode === 'send'
              ? `R${numericAmount.toFixed(2)} sent to ${selectedContact.name}`
              : `Request for R${numericAmount.toFixed(2)} sent to ${selectedContact.name}`}
          </Text>
          <Pressable style={styles.doneButton} onPress={() => navigation.goBack()}>
            <Text style={styles.doneButtonText}>Back to Payments</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <Pressable onPress={() => navigation.goBack()} hitSlop={12}>
          <Ionicons name="chevron-back" size={24} color={light.charcoal} />
        </Pressable>
        <Text style={styles.headerTitle}>{mode === 'send' ? 'Send money' : 'Request money'}</Text>
        <View style={{ width: 24 }} />
      </View>

      {!selectedContact ? (
        <>
          <Text style={styles.sectionLabel}>Choose a contact</Text>
          <FlatList
            data={contacts}
            keyExtractor={(c) => String(c.id)}
            contentContainerStyle={styles.contactList}
            renderItem={({ item }) => (
              <Pressable style={styles.contactRow} onPress={() => setSelectedContact(item)}>
                <Avatar name={item.name} color={item.avatar_color} size={44} />
                <Text style={styles.contactName}>{item.name}</Text>
              </Pressable>
            )}
          />
        </>
      ) : (
        <View style={styles.amountSection}>
          <View style={styles.selectedContactRow}>
            <Avatar name={selectedContact.name} color={selectedContact.avatar_color} size={48} />
            <Text style={styles.selectedContactName}>{selectedContact.name}</Text>
            <Pressable onPress={() => setSelectedContact(null)} hitSlop={10}>
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

          <Pressable
            style={[styles.confirmButton, !canConfirm && styles.confirmButtonDisabled]}
            disabled={!canConfirm}
            onPress={handleConfirm}
          >
            <Text style={styles.confirmButtonText}>
              {mode === 'send' ? 'Send' : 'Request'} R{numericAmount ? numericAmount.toFixed(2) : '0.00'}
            </Text>
          </Pressable>
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: light.offWhite,
  },
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
  sectionLabel: {
    fontFamily: fontFamily.semibold,
    fontSize: fontSize.sm,
    color: light.textSecondary,
    paddingHorizontal: 20,
    marginTop: 12,
    marginBottom: 8,
  },
  contactList: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  contactRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    gap: 14,
  },
  contactName: {
    fontFamily: fontFamily.medium,
    fontSize: fontSize.md,
    color: light.charcoal,
  },
  amountSection: {
    paddingHorizontal: 20,
    paddingTop: 20,
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
    marginBottom: 40,
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
  confirmButton: {
    backgroundColor: light.primary,
    borderRadius: 16,
    paddingVertical: 16,
    alignItems: 'center',
  },
  confirmButtonDisabled: {
    opacity: 0.4,
  },
  confirmButtonText: {
    fontFamily: fontFamily.semibold,
    fontSize: fontSize.md,
    color: light.offWhite,
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
  doneButton: {
    marginTop: 30,
    backgroundColor: light.primary,
    borderRadius: 16,
    paddingVertical: 14,
    paddingHorizontal: 30,
  },
  doneButtonText: {
    fontFamily: fontFamily.semibold,
    fontSize: fontSize.md,
    color: light.offWhite,
  },
});
