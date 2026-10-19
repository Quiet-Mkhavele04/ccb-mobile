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

import BusinessProfileScreen from
  '../screens/main/BusinessProfileScreen';

import SendMoneyScreen from
  '../screens/main/SendMoneyScreen';

import EditProfileScreen from
  '../screens/main/EditProfileScreen';

import AddContactScreen from
  '../screens/main/AddContactScreen';

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
import CartScreen from
  '../screens/main/CartScreen';

import {
  CartProvider,
} from '../context/CartContext';
export type RootStackParamList = {
  MainTabs: undefined;

  Cart: undefined;

  EditProfile: undefined;

  AddContact: undefined;

  CreateStatus: undefined;

  Chat: {
  contactId: number;
  name: string;
  avatarColor: string;
  photoUrl: string | null;
  isOnline: boolean;
};

  StatusViewer: {
    statuses:
      StatusViewerItem[];

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
      <Stack.Screen name="MainTabs">
        {() => (
          <BottomTabs
            onLogout={onLogout}
          />
        )}
      </Stack.Screen>

      <Stack.Screen
        name="AddContact"
        component={AddContactScreen}
        options={{
          animation:
            'slide_from_bottom',
          presentation: 'modal',
        }}
      />

      <Stack.Screen
        name="CreateStatus"
        component={CreateStatusScreen}
        options={{
          animation:
            'slide_from_bottom',
          presentation: 'modal',
        }}
      />

      <Stack.Screen
        name="EditProfile"
        component={EditProfileScreen}
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
        component={StatusViewerScreen}
        options={{
          animation: 'fade',
          presentation:
            'fullScreenModal',
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
  name="Cart"
  component={CartScreen}
  options={{
    animation:
      'slide_from_right',
  }}
/>

      <Stack.Screen
        name="SendMoney"
        component={SendMoneyScreen}
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