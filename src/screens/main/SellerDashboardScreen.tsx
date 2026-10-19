import React, { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect, useNavigation } from '@react-navigation/native';

import {
  getMyBusiness,
  Business,
  BusinessesApiError,
  deleteMyBusiness,
} from '../../api/businessesApi';
import { getMyProducts, Product } from '../../api/productsApi';
import { resolveMediaUrl } from '../../api/mediaUrl';
import { light } from '../../theme/colors';
import { fontFamily, fontSize } from '../../theme/fonts';

export default function SellerDashboardScreen() {
  const navigation = useNavigation<any>();
  const [business, setBusiness] = useState<Business | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');
  const [hasNoStore, setHasNoStore] = useState(false);

  const load = useCallback(async (refresh = false) => {
    refresh ? setRefreshing(true) : setLoading(true);
    setError('');
    setHasNoStore(false);

    try {
      const businessResult = await getMyBusiness();
      const productResult = await getMyProducts();

      setBusiness(businessResult.business);
      setProducts(productResult.products);
    } catch (caught) {
      if (
        caught instanceof BusinessesApiError &&
        caught.status === 404
      ) {
        setBusiness(null);
        setProducts([]);
        setHasNoStore(true);
        return;
      }

      setError(
        caught instanceof Error
          ? caught.message
          : 'Unable to load your store.'
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      void load();
    }, [load])
  );

  const availableCount = products.filter(item => item.isAvailable).length;
  const stockCount = products.reduce(
    (total, item) => total + item.stockQuantity,
    0
  );

  const confirmDeleteStore = () => {
    Alert.alert(
      'Delete store?',
      'This permanently deletes your store, its products and uploaded pictures. This action cannot be undone.',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Delete store',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteMyBusiness();

              Alert.alert(
                'Store deleted',
                'Your store has been permanently deleted.',
                [
                  {
                    text: 'Done',
                    onPress: () => navigation.goBack(),
                  },
                ]
              );
            } catch (caught) {
              Alert.alert(
                'Could not delete store',
                caught instanceof Error
                  ? caught.message
                  : 'Please try again.'
              );
            }
          },
        },
      ]
    );
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.center}>
        <ActivityIndicator size="large" color={light.primary} />
        <Text style={styles.loadingText}>Loading your store...</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <Pressable onPress={() => navigation.goBack()} hitSlop={12}>
          <Ionicons name="chevron-back" size={25} color={light.charcoal} />
        </Pressable>
        <Text style={styles.headerTitle}>Seller Dashboard</Text>
        <Pressable onPress={() => void load()} hitSlop={12}>
          <Ionicons name="refresh" size={22} color={light.primary} />
        </Pressable>
      </View>

      {error || !business ? (
        <View style={styles.center}>
          <Ionicons name="storefront-outline" size={48} color={light.textSecondary} />
          <Text style={styles.errorTitle}>
            {hasNoStore ? 'Start selling on CCB' : 'Store unavailable'}
          </Text>
          <Text style={styles.errorText}>
            {hasNoStore
              ? 'Create your store, upload a banner and add your first product.'
              : error || 'Unable to load your store.'}
          </Text>
          <Pressable
            style={styles.primaryButton}
            onPress={() =>
              hasNoStore
                ? navigation.navigate('CreateStore')
                : void load()
            }
          >
            <Text style={styles.primaryButtonText}>
              {hasNoStore ? 'Create my store' : 'Try again'}
            </Text>
          </Pressable>
        </View>
      ) : (
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.content}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => void load(true)}
              tintColor={light.primary}
            />
          }
        >
          <View
            style={[
              styles.banner,
              { backgroundColor: business.bannerColor || light.primary },
            ]}
          >
            {resolveMediaUrl(business.bannerImageUrl) ? (
              <Image
                source={{ uri: resolveMediaUrl(business.bannerImageUrl)! }}
                style={styles.bannerImage}
                resizeMode="cover"
              />
            ) : (
              <Ionicons name="storefront" size={54} color="rgba(255,255,255,0.75)" />
            )}
            <View style={styles.bannerShade} />
            <View style={styles.bannerText}>
              <Text style={styles.businessName}>{business.name}</Text>
              <Text style={styles.businessCategory}>{business.category}</Text>
            </View>
          </View>

          <View style={styles.statsRow}>
            <Stat label="Products" value={products.length} />
            <Stat label="Available" value={availableCount} />
            <Stat label="Stock units" value={stockCount} />
          </View>

          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Your products</Text>
            <Pressable
              style={styles.addButton}
              onPress={() => navigation.navigate('AddProduct')}
            >
              <Ionicons name="add" size={18} color={light.offWhite} />
              <Text style={styles.addButtonText}>Add product</Text>
            </Pressable>
          </View>

          {products.length === 0 ? (
            <View style={styles.emptyCard}>
              <Ionicons name="cube-outline" size={38} color={light.textSecondary} />
              <Text style={styles.emptyTitle}>No products yet</Text>
              <Text style={styles.emptyText}>Add your first product to start selling.</Text>
            </View>
          ) : (
            products.map(product => {
              const imageUrl = resolveMediaUrl(product.imageUrl);

              return (
                <Pressable
                  key={product.productId}
                  style={styles.productCard}
                  onPress={() =>
                    navigation.navigate('EditProduct', {
                      productId: product.productId,
                    })
                  }
                >
                  <View style={styles.productImageWrap}>
                    {imageUrl ? (
                      <Image
                        source={{ uri: imageUrl }}
                        style={styles.productImage}
                        resizeMode="cover"
                      />
                    ) : (
                      <Ionicons name="image-outline" size={30} color={light.textSecondary} />
                    )}
                  </View>

                  <View style={styles.productInfo}>
                    <Text style={styles.productName} numberOfLines={1}>
                      {product.name}
                    </Text>
                    <Text style={styles.productPrice}>R{product.price.toFixed(2)}</Text>
                    <Text style={styles.stockText}>{product.stockQuantity} in stock</Text>
                  </View>

                  <View
                    style={[
                      styles.statusPill,
                      !product.isAvailable && styles.hiddenPill,
                    ]}
                  >
                    <Text
                      style={[
                        styles.statusText,
                        !product.isAvailable && styles.hiddenText,
                      ]}
                    >
                      {product.isAvailable ? 'Live' : 'Hidden'}
                    </Text>
                  </View>
                </Pressable>
              );
            })
          )}

          <View style={styles.dangerSection}>
            <Text style={styles.dangerTitle}>Danger zone</Text>
            <Text style={styles.dangerDescription}>
              Permanently remove this store, its products and uploaded pictures.
            </Text>
            <Pressable
              style={styles.deleteStoreButton}
              onPress={confirmDeleteStore}
            >
              <Ionicons name="trash-outline" size={18} color={light.danger} />
              <Text style={styles.deleteStoreText}>Delete store</Text>
            </Pressable>
          </View>
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <View style={styles.stat}>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: light.offWhite },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
    backgroundColor: light.offWhite,
  },
  loadingText: {
    marginTop: 12,
    fontFamily: fontFamily.secondary,
    color: light.textSecondary,
  },
  header: {
    height: 58,
    paddingHorizontal: 18,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderBottomWidth: 1,
    borderBottomColor: light.border,
  },
  headerTitle: {
    fontFamily: fontFamily.bold,
    fontSize: fontSize.lg,
    color: light.charcoal,
  },
  content: { padding: 18, paddingBottom: 40 },
  banner: {
    height: 190,
    borderRadius: 20,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
  },
  bannerImage: {
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    width: '100%',
    height: '100%',
  },
  bannerShade: {
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    backgroundColor: 'rgba(0,0,0,0.28)',
  },
  bannerText: { position: 'absolute', left: 18, right: 18, bottom: 16 },
  businessName: {
    fontFamily: fontFamily.bold,
    fontSize: fontSize.xl,
    color: '#FFFFFF',
  },
  businessCategory: {
    marginTop: 3,
    fontFamily: fontFamily.secondary,
    fontSize: fontSize.sm,
    color: 'rgba(255,255,255,0.9)',
  },
  statsRow: {
    flexDirection: 'row',
    marginTop: 14,
    paddingVertical: 16,
    backgroundColor: light.card,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: light.border,
  },
  stat: { flex: 1, alignItems: 'center' },
  statValue: { fontFamily: fontFamily.bold, fontSize: fontSize.lg, color: light.charcoal },
  statLabel: { marginTop: 3, fontFamily: fontFamily.secondary, fontSize: fontSize.xs, color: light.textSecondary },
  sectionHeader: {
    marginTop: 24,
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  sectionTitle: { fontFamily: fontFamily.bold, fontSize: fontSize.md, color: light.charcoal },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    borderRadius: 11,
    paddingHorizontal: 12,
    paddingVertical: 9,
    backgroundColor: light.primary,
  },
  addButtonText: { fontFamily: fontFamily.semibold, fontSize: fontSize.xs, color: light.offWhite },
  productCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 11,
    marginBottom: 10,
    borderRadius: 15,
    borderWidth: 1,
    borderColor: light.border,
    backgroundColor: light.card,
  },
  productImageWrap: {
    width: 70,
    height: 70,
    borderRadius: 12,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#EAF3EF',
  },
  productImage: { width: '100%', height: '100%' },
  productInfo: { flex: 1, marginHorizontal: 12 },
  productName: { fontFamily: fontFamily.semibold, fontSize: fontSize.sm, color: light.charcoal },
  productPrice: { marginTop: 4, fontFamily: fontFamily.bold, fontSize: fontSize.sm, color: light.primary },
  stockText: { marginTop: 2, fontFamily: fontFamily.secondary, fontSize: fontSize.xs, color: light.textSecondary },
  statusPill: { paddingHorizontal: 9, paddingVertical: 5, borderRadius: 999, backgroundColor: '#EAF3EF' },
  hiddenPill: { backgroundColor: '#FDEAEA' },
  statusText: { fontFamily: fontFamily.semibold, fontSize: 11, color: light.primary },
  hiddenText: { color: light.danger },
  emptyCard: {
    alignItems: 'center',
    padding: 30,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: light.border,
    backgroundColor: light.card,
  },
  emptyTitle: { marginTop: 10, fontFamily: fontFamily.bold, fontSize: fontSize.md, color: light.charcoal },
  emptyText: { marginTop: 5, textAlign: 'center', fontFamily: fontFamily.secondary, fontSize: fontSize.sm, color: light.textSecondary },
  errorTitle: { marginTop: 12, fontFamily: fontFamily.bold, fontSize: fontSize.lg, color: light.charcoal },
  errorText: { marginTop: 6, textAlign: 'center', fontFamily: fontFamily.secondary, fontSize: fontSize.sm, color: light.textSecondary },
  primaryButton: { marginTop: 18, paddingHorizontal: 22, paddingVertical: 12, borderRadius: 12, backgroundColor: light.primary },
  primaryButtonText: { fontFamily: fontFamily.semibold, color: light.offWhite },
  dangerSection: {
    marginTop: 26,
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#F4B8B8',
    backgroundColor: '#FFF7F7',
  },
  dangerTitle: {
    fontFamily: fontFamily.bold,
    fontSize: fontSize.sm,
    color: light.danger,
  },
  dangerDescription: {
    marginTop: 5,
    fontFamily: fontFamily.secondary,
    fontSize: fontSize.xs,
    lineHeight: 18,
    color: light.textSecondary,
  },
  deleteStoreButton: {
    marginTop: 14,
    minHeight: 46,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 7,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#F4B8B8',
    backgroundColor: '#FDEAEA',
  },
  deleteStoreText: {
    fontFamily: fontFamily.semibold,
    fontSize: fontSize.sm,
    color: light.danger,
  },
});
