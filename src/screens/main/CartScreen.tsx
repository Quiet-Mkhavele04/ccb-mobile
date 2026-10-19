import React from 'react';

import {
  Alert,
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import {
  SafeAreaView,
} from 'react-native-safe-area-context';

import {
  Ionicons,
} from '@expo/vector-icons';

import {
  useNavigation,
} from '@react-navigation/native';

import type {
  NativeStackNavigationProp,
} from '@react-navigation/native-stack';

import {
  useCart,
} from '../../context/CartContext';

import {
  light,
} from '../../theme/colors';

import {
  fontFamily,
  fontSize,
} from '../../theme/fonts';

import type {
  RootStackParamList,
} from '../../navigation/RootNavigator';

type CartNavigation =
  NativeStackNavigationProp<
    RootStackParamList,
    'Cart'
  >;

const DELIVERY_FEE = 35;
const FREE_DELIVERY_MINIMUM = 500;

export default function CartScreen() {
  const navigation =
    useNavigation<CartNavigation>();

  const {
    items,
    itemCount,
    subtotal,
    addItem,
    decreaseItem,
    removeItem,
    clearCart,
  } = useCart();

  const deliveryFee =
    subtotal >=
      FREE_DELIVERY_MINIMUM ||
    subtotal === 0
      ? 0
      : DELIVERY_FEE;

  const total =
    subtotal + deliveryFee;

  function confirmClearCart() {
    Alert.alert(
      'Clear cart?',
      'This will remove every item from your cart.',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Clear',
          style: 'destructive',
          onPress: clearCart,
        },
      ]
    );
  }

  return (
    <SafeAreaView
      style={styles.container}
      edges={['top', 'bottom']}
    >
      <View style={styles.header}>
        <Pressable
          style={styles.headerButton}
          onPress={() =>
            navigation.goBack()
          }
          hitSlop={10}
        >
          <Ionicons
            name="chevron-back"
            size={24}
            color={light.charcoal}
          />
        </Pressable>

        <View style={styles.headerTitleBox}>
          <Text style={styles.headerTitle}>
            Your Cart
          </Text>

          <Text style={styles.headerSubtitle}>
            {itemCount}{' '}
            {itemCount === 1
              ? 'item'
              : 'items'}
          </Text>
        </View>

        {items.length > 0 ? (
          <Pressable
            style={styles.headerButton}
            onPress={confirmClearCart}
            hitSlop={10}
          >
            <Ionicons
              name="trash-outline"
              size={21}
              color={light.danger}
            />
          </Pressable>
        ) : (
          <View
            style={styles.headerButton}
          />
        )}
      </View>

      <FlatList
        data={items}
        keyExtractor={item =>
          String(
            item.product.productId
          )
        }
        contentContainerStyle={[
          styles.list,
          items.length === 0 &&
            styles.emptyList,
        ]}
        showsVerticalScrollIndicator={
          false
        }
        renderItem={({ item }) => {
          const product =
            item.product;

          return (
            <View
              style={styles.cartItem}
            >
              <View
                style={[
                  styles.productImage,
                  {
                    backgroundColor:
                      product
                        .businessBannerColor ||
                      light.primary,
                  },
                ]}
              >
                <Ionicons
                  name={getProductIcon(
                    product.category
                  )}
                  size={32}
                  color="rgba(255,255,255,0.88)"
                />
              </View>

              <View
                style={styles.itemDetails}
              >
                <View
                  style={styles.itemTopRow}
                >
                  <View
                    style={
                      styles.itemNameBox
                    }
                  >
                    <Text
                      style={
                        styles.productName
                      }
                      numberOfLines={2}
                    >
                      {product.name}
                    </Text>

                    <Text
                      style={
                        styles.businessName
                      }
                      numberOfLines={1}
                    >
                      {
                        product.businessName
                      }
                    </Text>
                  </View>

                  <Pressable
                    onPress={() =>
                      removeItem(
                        product.productId
                      )
                    }
                    hitSlop={10}
                  >
                    <Ionicons
                      name="close"
                      size={20}
                      color={
                        light.textSecondary
                      }
                    />
                  </Pressable>
                </View>

                <View
                  style={
                    styles.itemBottomRow
                  }
                >
                  <Text
                    style={
                      styles.productPrice
                    }
                  >
                    {formatPrice(
                      product.price *
                        item.quantity
                    )}
                  </Text>

                  <View
                    style={
                      styles.quantityControl
                    }
                  >
                    <Pressable
                      style={
                        styles.quantityButton
                      }
                      onPress={() =>
                        decreaseItem(
                          product.productId
                        )
                      }
                    >
                      <Ionicons
                        name="remove"
                        size={17}
                        color={
                          light.primary
                        }
                      />
                    </Pressable>

                    <Text
                      style={
                        styles.quantityText
                      }
                    >
                      {item.quantity}
                    </Text>

                    <Pressable
                      style={[
                        styles.quantityButton,
                        item.quantity >=
                          product.stockQuantity &&
                          styles
                            .quantityButtonDisabled,
                      ]}
                      onPress={() =>
                        addItem(product)
                      }
                      disabled={
                        item.quantity >=
                        product.stockQuantity
                      }
                    >
                      <Ionicons
                        name="add"
                        size={17}
                        color={
                          light.primary
                        }
                      />
                    </Pressable>
                  </View>
                </View>
              </View>
            </View>
          );
        }}
        ListEmptyComponent={
          <View
            style={styles.emptyBox}
          >
            <View
              style={styles.emptyIcon}
            >
              <Ionicons
                name="bag-outline"
                size={48}
                color={light.primary}
              />
            </View>

            <Text
              style={styles.emptyTitle}
            >
              Your cart is empty
            </Text>

            <Text
              style={styles.emptyText}
            >
              Discover products from local
              South African businesses.
            </Text>

            <Pressable
              style={styles.shopButton}
              onPress={() =>
                navigation.goBack()
              }
            >
              <Text
                style={
                  styles.shopButtonText
                }
              >
                Continue shopping
              </Text>
            </Pressable>
          </View>
        }
      />

      {items.length > 0 && (
        <View
          style={styles.summaryContainer}
        >
          {subtotal <
            FREE_DELIVERY_MINIMUM && (
            <View
              style={
                styles.deliveryNotice
              }
            >
              <Ionicons
                name="car-outline"
                size={17}
                color={light.primary}
              />

              <Text
                style={
                  styles.deliveryNoticeText
                }
              >
                Add{' '}
                {formatPrice(
                  FREE_DELIVERY_MINIMUM -
                    subtotal
                )}{' '}
                more for free delivery.
              </Text>
            </View>
          )}

          <View style={styles.summaryRow}>
            <Text
              style={styles.summaryLabel}
            >
              Subtotal
            </Text>

            <Text
              style={styles.summaryValue}
            >
              {formatPrice(subtotal)}
            </Text>
          </View>

          <View style={styles.summaryRow}>
            <Text
              style={styles.summaryLabel}
            >
              Delivery
            </Text>

            <Text
              style={[
                styles.summaryValue,
                deliveryFee === 0 &&
                  styles.freeText,
              ]}
            >
              {deliveryFee === 0
                ? 'FREE'
                : formatPrice(
                    deliveryFee
                  )}
            </Text>
          </View>

          <View style={styles.divider} />

          <View style={styles.summaryRow}>
            <Text
              style={styles.totalLabel}
            >
              Total
            </Text>

            <Text
              style={styles.totalValue}
            >
              {formatPrice(total)}
            </Text>
          </View>

          <Pressable
            style={styles.checkoutButton}
            onPress={() =>
              navigation.navigate(
                'Checkout'
              )
            }
          >
            <Text
              style={
                styles.checkoutButtonText
              }
            >
              Continue to checkout
            </Text>

            <Ionicons
              name="arrow-forward"
              size={19}
              color={light.offWhite}
            />
          </Pressable>
        </View>
      )}
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
      paddingHorizontal: 16,
      paddingVertical: 10,
      borderBottomWidth: 1,
      borderBottomColor:
        light.border,
      backgroundColor: light.card,
    },

    headerButton: {
      width: 42,
      height: 42,
      alignItems: 'center',
      justifyContent: 'center',
    },

    headerTitleBox: {
      flex: 1,
      alignItems: 'center',
    },

    headerTitle: {
      fontFamily: fontFamily.bold,
      fontSize: fontSize.lg,
      color: light.charcoal,
    },

    headerSubtitle: {
      fontFamily:
        fontFamily.secondary,
      fontSize: fontSize.xs,
      color:
        light.textSecondary,
      marginTop: 1,
    },

    list: {
      padding: 20,
      paddingBottom: 30,
    },

    emptyList: {
      flexGrow: 1,
    },

    cartItem: {
      flexDirection: 'row',
      backgroundColor: light.card,
      borderRadius: 16,
      borderWidth: 1,
      borderColor: light.border,
      padding: 10,
      marginBottom: 12,
    },

    productImage: {
      width: 84,
      height: 92,
      borderRadius: 13,
      alignItems: 'center',
      justifyContent: 'center',
    },

    itemDetails: {
      flex: 1,
      marginLeft: 12,
      justifyContent:
        'space-between',
    },

    itemTopRow: {
      flexDirection: 'row',
      alignItems:
        'flex-start',
    },

    itemNameBox: {
      flex: 1,
      marginRight: 8,
    },

    productName: {
      fontFamily:
        fontFamily.semibold,
      fontSize: fontSize.sm,
      color: light.charcoal,
    },

    businessName: {
      fontFamily:
        fontFamily.secondary,
      fontSize: fontSize.xs,
      color:
        light.textSecondary,
      marginTop: 3,
    },

    itemBottomRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent:
        'space-between',
    },

    productPrice: {
      fontFamily: fontFamily.bold,
      fontSize: fontSize.sm,
      color: light.primary,
    },

    quantityControl: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor:
        light.offWhite,
      borderRadius: 10,
      borderWidth: 1,
      borderColor: light.border,
    },

    quantityButton: {
      width: 30,
      height: 30,
      alignItems: 'center',
      justifyContent: 'center',
    },

    quantityButtonDisabled: {
      opacity: 0.35,
    },

    quantityText: {
      minWidth: 24,
      textAlign: 'center',
      fontFamily:
        fontFamily.semibold,
      fontSize: fontSize.sm,
      color: light.charcoal,
    },

    emptyBox: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
      paddingHorizontal: 30,
    },

    emptyIcon: {
      width: 100,
      height: 100,
      borderRadius: 50,
      backgroundColor: '#EAF3EF',
      alignItems: 'center',
      justifyContent: 'center',
    },

    emptyTitle: {
      fontFamily: fontFamily.bold,
      fontSize: fontSize.lg,
      color: light.charcoal,
      marginTop: 20,
    },

    emptyText: {
      fontFamily:
        fontFamily.secondary,
      fontSize: fontSize.sm,
      color:
        light.textSecondary,
      textAlign: 'center',
      lineHeight: 21,
      marginTop: 7,
    },

    shopButton: {
      backgroundColor:
        light.primary,
      paddingHorizontal: 22,
      paddingVertical: 12,
      borderRadius: 12,
      marginTop: 20,
    },

    shopButtonText: {
      fontFamily:
        fontFamily.semibold,
      fontSize: fontSize.sm,
      color: light.offWhite,
    },

    summaryContainer: {
      backgroundColor: light.card,
      borderTopWidth: 1,
      borderTopColor: light.border,
      paddingHorizontal: 20,
      paddingTop: 15,
      paddingBottom: 12,
    },

    deliveryNotice: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 7,
      backgroundColor: '#EAF3EF',
      borderRadius: 10,
      padding: 10,
      marginBottom: 14,
    },

    deliveryNoticeText: {
      flex: 1,
      fontFamily:
        fontFamily.secondary,
      fontSize: fontSize.xs,
      color: light.primary,
    },

    summaryRow: {
      flexDirection: 'row',
      justifyContent:
        'space-between',
      alignItems: 'center',
      marginBottom: 9,
    },

    summaryLabel: {
      fontFamily:
        fontFamily.secondary,
      fontSize: fontSize.sm,
      color:
        light.textSecondary,
    },

    summaryValue: {
      fontFamily:
        fontFamily.semibold,
      fontSize: fontSize.sm,
      color: light.charcoal,
    },

    freeText: {
      color: light.primary,
    },

    divider: {
      height: 1,
      backgroundColor: light.border,
      marginVertical: 4,
      marginBottom: 12,
    },

    totalLabel: {
      fontFamily: fontFamily.bold,
      fontSize: fontSize.md,
      color: light.charcoal,
    },

    totalValue: {
      fontFamily: fontFamily.bold,
      fontSize: fontSize.lg,
      color: light.primary,
    },

    checkoutButton: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 8,
      backgroundColor:
        light.primary,
      borderRadius: 14,
      paddingVertical: 15,
      marginTop: 7,
    },

    checkoutButtonText: {
      fontFamily:
        fontFamily.semibold,
      fontSize: fontSize.md,
      color: light.offWhite,
    },
  });
