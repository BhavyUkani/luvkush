import { Injectable, signal, computed, inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { Observable, of } from 'rxjs';
import { tap, catchError } from 'rxjs/operators';
import { ApiService } from './api.service';
import { AuthService } from './auth.service';
import { imageUrl } from '../../shared/utils/image-url';

export interface CartItem {
  id: number;
  productId: number;
  variantId?: number;
  name: string;
  variant?: string;
  price: number;
  mrp: number;
  quantity: number;
  image: string;
  slug: string;
  payment_mode?: string;
  advance_amount?: number | null;
}

export interface CartSummary {
  subtotal: number;
  shipping: number;
  tax: number;
  discount: number;
  total: number;
  item_count: number;
}

@Injectable({ providedIn: 'root' })
export class CartService {
  private readonly api = inject(ApiService);
  private readonly auth = inject(AuthService);
  private readonly platformId = inject(PLATFORM_ID);

  private _items = signal<CartItem[]>(this.loadFromStorage());
  private _summary = signal<CartSummary>({ subtotal: 0, shipping: 0, tax: 0, discount: 0, total: 0, item_count: 0 });
  private _appliedCoupon = signal<any>(null);
  private _loading = signal(false);

  readonly items = this._items.asReadonly();
  readonly summary = this._summary.asReadonly();
  readonly appliedCoupon = this._appliedCoupon.asReadonly();
  readonly loading = this._loading.asReadonly();
  readonly count = computed(() => this._items().reduce((sum, i) => sum + i.quantity, 0));
  readonly subtotal = computed(() => this._items().reduce((sum, i) => sum + i.price * i.quantity, 0));
  readonly savings = computed(() => this._items().reduce((sum, i) => sum + (i.mrp - i.price) * i.quantity, 0));
  readonly isEmpty = computed(() => this._items().length === 0);

  loadFromServer(): Observable<any> {
    if (!this.auth.isLoggedIn()) return of(null);
    this._loading.set(true);
    return this.api.get('/cart').pipe(
      tap((res: any) => {
        if (res.data) {
          this.syncFromServer(res.data);
        }
        this._loading.set(false);
      }),
      catchError(() => { this._loading.set(false); return of(null); })
    );
  }

  addItem(item: Omit<CartItem, 'id'>): Observable<any> {
    if (this.auth.isLoggedIn()) {
      return this.api.post('/cart/items', {
        product_id: item.productId,
        variant_id: item.variantId,
        quantity: item.quantity
      }).pipe(
        tap((res: any) => { if (res.data) this.syncFromServer(res.data); }),
        catchError(() => {
          this.addToLocal(item);
          return of(null);
        })
      );
    }
    this.addToLocal(item);
    return of(null);
  }

  updateQuantity(itemId: number, quantity: number): Observable<any> {
    if (this.auth.isLoggedIn()) {
      if (quantity <= 0) return this.removeItem(itemId);
      return this.api.put(`/cart/items/${itemId}`, { quantity }).pipe(
        tap((res: any) => { if (res.data) this.syncFromServer(res.data); }),
        catchError(() => of(null))
      );
    }
    if (quantity <= 0) {
      this._items.update(items => items.filter(i => i.id !== itemId));
    } else {
      this._items.update(items => items.map(i => i.id === itemId ? { ...i, quantity } : i));
    }
    this.saveToStorage();
    return of(null);
  }

  removeItem(itemId: number): Observable<any> {
    if (this.auth.isLoggedIn()) {
      return this.api.delete(`/cart/items/${itemId}`).pipe(
        tap((res: any) => { if (res.data) this.syncFromServer(res.data); }),
        catchError(() => of(null))
      );
    }
    this._items.update(items => items.filter(i => i.id !== itemId));
    this.saveToStorage();
    return of(null);
  }

  applyCoupon(code: string): Observable<any> {
    if (!this.auth.isLoggedIn()) return of(null);
    return this.api.post('/cart/coupon', { code }).pipe(
      tap((res: any) => {
        if (res.data?.coupon) {
          this._appliedCoupon.set(res.data.coupon);
        }
      })
    );
  }

  removeCoupon(): void {
    this._appliedCoupon.set(null);
  }

  clearCart(): void {
    this._items.set([]);
    this._appliedCoupon.set(null);
    if (isPlatformBrowser(this.platformId)) {
      try { localStorage.removeItem('lk_cart'); } catch { /* ignore */ }
    }
    if (this.auth.isLoggedIn()) {
      this.api.delete('/cart').pipe(catchError(() => of(null))).subscribe();
    }
  }

  private addToLocal(item: Omit<CartItem, 'id'>): void {
    this._items.update(items => {
      const existing = items.find(i =>
        i.productId === item.productId && i.variantId === item.variantId
      );
      if (existing) {
        return items.map(i =>
          i.productId === item.productId && i.variantId === item.variantId
            ? { ...i, quantity: i.quantity + (item.quantity || 1) }
            : i
        );
      }
      return [...items, { ...item, id: Date.now(), quantity: item.quantity || 1, payment_mode: item.payment_mode || 'full_cod', advance_amount: item.advance_amount ?? null }];
    });
    this.saveToStorage();
  }

  private syncFromServer(data: any): void {
    const items: CartItem[] = (data.items || []).map((i: any) => ({
      id: i.id,
      productId: i.product_id,
      variantId: i.variant_id,
      name: i.name,
      variant: i.variant_name,
      price: i.variant_id ? i.price + (i.price_modifier || 0) : i.price,
      mrp: i.mrp,
      quantity: i.quantity,
      image: imageUrl(i.primary_image),
      slug: i.slug,
      payment_mode: i.payment_mode || 'full_cod',
      advance_amount: i.advance_amount ? Number(i.advance_amount) : null
    }));
    this._items.set(items);
    this._summary.set({
      subtotal: data.subtotal || 0,
      shipping: data.shipping || 0,
      tax: data.tax || 0,
      discount: 0,
      total: data.total || 0,
      item_count: data.item_count || items.length
    });
    this.saveToStorage();
  }

  private loadFromStorage(): CartItem[] {
    if (!isPlatformBrowser(this.platformId)) return [];
    try {
      const stored = localStorage.getItem('lk_cart');
      return stored ? JSON.parse(stored) : [];
    } catch { return []; }
  }

  private saveToStorage(): void {
    if (!isPlatformBrowser(this.platformId)) return;
    try {
      localStorage.setItem('lk_cart', JSON.stringify(this._items()));
    } catch { /* ignore */ }
  }
}
