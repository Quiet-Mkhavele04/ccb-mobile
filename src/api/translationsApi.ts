import { API_BASE_URL } from './config';

import {
  getAccessToken,
} from '../storage/authStorage';

export type TranslationResult = {
  translationId: number;
  messageId: number;
  sourceLanguage: string | null;
  targetLanguage: string | null;
  originalText: string | null;
  translatedText: string | null;
  createdAt: string;
};

export type TranslateMessageResponse = {
  message: string;
  data: TranslationResult;
};

export class TranslationApiError extends Error {
  status: number;

  constructor(
    message: string,
    status: number
  ) {
    super(message);
    this.name = 'TranslationApiError';
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
    throw new TranslationApiError(
      'The server returned an invalid response.',
      response.status
    );
  }

  if (!response.ok) {
    throw new TranslationApiError(
      data.message ||
        `Request failed (${response.status}).`,
      response.status
    );
  }

  return data;
}

export async function translateMessage(
  messageId: number
): Promise<TranslateMessageResponse> {
  const token = await getAccessToken();

  if (!token) {
    throw new TranslationApiError(
      'No saved login session was found.',
      401
    );
  }

  const response = await fetch(
    `${API_BASE_URL}/Translations/message/${messageId}`,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: 'application/json',
      },
    }
  );

  return readResponse(response);
}
