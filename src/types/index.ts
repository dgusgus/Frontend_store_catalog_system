// ── Auth ───────────────────────────────────────────
export interface AuthUser {
  id: number
  email: string
  name?: string
  phone?: string
  role: 'USER' | 'ADMIN'
  createdAt: string
}

export interface AuthResponse {
  user: AuthUser
  accessToken: string
  refreshToken: string
}

// ── Catalog ────────────────────────────────────────
export interface Category {
  id: number
  name: string
  slug: string
  description?: string
  imageUrl?: string
  parentId?: number
  children: Pick<Category, 'id' | 'name' | 'slug'>[]
}

export interface Variant {
  id: number
  sku: string
  name: string
  stock: number
  price: string | null  // null = hereda precio del producto
}

export interface ProductImage {
  id: number
  url: string
  alt?: string
  position: number
  publicId?: string
}

export interface Tag {
  id: number
  name: string
  slug: string
}

export interface Product {
  id: number
  name: string
  slug: string
  description?: string
  price: string
  comparePrice?: string
  published: boolean
  createdAt: string
  updatedAt: string
  category: Pick<Category, 'id' | 'name' | 'slug'>
  variants: Variant[]
  images: ProductImage[]
  tags: Tag[]
  _count: { variants: number }
}

// ── Pagination ─────────────────────────────────────
export interface Pagination {
  total: number
  page: number
  limit: number
  totalPages: number
  hasNext: boolean
  hasPrev: boolean
}

export interface PaginatedResponse<T> {
  items: T[]
  pagination: Pagination
}

// ── Filters ────────────────────────────────────────
export interface ProductFilters {
  q?: string
  category?: string
  tag?: string
  minPrice?: number
  maxPrice?: number
  inStock?: boolean
  published?: boolean
  page?: number
  limit?: number
  orderBy?: 'price_asc' | 'price_desc' | 'newest' | 'name'
}

// ── API Errors ─────────────────────────────────────
export interface ApiError {
  error: string
  code?: string
}

// ── Cart ───────────────────────────────────────────
export interface CartItem {
  productId:   number
  productName: string
  slug:        string
  image?:      string
  variantId?:  number
  variantName?: string
  price:       number   // precio efectivo al momento de agregar
  quantity:    number
  maxStock:    number  // para validar incrementos sin API
}

export interface DiscountResult {
  valid:          boolean
  code:           string
  type:           'PERCENT' | 'FIXED'
  value:          number
  discountAmount: number
  finalAmount:    number
}