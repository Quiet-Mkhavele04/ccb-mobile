import {
  API_BASE_URL,
} from './config';

import {
  getAccessToken,
} from '../storage/authStorage';

export type Community = {
  communityId: number;
  name: string;
  category: string;
  description: string | null;
  bannerColor: string | null;
  memberCount: number;
  joined: boolean;
  isAdmin: boolean;
  createdAt: string;
};

export type CommunityMessage = {
  communityMessageId: number;
  communityId: number;
  senderProfileId: number | null;
  senderName: string;
  avatarColor: string | null;
  profilePhotoUrl: string | null;
  messageText: string;
  sentAt: string;
  isMe: boolean;
};

export type CommunityMessagesResponse = {
  messages: CommunityMessage[];
};

export type SendCommunityMessageResponse = {
  message: string;
  communityMessage: CommunityMessage;
};

export type CreateCommunityInput = {
  name: string;
  category: string;
  description: string | null;
  bannerColor: string | null;
};

export class CommunitiesApiError
  extends Error {
  status: number;

  constructor(
    message: string,
    status: number
  ) {
    super(message);

    this.name =
      'CommunitiesApiError';

    this.status = status;
  }
}

async function getAuthorization() {
  const token =
    await getAccessToken();

  if (!token) {
    throw new CommunitiesApiError(
      'No saved login session was found.',
      401
    );
  }

  return `Bearer ${token}`;
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
    throw new CommunitiesApiError(
      'The server returned an invalid response.',
      response.status
    );
  }

  if (!response.ok) {
    throw new CommunitiesApiError(
      data.message ||
        `Request failed (${response.status}).`,
      response.status
    );
  }

  return data;
}

async function authorizedFetch(
  path: string,
  options: RequestInit = {}
) {
  const authorization =
    await getAuthorization();

  const response = await fetch(
    `${API_BASE_URL}${path}`,
    {
      ...options,

      headers: {
        Authorization:
          authorization,

        Accept:
          'application/json',

        ...options.headers,
      },
    }
  );

  return readResponse(response);
}

export async function getCommunities(
  options?: {
    search?: string;
    category?: string;
    joinedOnly?: boolean;
  }
): Promise<{
  communities: Community[];
}> {
  const parameters =
    new URLSearchParams();

  if (options?.search?.trim()) {
    parameters.set(
      'search',
      options.search.trim()
    );
  }

  if (
    options?.category &&
    options.category !== 'All'
  ) {
    parameters.set(
      'category',
      options.category
    );
  }

  if (options?.joinedOnly) {
    parameters.set(
      'joinedOnly',
      'true'
    );
  }

  const query = parameters.toString();

  return authorizedFetch(
    `/Communities${query ? `?${query}` : ''}`
  );
}

export async function getCommunity(
  communityId: number
): Promise<{
  community: Community;
}> {
  return authorizedFetch(
    `/Communities/${communityId}`
  );
}

export async function createCommunity(
  input: CreateCommunityInput
): Promise<{
  message: string;
  community: Community;
}> {
  return authorizedFetch(
    '/Communities',
    {
      method: 'POST',

      headers: {
        'Content-Type':
          'application/json',
      },

      body: JSON.stringify(input),
    }
  );
}

export async function joinCommunity(
  communityId: number
): Promise<{
  message: string;
  communityId?: number;
  joined?: boolean;
  memberCount?: number;
}> {
  return authorizedFetch(
    `/Communities/${communityId}/join`,
    {
      method: 'POST',
    }
  );
}

export async function leaveCommunity(
  communityId: number
): Promise<{
  message: string;
  communityId?: number;
  joined?: boolean;
  memberCount?: number;
}> {
  return authorizedFetch(
    `/Communities/${communityId}/leave`,
    {
      method: 'DELETE',
    }
  );
}

export async function getCommunityMessages(
  communityId: number
): Promise<CommunityMessagesResponse> {
  return authorizedFetch(
    `/Communities/${communityId}/messages`
  );
}

export async function sendCommunityMessage(
  communityId: number,
  messageText: string
): Promise<SendCommunityMessageResponse> {
  return authorizedFetch(
    `/Communities/${communityId}/messages`,
    {
      method: 'POST',

      headers: {
        'Content-Type':
          'application/json',
      },

      body: JSON.stringify({
        messageText:
          messageText.trim(),
      }),
    }
  );
}
