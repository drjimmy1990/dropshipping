/* ================================================================
   Zid API TypeScript Types
   
   Covers: products, categories, orders, tokens, and API responses.
   API Base: https://api.zid.sa/v1
   ================================================================ */

// ---------- Token Types ----------

export interface ZidTokenResponse {
  access_token: string;
  refresh_token: string;
  token_type: string;
  expires_in: number;
  /** Zid returns a partner-level Authorization JWT in the token response */
  authorization?: string;
}

// ---------- Product Types ----------

export interface ZidLocalizedString {
  ar: string;
  en: string;
}

export interface ZidCreateProductPayload {
  name: ZidLocalizedString;
  price: number;
  sale_price?: number;
  sku: string;
  quantity?: number;
  is_infinite?: boolean;
  is_draft?: boolean;
  requires_shipping?: boolean;
  is_taxable?: boolean;
  short_description?: ZidLocalizedString;
  weight?: string;
}

export interface ZidProductResponse {
  id: string;
  product_class?: string;
  sku: string;
  barcode?: string;
  parent_id?: string | null;
  name: ZidLocalizedString;
  slug?: string;
  short_description?: string;
  price: number;
  sale_price?: number;
  formatted_price?: string;
  formatted_sale_price?: string;
  currency?: string;
  currency_symbol?: string;
  attributes?: unknown[];
  categories?: unknown[];
  display_order?: number;
  has_options?: boolean;
  has_fields?: boolean;
  images?: ZidProductImage[];
  videos?: unknown[];
  is_draft?: boolean;
  quantity?: number;
  is_infinite?: boolean;
  html_url?: string;
  weight?: number;
  keywords?: string[];
  requires_shipping?: boolean;
  is_taxable?: boolean;
  structure?: unknown;
  seo?: unknown;
  rating?: number;
  store_id?: string;
  created_at?: string;
  updated_at?: string;
}

export interface ZidProductImage {
  id?: string;
  url?: string;
  image_url?: string;
  original?: string;
  src?: string;
  /** Zid returns image as a nested object with size variants */
  image?: string | {
    large?: string;
    full_size?: string;
    medium?: string;
    small?: string;
    thumbnail?: string;
  };
  thumbnail_url?: string;
  alt?: string;
  alt_text?: string;
  sort_order?: number;
  display_order?: number;
  is_default?: boolean;
}

// ---------- Category Types ----------

export interface ZidCategoryItem {
  id: string;
  name: ZidLocalizedString;
  slug?: string;
  parent_id?: string | null;
  is_published?: boolean;
  display_order?: number;
  children?: ZidCategoryItem[];
  products_count?: number;
  created_at?: string;
  updated_at?: string;
}

// ---------- Order Types ----------

export interface ZidOrderItem {
  id: string;
  product_id: string;
  product_name?: string;
  sku?: string;
  quantity: number;
  price: number;
  total: number;
}

export interface ZidOrderResponse {
  id: string;
  order_number?: string;
  status?: string;
  payment_status?: string;
  currency?: string;
  subtotal?: number;
  shipping_cost?: number;
  total?: number;
  customer?: {
    id?: string;
    name?: string;
    email?: string;
    phone?: string;
  };
  shipping_address?: {
    name?: string;
    street?: string;
    city?: string;
    state?: string;
    country?: string;
    postal_code?: string;
    phone?: string;
  };
  items?: ZidOrderItem[];
  created_at?: string;
  updated_at?: string;
}

// ---------- API Response Wrappers ----------

export interface ZidApiResponse<T> {
  status?: string;
  message?: {
    type?: string;
    code?: string;
    name?: string;
    description?: string;
  };
  data?: T;
}

export interface ZidListResponse<T> {
  count?: number;
  next?: string | null;
  previous?: string | null;
  results?: T[];
}

// ---------- Variant Types ----------

export interface ZidVariantOption {
  name: ZidLocalizedString;
  values: ZidLocalizedString[];
}

export interface ZidCreateVariantsPayload {
  options: ZidVariantOption[];
}
