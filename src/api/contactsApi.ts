import { API_BASE_URL } from './config';

import {
  getAccessToken,
} from '../storage/authStorage';

export type Contact = {
  contactId: number;
  profileId: number | null;
  name: string;
  avatarColor: string | null;
  profilePhotoUrl: string | null;
  language: string | null;
  isOnline: boolean;
  pinned: boolean;
  unreadCount: number;
  addedAt: string;
  lastMessageText: string | null;
  lastMessageSentAt: string | null;
  lastMessageIsMine: boolean;
  lastMessageTranslated: boolean;
};

export type SearchUser = {
  profileId: number;
  name: string | null;
  profilePhotoUrl: string | null;
  username: string | null;
  phone: string | null;
  avatarColor: string | null;
  language: string | null;
  isAdded: boolean;
};

export type ContactsResponse = {
  contacts: Contact[];
};

export type SearchUsersResponse = {
  users: SearchUser[];
};

export type AddContactResponse = {
  message: string;
  contact: Contact;
};

export class ContactsApiError
  extends Error {
  status: number;

  constructor(
    message: string,
    status: number
  ) {
    super(message);

    this.name = 'ContactsApiError';
    this.status = status;
  }
}

async function readResponse(
  response: Response
) {
  const text =
    await response.text();

  let data: any;

  try {
    data = text
      ? JSON.parse(text)
      : {};
  } catch {
    throw new ContactsApiError(
      'The server returned an invalid response.',
      response.status
    );
  }

  if (!response.ok) {
    throw new ContactsApiError(
      data.message ||
        `Request failed (${response.status}).`,
      response.status
    );
  }

  return data;
}

async function getAuthorization() {
  const token =
    await getAccessToken();

  if (!token) {
    throw new ContactsApiError(
      'No saved login session was found.',
      401
    );
  }

  return `Bearer ${token}`;
}

export async function getMyContacts():
  Promise<ContactsResponse> {
  const authorization =
    await getAuthorization();

  const response = await fetch(
    `${API_BASE_URL}/Contacts`,
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

export async function searchUsers(
  query: string
): Promise<SearchUsersResponse> {
  const authorization =
    await getAuthorization();

  const searchText =
    query.trim();

  if (searchText.length < 2) {
    return {
      users: [],
    };
  }

  const encodedQuery =
    encodeURIComponent(searchText);

  const response = await fetch(
    `${API_BASE_URL}/Contacts/search?query=${encodedQuery}`,
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

export async function addContact(
  profileId: number
): Promise<AddContactResponse> {
  const authorization =
    await getAuthorization();

  const response = await fetch(
    `${API_BASE_URL}/Contacts/add`,
    {
      method: 'POST',

      headers: {
        Authorization: authorization,
        Accept: 'application/json',
        'Content-Type':
          'application/json',
      },

      body: JSON.stringify({
        profileId,
      }),
    }
  );

  return readResponse(response);
}