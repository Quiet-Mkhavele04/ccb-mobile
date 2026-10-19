import React, { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  Image,
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
  getProduct,
  Product,
  ProductsApiError,
} from '../../api/productsApi';
import { resolveMediaUrl } from '../../api/mediaUrl';
import { useCart } from '../../context/CartContext';
import type { RootStackParamList } from '../../navigation/RootNavigator';
import { light } from '../../theme/colors';
import { fontFamily, fontSize } from '../../theme/fonts';

type DetailsRoute = RouteProp<RootStackParamList, 'ProductDetails'>;
type DetailsNavigation = NativeStackNavigationProp<RootStackParamList, 'ProductDetails'>;

export default function ProductDetailsScreen() {
  const navigation = useNavigation<DetailsNavigation>();
  const route = useRoute<DetailsRoute>();
  const { productId } = route.params;
  const { addItem, itemCount, getQuantity } = useCart();
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadProduct = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const result = await getProduct(productId);
      setProduct(result.product);
    } catch (loadError) {
      setError(
        loadError instanceof ProductsApiError
          ? loadError.message
          : 'Unable to load this product.'
      );
    } finally {
      setLoading(false);
    }
  }, [productId]);

  useFocusEffect(
    useCallback(() => {
      loadProduct();
    }, [loadProduct])
  );

  if (loading) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <Header navigation={navigation} itemCount={itemCount} />
        <View style={styles.centerBox}>
          <ActivityIndicator size="large" color={light.primary} />
          <Text style={styles.messageText}>Loading product...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!product || error) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <Header navigation={navigation} itemCount={itemCount} />
        <View style={styles.centerBox}>
          <Ionicons name="alert-circle-outline" size={48} color={light.textSecondary} />
          <Text style={styles.errorTitle}>Product unavailable</Text>
          <Text style={styles.messageText}>{error ?? 'Product not found.'}</Text>
          <Pressable style={styles.retryButton} onPress={loadProduct}>
            <Text style={styles.retryText}>Try again</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  const quantity = getQuantity(product.productId);
  const soldOut = product.stockQuantity <= 0;
  const reachedLimit = quantity >= product.stockQuantity;
  const productImageUrl = resolveMediaUrl(product.imageUrl);

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <Header navigation={navigation} itemCount={itemCount} />

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
        <View
          style={[
            styles.productHero,
            { backgroundColor: product.businessBannerColor || light.primary },
          ]}
        >
          {productImageUrl ? (
            <Image
              source={{ uri: productImageUrl }}
              style={styles.heroImage}
              resizeMode="cover"
            />
          ) : (
            <Ionicons
              name={getProductIcon(product.category)}
              size={86}
              color="rgba(255,255,255,0.88)"
            />
          )}

          {product.isFeatured && (
            <View style={styles.featuredBadge}>
              <Ionicons name="sparkles" size={13} color={light.primary} />
              <Text style={styles.featuredText}>Featured</Text>
            </View>
          )}
        </View>

        <View style={styles.details}>
          <View style={styles.categoryRow}>
            <Text style={styles.category}>{product.category}</Text>
            <View style={[styles.stockBadge, soldOut && styles.soldOutBadge]}>
              <Text style={[styles.stockBadgeText, soldOut && styles.soldOutText]}>
                {soldOut ? 'Out of stock' : `${product.stockQuantity} in stock`}
              </Text>
            </View>
          </View>

          <Text style={styles.name}>{product.name}</Text>
          <Text style={styles.price}>{formatPrice(product.price)}</Text>

          <View style={styles.storeCard}>
            <View
              style={[
                styles.storeIcon,
                { backgroundColor: product.businessBannerColor || light.primary },
              ]}
            >
              <Ionicons name="storefront" size={21} color={light.offWhite} />
            </View>
            <View style={styles.storeText}>
              <Text style={styles.soldBy}>SOLD BY</Text>
              <Text style={styles.businessName}>{product.businessName}</Text>
              {product.businessAddress ? (
                <Text style={styles.businessAddress} numberOfLines={1}>
                  {product.businessAddress}
                </Text>
              ) : null}
            </View>
            <Ionicons name="shield-checkmark" size={22} color={light.primary} />
          </View>

          <Text style={styles.sectionTitle}>Product details</Text>
          <Text style={styles.description}>
            {product.description || 'No product description is available.'}
          </Text>

          <View style={styles.benefitRow}>
            <Benefit icon="location-outline" title="Shop local" subtitle="Support community businesses" />
            <Benefit icon="lock-closed-outline" title="Secure cart" subtitle="Your items stay saved" />
          </View>
        </View>
      </ScrollView>

      <View style={styles.bottomBar}>
        <View>
          <Text style={styles.bottomLabel}>Total price</Text>
          <Text style={styles.bottomPrice}>{formatPrice(product.price)}</Text>
        </View>

        <Pressable
          style={[styles.addButton, (soldOut || reachedLimit) && styles.disabledButton]}
          disabled={soldOut || reachedLimit}
          onPress={() => addItem(product)}
        >
          <Ionicons
            name={reachedLimit ? 'checkmark' : 'bag-add-outline'}
            size={20}
            color={light.offWhite}
          />
          <Text style={styles.addButtonText}>
            {soldOut
              ? 'Out of stock'
              : reachedLimit
                ? 'Maximum added'
                : quantity > 0
                  ? `Add another (${quantity})`
                  : 'Add to cart'}
          </Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

