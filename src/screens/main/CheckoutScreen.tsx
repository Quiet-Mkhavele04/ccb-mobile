import React, { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { checkout, OrdersApiError } from '../../api/ordersApi';
import { useCart } from '../../context/CartContext';
import type { RootStackParamList } from '../../navigation/RootNavigator';
import { light } from '../../theme/colors';
import { fontFamily, fontSize } from '../../theme/fonts';

type CheckoutNavigation = NativeStackNavigationProp<RootStackParamList, 'Checkout'>;
type FulfilmentType = 'Delivery' | 'Collection';
type PaymentMethod = 'CCB Wallet' | 'Cash on Collection';

const DELIVERY_FEE = 35;
const FREE_DELIVERY_MINIMUM = 500;

export default function CheckoutScreen() {
  const navigation = useNavigation<CheckoutNavigation>();
  const { items, itemCount, subtotal, clearCart } = useCart();
  const [fulfilmentType, setFulfilmentType] = useState<FulfilmentType>('Collection');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('Cash on Collection');
  const [address, setAddress] = useState('');
  const [placingOrder, setPlacingOrder] = useState(false);

  const deliveryFee =
    fulfilmentType === 'Delivery' && subtotal < FREE_DELIVERY_MINIMUM
      ? DELIVERY_FEE
      : 0;
  const total = subtotal + deliveryFee;

  function chooseFulfilment(value: FulfilmentType) {
    setFulfilmentType(value);
    if (value === 'Delivery') setPaymentMethod('CCB Wallet');
  }

  async function placeOrder() {
    if (items.length === 0) {
      Alert.alert('Empty cart', 'Add at least one product before checking out.');
      return;
    }

    if (fulfilmentType === 'Delivery' && !address.trim()) {
      Alert.alert('Address required', 'Enter the address where your order must be delivered.');
      return;
    }

    try {
      setPlacingOrder(true);
      const result = await checkout({
        fulfilmentType,
        deliveryAddress: fulfilmentType === 'Delivery' ? address.trim() : null,
        paymentMethod,
        items: items.map(item => ({
          productId: item.product.productId,
          quantity: item.quantity,
        })),
      });

      clearCart();
      navigation.replace('OrderConfirmation', { order: result.order });
    } catch (error) {
      Alert.alert(
        'Order not placed',
        error instanceof OrdersApiError
          ? error.message
          : 'Something went wrong. Please try again.'
      );
    } finally {
      setPlacingOrder(false);
    }
  }

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <View style={styles.header}>
          <Pressable style={styles.headerButton} onPress={() => navigation.goBack()}>
            <Ionicons name="chevron-back" size={24} color={light.charcoal} />
          </Pressable>
          <Text style={styles.headerTitle}>Checkout</Text>
          <View style={styles.headerButton} />
        </View>

        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.content}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <StepTitle number="1" title="How would you like your order?" />
          <View style={styles.optionRow}>
            <OptionCard
              active={fulfilmentType === 'Collection'}
              icon="storefront-outline"
              title="Collection"
              subtitle="Collect from the seller"
              onPress={() => chooseFulfilment('Collection')}
            />
            <OptionCard
              active={fulfilmentType === 'Delivery'}
              icon="car-outline"
              title="Delivery"
              subtitle={subtotal >= FREE_DELIVERY_MINIMUM ? 'Free delivery' : 'R35 delivery fee'}
              onPress={() => chooseFulfilment('Delivery')}
            />
          </View>

          {fulfilmentType === 'Delivery' && (
            <View style={styles.addressBox}>
              <Text style={styles.inputLabel}>Delivery address</Text>
              <View style={styles.inputContainer}>
                <Ionicons name="location-outline" size={19} color={light.textSecondary} />
                <TextInput
                  style={styles.input}
                  value={address}
                  onChangeText={setAddress}
                  placeholder="Street, suburb and city"
                  placeholderTextColor={light.textSecondary}
                  multiline
                />
              </View>
            </View>
          )}

          <StepTitle number="2" title="Payment method" />
          <PaymentOption
            active={paymentMethod === 'CCB Wallet'}
            icon="wallet-outline"
            title="CCB Wallet"
            subtitle="Pay securely from your wallet balance"
            onPress={() => setPaymentMethod('CCB Wallet')}
          />
          {fulfilmentType === 'Collection' && (
            <PaymentOption
              active={paymentMethod === 'Cash on Collection'}
              icon="cash-outline"
              title="Cash on Collection"
              subtitle="Pay the seller when collecting"
              onPress={() => setPaymentMethod('Cash on Collection')}
            />
          )}

          <StepTitle number="3" title="Order summary" />
          <View style={styles.summaryCard}>
            {items.map(item => (
              <View key={item.product.productId} style={styles.itemRow}>
                <Text style={styles.itemName} numberOfLines={1}>
                  {item.quantity} × {item.product.name}
                </Text>
                <Text style={styles.itemPrice}>
                  {formatPrice(item.product.price * item.quantity)}
                </Text>
              </View>
            ))}
            <View style={styles.divider} />
            <SummaryRow label={`Subtotal (${itemCount} items)`} value={formatPrice(subtotal)} />
            <SummaryRow label="Delivery" value={deliveryFee === 0 ? 'FREE' : formatPrice(deliveryFee)} highlight={deliveryFee === 0} />
            <View style={styles.divider} />
            <View style={styles.totalRow}>
              <Text style={styles.totalLabel}>Total</Text>
              <Text style={styles.totalValue}>{formatPrice(total)}</Text>
            </View>
          </View>

          <View style={styles.secureNotice}>
            <Ionicons name="shield-checkmark-outline" size={19} color={light.primary} />
            <Text style={styles.secureText}>
              Prices and stock are verified securely by the CCB server before your order is placed.
            </Text>
          </View>
        </ScrollView>

        <View style={styles.bottomBar}>
          <Pressable
            style={[styles.placeButton, placingOrder && styles.disabledButton]}
            disabled={placingOrder}
            onPress={placeOrder}
          >
            {placingOrder ? (
              <ActivityIndicator color={light.offWhite} />
            ) : (
              <>
                <Text style={styles.placeButtonText}>Place order · {formatPrice(total)}</Text>
                <Ionicons name="arrow-forward" size={19} color={light.offWhite} />
              </>
            )}
          </Pressable>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

function StepTitle({ number, title }: { number: string; title: string }) {
  return (
    <View style={styles.stepTitleRow}>
      <View style={styles.stepNumber}><Text style={styles.stepNumberText}>{number}</Text></View>
      <Text style={styles.sectionTitle}>{title}</Text>
    </View>
  );
}

function OptionCard({ active, icon, title, subtitle, onPress }: {
  active: boolean;
  icon: React.ComponentProps<typeof Ionicons>['name'];
  title: string;
  subtitle: string;
  onPress: () => void;
}) {
  return (
    <Pressable style={[styles.optionCard, active && styles.activeCard]} onPress={onPress}>
      <Ionicons name={icon} size={25} color={active ? light.primary : light.textSecondary} />
      <Text style={[styles.optionTitle, active && styles.activeText]}>{title}</Text>
      <Text style={styles.optionSubtitle}>{subtitle}</Text>
      <Ionicons name={active ? 'radio-button-on' : 'radio-button-off'} size={19} color={active ? light.primary : light.textSecondary} />
    </Pressable>
  );
}

function PaymentOption({ active, icon, title, subtitle, onPress }: {
  active: boolean;
  icon: React.ComponentProps<typeof Ionicons>['name'];
  title: string;
  subtitle: string;
  onPress: () => void;
}) {
  return (
    <Pressable style={[styles.paymentCard, active && styles.activeCard]} onPress={onPress}>
      <View style={styles.paymentIcon}><Ionicons name={icon} size={22} color={light.primary} /></View>
      <View style={styles.paymentText}>
        <Text style={styles.paymentTitle}>{title}</Text>
        <Text style={styles.paymentSubtitle}>{subtitle}</Text>
      </View>
      <Ionicons name={active ? 'radio-button-on' : 'radio-button-off'} size={21} color={active ? light.primary : light.textSecondary} />
    </Pressable>
  );
}

function SummaryRow({ label, value, highlight = false }: { label: string; value: string; highlight?: boolean }) {
  return (
    <View style={styles.summaryRow}>
      <Text style={styles.summaryLabel}>{label}</Text>
      <Text style={[styles.summaryValue, highlight && styles.highlightText]}>{value}</Text>
    </View>
  );
}

function formatPrice(value: number) { return `R${value.toFixed(2)}`; }

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: light.offWhite },
  header: { height: 58, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 14, backgroundColor: light.card, borderBottomWidth: 1, borderBottomColor: light.border },
  headerButton: { width: 42, height: 42, alignItems: 'center', justifyContent: 'center' },
  headerTitle: { flex: 1, textAlign: 'center', fontFamily: fontFamily.semibold, fontSize: fontSize.md, color: light.charcoal },
  scroll: { flex: 1 },
  content: { padding: 20, paddingBottom: 30 },
  stepTitleRow: { flexDirection: 'row', alignItems: 'center', marginTop: 8, marginBottom: 12 },
  stepNumber: { width: 26, height: 26, borderRadius: 13, backgroundColor: light.primary, alignItems: 'center', justifyContent: 'center', marginRight: 9 },
  stepNumberText: { fontFamily: fontFamily.semibold, fontSize: fontSize.xs, color: light.offWhite },
  sectionTitle: { fontFamily: fontFamily.semibold, fontSize: fontSize.md, color: light.charcoal },
  optionRow: { flexDirection: 'row', gap: 10, marginBottom: 18 },
  optionCard: { flex: 1, minHeight: 145, backgroundColor: light.card, borderWidth: 1.5, borderColor: light.border, borderRadius: 15, padding: 13 },
  activeCard: { borderColor: light.primary, backgroundColor: '#F3F8F6' },
  optionTitle: { fontFamily: fontFamily.semibold, fontSize: fontSize.sm, color: light.charcoal, marginTop: 10 },
  activeText: { color: light.primary },
  optionSubtitle: { flex: 1, fontFamily: fontFamily.secondary, fontSize: fontSize.xs, lineHeight: 17, color: light.textSecondary, marginTop: 4 },
  addressBox: { marginBottom: 18 },
  inputLabel: { fontFamily: fontFamily.medium, fontSize: fontSize.xs, color: light.charcoal, marginBottom: 7 },
  inputContainer: { flexDirection: 'row', alignItems: 'flex-start', gap: 8, backgroundColor: light.card, borderWidth: 1, borderColor: light.border, borderRadius: 13, paddingHorizontal: 13, paddingVertical: 11 },
  input: { flex: 1, minHeight: 42, fontFamily: fontFamily.regular, fontSize: fontSize.sm, color: light.charcoal, padding: 0, textAlignVertical: 'top' },
  paymentCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: light.card, borderWidth: 1.5, borderColor: light.border, borderRadius: 14, padding: 12, marginBottom: 10 },
  paymentIcon: { width: 42, height: 42, borderRadius: 12, backgroundColor: '#EAF3EF', alignItems: 'center', justifyContent: 'center' },
  paymentText: { flex: 1, marginHorizontal: 11 },
  paymentTitle: { fontFamily: fontFamily.semibold, fontSize: fontSize.sm, color: light.charcoal },
  paymentSubtitle: { fontFamily: fontFamily.secondary, fontSize: fontSize.xs, color: light.textSecondary, marginTop: 2 },
  summaryCard: { backgroundColor: light.card, borderWidth: 1, borderColor: light.border, borderRadius: 15, padding: 15, marginBottom: 15 },
  itemRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 9 },
  itemName: { flex: 1, fontFamily: fontFamily.secondary, fontSize: fontSize.sm, color: light.charcoal, marginRight: 10 },
  itemPrice: { fontFamily: fontFamily.medium, fontSize: fontSize.sm, color: light.charcoal },
  divider: { height: 1, backgroundColor: light.border, marginVertical: 10 },
  summaryRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
  summaryLabel: { fontFamily: fontFamily.secondary, fontSize: fontSize.sm, color: light.textSecondary },
  summaryValue: { fontFamily: fontFamily.semibold, fontSize: fontSize.sm, color: light.charcoal },
  highlightText: { color: light.primary },
  totalRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  totalLabel: { fontFamily: fontFamily.bold, fontSize: fontSize.md, color: light.charcoal },
  totalValue: { fontFamily: fontFamily.bold, fontSize: fontSize.lg, color: light.primary },
  secureNotice: { flexDirection: 'row', alignItems: 'flex-start', gap: 8, backgroundColor: '#EAF3EF', borderRadius: 12, padding: 12 },
  secureText: { flex: 1, fontFamily: fontFamily.secondary, fontSize: fontSize.xs, lineHeight: 18, color: light.primary },
  bottomBar: { backgroundColor: light.card, borderTopWidth: 1, borderTopColor: light.border, paddingHorizontal: 20, paddingTop: 12, paddingBottom: 10 },
  placeButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, minHeight: 52, backgroundColor: light.primary, borderRadius: 14 },
  disabledButton: { opacity: 0.6 },
  placeButtonText: { fontFamily: fontFamily.semibold, fontSize: fontSize.md, color: light.offWhite },
});
