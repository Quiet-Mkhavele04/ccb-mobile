import { API_BASE_URL } from './config';
import { getAccessToken } from '../storage/authStorage';
import * as FileSystem from 'expo-file-system/legacy';

export type Business = {
  businessId: number;
  name: string;
  category: string;
  rating: number | null;
  bannerColor: string | null;
  bannerImageUrl: string | null;
  description: string | null;
  address: string | null;
  phone: string | null;
  featured: boolean;
  createdAt: string;
};

export type BusinessResponse = {
  business: Business;
};

export type CreateBusinessInput = {
  name: string;
  category: string;
  bannerColor?: string;
  description?: string;
  address?: string;
  phone?: string;
};

export class BusinessesApiError extends Error {
  status: number;

  constructor(message: string, status: number) {
    super(message);
    this.name = 'BusinessesApiError';
    this.status = status;
  }
}

async function getAuthorization() {
  const token = await getAccessToken();

  if (!token) {
    throw new BusinessesApiError(
      'No saved login session was found.',
      401
    );
  }

  return `Bearer ${token}`;
}

async function readResponse(response: Response) {
  const text = await response.text();
  let data: any;

  try {
    data = text ? JSON.parse(text) : {};
  } catch {
    throw new BusinessesApiError(
      'The server returned an invalid response.',
      response.status
    );
  }

  if (!response.ok) {
    throw new BusinessesApiError(
      data.message || `Request failed (${response.status}).`,
      response.status
    );
  }

  return data;
}

export async function getMyBusiness(): Promise<BusinessResponse> {
  const authorization = await getAuthorization();
  const response = await fetch(`${API_BASE_URL}/Businesses/mine`, {
    method: 'GET',
    headers: {
      Authorization: authorization,
      Accept: 'application/json',
    },
  });

  return readResponse(response);
}

export async function createBusiness(
  input: CreateBusinessInput
): Promise<BusinessResponse> {
  const authorization = await getAuthorization();
  const response = await fetch(`${API_BASE_URL}/Businesses`, {
    method: 'POST',
    headers: {
      Authorization: authorization,
      Accept: 'application/json',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(input),
  });

  return readResponse(response);
}

export async function uploadBusinessBanner(
  imageUri: string,
  mimeType = 'image/jpeg'
): Promise<{ message: string; bannerImageUrl: string }> {
  const authorization = await getAuthorization();
  const response = await FileSystem.uploadAsync(
    `${API_BASE_URL}/Businesses/mine/banner-image`,
    imageUri,
    {
      httpMethod: 'POST',
      uploadType: FileSystem.FileSystemUploadType.MULTIPART,
      fieldName: 'image',
      mimeType,
      headers: {
        Authorization: authorization,
        Accept: 'application/json',
      },
    }
  );

  let data: any;
  try {
    data = response.body ? JSON.parse(response.body) : {};
  } catch {
    throw new BusinessesApiError(
      'The server returned an invalid response.',
      response.status
    );
  }

  if (response.status < 200 || response.status >= 300) {
    throw new BusinessesApiError(
      data.message || `Image upload failed (${response.status}).`,
      response.status
    );
  }

  return data;
}

export async function deleteMyBusiness(): Promise<{
  message: string;
  businessId: number;
}> {
  const authorization = await getAuthorization();
  const response = await fetch(`${API_BASE_URL}/Businesses/mine`, {
    method: 'DELETE',
    headers: {
      Authorization: authorization,
      Accept: 'application/json',
    },
  });

  return readResponse(response);
}