function Header({
  navigation,
  itemCount,
}: {
  navigation: DetailsNavigation;
  itemCount: number;
}) {
  return (
    <View style={styles.header}>
      <Pressable style={styles.headerButton} onPress={() => navigation.goBack()}>
        <Ionicons name="chevron-back" size={24} color={light.charcoal} />
      </Pressable>
      <Text style={styles.headerTitle}>Product Details</Text>
      <Pressable style={styles.headerButton} onPress={() => navigation.navigate('Cart')}>
        <Ionicons name="bag-outline" size={23} color={light.charcoal} />
        {itemCount > 0 && (
          <View style={styles.cartBadge}>
            <Text style={styles.cartBadgeText}>{itemCount > 99 ? '99+' : itemCount}</Text>
          </View>
        )}
      </Pressable>
    </View>
  );
}

function Benefit({
  icon,
  title,
  subtitle,
}: {
  icon: React.ComponentProps<typeof Ionicons>['name'];
  title: string;
  subtitle: string;
}) {
  return (
    <View style={styles.benefitCard}>
      <Ionicons name={icon} size={22} color={light.primary} />
      <Text style={styles.benefitTitle}>{title}</Text>
      <Text style={styles.benefitSubtitle}>{subtitle}</Text>
    </View>
  );
}

function formatPrice(price: number) {
  return `R${price.toFixed(2)}`;
}

