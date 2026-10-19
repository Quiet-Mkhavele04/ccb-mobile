import { fetch as expoFetch } from 'expo/fetch';
import { File } from 'expo-file-system';

import { API_BASE_URL } from './config';
import { getAccessToken } from '../storage/authStorage';

export type ApiStatus = {
  statusId: number;
  contactId: number;
  profileId: number;
  name: string;
  avatarColor: string | null;
  profilePhotoUrl: string | null;
  mediaType: 'image' | 'video' | null;
  mediaUrl: string | null;
  caption: string;
  backgroundColor: string | null;
  createdAt: string;
  expiresAt: string | null;
  isMine: boolean;
  viewed: boolean;
};

export type StatusesResponse = {
  statuses: ApiStatus[];
};

export type CreateStatusResponse = {
  message: string;
  status: ApiStatus;
};

export type DeleteStatusResponse = {
  message: string;
  statusId: number;
};

export type ViewStatusResponse = {
  message: string;
  statusId: number;
  viewed: boolean;
};

export type StatusMediaInput = {
  uri: string;
  fileName: string;
  mimeType: string;
};

export class StatusesApiError extends Error {
  status: number;

  constructor(
    message: string,
    status: number
  ) {
    super(message);

    this.name = 'StatusesApiError';
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
    throw new StatusesApiError(
      'The server returned an invalid response.',
      response.status
    );
  }

  if (!response.ok) {
    throw new StatusesApiError(
      data.message ||
        `Request failed (${response.status}).`,
      response.status
    );
  }

  return data;
}

async function getAuthorizationHeader() {
  const token =
    await getAccessToken();

  if (!token) {
    throw new StatusesApiError(
      'No saved login session was found.',
      401
    );
  }

  return `Bearer ${token}`;
}

export async function getStatuses():
  Promise<StatusesResponse> {
  const authorization =
    await getAuthorizationHeader();

  const response = await fetch(
    `${API_BASE_URL}/Statuses`,
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

export async function createStatus(
  caption: string,
  backgroundColor: string,
  media?: StatusMediaInput | null
): Promise<CreateStatusResponse> {
  const authorization =
    await getAuthorizationHeader();

  const body =
    new FormData();

  body.append(
    'Caption',
    caption
  );

  body.append(
    'BackgroundColor',
    backgroundColor
  );

  if (media) {
    try {
      const mediaFile =
        new File(media.uri);

      if (
        !mediaFile.exists ||
        mediaFile.size === 0
      ) {
        throw new Error(
          'The selected media file is empty or unavailable.'
        );
      }

      body.append(
        'Media',
        mediaFile as any
      );

      console.log(
        'Preparing status media:',
        {
          uri: mediaFile.uri,
          name: mediaFile.name,
          type:
            mediaFile.type ||
            media.mimeType,
          size: mediaFile.size,
        }
      );
    } catch (error) {
      console.error(
        'Unable to prepare status media:',
        error
      );

      throw new StatusesApiError(
        'The selected picture or video could not be prepared for upload.',
        0
      );
    }
  }

  const response = await expoFetch(
    `${API_BASE_URL}/Statuses`,
    {
      method: 'POST',

      headers: {
        Authorization: authorization,
        Accept: 'application/json',
      },

      body,
    }
  );

  return readResponse(
    response as Response
  );
}

export function resolveStatusMediaUrl(
  mediaUrl?: string | null
) {
  if (!mediaUrl) {
    return null;
  }

  const serverBaseUrl =
    API_BASE_URL.replace(
      /\/api\/?$/,
      ''
    );

  if (mediaUrl.startsWith('/')) {
    return `${serverBaseUrl}${mediaUrl}`;
  }

  if (mediaUrl.includes('/uploads/')) {
    const path =
      mediaUrl.slice(
        mediaUrl.indexOf('/uploads/')
      );

    return `${serverBaseUrl}${path}`;
  }

  return mediaUrl;
}

export async function deleteStatus(
  statusId: number
): Promise<DeleteStatusResponse> {
  const authorization =
    await getAuthorizationHeader();

  const response = await fetch(
    `${API_BASE_URL}/Statuses/${statusId}`,
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

export async function markStatusViewed(
  statusId: number
): Promise<ViewStatusResponse> {
  const authorization =
    await getAuthorizationHeader();

  const response = await fetch(
    `${API_BASE_URL}/Statuses/${statusId}/view`,
    {
      method: 'POST',

      headers: {
        Authorization: authorization,
        Accept: 'application/json',
      },
    }
  );

  return readResponse(response);
}