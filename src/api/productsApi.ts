import {
  API_BASE_URL,
} from './config';

import {
  getAccessToken,
} from '../storage/authStorage';

export type Product = {
  productId: number;
  businessId: number;
  businessName?: string;
  businessCategory?: string | null;
  businessRating?: number | null;
  businessBannerColor?: string | null;
  businessAddress?: string | null;
  businessPhone?: string | null;
  name: string;
  description: string | null;
  category: string;
  price: number;
  imageUrl: string | null;
  stockQuantity: number;
  isAvailable: boolean;
  isFeatured: boolean;
};

export type ProductsResponse = {
  products: Product[];
};

export type ProductResponse = {
  product: Product;
};

export type ProductFilters = {
  search?: string;
  category?: string;
  businessId?: number;
  featuredOnly?: boolean;
};

export class ProductsApiError
  extends Error {
  status: number;

  constructor(
    message: string,
    status: number
  ) {
    super(message);

    this.name =
      'ProductsApiError';

    this.status = status;
  }
}

async function getAuthorization() {
  const token =
    await getAccessToken();

  if (!token) {
    throw new ProductsApiError(
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
    throw new ProductsApiError(
      'The server returned an invalid response.',
      response.status
    );
  }

  if (!response.ok) {
    throw new ProductsApiError(
      data.message ||
        `Request failed (${response.status}).`,
      response.status
    );
  }

  return data;
}

export async function getProducts(
  filters: ProductFilters = {}
): Promise<ProductsResponse> {
  const authorization =
    await getAuthorization();

  const parameters =
    new URLSearchParams();

  if (filters.search?.trim()) {
    parameters.append(
      'search',
      filters.search.trim()
    );
  }

  if (filters.category?.trim()) {
    parameters.append(
      'category',
      filters.category.trim()
    );
  }

  if (
    filters.businessId !==
    undefined
  ) {
    parameters.append(
      'businessId',
      String(filters.businessId)
    );
  }

  if (filters.featuredOnly) {
    parameters.append(
      'featuredOnly',
      'true'
    );
  }

  const query =
    parameters.toString();

  const url =
    query.length > 0
      ? `${API_BASE_URL}/Products?${query}`
      : `${API_BASE_URL}/Products`;

  const response =
    await fetch(url, {
      method: 'GET',

      headers: {
        Authorization:
          authorization,

        Accept:
          'application/json',
      },
    });

  return readResponse(response);
}

export async function getProduct(
  productId: number
): Promise<ProductResponse> {
  const authorization =
    await getAuthorization();

  const response =
    await fetch(
      `${API_BASE_URL}/Products/${productId}`,
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

export async function getBusinessProducts(
  businessId: number
): Promise<ProductsResponse> {
  const authorization =
    await getAuthorization();

  const response =
    await fetch(
      `${API_BASE_URL}/Products/business/${businessId}`,
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