import React, {
  useCallback,
  useMemo,
  useState,
} from 'react';

import {
  ActivityIndicator,
  FlatList,
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

import {
  SafeAreaView,
} from 'react-native-safe-area-context';

import {
  Ionicons,
} from '@expo/vector-icons';

import {
  useFocusEffect,
  useNavigation,
} from '@react-navigation/native';

import {
  getProducts,
  Product,
  ProductsApiError,
} from '../../api/productsApi';

import {
  resolveMediaUrl,
} from '../../api/mediaUrl';

import {
  light,
} from '../../theme/colors';

import {
  fontFamily,
  fontSize,
} from '../../theme/fonts';

import type {
  NativeStackNavigationProp,
} from '@react-navigation/native-stack';

import {
  useCart,
} from '../../context/CartContext';

import type {
  RootStackParamList,
} from '../../navigation/RootNavigator';

const CATEGORIES = [
  'All',
  'Food',
  'Groceries',
  'Fashion',
  'Accessories',
];

type DiscoverNavigation =
  NativeStackNavigationProp<
    RootStackParamList,
    'MainTabs'
  >;

export default function DiscoverScreen() {
  const navigation =
    useNavigation<DiscoverNavigation>();

  const {
    itemCount: cartCount,
    addItem,
  } = useCart();

  const [
    products,
    setProducts,
  ] = useState<Product[]>([]);

  const [
    activeCategory,
    setActiveCategory,
  ] = useState('All');

  const [
    search,
    setSearch,
  ] = useState('');

  const [
    loading,
    setLoading,
  ] = useState(true);

  const [
    refreshing,
    setRefreshing,
  ] = useState(false);

  const [
    error,
    setError,
  ] = useState<string | null>(
    null
  );

  const loadProducts =
    useCallback(async (
      isRefresh = false
    ) => {
      try {
        if (isRefresh) {
          setRefreshing(true);
        } else {
          setLoading(true);
        }

        setError(null);

        const result =
          await getProducts();

        setProducts(
          result.products
        );
      } catch (loadError) {
        if (
          loadError instanceof
          ProductsApiError
        ) {
          setError(
            loadError.message
          );
        } else {
          setError(
            'Unable to load the marketplace.'
          );
        }
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    }, []);

  useFocusEffect(
    useCallback(() => {
      loadProducts();
    }, [loadProducts])
  );

  const featuredProducts =
    useMemo(
      () =>
        products.filter(
          product =>
            product.isFeatured
        ),
      [products]
    );

  const filteredProducts =
    useMemo(() => {
      const searchText =
        search
          .trim()
          .toLowerCase();

      return products.filter(
        product => {
          const matchesCategory =
            activeCategory ===
              'All' ||
            product.category ===
              activeCategory;

          const matchesSearch =
            searchText.length ===
              0 ||
            product.name
              .toLowerCase()
              .includes(
                searchText
              ) ||
            (
              product.description ??
              ''
            )
              .toLowerCase()
              .includes(
                searchText
              ) ||
            (
              product.businessName ??
              ''
            )
              .toLowerCase()
              .includes(
                searchText
              );

          return (
            matchesCategory &&
            matchesSearch
          );
        }
      );
    }, [
      products,
      activeCategory,
      search,
    ]);

  function addToCart(
    product: Product
  ) {
    addItem(product);
  }

  if (loading) {
    return (
      <SafeAreaView
        style={styles.container}
        edges={['top']}
      >
        <View
          style={styles.centerBox}
        >
          <ActivityIndicator
            size="large"
            color={light.primary}
          />

          <Text
            style={styles.loadingText}
          >
            Loading marketplace...
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  if (
    error &&
    products.length === 0
  ) {
    return (
      <SafeAreaView
        style={styles.container}
        edges={['top']}
      >
        <View
          style={styles.centerBox}
        >
          <Ionicons
            name="cloud-offline-outline"
            size={48}
            color={
              light.textSecondary
            }
          />

          <Text
            style={styles.errorTitle}
          >
            Marketplace unavailable
          </Text>

          <Text
            style={styles.errorText}
          >
            {error}
          </Text>

          <Pressable
            style={styles.retryButton}
            onPress={() =>
              loadProducts()
            }
          >
            <Text
              style={
                styles.retryButtonText
              }
            >
              Try again
            </Text>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView
      style={styles.container}
      edges={['top']}
    >
      <View style={styles.header}>
        <View>
          <Text
            style={styles.eyebrow}
          >
            SUPPORT LOCAL
          </Text>

          <Text style={styles.title}>
            CCB Marketplace
          </Text>
        </View>

        <Pressable
          style={styles.cartButton}
          onPress={() =>
            navigation.navigate(
              'Cart'
            )
          }
        >
          <Ionicons
            name="bag-outline"
            size={23}
            color={light.charcoal}
          />

          {cartCount > 0 && (
            <View
              style={styles.cartBadge}
            >
              <Text
                style={
                  styles.cartBadgeText
                }
              >
                {cartCount > 99
                  ? '99+'
                  : cartCount}
              </Text>
            </View>
          )}
        </Pressable>
      </View>

      <View
        style={styles.searchBar}
      >
        <Ionicons
          name="search"
          size={19}
          color={
            light.textSecondary
          }
        />

        <TextInput
          value={search}
          onChangeText={setSearch}
          placeholder="Search products or stores"
          placeholderTextColor={
            light.textSecondary
          }
          style={styles.searchInput}
          returnKeyType="search"
        />

        {search.length > 0 && (
          <Pressable
            onPress={() =>
              setSearch('')
            }
            hitSlop={10}
          >
            <Ionicons
              name="close-circle"
              size={19}
              color={
                light.textSecondary
              }
            />
          </Pressable>
        )}
      </View>

      <FlatList
        data={filteredProducts}
        keyExtractor={item =>
          String(item.productId)
        }
        numColumns={2}
        columnWrapperStyle={
          styles.productRow
        }
        contentContainerStyle={
          styles.list
        }
        showsVerticalScrollIndicator={
          false
        }
        refreshing={refreshing}
        onRefresh={() =>
          loadProducts(true)
        }
        ListHeaderComponent={
          <View>
            {!search.trim() &&
              featuredProducts.length >
                0 && (
                <>
                  <View
                    style={
                      styles.sectionHeader
                    }
                  >
                    <Text
                      style={
                        styles.sectionTitle
                      }
                    >
                      Featured today
                    </Text>

                    <View
                      style={
                        styles.featuredPill
                      }
                    >
                      <Ionicons
                        name="sparkles"
                        size={12}
                        color={
                          light.primary
                        }
                      />

                      <Text
                        style={
                          styles
                            .featuredPillText
                        }
                      >
                        Local favourites
                      </Text>
                    </View>
                  </View>

                  <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={
                      false
                    }
                    contentContainerStyle={
                      styles.featuredRow
                    }
                  >
                    {featuredProducts.map(
                      product => (
                        <View
                          key={
                            product.productId
                          }
                          style={
                            styles.featuredCard
                          }
                        >
                          <Pressable
                            onPress={() =>
                              navigation.navigate(
                                'ProductDetails',
                                {
                                  productId:
                                    product.productId,
                                }
                              )
                            }
                            style={[
                              styles
                                .featuredImage,
                              {
                                backgroundColor:
                                  product
                                    .businessBannerColor ||
                                  light.primary,
                              },
                            ]}
                          >
                            {resolveMediaUrl(
                              product.imageUrl
                            ) ? (
                              <Image
                                source={{
                                  uri: resolveMediaUrl(
                                    product.imageUrl
                                  )!,
                                }}
                                style={
                                  styles.marketImage
                                }
                                resizeMode="cover"
                              />
                            ) : (
                              <Ionicons
                                name={
                                  getProductIcon(
                                    product.category
                                  )
                                }
                                size={38}
                                color="rgba(255,255,255,0.85)"
                              />
                            )}

                            <View
                              style={
                                styles
                                  .featuredBadge
                              }
                            >
                              <Text
                                style={
                                  styles
                                    .featuredBadgeText
                                }
                              >
                                FEATURED
                              </Text>
                            </View>
                          </Pressable>

                          <View
                            style={
                              styles
                                .featuredBody
                            }
                          >
                            <Text
                              style={
                                styles
                                  .featuredName
                              }
                              numberOfLines={
                                1
                              }
                            >
                              {product.name}
                            </Text>

                            <Text
                              style={
                                styles.storeName
                              }
                              numberOfLines={
                                1
                              }
                            >
                              {
                                product.businessName
                              }
                            </Text>

                            <View
                              style={
                                styles
                                  .featuredBottom
                              }
                            >
                              <Text
                                style={
                                  styles
                                    .featuredPrice
                                }
                              >
                                {formatPrice(
                                  product.price
                                )}
                              </Text>

                              <Pressable
                                style={
                                  styles
                                    .smallAddButton
                                }
                                onPress={() =>
                                  addToCart(
                                    product
                                  )
                                }
                              >
                                <Ionicons
                                  name="add"
                                  size={18}
                                  color={
                                    light.offWhite
                                  }
                                />
                              </Pressable>
                            </View>
                          </View>
                        </View>
                      )
                    )}
                  </ScrollView>
                </>
              )}

            <Text
              style={styles.sectionTitle}
            >
              Shop by category
            </Text>

            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={
                false
              }
              contentContainerStyle={
                styles.categoryRow
              }
            >
              {CATEGORIES.map(
                category => {
                  const active =
                    category ===
                    activeCategory;

                  return (
                    <Pressable
                      key={category}
                      style={[
                        styles.categoryChip,
                        active &&
                          styles
                            .categoryChipActive,
                      ]}
                      onPress={() =>
                        setActiveCategory(
                          category
                        )
                      }
                    >
                      <Text
                        style={[
                          styles
                            .categoryChipText,
                          active &&
                            styles
                              .categoryChipTextActive,
                        ]}
                      >
                        {category}
                      </Text>
                    </Pressable>
                  );
                }
              )}
            </ScrollView>

            <View
              style={
                styles.productsHeading
              }
            >
              <Text
                style={styles.sectionTitle}
              >
                {activeCategory ===
                'All'
                  ? 'All products'
                  : activeCategory}
              </Text>

              <Text
                style={
                  styles.resultCount
                }
              >
                {
                  filteredProducts.length
                }{' '}
                {filteredProducts.length ===
                1
                  ? 'item'
                  : 'items'}
              </Text>
            </View>
          </View>
        }
        renderItem={({ item }) => (
          <View
            style={styles.productCard}
          >
            <Pressable
              onPress={() =>
                navigation.navigate(
                  'ProductDetails',
                  {
                    productId:
                      item.productId,
                  }
                )
              }
              style={[
                styles.productImage,
                {
                  backgroundColor:
                    item.businessBannerColor ||
                    light.primary,
                },
              ]}
            >
              {resolveMediaUrl(
                item.imageUrl
              ) ? (
                <Image
                  source={{
                    uri: resolveMediaUrl(
                      item.imageUrl
                    )!,
                  }}
                  style={
                    styles.marketImage
                  }
                  resizeMode="cover"
                />
              ) : (
                <Ionicons
                  name={getProductIcon(
                    item.category
                  )}
                  size={40}
                  color="rgba(255,255,255,0.85)"
                />
              )}

              {item.stockQuantity <=
                5 && (
                <View
                  style={
                    styles.lowStockBadge
                  }
                >
                  <Text
                    style={
                      styles.lowStockText
                    }
                  >
                    Low stock
                  </Text>
                </View>
              )}
            </Pressable>

            <View
              style={styles.productBody}
            >
              <Text
                style={styles.productName}
                numberOfLines={2}
              >
                {item.name}
              </Text>

              <Text
                style={styles.storeName}
                numberOfLines={1}
              >
                {item.businessName}
              </Text>

              <Text
                style={
                  styles.stockText
                }
              >
                {item.stockQuantity >
                0
                  ? `${item.stockQuantity} available`
                  : 'Out of stock'}
              </Text>

              <View
                style={
                  styles.productBottom
                }
              >
                <Text
                  style={
                    styles.productPrice
                  }
                >
                  {formatPrice(
                    item.price
                  )}
                </Text>

                <Pressable
                  style={[
                    styles.addButton,
                    item.stockQuantity <=
                      0 &&
                      styles
                        .addButtonDisabled,
                  ]}
                  onPress={() =>
                    addToCart(item)
                  }
                  disabled={
                    item.stockQuantity <=
                    0
                  }
                >
                  <Ionicons
                    name="add"
                    size={19}
                    color={light.offWhite}
                  />
                </Pressable>
              </View>
            </View>
          </View>
        )}
        ListEmptyComponent={
          <View
            style={styles.emptyBox}
          >
            <Ionicons
              name="basket-outline"
              size={46}
              color={
                light.textSecondary
              }
            />

            <Text
              style={styles.emptyTitle}
            >
              No products found
            </Text>

            <Text
              style={styles.emptyText}
            >
              Try another search or
              category.
            </Text>
          </View>
        }
      />
    </SafeAreaView>
  );
}

function formatPrice(
  price: number
) {
  return `R${price.toFixed(2)}`;
}

function getProductIcon(
  category: string
): React.ComponentProps<
  typeof Ionicons
>['name'] {
  switch (
    category.toLowerCase()
  ) {
    case 'food':
      return 'restaurant-outline';

    case 'groceries':
      return 'basket-outline';

    case 'fashion':
      return 'shirt-outline';

    case 'accessories':
      return 'bag-handle-outline';

    default:
      return 'cube-outline';
  }
}

const styles =
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor:
        light.offWhite,
    },

    header: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent:
        'space-between',
      paddingHorizontal: 20,
      paddingTop: 8,
    },

    eyebrow: {
      fontFamily:
        fontFamily.semibold,
      fontSize: 10,
      letterSpacing: 1.4,
      color: light.primary,
    },

    title: {
      fontFamily:
        fontFamily.bold,
      fontSize: fontSize.xl,
      color: light.charcoal,
      marginTop: 2,
    },

    cartButton: {
      width: 44,
      height: 44,
      borderRadius: 22,
      backgroundColor: light.card,
      borderWidth: 1,
      borderColor: light.border,
      alignItems: 'center',
      justifyContent: 'center',
    },

    cartBadge: {
      position: 'absolute',
      top: -3,
      right: -3,
      minWidth: 20,
      height: 20,
      borderRadius: 10,
      paddingHorizontal: 4,
      backgroundColor: light.gold,
      alignItems: 'center',
      justifyContent: 'center',
    },

    cartBadgeText: {
      fontFamily:
        fontFamily.semibold,
      fontSize: 10,
      color: light.charcoal,
    },

    searchBar: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: light.card,
      marginHorizontal: 20,
      marginTop: 16,
      paddingHorizontal: 14,
      paddingVertical: 11,
      borderRadius: 14,
      borderWidth: 1,
      borderColor: light.border,
      gap: 8,
    },

    searchInput: {
      flex: 1,
      fontFamily:
        fontFamily.regular,
      fontSize: fontSize.sm,
      color: light.charcoal,
      paddingVertical: 0,
    },

    list: {
      paddingHorizontal: 20,
      paddingBottom: 100,
    },

    sectionHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent:
        'space-between',
      marginTop: 22,
      marginBottom: 10,
    },

    sectionTitle: {
      fontFamily:
        fontFamily.semibold,
      fontSize: fontSize.md,
      color: light.charcoal,
      marginTop: 22,
      marginBottom: 10,
    },

    featuredPill: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
      backgroundColor: '#EAF3EF',
      paddingHorizontal: 9,
      paddingVertical: 5,
      borderRadius: 999,
    },

    featuredPillText: {
      fontFamily:
        fontFamily.medium,
      fontSize: 10,
      color: light.primary,
    },

    featuredRow: {
      gap: 12,
      paddingRight: 4,
    },

    featuredCard: {
      width: 210,
      backgroundColor: light.card,
      borderRadius: 16,
      borderWidth: 1,
      borderColor: light.border,
      overflow: 'hidden',
    },

    featuredImage: {
      height: 105,
      alignItems: 'center',
      justifyContent: 'center',
    },

    featuredBadge: {
      position: 'absolute',
      top: 10,
      left: 10,
      backgroundColor:
        'rgba(255,255,255,0.92)',
      borderRadius: 999,
      paddingHorizontal: 8,
      paddingVertical: 4,
    },

    featuredBadgeText: {
      fontFamily:
        fontFamily.semibold,
      fontSize: 9,
      color: light.primary,
      letterSpacing: 0.6,
    },

    featuredBody: {
      padding: 12,
    },

    featuredName: {
      fontFamily:
        fontFamily.semibold,
      fontSize: fontSize.sm,
      color: light.charcoal,
    },

    storeName: {
      fontFamily:
        fontFamily.secondary,
      fontSize: fontSize.xs,
      color:
        light.textSecondary,
      marginTop: 3,
    },

    featuredBottom: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent:
        'space-between',
      marginTop: 10,
    },

    featuredPrice: {
      fontFamily:
        fontFamily.bold,
      fontSize: fontSize.md,
      color: light.primary,
    },

    smallAddButton: {
      width: 32,
      height: 32,
      borderRadius: 16,
      backgroundColor: light.primary,
      alignItems: 'center',
      justifyContent: 'center',
    },

    categoryRow: {
      gap: 8,
      paddingRight: 4,
    },

    categoryChip: {
      paddingHorizontal: 15,
      paddingVertical: 9,
      borderRadius: 999,
      backgroundColor: light.card,
      borderWidth: 1,
      borderColor: light.border,
    },

    categoryChipActive: {
      backgroundColor:
        light.primary,
      borderColor: light.primary,
    },

    categoryChipText: {
      fontFamily:
        fontFamily.medium,
      fontSize: fontSize.sm,
      color:
        light.textSecondary,
    },

    categoryChipTextActive: {
      color: light.offWhite,
    },

    productsHeading: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent:
        'space-between',
    },

    resultCount: {
      fontFamily:
        fontFamily.secondary,
      fontSize: fontSize.xs,
      color:
        light.textSecondary,
      marginTop: 12,
    },

    productRow: {
      justifyContent:
        'space-between',
      gap: 12,
    },

    productCard: {
      width: '48%',
      backgroundColor: light.card,
      borderRadius: 16,
      borderWidth: 1,
      borderColor: light.border,
      overflow: 'hidden',
      marginBottom: 12,
    },

    productImage: {
      height: 112,
      alignItems: 'center',
      justifyContent: 'center',
    },

    marketImage: {
      position: 'absolute',
      top: 0,
      right: 0,
      bottom: 0,
      left: 0,
      width: '100%',
      height: '100%',
    },

    lowStockBadge: {
      position: 'absolute',
      top: 8,
      right: 8,
      backgroundColor: '#FFF1E8',
      borderRadius: 999,
      paddingHorizontal: 7,
      paddingVertical: 4,
    },

    lowStockText: {
      fontFamily:
        fontFamily.semibold,
      fontSize: 9,
      color: '#B45309',
    },

    productBody: {
      padding: 11,
    },

    productName: {
      minHeight: 38,
      fontFamily:
        fontFamily.semibold,
      fontSize: fontSize.sm,
      color: light.charcoal,
    },

    stockText: {
      fontFamily:
        fontFamily.secondary,
      fontSize: 10,
      color: light.primary,
      marginTop: 5,
    },

    productBottom: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent:
        'space-between',
      marginTop: 9,
    },

    productPrice: {
      flex: 1,
      fontFamily:
        fontFamily.bold,
      fontSize: fontSize.sm,
      color: light.primary,
    },

    addButton: {
      width: 32,
      height: 32,
      borderRadius: 10,
      backgroundColor: light.primary,
      alignItems: 'center',
      justifyContent: 'center',
    },

    addButtonDisabled: {
      opacity: 0.4,
    },

    centerBox: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
      paddingHorizontal: 30,
    },

    loadingText: {
      fontFamily:
        fontFamily.secondary,
      fontSize: fontSize.sm,
      color:
        light.textSecondary,
      marginTop: 12,
    },

    errorTitle: {
      fontFamily:
        fontFamily.semibold,
      fontSize: fontSize.md,
      color: light.charcoal,
      marginTop: 14,
    },

    errorText: {
      fontFamily:
        fontFamily.secondary,
      fontSize: fontSize.sm,
      color:
        light.textSecondary,
      textAlign: 'center',
      marginTop: 6,
    },

    retryButton: {
      backgroundColor:
        light.primary,
      borderRadius: 12,
      paddingHorizontal: 20,
      paddingVertical: 11,
      marginTop: 18,
    },

    retryButtonText: {
      fontFamily:
        fontFamily.semibold,
      fontSize: fontSize.sm,
      color: light.offWhite,
    },

    emptyBox: {
      alignItems: 'center',
      justifyContent: 'center',
      paddingTop: 42,
    },

    emptyTitle: {
      fontFamily:
        fontFamily.semibold,
      fontSize: fontSize.md,
      color: light.charcoal,
      marginTop: 12,
    },

    emptyText: {
      fontFamily:
        fontFamily.secondary,
      fontSize: fontSize.sm,
      color:
        light.textSecondary,
      marginTop: 4,
    },
  });
