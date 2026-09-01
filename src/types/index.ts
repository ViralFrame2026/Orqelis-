export type ProductStatus =
  | "available"
  | "last_units"
  | "sold_out"
  | "coming_soon"
  | "hidden"
  | "archived";

export type Category = {
  id: string;
  name: string;
  slug: string;
  icon: string;
  product_count?: number;
  created_at?: string;
};

export type ProductImage = {
  id?: string;
  image_url: string;
  position: number;
};

export type Product = {
  id: string;
  name: string;
  slug: string;
  sku: string | null;
  short_description: string;
  description: string;
  price: number;
  previous_price: number | null;
  installments: number | null;
  installment_price: number | null;
  category_id: string;
  category: Category;
  stock: number | null;
  status: ProductStatus;
  featured: boolean;
  offer: boolean;
  is_new: boolean;
  tags: string[];
  images: ProductImage[];
  features: string[];
  created_at: string;
  updated_at: string;
};

export type CartProduct = Pick<Product, "id" | "name" | "slug" | "price"> & {
  image_url: string;
};

export type CartItem = CartProduct & {
  quantity: number;
};

export type SiteSettings = {
  storeName: string;
  whatsappNumber: string;
  instagramUrl: string;
  shippingText: string;
  deliveryText: string;
  email: string;
};

export type ProductFilters = {
  query?: string;
  category?: string;
  minPrice?: number;
  maxPrice?: number;
  offersOnly?: boolean;
  featuredOnly?: boolean;
  availableOnly?: boolean;
  sort?: "newest" | "price-asc" | "price-desc" | "featured";
};
