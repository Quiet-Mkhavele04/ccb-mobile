import React, { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import {
  RouteProp,
  useFocusEffect,
  useNavigation,
  useRoute,
} from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import {
  getOrder,
  OrderDetails,
  OrdersApiError,
} from '../../api/ordersApi';
import type { RootStackParamList } from '../../navigation/RootNavigator';
import { light } from '../../theme/colors';
import { fontFamily, fontSize } from '../../theme/fonts';

type DetailsRoute = RouteProp<RootStackParamList, 'OrderDetails'>;
type DetailsNavigation = NativeStackNavigationProp<RootStackParamList, 'OrderDetails'>;

export default function OrderDetailsScreen() {
  const navigation = useNavigation<DetailsNavigation>();
  const { orderId } = useRoute<DetailsRoute>().params;
  const [order, setOrder] = useState<OrderDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadOrder = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const result = await getOrder(orderId);
      setOrder(result.order);
    } catch (loadError) {
      setError(
        loadError instanceof OrdersApiError
          ? loadError.message
          : 'Unable to load this order.'
      );
    } finally {
      setLoading(false);
    }
  }, [orderId]);

  useFocusEffect(
    useCallback(() => {
      loadOrder();
    }, [loadOrder])
  );

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <Pressable style={styles.headerButton} onPress={() => navigation.goBack()}>
          <Ionicons name="chevron-back" size={24} color={light.charcoal} />
        </Pressable>
        <Text style={styles.headerTitle}>Order Details</Text>
        <View style={styles.headerButton} />
      </View>

      {loading ? (
        <View style={styles.centerBox}>
          <ActivityIndicator size="large" color={light.primary} />
          <Text style={styles.messageText}>Loading order...</Text>
        </View>
      ) : !order || error ? (
        <View style={styles.centerBox}>
          <Ionicons name="alert-circle-outline" size={48} color={light.textSecondary} />
          <Text style={styles.errorTitle}>Order unavailable</Text>
          <Text style={styles.messageText}>{error ?? 'Order not found.'}</Text>
          <Pressable style={styles.retryButton} onPress={loadOrder}>
            <Text style={styles.retryText}>Try again</Text>
          </Pressable>
        </View>
      ) : (
        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          <View style={styles.heroCard}>
            <View style={styles.heroIcon}>
              <Ionicons name="receipt-outline" size={32} color={light.offWhite} />
            </View>
            <Text style={styles.orderLabel}>ORDER NUMBER</Text>
            <Text style={styles.orderNumber}>{order.orderNumber}</Text>
            <View style={[styles.statusPill, getStatusStyle(order.status)]}>
              <View style={[styles.statusDot, getStatusDotStyle(order.status)]} />
              <Text style={[styles.statusText, getStatusTextStyle(order.status)]}>
                {order.status}
              </Text>
            </View>
            <Text style={styles.orderDate}>{formatDate(order.createdAt)}</Text>
          </View>

          <Text style={styles.sectionTitle}>Items</Text>
          <View style={styles.card}>
            {order.items.map((item, index) => (
              <View
                key={item.orderItemId}
                style={[styles.itemRow, index < order.items.length - 1 && styles.rowBorder]}
              >
                <View style={styles.productIcon}>
                  <Ionicons name="cube-outline" size={21} color={light.primary} />
                </View>
                <View style={styles.itemText}>
                  <Text style={styles.productName}>{item.productName}</Text>
                  <Text style={styles.quantityText}>
                    {item.quantity} × R{item.unitPrice.toFixed(2)}
                  </Text>
                </View>
                <Text style={styles.lineTotal}>R{item.lineTotal.toFixed(2)}</Text>
              </View>
            ))}
          </View>

          <Text style={styles.sectionTitle}>Order information</Text>
          <View style={styles.card}>
            <InfoRow icon="cube-outline" label="Method" value={order.fulfilmentType} />
            <InfoRow icon="card-outline" label="Payment" value={order.paymentMethod} />
            {order.deliveryAddress ? (
              <InfoRow icon="location-outline" label="Address" value={order.deliveryAddress} />
            ) : (
              <InfoRow icon="storefront-outline" label="Collection" value="Collect from the seller" />
            )}
          </View>

          <Text style={styles.sectionTitle}>Payment summary</Text>
          <View style={styles.card}>
            <PriceRow label="Subtotal" value={order.subtotal} />
            <PriceRow label="Delivery" value={order.deliveryFee} free={order.deliveryFee === 0} />
            <View style={styles.summaryDivider} />
            <View style={styles.totalRow}>
              <Text style={styles.totalLabel}>Total</Text>
              <Text style={styles.totalValue}>R{order.total.toFixed(2)}</Text>
            </View>
          </View>

          <View style={styles.helpNotice}>
            <Ionicons name="help-circle-outline" size={21} color={light.primary} />
            <Text style={styles.helpText}>
              Need help with this order? Contact the business or CCB support and provide your order number.
            </Text>
          </View>
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

function InfoRow({ icon, label, value }: {
  icon: React.ComponentProps<typeof Ionicons>['name'];
  label: string;
  value: string;
}) {
  return (
    <View style={styles.infoRow}>
      <View style={styles.infoIcon}><Ionicons name={icon} size={18} color={light.primary} /></View>
      <Text style={styles.infoLabel}>{label}</Text>
      <Text style={styles.infoValue}>{value}</Text>
    </View>
  );
}

function PriceRow({ label, value, free = false }: { label: string; value: number; free?: boolean }) {
  return (
    <View style={styles.priceRow}>
      <Text style={styles.priceLabel}>{label}</Text>
      <Text style={[styles.priceValue, free && styles.freeText]}>
        {free ? 'FREE' : `R${value.toFixed(2)}`}
      </Text>
    </View>
  );
}

function formatDate(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  return date.toLocaleDateString([], {
    weekday: 'short', day: '2-digit', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });
}

function getStatusStyle(status: string) {
  if (status.toLowerCase() === 'confirmed') return styles.confirmedStatus;
  if (status.toLowerCase() === 'cancelled') return styles.cancelledStatus;
  return styles.pendingStatus;
}

function getStatusTextStyle(status: string) {
  if (status.toLowerCase() === 'confirmed') return styles.confirmedText;
  if (status.toLowerCase() === 'cancelled') return styles.cancelledText;
  return styles.pendingText;
}

function getStatusDotStyle(status: string) {
  if (status.toLowerCase() === 'confirmed') return styles.confirmedDot;
  if (status.toLowerCase() === 'cancelled') return styles.cancelledDot;
  return styles.pendingDot;
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: light.offWhite },
  header: { height: 58, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 14, backgroundColor: light.card, borderBottomWidth: 1, borderBottomColor: light.border },
  headerButton: { width: 42, height: 42, alignItems: 'center', justifyContent: 'center' },
  headerTitle: { flex: 1, textAlign: 'center', fontFamily: fontFamily.semibold, fontSize: fontSize.md, color: light.charcoal },
  content: { padding: 20, paddingBottom: 40 },
  heroCard: { alignItems: 'center', backgroundColor: light.card, borderWidth: 1, borderColor: light.border, borderRadius: 18, padding: 20 },
  heroIcon: { width: 58, height: 58, borderRadius: 18, backgroundColor: light.primary, alignItems: 'center', justifyContent: 'center' },
  orderLabel: { fontFamily: fontFamily.semibold, fontSize: 9, letterSpacing: 1, color: light.textSecondary, marginTop: 13 },
  orderNumber: { fontFamily: fontFamily.bold, fontSize: fontSize.lg, color: light.charcoal, marginTop: 4 },
  orderDate: { fontFamily: fontFamily.secondary, fontSize: fontSize.xs, color: light.textSecondary, marginTop: 8 },
  statusPill: { flexDirection: 'row', alignItems: 'center', gap: 6, borderRadius: 999, paddingHorizontal: 10, paddingVertical: 5, marginTop: 10 },
  statusDot: { width: 7, height: 7, borderRadius: 4 },
  statusText: { fontFamily: fontFamily.semibold, fontSize: fontSize.xs },
  confirmedStatus: { backgroundColor: '#EAF3EF' },
  confirmedText: { color: light.primary },
  confirmedDot: { backgroundColor: light.primary },
  pendingStatus: { backgroundColor: '#FFF6E6' },
  pendingText: { color: '#A16207' },
  pendingDot: { backgroundColor: light.gold },
  cancelledStatus: { backgroundColor: '#FDECEC' },
  cancelledText: { color: light.danger },
  cancelledDot: { backgroundColor: light.danger },
  sectionTitle: { fontFamily: fontFamily.semibold, fontSize: fontSize.md, color: light.charcoal, marginTop: 22, marginBottom: 9 },
  card: { backgroundColor: light.card, borderWidth: 1, borderColor: light.border, borderRadius: 15, paddingHorizontal: 14 },
  itemRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 13 },
  rowBorder: { borderBottomWidth: 1, borderBottomColor: light.border },
  productIcon: { width: 40, height: 40, borderRadius: 11, backgroundColor: '#EAF3EF', alignItems: 'center', justifyContent: 'center' },
  itemText: { flex: 1, marginHorizontal: 10 },
  productName: { fontFamily: fontFamily.semibold, fontSize: fontSize.sm, color: light.charcoal },
  quantityText: { fontFamily: fontFamily.secondary, fontSize: fontSize.xs, color: light.textSecondary, marginTop: 3 },
  lineTotal: { fontFamily: fontFamily.semibold, fontSize: fontSize.sm, color: light.primary },
  infoRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 12 },
  infoIcon: { width: 34, height: 34, borderRadius: 10, backgroundColor: '#EAF3EF', alignItems: 'center', justifyContent: 'center' },
  infoLabel: { fontFamily: fontFamily.secondary, fontSize: fontSize.sm, color: light.textSecondary, marginLeft: 10 },
  infoValue: { flex: 1, textAlign: 'right', fontFamily: fontFamily.medium, fontSize: fontSize.sm, color: light.charcoal, marginLeft: 12 },
  priceRow: { flexDirection: 'row', justifyContent: 'space-between', paddingTop: 13 },
  priceLabel: { fontFamily: fontFamily.secondary, fontSize: fontSize.sm, color: light.textSecondary },
  priceValue: { fontFamily: fontFamily.semibold, fontSize: fontSize.sm, color: light.charcoal },
  freeText: { color: light.primary },
  summaryDivider: { height: 1, backgroundColor: light.border, marginVertical: 13 },
  totalRow: { flexDirection: 'row', justifyContent: 'space-between', paddingBottom: 14 },
  totalLabel: { fontFamily: fontFamily.bold, fontSize: fontSize.md, color: light.charcoal },
  totalValue: { fontFamily: fontFamily.bold, fontSize: fontSize.lg, color: light.primary },
  helpNotice: { flexDirection: 'row', alignItems: 'flex-start', gap: 8, backgroundColor: '#EAF3EF', borderRadius: 13, padding: 13, marginTop: 18 },
  helpText: { flex: 1, fontFamily: fontFamily.secondary, fontSize: fontSize.xs, lineHeight: 18, color: light.primary },
  centerBox: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 34 },
  messageText: { fontFamily: fontFamily.secondary, fontSize: fontSize.sm, color: light.textSecondary, textAlign: 'center', marginTop: 10 },
  errorTitle: { fontFamily: fontFamily.semibold, fontSize: fontSize.md, color: light.charcoal, marginTop: 12 },
  retryButton: { backgroundColor: light.primary, borderRadius: 12, paddingHorizontal: 20, paddingVertical: 11, marginTop: 18 },
  retryText: { fontFamily: fontFamily.semibold, fontSize: fontSize.sm, color: light.offWhite },
});
