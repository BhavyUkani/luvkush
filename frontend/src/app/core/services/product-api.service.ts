import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService, ApiResponse } from './api.service';

export interface Product {
  id: number;
  name: string;
  slug: string;
  subtitle?: string;
  price: number;
  mrp: number;
  primary_image?: string;
  images?: string | string[];
  rating_avg?: number;
  rating_count?: number;
  is_bestseller?: boolean;
  is_new?: boolean;
  is_featured?: boolean;
  stock_quantity?: number;
  short_description?: string;
  description?: string;
  benefits?: string;
  how_to_use?: string;
  badges?: string;
  ingredients_list?: string;
  category_name?: string;
  category_slug?: string;
  length_cm?: number;
  width_cm?: number;
  height_cm?: number;
  weight?: number;
  payment_mode?: string;
  advance_amount?: number;
  video_url?: string;
  seo_title?: string;
  seo_description?: string;
  seo_keywords?: string;
  canonical_url?: string;
  variants?: ProductVariant[];
  recent_reviews?: Review[];
  is_wishlisted?: boolean;
}

export interface ProductVariant {
  id: number;
  name: string;
  value: string;
  price_modifier: number;
  stock: number;
}

export interface Review {
  id: number;
  rating: number;
  title?: string;
  body: string;
  created_at: string;
  user_name: string;
  is_verified_purchase?: boolean;
}

export interface Category {
  id: number;
  name: string;
  slug: string;
  description?: string;
  image_url?: string;
  icon?: string;
  display_order?: number;
  status?: string;
  product_count?: number;
}

export interface ProductFilters {
  page?: number;
  limit?: number;
  category?: string;
  sort?: string;
  order?: 'ASC' | 'DESC';
  minPrice?: number;
  maxPrice?: number;
  search?: string;
  inStock?: boolean;
  featured?: boolean;
}

@Injectable({ providedIn: 'root' })
export class ProductApiService {
  private readonly api = inject(ApiService);

  getProducts(filters: ProductFilters = {}): Observable<ApiResponse<Product[]>> {
    return this.api.get<Product[]>('/products', filters as Record<string, any>);
  }

  getFeatured(limit = 8): Observable<ApiResponse<Product[]>> {
    return this.api.get<Product[]>('/products/featured', { limit });
  }

  getBestSellers(limit = 8): Observable<ApiResponse<Product[]>> {
    return this.api.get<Product[]>('/products', { sort: 'sales_count', order: 'DESC', limit });
  }

  getNewArrivals(limit = 8): Observable<ApiResponse<Product[]>> {
    return this.api.get<Product[]>('/products', { sort: 'created_at', order: 'DESC', limit });
  }

  getBySlug(slug: string): Observable<ApiResponse<Product>> {
    return this.api.get<Product>(`/products/${slug}`);
  }

  getRelated(id: number): Observable<ApiResponse<Product[]>> {
    return this.api.get<Product[]>(`/products/${id}/related`);
  }

  search(q: string, limit = 10): Observable<ApiResponse<Product[]>> {
    return this.api.get<Product[]>('/products/search', { q, limit });
  }

  getCategories(): Observable<ApiResponse<Category[]>> {
    return this.api.get<Category[]>('/categories');
  }

  getCategoryBySlug(slug: string): Observable<ApiResponse<Category>> {
    return this.api.get<Category>(`/categories/${slug}`);
  }

  getProductReviews(productId: number, page = 1, limit = 10): Observable<ApiResponse<Review[]>> {
    return this.api.get<Review[]>(`/reviews/product/${productId}`, { page, limit });
  }

  getRatingSummary(productId: number): Observable<ApiResponse<any>> {
    return this.api.get(`/reviews/product/${productId}/summary`);
  }

  submitReview(data: { product_id: number; rating: number; title?: string; body: string }): Observable<ApiResponse<Review>> {
    return this.api.post<Review>('/reviews', data);
  }
}
