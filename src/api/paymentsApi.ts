import {
  API_BASE_URL,
} from './config';

import {
  getAccessToken,
} from '../storage/authStorage';

export type Wallet = {
  balance: number;
  currency: string;
};

export type PaymentTransaction = {
  transactionId: number;
  counterparty: string | null;
  amount: number;
  direction:
    | 'sent'
    | 'received';
  transactionDate: string;
  reference: string | null;
  description: string | null;
  status: string;
};

export type TransferChallenge = {
  message: string;
  challengeId: string;
  expiresInSeconds: number;

  recipient: {
    profileId: number;
    name: string | null;
  };

  amount: number;
  developmentCode:
    | string
    | null;
};

export type ConfirmedTransfer = {
  message: string;

  transaction: {
    transactionId: number;
    recipientProfileId: number;
    recipientName: string | null;
    amount: number;
    reference: string | null;
    status: string;
    transactionDate: string;
  };

  walletBalance: number;
};

export class PaymentsApiError
  extends Error {
  status: number;

  constructor(
    message: string,
    status: number
  ) {
    super(message);

    this.name =
      'PaymentsApiError';

    this.status = status;
  }
}

async function getAuthorization() {
  const token =
    await getAccessToken();

  if (!token) {
    throw new PaymentsApiError(
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
    throw new PaymentsApiError(
      'The server returned an invalid response.',
      response.status
    );
  }

  if (!response.ok) {
    throw new PaymentsApiError(
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

export async function getWallet():
  Promise<{
    wallet: Wallet;
  }> {
  return authorizedFetch(
    '/Transactions/wallet'
  );
}

export async function getPaymentTransactions():
  Promise<{
    transactions:
      PaymentTransaction[];
  }> {
  return authorizedFetch(
    '/Transactions'
  );
}

export async function getPaymentPinStatus():
  Promise<{
    hasPin: boolean;
  }> {
  return authorizedFetch(
    '/Transactions/pin/status'
  );
}

export async function savePaymentPin(
  pin: string,
  confirmPin: string
): Promise<{
  message: string;
}> {
  return authorizedFetch(
    '/Transactions/pin',
    {
      method: 'POST',

      headers: {
        'Content-Type':
          'application/json',
      },

      body: JSON.stringify({
        pin,
        confirmPin,
      }),
    }
  );
}

export async function startTransfer(
  recipientProfileId: number,
  amount: number,
  reference: string | null,
  pin: string
): Promise<TransferChallenge> {
  return authorizedFetch(
    '/Transactions/transfer/start',
    {
      method: 'POST',

      headers: {
        'Content-Type':
          'application/json',
      },

      body: JSON.stringify({
        recipientProfileId,
        amount,
        reference,
        pin,
      }),
    }
  );
}

export async function confirmTransfer(
  challengeId: string,
  code: string
): Promise<ConfirmedTransfer> {
  return authorizedFetch(
    '/Transactions/transfer/confirm',
    {
      method: 'POST',

      headers: {
        'Content-Type':
          'application/json',
      },

      body: JSON.stringify({
        challengeId,
        code,
      }),
    }
  );
}

export async function addDemoFunds(
  amount: number
): Promise<{
  message: string;
  walletBalance: number;
  currency: string;
}> {
  return authorizedFetch(
    '/Transactions/development/top-up',
    {
      method: 'POST',

      headers: {
        'Content-Type':
          'application/json',
      },

      body: JSON.stringify({
        amount,
      }),
    }
  );
}