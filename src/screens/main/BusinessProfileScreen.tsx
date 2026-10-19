import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Pressable, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { light } from '../../theme/colors';
import { fontFamily, fontSize } from '../../theme/fonts';
import { getBusinessById, getServicesForBusiness, Business, BusinessService } from '../../db/database';
import type { RootStackParamList } from '../../navigation/RootNavigator';

type ProfileRouteProp = RouteProp<RootStackParamList, 'BusinessProfile'>;
type ProfileNavProp = NativeStackNavigationProp<RootStackParamList, 'BusinessProfile'>;

export default function BusinessProfileScreen() {
  const navigation = useNavigation<ProfileNavProp>();
  const route = useRoute<ProfileRouteProp>();
  const { businessId } = route.params;

  const [business, setBusiness] = useState<Business | null>(null);
  const [services, setServices] = useState<BusinessService[]>([]);

  useEffect(() => {
    setBusiness(getBusinessById(businessId));
    setServices(getServicesForBusiness(businessId));
  }, [businessId]);

  if (!business) {
    return (
      <SafeAreaView style={styles.container}>
        <Text style={styles.loadingText}>Loading business...</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={[styles.banner, { backgroundColor: business.banner_color }]}>
        <Pressable style={styles.backButton} onPress={() => navigation.goBack()} hitSlop={12}>
          <Ionicons name="chevron-back" size={22} color={light.offWhite} />
        </Pressable>
        <View style={styles.bannerIcon}>
          <Ionicons name="storefront" size={36} color="rgba(255,255,255,0.5)" />
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.body} showsVerticalScrollIndicator={false}>
        <Text style={styles.name}>{business.name}</Text>

        <View style={styles.metaRow}>
          <View style={styles.ratingPill}>
            <Ionicons name="star" size={13} color={light.gold} />
            <Text style={styles.ratingText}>{business.rating.toFixed(1)}</Text>
          </View>
          <View style={styles.categoryTag}>
            <Text style={styles.categoryTagText}>{business.category}</Text>
          </View>
        </View>

        {business.description && <Text style={styles.description}>{business.description}</Text>}

        {business.address && (
          <View style={styles.infoRow}>
            <Ionicons name="location-outline" size={16} color={light.textSecondary} />
            <Text style={styles.infoText}>{business.address}</Text>
          </View>
        )}
        {business.phone && (
          <View style={styles.infoRow}>
            <Ionicons name="call-outline" size={16} color={light.textSecondary} />
            <Text style={styles.infoText}>{business.phone}</Text>
          </View>
        )}

        {/* Action buttons */}
        <View style={styles.actionRow}>
          <Pressable style={styles.actionButton}>
            <Ionicons name="call" size={18} color={light.offWhite} />
            <Text style={styles.actionButtonText}>Call</Text>
          </Pressable>
          <Pressable style={[styles.actionButton, styles.actionButtonSecondary]}>
            <Ionicons name="chatbubble" size={18} color={light.primary} />
            <Text style={[styles.actionButtonText, styles.actionButtonTextSecondary]}>Message</Text>
          </Pressable>
          <Pressable style={[styles.actionButton, styles.actionButtonSecondary]}>
            <Ionicons name="navigate" size={18} color={light.primary} />
            <Text style={[styles.actionButtonText, styles.actionButtonTextSecondary]}>Directions</Text>
          </Pressable>
        </View>

        {/* Services menu */}
        <Text style={styles.sectionLabel}>Services</Text>
        {services.length === 0 ? (
          <Text style={styles.emptyServices}>No services listed yet.</Text>
        ) : (
          services.map((s) => (
            <View key={s.id} style={styles.serviceRow}>
              <Text style={styles.serviceName}>{s.name}</Text>
              <Text style={styles.servicePrice}>{s.price}</Text>
            </View>
          ))
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: light.offWhite,
  },
  loadingText: {
    fontFamily: fontFamily.secondary,
    color: light.textSecondary,
    textAlign: 'center',
    marginTop: 40,
  },
  banner: {
    height: 140,
    alignItems: 'center',
    justifyContent: 'center',
  },
  backButton: {
    position: 'absolute',
    top: 12,
    left: 16,
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(0,0,0,0.25)',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 2,
  },
  bannerIcon: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  body: {
    paddingHorizontal: 20,
    paddingTop: 18,
    paddingBottom: 40,
  },
  name: {
    fontFamily: fontFamily.bold,
    fontSize: fontSize.xl,
    color: light.charcoal,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 8,
  },
  ratingPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#FFF6E6',
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  ratingText: {
    fontFamily: fontFamily.semibold,
    fontSize: fontSize.xs,
    color: light.charcoal,
  },
  categoryTag: {
    backgroundColor: '#EAF3EF',
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  categoryTagText: {
    fontFamily: fontFamily.medium,
    fontSize: fontSize.xs,
    color: light.primary,
  },
  description: {
    fontFamily: fontFamily.secondary,
    fontSize: fontSize.sm,
    color: light.textSecondary,
    marginTop: 12,
    lineHeight: 20,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 10,
    gap: 8,
  },
  infoText: {
    fontFamily: fontFamily.secondary,
    fontSize: fontSize.sm,
    color: light.textSecondary,
  },
  actionRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 20,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: light.primary,
    borderRadius: 12,
    paddingVertical: 12,
  },
  actionButtonSecondary: {
    backgroundColor: light.card,
    borderWidth: 1.5,
    borderColor: light.border,
  },
  actionButtonText: {
    fontFamily: fontFamily.semibold,
    fontSize: fontSize.xs,
    color: light.offWhite,
  },
  actionButtonTextSecondary: {
    color: light.primary,
  },
  sectionLabel: {
    fontFamily: fontFamily.semibold,
    fontSize: fontSize.sm,
    color: light.textSecondary,
    marginTop: 26,
    marginBottom: 10,
  },
  emptyServices: {
    fontFamily: fontFamily.secondary,
    fontSize: fontSize.sm,
    color: light.textSecondary,
  },
  serviceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: light.card,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: light.border,
    paddingHorizontal: 14,
    paddingVertical: 12,
    marginBottom: 10,
  },
  serviceName: {
    fontFamily: fontFamily.medium,
    fontSize: fontSize.sm,
    color: light.charcoal,
    flex: 1,
    marginRight: 10,
  },
  servicePrice: {
    fontFamily: fontFamily.semibold,
    fontSize: fontSize.sm,
    color: light.primary,
  },
});
