import React from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { RouteProp, useNavigation, useRoute } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../../navigation/RootNavigator';
import { light } from '../../theme/colors';
import { fontFamily, fontSize } from '../../theme/fonts';

type ConfirmationRoute = RouteProp<RootStackParamList, 'OrderConfirmation'>;
type ConfirmationNavigation = NativeStackNavigationProp<RootStackParamList, 'OrderConfirmation'>;

export default function OrderConfirmationScreen() {
  const navigation = useNavigation<ConfirmationNavigation>();
  const { order } = useRoute<ConfirmationRoute>().params;

  function returnToMarketplace() {
    navigation.reset({ index: 0, routes: [{ name: 'MainTabs' }] });
  }

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.successCircle}>
          <Ionicons name="checkmark" size={58} color={light.offWhite} />
        </View>
        <Text style={styles.title}>Order received!</Text>
        <Text style={styles.subtitle}>
          Thank you for supporting a local South African business.
        </Text>

        <View style={styles.orderNumberCard}>
          <Text style={styles.orderNumberLabel}>ORDER NUMBER</Text>
          <Text style={styles.orderNumber}>{order.orderNumber}</Text>
          <View style={styles.statusPill}>
            <View style={styles.statusDot} />
            <Text style={styles.statusText}>{order.status}</Text>
          </View>
        </View>

        <View style={styles.detailsCard}>
          <Detail icon="bag-check-outline" label="Items" value={`${order.itemCount}`} />
          <Detail icon="cube-outline" label="Order method" value={order.fulfilmentType} />
          <Detail icon="card-outline" label="Payment" value={order.paymentMethod} />
          {order.deliveryAddress ? (
            <Detail icon="location-outline" label="Deliver to" value={order.deliveryAddress} />
          ) : null}
          <View style={styles.divider} />
          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>Order total</Text>
            <Text style={styles.totalValue}>R{order.total.toFixed(2)}</Text>
          </View>
        </View>

        <View style={styles.notice}>
          <Ionicons name="notifications-outline" size={21} color={light.primary} />
          <Text style={styles.noticeText}>
            You can check your order status from your order history when that screen is added next.
          </Text>
        </View>
      </ScrollView>

      <View style={styles.bottomBar}>
        <Pressable style={styles.doneButton} onPress={returnToMarketplace}>
          <Text style={styles.doneButtonText}>Continue shopping</Text>
          <Ionicons name="arrow-forward" size={19} color={light.offWhite} />
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

function Detail({ icon, label, value }: {
  icon: React.ComponentProps<typeof Ionicons>['name'];
  label: string;
  value: string;
}) {
  return (
    <View style={styles.detailRow}>
      <View style={styles.detailIcon}><Ionicons name={icon} size={19} color={light.primary} /></View>
      <Text style={styles.detailLabel}>{label}</Text>
      <Text style={styles.detailValue} numberOfLines={2}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: light.offWhite },
  content: { flexGrow: 1, alignItems: 'center', paddingHorizontal: 20, paddingTop: 55, paddingBottom: 30 },
  successCircle: { width: 112, height: 112, borderRadius: 56, backgroundColor: light.primary, alignItems: 'center', justifyContent: 'center' },
  title: { fontFamily: fontFamily.bold, fontSize: 28, color: light.charcoal, marginTop: 24 },
  subtitle: { fontFamily: fontFamily.secondary, fontSize: fontSize.sm, lineHeight: 21, color: light.textSecondary, textAlign: 'center', marginTop: 7, paddingHorizontal: 25 },
  orderNumberCard: { width: '100%', alignItems: 'center', backgroundColor: '#EAF3EF', borderRadius: 16, padding: 17, marginTop: 28 },
  orderNumberLabel: { fontFamily: fontFamily.semibold, fontSize: 10, letterSpacing: 1, color: light.textSecondary },
  orderNumber: { fontFamily: fontFamily.bold, fontSize: fontSize.lg, color: light.primary, marginTop: 5 },
  statusPill: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: light.card, borderRadius: 999, paddingHorizontal: 10, paddingVertical: 5, marginTop: 10 },
  statusDot: { width: 7, height: 7, borderRadius: 4, backgroundColor: light.gold },
  statusText: { fontFamily: fontFamily.medium, fontSize: fontSize.xs, color: light.charcoal },
  detailsCard: { width: '100%', backgroundColor: light.card, borderWidth: 1, borderColor: light.border, borderRadius: 16, padding: 15, marginTop: 16 },
  detailRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 13 },
  detailIcon: { width: 34, height: 34, borderRadius: 10, backgroundColor: '#EAF3EF', alignItems: 'center', justifyContent: 'center' },
  detailLabel: { fontFamily: fontFamily.secondary, fontSize: fontSize.sm, color: light.textSecondary, marginLeft: 10 },
  detailValue: { flex: 1, textAlign: 'right', fontFamily: fontFamily.semibold, fontSize: fontSize.sm, color: light.charcoal, marginLeft: 12 },
  divider: { height: 1, backgroundColor: light.border, marginVertical: 3, marginBottom: 14 },
  totalRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  totalLabel: { fontFamily: fontFamily.bold, fontSize: fontSize.md, color: light.charcoal },
  totalValue: { fontFamily: fontFamily.bold, fontSize: fontSize.lg, color: light.primary },
  notice: { width: '100%', flexDirection: 'row', alignItems: 'flex-start', gap: 9, backgroundColor: '#FFF6E6', borderRadius: 13, padding: 13, marginTop: 16 },
  noticeText: { flex: 1, fontFamily: fontFamily.secondary, fontSize: fontSize.xs, lineHeight: 18, color: light.charcoal },
  bottomBar: { backgroundColor: light.card, borderTopWidth: 1, borderTopColor: light.border, paddingHorizontal: 20, paddingTop: 12, paddingBottom: 10 },
  doneButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: light.primary, borderRadius: 14, paddingVertical: 15 },
  doneButtonText: { fontFamily: fontFamily.semibold, fontSize: fontSize.md, color: light.offWhite },
});
