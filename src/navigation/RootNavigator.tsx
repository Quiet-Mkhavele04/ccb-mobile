import React from 'react';

import {
  createNativeStackNavigator,
} from '@react-navigation/native-stack';

import BottomTabs from './BottomTabs';

import ChatScreen from
  '../screens/main/ChatScreen';

import StatusViewerScreen from
  '../screens/main/StatusViewerScreen';

import CreateStatusScreen from
  '../screens/main/CreateStatusScreen';

import CommunityDetailScreen from
  '../screens/main/CommunityDetailScreen';

import CreateCommunityScreen from
  '../screens/main/CreateCommunityScreen';

import BusinessProfileScreen from
  '../screens/main/BusinessProfileScreen';

import ProductDetailsScreen from
  '../screens/main/ProductDetailsScreen';

import CartScreen from
  '../screens/main/CartScreen';

import CheckoutScreen from
  '../screens/main/CheckoutScreen';

import OrderConfirmationScreen from
  '../screens/main/OrderConfirmationScreen';

import OrdersScreen from
  '../screens/main/OrdersScreen';

import OrderDetailsScreen from
  '../screens/main/OrderDetailsScreen';

import CreateStoreScreen from
  '../screens/main/CreateStoreScreen';

import SellerDashboardScreen from
  '../screens/main/SellerDashboardScreen';

import AddProductScreen from
  '../screens/main/AddProductScreen';

import EditProductScreen from
  '../screens/main/EditProductScreen';

import SendMoneyScreen from
  '../screens/main/SendMoneyScreen';

import EditProfileScreen from
  '../screens/main/EditProfileScreen';

import AddContactScreen from
  '../screens/main/AddContactScreen';

import {
  CartProvider,
} from '../context/CartContext';

import type {
  OrderSummary,
} from '../api/ordersApi';

export type StatusViewerItem = {
  statusId: number;
  name: string;
  avatarColor: string;
  photoUrl: string | null;
  caption: string;
  bgColor: string;
  timestamp: string;
  isMine: boolean;
  viewed: boolean;

  mediaType:
    | 'image'
    | 'video'
    | null;

  mediaUrl: string | null;
};

export type RootStackParamList = {
  MainTabs: undefined;

  EditProfile: undefined;

  AddContact: undefined;

  CreateStatus: undefined;

  CreateCommunity: undefined;

  ProductDetails: {
    productId: number;
  };

  Cart: undefined;

  Checkout: undefined;

  OrderConfirmation: {
    order: OrderSummary;
  };

  Orders: undefined;

  OrderDetails: {
    orderId: number;
  };

  CreateStore: undefined;

  SellerDashboard: undefined;

  AddProduct: undefined;

  EditProduct: {
    productId: number;
  };

  Chat: {
    contactId: number;
    name: string;
    avatarColor: string;
    photoUrl: string | null;
    isOnline: boolean;
  };

  StatusViewer: {
    statuses: StatusViewerItem[];
    initialIndex: number;
  };

  CommunityDetail: {
    communityId: number;
  };

  BusinessProfile: {
    businessId: number;
  };

  SendMoney:
    | {
        mode?:
          | 'send'
          | 'request';
      }
    | undefined;
};

type Props = {
  onLogout:
    () => Promise<void> | void;
};

const Stack =
  createNativeStackNavigator<
    RootStackParamList
  >();

export default function RootNavigator({
  onLogout,
}: Props) {
  return (
    <CartProvider>
      <Stack.Navigator
        screenOptions={{
          headerShown: false,
        }}
      >
        <Stack.Screen
          name="MainTabs"
        >
          {() => (
            <BottomTabs
              onLogout={onLogout}
            />
          )}
        </Stack.Screen>

        <Stack.Screen
          name="AddContact"
          component={
            AddContactScreen
          }
          options={{
            animation:
              'slide_from_bottom',
            presentation: 'modal',
          }}
        />

        <Stack.Screen
          name="CreateStatus"
          component={
            CreateStatusScreen
          }
          options={{
            animation:
              'slide_from_bottom',
            presentation: 'modal',
          }}
        />

        <Stack.Screen
          name="EditProfile"
          component={
            EditProfileScreen
          }
          options={{
            animation:
              'slide_from_right',
          }}
        />

        <Stack.Screen
          name="Chat"
          component={ChatScreen}
          options={{
            animation:
              'slide_from_right',
          }}
        />

        <Stack.Screen
          name="StatusViewer"
          component={
            StatusViewerScreen
          }
          options={{
            animation: 'fade',
            presentation:
              'fullScreenModal',
          }}
        />

        <Stack.Screen
          name="CreateCommunity"
          component={
            CreateCommunityScreen
          }
          options={{
            animation:
              'slide_from_bottom',
            presentation: 'modal',
          }}
        />

        <Stack.Screen
          name="CommunityDetail"
          component={
            CommunityDetailScreen
          }
          options={{
            animation:
              'slide_from_right',
          }}
        />

        <Stack.Screen
          name="BusinessProfile"
          component={
            BusinessProfileScreen
          }
          options={{
            animation:
              'slide_from_right',
          }}
        />

        <Stack.Screen
          name="ProductDetails"
          component={
            ProductDetailsScreen
          }
          options={{
            animation:
              'slide_from_right',
          }}
        />

        <Stack.Screen
          name="Cart"
          component={CartScreen}
          options={{
            animation:
              'slide_from_right',
          }}
        />

        <Stack.Screen
          name="Checkout"
          component={CheckoutScreen}
          options={{
            animation:
              'slide_from_right',
          }}
        />

        <Stack.Screen
          name="OrderConfirmation"
          component={
            OrderConfirmationScreen
          }
          options={{
            animation: 'fade',
            gestureEnabled: false,
          }}
        />

        <Stack.Screen
          name="Orders"
          component={OrdersScreen}
          options={{
            animation:
              'slide_from_right',
          }}
        />

        <Stack.Screen
          name="OrderDetails"
          component={
            OrderDetailsScreen
          }
          options={{
            animation:
              'slide_from_right',
          }}
        />

        <Stack.Screen
          name="CreateStore"
          component={
            CreateStoreScreen
          }
          options={{
            animation:
              'slide_from_bottom',
            presentation: 'modal',
          }}
        />

        <Stack.Screen
          name="SellerDashboard"
          component={
            SellerDashboardScreen
          }
          options={{
            animation:
              'slide_from_right',
          }}
        />

        <Stack.Screen
          name="AddProduct"
          component={
            AddProductScreen
          }
          options={{
            animation:
              'slide_from_bottom',
            presentation: 'modal',
          }}
        />

        <Stack.Screen
          name="EditProduct"
          component={
            EditProductScreen
          }
          options={{
            animation:
              'slide_from_right',
          }}
        />

        <Stack.Screen
          name="SendMoney"
          component={
            SendMoneyScreen
          }
          options={{
            animation:
              'slide_from_bottom',
            presentation: 'modal',
          }}
        />
      </Stack.Navigator>
    </CartProvider>
  );
}
