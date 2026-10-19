import { File } from 'expo-file-system';
import { fetch as expoFetch } from 'expo/fetch';

import { API_BASE_URL } from './config';

export type CreatedProfile = {
  profileId: number;
  name: string;
  username: string;
  phone: string;
  language: string;
  avatarColor: string;
  profilePhotoUrl?: string | null;
  balance: number;
  darkMode: boolean;
  createdAt?: string;
  updatedAt?: string | null;
};

export type CompleteProfileResponse = {
  message: string;
  nextScreen: 'Home';
  token: string;
  user: CreatedProfile;
};

export type MyProfileResponse = {
  user: CreatedProfile;
};

export type UpdateProfileResponse = {
  message: string;
  user: CreatedProfile;
};

type CompleteProfileData = {
  name: string;
  username: string;
  avatarColor: string;
  photoUri?: string | null;
};

export type UpdateProfileData = {
  name: string;
  username: string;
  avatarColor: string;
  photoUri?: string | null;
  removePhoto?: boolean;
};

export class ApiRequestError extends Error {
  status: number;

  constructor(
    message: string,
    status: number
  ) {
    super(message);

    this.name = 'ApiRequestError';
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
    throw new ApiRequestError(
      'The server returned an invalid response.',
      response.status
    );
  }

  if (!response.ok) {
    throw new ApiRequestError(
      data.message ||
        `Request failed (${response.status}).`,
      response.status
    );
  }

  return data;
}

async function appendPhoto(
  formData: FormData,
  photoUri?: string | null
) {
  if (!photoUri) {
    return;
  }

  try {
    const photoFile =
      new File(photoUri);

    if (
      !photoFile.exists ||
      photoFile.size === 0
    ) {
      throw new Error(
        'The selected profile photo is empty or unavailable.'
      );
    }

    formData.append(
      'Photo',
      photoFile as any
    );

    console.log(
      'Preparing profile photo:',
      {
        uri: photoFile.uri,
        name: photoFile.name,
        type: photoFile.type,
        size: photoFile.size,
      }
    );
  } catch (error) {
    console.error(
      'Unable to prepare profile photo:',
      error
    );

    throw new ApiRequestError(
      'The selected profile photo could not be prepared for upload.',
      0
    );
  }
}

export async function completeProfile(
  setupToken: string,
  profile: CompleteProfileData
): Promise<CompleteProfileResponse> {
  const formData =
    new FormData();

  formData.append(
    'Name',
    profile.name
  );

  formData.append(
    'Username',
    profile.username
  );

  formData.append(
    'AvatarColor',
    profile.avatarColor
  );

  await appendPhoto(
    formData,
    profile.photoUri
  );

  const response = await expoFetch(
    `${API_BASE_URL}/Profiles/complete`,
    {
      method: 'POST',

      headers: {
        Authorization:
          `Bearer ${setupToken}`,
        Accept: 'application/json',
      },

      body: formData,
    }
  );

  return readResponse(
    response as Response
  );
}

export async function getMyProfile(
  accessToken: string
): Promise<MyProfileResponse> {
  const response = await fetch(
    `${API_BASE_URL}/Profiles/me`,
    {
      method: 'GET',

      headers: {
        Authorization:
          `Bearer ${accessToken}`,
        Accept: 'application/json',
      },
    }
  );

  return readResponse(response);
}

export async function updateMyProfile(
  accessToken: string,
  profile: UpdateProfileData
): Promise<UpdateProfileResponse> {
  const formData =
    new FormData();

  formData.append(
    'Name',
    profile.name
  );

  formData.append(
    'Username',
    profile.username
  );

  formData.append(
    'AvatarColor',
    profile.avatarColor
  );

  formData.append(
    'RemovePhoto',
    profile.removePhoto
      ? 'true'
      : 'false'
  );

  await appendPhoto(
    formData,
    profile.photoUri
  );

  const response = await expoFetch(
    `${API_BASE_URL}/Profiles/me`,
    {
      method: 'PUT',

      headers: {
        Authorization:
          `Bearer ${accessToken}`,
        Accept: 'application/json',
      },

      body: formData,
    }
  );

  return readResponse(
    response as Response
  );
}