function getProductIcon(category: string): React.ComponentProps<typeof Ionicons>['name'] {
  switch (category.toLowerCase()) {
    case 'food': return 'restaurant-outline';
    case 'groceries': return 'basket-outline';
    case 'fashion': return 'shirt-outline';
    case 'accessories': return 'bag-handle-outline';
    default: return 'cube-outline';
  }
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: light.offWhite },
  header: {
    height: 58,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    backgroundColor: light.card,
    borderBottomWidth: 1,
    borderBottomColor: light.border,
  },
  headerButton: { width: 42, height: 42, alignItems: 'center', justifyContent: 'center' },
  headerTitle: {
    flex: 1,
    textAlign: 'center',
    fontFamily: fontFamily.semibold,
    fontSize: fontSize.md,
    color: light.charcoal,
  },
  cartBadge: {
    position: 'absolute', top: 1, right: 0, minWidth: 18, height: 18,
    paddingHorizontal: 4, borderRadius: 9, backgroundColor: light.gold,
    alignItems: 'center', justifyContent: 'center',
  },
  cartBadgeText: { fontFamily: fontFamily.semibold, fontSize: 9, color: light.charcoal },
  content: { paddingBottom: 25 },
  productHero: { height: 285, alignItems: 'center', justifyContent: 'center' },
  heroImage: {
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    width: '100%',
    height: '100%',
  },
  featuredBadge: {
    position: 'absolute', top: 18, left: 18, flexDirection: 'row', alignItems: 'center',
    gap: 5, backgroundColor: 'rgba(255,255,255,0.94)', borderRadius: 999,
    paddingHorizontal: 11, paddingVertical: 7,
  },
  featuredText: { fontFamily: fontFamily.semibold, fontSize: fontSize.xs, color: light.primary },
  details: { padding: 20 },
  categoryRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  category: { fontFamily: fontFamily.semibold, fontSize: fontSize.xs, color: light.primary, textTransform: 'uppercase', letterSpacing: 0.8 },
  stockBadge: { backgroundColor: '#EAF3EF', borderRadius: 999, paddingHorizontal: 10, paddingVertical: 5 },
  soldOutBadge: { backgroundColor: '#FDECEC' },
  stockBadgeText: { fontFamily: fontFamily.medium, fontSize: fontSize.xs, color: light.primary },
  soldOutText: { color: light.danger },
  name: { fontFamily: fontFamily.bold, fontSize: 26, color: light.charcoal, marginTop: 14, lineHeight: 32 },
  price: { fontFamily: fontFamily.bold, fontSize: 24, color: light.primary, marginTop: 8 },
  storeCard: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: light.card,
    borderWidth: 1, borderColor: light.border, borderRadius: 15, padding: 12, marginTop: 20,
  },
  storeIcon: { width: 46, height: 46, borderRadius: 13, alignItems: 'center', justifyContent: 'center' },
  storeText: { flex: 1, marginHorizontal: 11 },
  soldBy: { fontFamily: fontFamily.semibold, fontSize: 9, letterSpacing: 0.8, color: light.textSecondary },
  businessName: { fontFamily: fontFamily.semibold, fontSize: fontSize.sm, color: light.charcoal, marginTop: 2 },
  businessAddress: { fontFamily: fontFamily.secondary, fontSize: fontSize.xs, color: light.textSecondary, marginTop: 2 },
  sectionTitle: { fontFamily: fontFamily.semibold, fontSize: fontSize.md, color: light.charcoal, marginTop: 25 },
  description: { fontFamily: fontFamily.secondary, fontSize: fontSize.sm, lineHeight: 22, color: light.textSecondary, marginTop: 8 },
  benefitRow: { flexDirection: 'row', gap: 10, marginTop: 22 },
  benefitCard: { flex: 1, backgroundColor: light.card, borderWidth: 1, borderColor: light.border, borderRadius: 14, padding: 13 },
  benefitTitle: { fontFamily: fontFamily.semibold, fontSize: fontSize.xs, color: light.charcoal, marginTop: 8 },
  benefitSubtitle: { fontFamily: fontFamily.secondary, fontSize: 10, lineHeight: 15, color: light.textSecondary, marginTop: 3 },
  bottomBar: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 18,
    backgroundColor: light.card, borderTopWidth: 1, borderTopColor: light.border,
    paddingHorizontal: 20, paddingTop: 13, paddingBottom: 10,
  },
  bottomLabel: { fontFamily: fontFamily.secondary, fontSize: fontSize.xs, color: light.textSecondary },
  bottomPrice: { fontFamily: fontFamily.bold, fontSize: fontSize.lg, color: light.charcoal, marginTop: 2 },
  addButton: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    backgroundColor: light.primary, borderRadius: 14, paddingVertical: 15,
  },
  disabledButton: { opacity: 0.48 },
  addButtonText: { fontFamily: fontFamily.semibold, fontSize: fontSize.sm, color: light.offWhite },
  centerBox: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 30 },
  messageText: { fontFamily: fontFamily.secondary, fontSize: fontSize.sm, color: light.textSecondary, textAlign: 'center', marginTop: 10 },
  errorTitle: { fontFamily: fontFamily.semibold, fontSize: fontSize.md, color: light.charcoal, marginTop: 12 },
  retryButton: { backgroundColor: light.primary, borderRadius: 12, paddingHorizontal: 20, paddingVertical: 11, marginTop: 18 },
  retryText: { fontFamily: fontFamily.semibold, fontSize: fontSize.sm, color: light.offWhite },
});
