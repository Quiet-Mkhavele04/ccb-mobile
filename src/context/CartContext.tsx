import AsyncStorage from
  '@react-native-async-storage/async-storage';

import React, {
  createContext,
  ReactNode,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';

import {
  Product,
} from '../api/productsApi';

const CART_STORAGE_KEY =
  '@ccb_marketplace_cart';

export type CartItem = {
  product: Product;
  quantity: number;
};

type CartContextValue = {
  items: CartItem[];
  itemCount: number;
  subtotal: number;
  loading: boolean;
  addItem: (
    product: Product
  ) => void;
  decreaseItem: (
    productId: number
  ) => void;
  removeItem: (
    productId: number
  ) => void;
  clearCart: () => void;
  getQuantity: (
    productId: number
  ) => number;
};

const CartContext =
  createContext<
    CartContextValue | undefined
  >(undefined);

type Props = {
  children: ReactNode;
};

export function CartProvider({
  children,
}: Props) {
  const [
    items,
    setItems,
  ] = useState<CartItem[]>([]);

  const [
    loading,
    setLoading,
  ] = useState(true);

  useEffect(() => {
    async function loadCart() {
      try {
        const savedCart =
          await AsyncStorage.getItem(
            CART_STORAGE_KEY
          );

        if (savedCart) {
          const parsedItems =
            JSON.parse(
              savedCart
            ) as CartItem[];

          if (
            Array.isArray(
              parsedItems
            )
          ) {
            setItems(
              parsedItems
            );
          }
        }
      } catch (error) {
        console.error(
          'Unable to load cart:',
          error
        );
      } finally {
        setLoading(false);
      }
    }

    loadCart();
  }, []);

  useEffect(() => {
    if (loading) {
      return;
    }

    async function saveCart() {
      try {
        await AsyncStorage.setItem(
          CART_STORAGE_KEY,
          JSON.stringify(items)
        );
      } catch (error) {
        console.error(
          'Unable to save cart:',
          error
        );
      }
    }

    saveCart();
  }, [items, loading]);

  const addItem =
    useCallback(
      (product: Product) => {
        setItems(
          currentItems => {
            const existingItem =
              currentItems.find(
                item =>
                  item.product
                    .productId ===
                  product.productId
              );

            if (existingItem) {
              if (
                existingItem.quantity >=
                product.stockQuantity
              ) {
                return currentItems;
              }

              return currentItems.map(
                item =>
                  item.product
                    .productId ===
                  product.productId
                    ? {
                        ...item,
                        product,
                        quantity:
                          item.quantity +
                          1,
                      }
                    : item
              );
            }

            if (
              product.stockQuantity <=
              0
            ) {
              return currentItems;
            }

            return [
              ...currentItems,
              {
                product,
                quantity: 1,
              },
            ];
          }
        );
      },
      []
    );

  const decreaseItem =
    useCallback(
      (productId: number) => {
        setItems(
          currentItems =>
            currentItems
              .map(item =>
                item.product
                  .productId ===
                  productId
                  ? {
                      ...item,
                      quantity:
                        item.quantity -
                        1,
                    }
                  : item
              )
              .filter(
                item =>
                  item.quantity > 0
              )
        );
      },
      []
    );

  const removeItem =
    useCallback(
      (productId: number) => {
        setItems(
          currentItems =>
            currentItems.filter(
              item =>
                item.product
                  .productId !==
                productId
            )
        );
      },
      []
    );

  const clearCart =
    useCallback(() => {
      setItems([]);
    }, []);

  const getQuantity =
    useCallback(
      (productId: number) => {
        return (
          items.find(
            item =>
              item.product
                .productId ===
              productId
          )?.quantity ?? 0
        );
      },
      [items]
    );

  const itemCount =
    useMemo(
      () =>
        items.reduce(
          (
            total,
            item
          ) =>
            total +
            item.quantity,
          0
        ),
      [items]
    );

  const subtotal =
    useMemo(
      () =>
        items.reduce(
          (
            total,
            item
          ) =>
            total +
            item.product.price *
              item.quantity,
          0
        ),
      [items]
    );

  const value =
    useMemo(
      () => ({
        items,
        itemCount,
        subtotal,
        loading,
        addItem,
        decreaseItem,
        removeItem,
        clearCart,
        getQuantity,
      }),
      [
        items,
        itemCount,
        subtotal,
        loading,
        addItem,
        decreaseItem,
        removeItem,
        clearCart,
        getQuantity,
      ]
    );

  return (
    <CartContext.Provider
      value={value}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context =
    useContext(
      CartContext
    );

  if (!context) {
    throw new Error(
      'useCart must be used inside CartProvider.'
    );
  }

  return context;
}