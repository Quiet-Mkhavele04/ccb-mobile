import {
  API_BASE_URL,
} from './config';

import {
  getAccessToken,
} from '../storage/authStorage';

export type CheckoutItem = {
  productId: number;
  quantity: number;
};

export type CheckoutRequest = {
  fulfilmentType:
    | 'Delivery'
    | 'Collection';

  deliveryAddress:
    | string
    | null;

  paymentMethod:
    | 'CCB Wallet'
    | 'Cash on Collection';

  items: CheckoutItem[];
};

export type OrderSummary = {
  orderId: number;
  orderNumber: string;

  fulfilmentType:
    | 'Delivery'
    | 'Collection';

  deliveryAddress:
    | string
    | null;

  paymentMethod: string;
  subtotal: number;
  deliveryFee: number;
  total: number;
  status: string;
  createdAt: string;
  itemCount: number;
};

export type CheckoutResponse = {
  message: string;
  order: OrderSummary;
  walletBalance: number;
};

export type OrderListItem = {
  orderId: number;
  orderNumber: string;

  fulfilmentType:
    | 'Delivery'
    | 'Collection';

  paymentMethod: string;
  total: number;
  status: string;
  createdAt: string;
  itemCount: number;
};

export type OrdersResponse = {
  orders: OrderListItem[];
};

export type OrderItem = {
  orderItemId: number;
  productId: number;
  productName: string;
  unitPrice: number;
  quantity: number;
  lineTotal: number;
};

export type OrderDetails = {
  orderId: number;
  orderNumber: string;
  fulfilmentType: string;
  deliveryAddress: string | null;
  paymentMethod: string;
  subtotal: number;
  deliveryFee: number;
  total: number;
  status: string;
  createdAt: string;
  items: OrderItem[];
};

export type OrderResponse = {
  order: OrderDetails;
};

export class OrdersApiError
  extends Error {
  status: number;

  constructor(
    message: string,
    status: number
  ) {
    super(message);

    this.name =
      'OrdersApiError';

    this.status = status;
  }
}

async function getAuthorization() {
  const token =
    await getAccessToken();

  if (!token) {
    throw new OrdersApiError(
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
    throw new OrdersApiError(
      'The server returned an invalid response.',
      response.status
    );
  }

  if (!response.ok) {
    throw new OrdersApiError(
      data.message ||
        `Request failed (${response.status}).`,
      response.status
    );
  }

  return data;
}

export async function checkout(
  request: CheckoutRequest
): Promise<CheckoutResponse> {
  const authorization =
    await getAuthorization();

  const response =
    await fetch(
      `${API_BASE_URL}/Orders/checkout`,
      {
        method: 'POST',

        headers: {
          Authorization:
            authorization,

          Accept:
            'application/json',

          'Content-Type':
            'application/json',
        },

        body: JSON.stringify(
          request
        ),
      }
    );

  return readResponse(response);
}

export async function getMyOrders():
  Promise<OrdersResponse> {
  const authorization =
    await getAuthorization();

  const response =
    await fetch(
      `${API_BASE_URL}/Orders`,
      {
        method: 'GET',

        headers: {
          Authorization:
            authorization,

          Accept:
            'application/json',
        },
      }
    );

  return readResponse(response);
}

export async function getOrder(
  orderId: number
): Promise<OrderResponse> {
  const authorization =
    await getAuthorization();

  const response =
    await fetch(
      `${API_BASE_URL}/Orders/${orderId}`,
      {
        method: 'GET',

        headers: {
          Authorization:
            authorization,

          Accept:
            'application/json',
        },
      }
    );

  return readResponse(response);
}