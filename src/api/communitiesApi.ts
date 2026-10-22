import {
  API_BASE_URL,
} from './config';

import {
  getAccessToken,
} from '../storage/authStorage';

import * as FileSystem from
  'expo-file-system/legacy';

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

export type CommunityEvent = {
  communityEventId: number;
  communityId: number;
  title: string;
  dateLabel: string | null;
  eventDate: string | null;
  location: string | null;
  description: string | null;
};

export type CreateCommunityEventInput = {
  title: string;
  eventDate: string;
  location: string | null;
  description: string | null;
};

export type CommunityEventsResponse = {
  events: CommunityEvent[];
};

export type CreateCommunityEventResponse = {
  message: string;
  communityEvent: CommunityEvent;
};

export type CommunityJob = {
  communityJobId: number;
  communityId: number;
  postedByProfileId: number | null;
  postedByName: string | null;
  title: string;
  detail: string;
  company: string | null;
  location: string | null;
  employmentType: string | null;
  applicationContact: string | null;
  postedAt: string;
  expiresAt: string | null;
  isActive: boolean;
};

export type CreateCommunityJobInput = {
  title: string;
  detail: string;
  company: string | null;
  location: string | null;
  employmentType: string | null;
  applicationContact: string | null;
  expiresAt: string | null;
};

export type CommunityJobsResponse = {
  jobs: CommunityJob[];
};

export type CreateCommunityJobResponse = {
  message: string;
  communityJob: CommunityJob;
};

export type CommunityListing = {
  communityListingId: number;
  communityId: number;
  sellerProfileId: number | null;
  sellerName: string | null;
  title: string;
  price: number | null;
  description: string | null;
  category: string | null;
  condition: string | null;
  location: string | null;
  contact: string | null;
  imageUrl: string | null;
  isAvailable: boolean;
  createdAt: string;
  updatedAt: string | null;
  isMine: boolean;
};

export type CreateCommunityListingInput = {
  title: string;
  price: number | null;
  description: string | null;
  category: string | null;
  condition: string | null;
  location: string | null;
  contact: string;
};

export type CommunityListingsResponse = {
  listings: CommunityListing[];
};

export type CreateCommunityListingResponse = {
  message: string;
  communityListing: CommunityListing;
};

export type ListingImage = {
  uri: string;
  fileName?: string | null;
  mimeType?: string | null;
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

export async function getCommunityEvents(
  communityId: number
): Promise<CommunityEventsResponse> {
  return authorizedFetch(
    `/Communities/${communityId}/events`
  );
}

export async function createCommunityEvent(
  communityId: number,
  input: CreateCommunityEventInput
): Promise<CreateCommunityEventResponse> {
  return authorizedFetch(
    `/Communities/${communityId}/events`,
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

export async function deleteCommunityEvent(
  communityId: number,
  communityEventId: number
): Promise<{
  message: string;
}> {
  return authorizedFetch(
    `/Communities/${communityId}/events/${communityEventId}`,
    {
      method: 'DELETE',
    }
  );
}

export async function getCommunityJobs(
  communityId: number
): Promise<CommunityJobsResponse> {
  return authorizedFetch(
    `/Communities/${communityId}/jobs`
  );
}

export async function createCommunityJob(
  communityId: number,
  input: CreateCommunityJobInput
): Promise<CreateCommunityJobResponse> {
  return authorizedFetch(
    `/Communities/${communityId}/jobs`,
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

export async function deleteCommunityJob(
  communityId: number,
  communityJobId: number
): Promise<{
  message: string;
}> {
  return authorizedFetch(
    `/Communities/${communityId}/jobs/${communityJobId}`,
    {
      method: 'DELETE',
    }
  );
}

export async function getCommunityListings(
  communityId: number
): Promise<CommunityListingsResponse> {
  return authorizedFetch(
    `/Communities/${communityId}/listings`
  );
}

export async function createCommunityListing(
  communityId: number,
  input: CreateCommunityListingInput
): Promise<CreateCommunityListingResponse> {
  return authorizedFetch(
    `/Communities/${communityId}/listings`,
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

export async function uploadCommunityListingImage(
  communityId: number,
  communityListingId: number,
  image: ListingImage
): Promise<{
  message: string;
  imageUrl: string;
}> {
  const extension =
    image.fileName
      ?.split('.')
      .pop()
      ?.toLowerCase() ||
    image.mimeType
      ?.split('/')
      .pop()
      ?.toLowerCase() ||
    'jpg';

  const fileName =
    image.fileName ||
    `community-listing.${extension}`;

  const mimeType =
    image.mimeType ||
    `image/${extension === 'jpg' ? 'jpeg' : extension}`;

  const authorization =
    await getAuthorization();

  const response =
    await FileSystem.uploadAsync(
      `${API_BASE_URL}/Communities/${communityId}/listings/${communityListingId}/image`,
      image.uri,
      {
        httpMethod: 'POST',
        uploadType:
          FileSystem
            .FileSystemUploadType
            .MULTIPART,
        fieldName: 'image',
        mimeType,
        parameters: {
          fileName,
        },
        headers: {
          Authorization:
            authorization,
          Accept:
            'application/json',
        },
      }
    );

  let data: any;

  try {
    data = response.body
      ? JSON.parse(response.body)
      : {};
  } catch {
    throw new CommunitiesApiError(
      'The server returned an invalid response.',
      response.status
    );
  }

  if (
    response.status < 200 ||
    response.status >= 300
  ) {
    throw new CommunitiesApiError(
      data.message ||
        `Image upload failed (${response.status}).`,
      response.status
    );
  }

  return data;
}

export async function updateCommunityListingAvailability(
  communityId: number,
  communityListingId: number,
  isAvailable: boolean
): Promise<{
  message: string;
  isAvailable: boolean;
}> {
  return authorizedFetch(
    `/Communities/${communityId}/listings/${communityListingId}/availability`,
    {
      method: 'PATCH',

      headers: {
        'Content-Type':
          'application/json',
      },

      body: JSON.stringify({
        isAvailable,
      }),
    }
  );
}

export async function deleteCommunityListing(
  communityId: number,
  communityListingId: number
): Promise<{
  message: string;
}> {
  return authorizedFetch(
    `/Communities/${communityId}/listings/${communityListingId}`,
    {
      method: 'DELETE',
    }
  );
}
