/* ================================================================
   AliExpress Open Platform — TypeScript Types
   Matches the API responses from api-sg.aliexpress.com
   ================================================================ */

// ---------- Search / Feed Results ----------

export interface AliExpressSearchProduct {
  product_id: number;
  product_title: string;
  product_main_image_url: string;
  product_small_image_urls?: { string: string[] };
  target_sale_price: string;
  target_sale_price_currency: string;
  target_original_price: string;
  target_original_price_currency: string;
  sale_price: string;
  sale_price_currency: string;
  original_price: string;
  original_price_currency: string;
  discount: string;
  evaluate_rate: string; // e.g. "91.3%"
  first_level_category_id: number;
  first_level_category_name?: string;
  second_level_category_id?: number;
  second_level_category_name?: string;
  orders_count?: number;
  ship_to_days?: string;
  lastest_volume?: number; // sic — AliExpress typo in their API
  product_detail_url?: string;
  product_video_url?: string;
  promotion_link?: string;
  shop_id?: number;
  shop_url?: string;
}

export interface AliExpressSearchResponse {
  current_page_no: number;
  current_record_count: number;
  total_page_no: number;
  total_record_count: number;
  products: { traffic_product_dto: AliExpressSearchProduct[] };
}

// ---------- Product Detail ----------

export interface AliExpressProductImage {
  image_url: string;
}

export interface AliExpressSkuProperty {
  sku_property_id: number;
  sku_property_name: string;
  sku_property_value: string;
  property_value_definition_name?: string;
  sku_image?: string;
}

export interface AliExpressSkuInfo {
  sku_id: string;
  sku_price: string;
  sku_stock: boolean;
  sku_available_stock?: number;
  offer_sale_price?: string;
  offer_bulk_sale_price?: string;
  sku_code?: string;
  id: string;
  currency_code: string;
  sku_attr: string;
  sku_property_list?: { sku_property: AliExpressSkuProperty[] };
}

export interface AliExpressProductDetail {
  product_id: number;
  category_id: number;
  subject: string; // title
  product_status_type: string;
  ws_display: string;
  product_unit?: number;
  is_pack_sell?: boolean;
  base_unit?: number;
  avg_evaluation_rating?: string;
  evaluation_count?: number;
  order_count?: number;
  sku_info_list?: { sku_info: AliExpressSkuInfo[] };
  image_u_r_ls?: string; // semicolon-separated
  product_props?: {
    product_property: {
      attr_name: string;
      attr_value: string;
    }[];
  };
  // Parsed from sku_info_list
  min_price?: string;
  max_price?: string;
  currency_code?: string;
}

export interface AliExpressProductDetailResponse {
  result: AliExpressProductDetail;
  rsp_code: number;
  rsp_msg: string;
  is_success: boolean;
}

// ---------- Freight / Shipping (aliexpress.ds.freight.query) ----------

export interface AliExpressDSFreightOption {
  code: string;                      // e.g. "CAINIAO_STANDARD"
  company: string;                   // e.g. "AliExpress standard shipping"
  shipping_fee_cent: string;         // e.g. "172.71" (amount in selected currency)
  shipping_fee_currency: string;     // e.g. "SAR"
  shipping_fee_format: string;       // e.g. "SAR 172.71"
  free_shipping: boolean;
  tracking: boolean;
  estimated_delivery_time: string;   // e.g. "Mar 08 - 25"
  delivery_date_desc: string;        // e.g. "Mar 08 - 25"
  min_delivery_days: number;
  max_delivery_days: number;
  guaranteed_delivery_days: string;
  ship_from_country: string;         // e.g. "CN"
  available_stock: string;
  mayHavePFS: boolean;
  ddpIncludeVATTax?: string;
  free_shipping_threshold?: string;
}

export interface AliExpressDSFreightResponse {
  result: {
    msg: string;
    code: number;
    success: boolean;
    delivery_options?: {
      delivery_option_d_t_o: AliExpressDSFreightOption[];
    };
  };
}

// ---------- Order Placement (Phase 6) ----------

export interface AliExpressOrderCreateRequest {
  product_id: number;
  product_count: number;
  logistics_address: {
    contact_person: string;
    phone_country: string;
    mobile_no: string;
    address: string;
    city: string;
    province: string;
    country: string;
    zip: string;
  };
  shipping_method: string;
}

export interface AliExpressOrderCreateResponse {
  order_list?: { number: number[] };
  is_success: boolean;
}

// ---------- Token Management ----------

export interface AliExpressTokenResponse {
  access_token: string;
  refresh_token: string;
  expires_in: number;
  refresh_expires_in: number;
  account_id?: string;
  user_id?: string;
  seller_id?: string;
  sp?: string;
  locale?: string;
  code?: string;
  expire_time?: number;
  refresh_token_valid_time?: number;
}

// ---------- API Client Config ----------

export interface AliExpressConfig {
  appKey: string;
  appSecret: string;
  apiUrl: string;
}

// ---------- Internal Search Params ----------

export interface ProductSearchParams {
  keyword?: string;
  feedName?: string;
  category_id?: string;
  page?: number;
  pageSize?: number;
  sort?: "SALE_PRICE_ASC" | "SALE_PRICE_DESC" | "LAST_VOLUME_DESC";
  minPrice?: number;
  maxPrice?: number;
  shipTo?: string;
  currency?: string;
  language?: string;
}

// ---------- Normalized Product (for our UI) ----------

export interface NormalizedProduct {
  id: number;
  title: string;
  image: string;
  images: string[];
  price: number;
  originalPrice: number;
  currency: string;
  discount: number;
  rating: number;
  orders: number;
  shipping: string;
  category: string;
  url: string;
  supplier: "aliexpress";
}

export interface NormalizedProductDetail extends NormalizedProduct {
  description: string;
  variants: NormalizedVariant[];
  properties: { name: string; value: string }[];
  shippingOptions: NormalizedShippingOption[];
  stock: boolean;
}

export interface NormalizedVariant {
  skuId: string;
  price: number;
  stock: boolean;
  stockQuantity?: number;
  properties: { name: string; value: string; image?: string }[];
}

export interface NormalizedShippingOption {
  name: string;
  price: number;
  currency: string;
  estimatedDays: string;
  trackingAvailable: boolean;
  serviceCode?: string; // e.g. "CAINIAO_STANDARD" — used for aliexpress.ds.order.create
}
