import {
  HubConnection,
  HubConnectionBuilder,
  HubConnectionState,
  LogLevel,
} from '@microsoft/signalr';

import { API_BASE_URL } from './config';
import { getAccessToken } from '../storage/authStorage';

const SERVER_BASE_URL = API_BASE_URL.replace(
  /\/api\/?$/,
  ''
);

export const CHAT_HUB_URL =
  `${SERVER_BASE_URL}/hubs/chat`;

let chatConnection: HubConnection | null = null;

export function getChatConnection() {
  if (chatConnection) {
    return chatConnection;
  }

  chatConnection = new HubConnectionBuilder()
    .withUrl(CHAT_HUB_URL, {
      accessTokenFactory: async () => {
        const token = await getAccessToken();

        return token ?? '';
      },
    })
    .withAutomaticReconnect([
      0,
      2000,
      10000,
      30000,
    ])
    .configureLogging(LogLevel.Information)
    .build();

  /*
   * Keep one background listener registered for every
   * server event. Individual screens add their own
   * listeners while focused. These handlers prevent
   * SignalR warnings when an event arrives while its
   * screen is not currently open.
   */
  chatConnection.on(
    'MessageReceived',
    () => undefined
  );

  chatConnection.on(
    'MessageUpdated',
    () => undefined
  );

  chatConnection.on(
    'MessageDeleted',
    () => undefined
  );

  chatConnection.on(
    'MessagesRead',
    () => undefined
  );

  chatConnection.on(
    'PresenceChanged',
    () => undefined
  );

  chatConnection.on(
    'StatusesChanged',
    () => undefined
  );

  return chatConnection;
}

export async function startChatConnection() {
  const connection = getChatConnection();

  if (
    connection.state ===
    HubConnectionState.Connected
  ) {
    return connection;
  }

  if (
    connection.state !==
    HubConnectionState.Disconnected
  ) {
    return connection;
  }

  try {
    await connection.start();

    console.log(
      'SignalR chat connected.'
    );
  } catch (error) {
    console.error(
      'SignalR connection failed:',
      error
    );

    throw error;
  }

  return connection;
}

export async function stopChatConnection() {
  if (!chatConnection) {
    return;
  }

  if (
    chatConnection.state !==
    HubConnectionState.Disconnected
  ) {
    await chatConnection.stop();
  }

  chatConnection = null;
}
