import { API_BASE_URL } from './config';

import {
  getAccessToken,
} from '../storage/authStorage';

export type MessageContact = {
  contactId: number;
  profileId: number;
  name: string;
  avatarColor: string | null;
  isOnline: boolean;
  language: string | null;
};

export type ChatMessage = {
  messageId: number;
  senderProfileId: number;
  recipientProfileId: number;
  messageText: string;
  isMine: boolean;
  translated: boolean;
  sentAt: string;
  readAt: string | null;
  editedAt: string | null;
};

export type ConversationResponse = {
  contact: MessageContact;
  messages: ChatMessage[];
};

export type MessageResponse = {
  message: string;
  data: ChatMessage;
};

export type DeleteMessageResponse = {
  message: string;
  messageId: number;
};

export class MessagesApiError extends Error {
  status: number;

  constructor(
    message: string,
    status: number
  ) {
    super(message);

    this.name = 'MessagesApiError';
    this.status = status;
  }
}

async function readResponse(
  response: Response
) {
  const text = await response.text();

  let data: any;

  try {
    data = text
      ? JSON.parse(text)
      : {};
  } catch {
    throw new MessagesApiError(
      'The server returned an invalid response.',
      response.status
    );
  }

  if (!response.ok) {
    throw new MessagesApiError(
      data.message ||
        `Request failed (${response.status}).`,
      response.status
    );
  }

  return data;
}

async function getAuthorizationHeader() {
  const token = await getAccessToken();

  if (!token) {
    throw new MessagesApiError(
      'No saved login session was found.',
      401
    );
  }

  return `Bearer ${token}`;
}

export async function getConversation(
  contactId: number
): Promise<ConversationResponse> {
  const authorization =
    await getAuthorizationHeader();

  const response = await fetch(
    `${API_BASE_URL}/Messages/contact/${contactId}`,
    {
      method: 'GET',

      headers: {
        Authorization: authorization,
        Accept: 'application/json',
      },
    }
  );

  return readResponse(response);
}

export async function sendMessage(
  contactId: number,
  messageText: string
): Promise<MessageResponse> {
  const authorization =
    await getAuthorizationHeader();

  const response = await fetch(
    `${API_BASE_URL}/Messages`,
    {
      method: 'POST',

      headers: {
        Authorization: authorization,
        Accept: 'application/json',
        'Content-Type': 'application/json',
      },

      body: JSON.stringify({
        contactId,
        messageText,
      }),
    }
  );

  return readResponse(response);
}

export async function editMessage(
  messageId: number,
  messageText: string
): Promise<MessageResponse> {
  const authorization =
    await getAuthorizationHeader();

  const response = await fetch(
    `${API_BASE_URL}/Messages/${messageId}`,
    {
      method: 'PUT',

      headers: {
        Authorization: authorization,
        Accept: 'application/json',
        'Content-Type': 'application/json',
      },

      body: JSON.stringify({
        messageText,
      }),
    }
  );

  return readResponse(response);
}

export async function deleteMessage(
  messageId: number
): Promise<DeleteMessageResponse> {
  const authorization =
    await getAuthorizationHeader();

  const response = await fetch(
    `${API_BASE_URL}/Messages/${messageId}`,
    {
      method: 'DELETE',

      headers: {
        Authorization: authorization,
        Accept: 'application/json',
      },
    }
  );

  return readResponse(response);
}
