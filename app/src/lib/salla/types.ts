/* ================================================================
   Salla Merchant API — Type Definitions
   Based on Merchant APIs V2.7.6 Postman Collection
   Base URL: https://api.salla.dev/admin/v2
   ================================================================ */

// ---------- Request Payloads ----------

export interface SallaProductImage {
  original: string;
  thumbnail?: string;
  alt?: string;
  default?: boolean;
  sort?: number;
}

export interface SallaOptionValue {
  name: string;
  price?: number;
  quantity?: number;
  display_value?: string;
}

export interface SallaOption {
  name: string;
  display_type?: "text" | "color" | "image";
  values: SallaOptionValue[];
}

/**
 * Payload for POST /products
 * Required fields: name, price, product_type
 * 
 * NOTE: Products are `hidden` until at least one image is attached,
 *       and `out` status until quantity is set.
 *       Always send images[] and quantity.
 *
 * FUTURE: AI-generated images and descriptions will be supported.
 *         The client is designed to accept any image URL source.
 */
export interface SallaCreateProductPayload {
  name: string;
  price: number;
  product_type: "product" | "service" | "group_products" | "codes" | "digital" | "food" | "donating";
  status?: "sale" | "hidden" | "out";
  quantity?: number;
  description?: string;
  sale_price?: number;
  cost_price?: number;
  sale_end?: string;
  require_shipping?: boolean;
  weight?: number;
  weight_type?: "kg" | "g" | "lb" | "oz";
  sku?: string;
  mpn?: string;
  gtin?: string;
  hide_quantity?: boolean;
  enable_upload_image?: boolean;
  enable_note?: boolean;
  pinned?: boolean;
  subtitle?: string;
  promotion_title?: string;
  metadata_title?: string;
  metadata_description?: string;
  images?: SallaProductImage[];
  options?: SallaOption[];
  categories?: number[];
  tags?: number[];
  brand_id?: number;
}

/**
 * Payload for POST /products/bulk
 */
export interface SallaBulkUpdateProduct {
  id: number;
  name?: string;
  description?: string;
  sku?: string;
  prices?: {
    price?: number;
    sale_price?: number;
    cost_price?: number;
    sale_end?: string | null;
  };
  categories?: number[];
  features?: {
    taxable?: boolean;
    require_shipping?: boolean;
    hide_quantity?: boolean;
  };
}

// ---------- Response Types ----------

export interface SallaPrice {
  amount: number;
  currency: string;
}

export interface SallaProductResponse {
  id: number;
  name: string;
  type: string;
  sku: string;
  status: "sale" | "hidden" | "out";
  price: SallaPrice;
  sale_price: SallaPrice;
  cost_price: string;
  quantity: string;
  description: string;
  url: string;
  main_image: string;
  images: Array<{
    id: number;
    url: string;
    main: boolean;
    alt: string;
    sort: number;
  }>;
  options: Array<{
    id: number;
    name: string;
    values: Array<{
      id: number;
      name: string;
      price: SallaPrice;
    }>;
  }>;
  skus: Array<{
    id: number;
    price: SallaPrice;
    stock_quantity: number;
    sku: string;
  }>;
  categories: Array<{
    id: number;
    name: string;
  }>;
  updated_at: string;
}

export interface SallaApiResponse<T> {
  status: number;
  success: boolean;
  data: T;
}

export interface SallaListResponse<T> {
  status: number;
  success: boolean;
  data: T[];
  pagination: {
    count: number;
    total: number;
    perPage: number;
    currentPage: number;
    totalPages: number;
    links: {
      previous?: string;
      next?: string;
    };
  };
}

export interface SallaTokenResponse {
  access_token: string;
  refresh_token: string;
  token_type: string;
  expires_in: number;
  scope: string;
}

// ---------- Error Types ----------

export interface SallaApiError {
  status: number;
  success: false;
  data?: {
    message?: string;
    code?: number;
  };
  error?: {
    fields?: Record<string, string[]>;
    message?: string;
  };
}

// ---------- Category Types ----------

export interface SallaCategoryItem {
  id: number;
  name: string;
  image: string | null;
  parent_id: number; // 0 = root
  sort_order: number;
  status: "active" | "inactive";
  sub_categories: SallaCategoryItem[];
}

// ---------- Product List Types ----------

/**
 * Product item from GET /products (list endpoint).
 * Fields sourced from Merchant APIs V2.7.6 Postman Collection.
 */
export interface SallaProductListItem {
  id: number;
  name: string;
  sku: string;
  type: string;
  status: "sale" | "hidden" | "out";
  quantity: string;
  price: SallaPrice;
  cost_price: string;
  url: string;
  main_image: string;
  description: string;
  require_shipping: boolean;
  weight: number;
  weight_type: string;
  images: Array<{
    id: number;
    url: string;
    main: boolean;
    alt: string;
    sort: number;
  }>;
  categories: Array<{
    id: number;
    name: string;
  }>;
  tags: Array<{
    id: number;
    name: string;
  }>;
  options: Array<{
    id: number;
    name: string;
    display_type: string;
    values: Array<{
      id: number;
      name: string;
      price: SallaPrice;
    }>;
  }>;
  updated_at: string;
}

/**
 * Payload for PUT /products/:id (update endpoint).
 * All fields are optional — send only what changed.
 * Fields sourced from Merchant APIs V2.7.6 Postman Collection.
 */
export interface SallaUpdateProductPayload {
  name?: string;
  price?: number;
  quantity?: number;
  description?: string;
  categories?: number[];
  sale_price?: number;
  cost_price?: number;
  require_shipping?: boolean;
  weight?: number;
  weight_type?: "kg" | "g" | "lb" | "oz";
  sku?: string;
  metadata_title?: string;
  metadata_description?: string;
  tags?: number[];
}

/**
 * Response from POST /products/:product/images (attach image).
 * Image is sent as formdata with field "original" (URL) or "photo" (file).
 */
export interface SallaImageAttachResponse {
  id: number;
  image: {
    original: { url: string };
    thumbnail: { url: string };
  };
  sort: number;
  default: boolean;
  alt_seo: string;
}
