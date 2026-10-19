import React, { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import {
  getMyOrders,
  OrderListItem,
  OrdersApiError,
} from '../../api/ordersApi';
import type { RootStackParamList } from '../../navigation/RootNavigator';
import { light } from '../../theme/colors';
import { fontFamily, fontSize } from '../../theme/fonts';

type OrdersNavigation = NativeStackNavigationProp<RootStackParamList, 'Orders'>;

export default function OrdersScreen() {
  const navigation = useNavigation<OrdersNavigation>();
  const [orders, setOrders] = useState<OrderListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadOrders = useCallback(async (refresh = false) => {
    try {
      refresh ? setRefreshing(true) : setLoading(true);
      setError(null);
      const result = await getMyOrders();
      setOrders(result.orders);
    } catch (loadError) {
      setError(
        loadError instanceof OrdersApiError
          ? loadError.message
          : 'Unable to load your orders.'
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadOrders();
    }, [loadOrders])
  );

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <Pressable style={styles.headerButton} onPress={() => navigation.goBack()}>
          <Ionicons name="chevron-back" size={24} color={light.charcoal} />
        </Pressable>
        <View style={styles.headerText}>
          <Text style={styles.title}>My Orders</Text>
          <Text style={styles.subtitle}>Track your marketplace purchases</Text>
        </View>
        <View style={styles.headerButton} />
      </View>

      {loading ? (
        <View style={styles.centerBox}>
          <ActivityIndicator size="large" color={light.primary} />
          <Text style={styles.messageText}>Loading orders...</Text>
        </View>
      ) : error && orders.length === 0 ? (
        <View style={styles.centerBox}>
          <Ionicons name="cloud-offline-outline" size={48} color={light.textSecondary} />
          <Text style={styles.errorTitle}>Orders unavailable</Text>
          <Text style={styles.messageText}>{error}</Text>
          <Pressable style={styles.retryButton} onPress={() => loadOrders()}>
            <Text style={styles.retryText}>Try again</Text>
          </Pressable>
        </View>
      ) : (
        <FlatList
          data={orders}
          keyExtractor={item => String(item.orderId)}
          contentContainerStyle={[styles.list, orders.length === 0 && styles.emptyList]}
          showsVerticalScrollIndicator={false}
          refreshing={refreshing}
          onRefresh={() => loadOrders(true)}
          renderItem={({ item }) => (
            <Pressable
              style={styles.orderCard}
              onPress={() =>
                navigation.navigate(
                  'OrderDetails',
                  { orderId: item.orderId }
                )
              }
            >
              <View style={styles.cardHeader}>
                <View style={styles.orderIcon}>
                  <Ionicons name="bag-check-outline" size={22} color={light.primary} />
                </View>
                <View style={styles.orderHeading}>
                  <Text style={styles.orderNumber}>{item.orderNumber}</Text>
                  <Text style={styles.orderDate}>{formatDate(item.createdAt)}</Text>
                </View>
                <View style={[styles.statusPill, getStatusStyle(item.status)]}>
                  <Text style={[styles.statusText, getStatusTextStyle(item.status)]}>
                    {item.status}
                  </Text>
                </View>
              </View>

              <View style={styles.divider} />

              <View style={styles.detailsRow}>
                <View style={styles.detailBlock}>
                  <Text style={styles.detailLabel}>ITEMS</Text>
                  <Text style={styles.detailValue}>
                    {item.itemCount} {item.itemCount === 1 ? 'item' : 'items'}
                  </Text>
                </View>
                <View style={styles.verticalDivider} />
                <View style={styles.detailBlock}>
                  <Text style={styles.detailLabel}>METHOD</Text>
                  <Text style={styles.detailValue}>{item.fulfilmentType}</Text>
                </View>
                <View style={styles.verticalDivider} />
                <View style={[styles.detailBlock, styles.totalBlock]}>
                  <Text style={styles.detailLabel}>TOTAL</Text>
                  <Text style={styles.orderTotal}>R{item.total.toFixed(2)}</Text>
                </View>
              </View>

              <View style={styles.paymentRow}>
                <Ionicons name="card-outline" size={15} color={light.textSecondary} />
                <Text style={styles.paymentText}>{item.paymentMethod}</Text>
                <Ionicons
                  name="chevron-forward"
                  size={17}
                  color={light.textSecondary}
                  style={styles.chevron}
                />
              </View>
            </Pressable>
          )}
          ListEmptyComponent={
            <View style={styles.centerBox}>
              <View style={styles.emptyIcon}>
                <Ionicons name="receipt-outline" size={48} color={light.primary} />
              </View>
              <Text style={styles.emptyTitle}>No orders yet</Text>
              <Text style={styles.messageText}>
                Your marketplace orders will appear here after checkout.
              </Text>
              <Pressable
                style={styles.shopButton}
                onPress={() => navigation.navigate('MainTabs')}
              >
                <Text style={styles.shopButtonText}>Browse marketplace</Text>
              </Pressable>
            </View>
          }
        />
      )}
    </SafeAreaView>
  );
}

function formatDate(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  return date.toLocaleDateString([], {
    day: '2-digit', month: 'short', year: 'numeric',
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

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: light.offWhite },
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 14, paddingVertical: 9, backgroundColor: light.card, borderBottomWidth: 1, borderBottomColor: light.border },
  headerButton: { width: 42, height: 42, alignItems: 'center', justifyContent: 'center' },
  headerText: { flex: 1, alignItems: 'center' },
  title: { fontFamily: fontFamily.bold, fontSize: fontSize.lg, color: light.charcoal },
  subtitle: { fontFamily: fontFamily.secondary, fontSize: fontSize.xs, color: light.textSecondary, marginTop: 1 },
  list: { padding: 20, paddingBottom: 40 },
  emptyList: { flexGrow: 1 },
  orderCard: { backgroundColor: light.card, borderWidth: 1, borderColor: light.border, borderRadius: 16, padding: 14, marginBottom: 12 },
  cardHeader: { flexDirection: 'row', alignItems: 'center' },
  orderIcon: { width: 42, height: 42, borderRadius: 12, backgroundColor: '#EAF3EF', alignItems: 'center', justifyContent: 'center' },
  orderHeading: { flex: 1, marginHorizontal: 10 },
  orderNumber: { fontFamily: fontFamily.semibold, fontSize: fontSize.sm, color: light.charcoal },
  orderDate: { fontFamily: fontFamily.secondary, fontSize: 10, color: light.textSecondary, marginTop: 3 },
  statusPill: { borderRadius: 999, paddingHorizontal: 9, paddingVertical: 5 },
  statusText: { fontFamily: fontFamily.semibold, fontSize: 10 },
  confirmedStatus: { backgroundColor: '#EAF3EF' },
  confirmedText: { color: light.primary },
  pendingStatus: { backgroundColor: '#FFF6E6' },
  pendingText: { color: '#A16207' },
  cancelledStatus: { backgroundColor: '#FDECEC' },
  cancelledText: { color: light.danger },
  divider: { height: 1, backgroundColor: light.border, marginVertical: 13 },
  detailsRow: { flexDirection: 'row', alignItems: 'center' },
  detailBlock: { flex: 1 },
  totalBlock: { alignItems: 'flex-end' },
  detailLabel: { fontFamily: fontFamily.semibold, fontSize: 9, letterSpacing: 0.6, color: light.textSecondary },
  detailValue: { fontFamily: fontFamily.medium, fontSize: fontSize.xs, color: light.charcoal, marginTop: 4 },
  orderTotal: { fontFamily: fontFamily.bold, fontSize: fontSize.sm, color: light.primary, marginTop: 3 },
  verticalDivider: { width: 1, height: 31, backgroundColor: light.border, marginHorizontal: 9 },
  paymentRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 13 },
  paymentText: { fontFamily: fontFamily.secondary, fontSize: fontSize.xs, color: light.textSecondary },
  chevron: { marginLeft: 'auto' },
  centerBox: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 34 },
  messageText: { fontFamily: fontFamily.secondary, fontSize: fontSize.sm, lineHeight: 20, color: light.textSecondary, textAlign: 'center', marginTop: 9 },
  errorTitle: { fontFamily: fontFamily.semibold, fontSize: fontSize.md, color: light.charcoal, marginTop: 12 },
  retryButton: { backgroundColor: light.primary, borderRadius: 12, paddingHorizontal: 20, paddingVertical: 11, marginTop: 18 },
  retryText: { fontFamily: fontFamily.semibold, fontSize: fontSize.sm, color: light.offWhite },
  emptyIcon: { width: 96, height: 96, borderRadius: 48, backgroundColor: '#EAF3EF', alignItems: 'center', justifyContent: 'center' },
  emptyTitle: { fontFamily: fontFamily.bold, fontSize: fontSize.lg, color: light.charcoal, marginTop: 18 },
  shopButton: { backgroundColor: light.primary, borderRadius: 12, paddingHorizontal: 20, paddingVertical: 12, marginTop: 18 },
  shopButtonText: { fontFamily: fontFamily.semibold, fontSize: fontSize.sm, color: light.offWhite },
});
