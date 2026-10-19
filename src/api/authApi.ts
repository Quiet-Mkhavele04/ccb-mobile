import { API_BASE_URL } from './config';

export type SendCodeResponse = {
  message: string;
  phone: string;
  expiresInSeconds: number;
  developmentCode?: string | null;
};

export type VerifyCodeResponse = {
  message: string;
  isNewUser: boolean;
  nextScreen: 'ProfileSetup' | 'Home';
  phone?: string;
  setupToken?: string;
  token?: string;

  user?: {
    profileId: number;
    name: string;
    username: string;
    phone: string;
    language: string;
    avatarColor: string;
    profilePhotoUrl?: string | null;
    balance: number;
    darkMode: boolean;
  };
};

async function readResponse(
  response: Response
) {
  const data = await response.json();

  if (!response.ok) {
    throw new Error(
      data.message ||
      'Something went wrong.'
    );
  }

  return data;
}

export async function sendVerificationCode(
  phone: string
): Promise<SendCodeResponse> {
  const response = await fetch(
    `${API_BASE_URL}/Auth/send-code`,
    {
      method: 'POST',

      headers: {
        'Content-Type': 'application/json',
      },

      body: JSON.stringify({
        phone: phone,
      }),
    }
  );

  return readResponse(response);
}

export async function verifyCode(
  phone: string,
  code: string
): Promise<VerifyCodeResponse> {
  const response = await fetch(
    `${API_BASE_URL}/Auth/verify-code`,
    {
      method: 'POST',

      headers: {
        'Content-Type': 'application/json',
      },

      body: JSON.stringify({
        phone: phone,
        code: code,
      }),
    }
  );

  return readResponse(response);
}