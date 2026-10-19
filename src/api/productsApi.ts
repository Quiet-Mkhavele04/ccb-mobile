import {
  API_BASE_URL,
} from './config';

import {
  getAccessToken,
} from '../storage/authStorage';

import * as FileSystem from
  'expo-file-system/legacy';

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
  createdAt?: string;
  updatedAt?: string | null;
};

export type ProductsResponse = {
  products: Product[];
};

export type ProductResponse = {
  product: Product;
};

export type MyProductsResponse = {
  business: {
    businessId: number;
    name: string;
  };
  products: Product[];
};

export type CreateProductInput = {
  name: string;
  description?: string;
  category: string;
  price: number;
  stockQuantity: number;
  isAvailable: boolean;
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

export async function getMyProducts():
  Promise<MyProductsResponse> {
  const authorization =
    await getAuthorization();

  const response = await fetch(
    `${API_BASE_URL}/Products/mine`,
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

export async function createProduct(
  input: CreateProductInput
): Promise<ProductResponse> {
  const authorization = await getAuthorization();
  const response = await fetch(`${API_BASE_URL}/Products`, {
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

export async function uploadProductImage(
  productId: number,
  imageUri: string,
  mimeType = 'image/jpeg',
  fileName = 'product.jpg'
): Promise<{ message: string; imageUrl: string }> {
  const authorization = await getAuthorization();
  const response = await FileSystem.uploadAsync(
    `${API_BASE_URL}/Products/${productId}/image`,
    imageUri,
    {
      httpMethod: 'POST',
      uploadType:
        FileSystem.FileSystemUploadType.MULTIPART,
      fieldName: 'image',
      mimeType,
      parameters: {
        fileName,
      },
      headers: {
        Authorization: authorization,
        Accept: 'application/json',
      },
    }
  );

  let data: any;

  try {
    data = response.body
      ? JSON.parse(response.body)
      : {};
  } catch {
    throw new ProductsApiError(
      'The server returned an invalid response.',
      response.status
    );
  }

  if (
    response.status < 200 ||
    response.status >= 300
  ) {
    throw new ProductsApiError(
      data.message ||
        `Image upload failed (${response.status}).`,
      response.status
    );
  }

  return data;
}

export async function updateProduct(
  productId: number,
  input: CreateProductInput
): Promise<ProductResponse> {
  const authorization = await getAuthorization();
  const response = await fetch(
    `${API_BASE_URL}/Products/${productId}`,
    {
      method: 'PUT',
      headers: {
        Authorization: authorization,
        Accept: 'application/json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(input),
    }
  );

  return readResponse(response);
}

export async function setProductAvailability(
  productId: number,
  isAvailable: boolean
): Promise<{ message: string; productId: number; isAvailable: boolean }> {
  const authorization = await getAuthorization();
  const response = await fetch(
    `${API_BASE_URL}/Products/${productId}/availability`,
    {
      method: 'PATCH',
      headers: {
        Authorization: authorization,
        Accept: 'application/json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ isAvailable }),
    }
  );

  return readResponse(response);
}

export async function deleteProduct(
  productId: number
): Promise<{ message: string; productId: number }> {
  const authorization = await getAuthorization();
  const response = await fetch(
    `${API_BASE_URL}/Products/${productId}`,
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
