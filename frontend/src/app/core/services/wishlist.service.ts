import { Injectable, inject, signal, computed } from '@angular/core';
import { Observable, of } from 'rxjs';
import { tap, catchError } from 'rxjs/operators';
import { ApiService } from './api.service';
import { AuthService } from './auth.service';
import { Product } from './product-api.service';

@Injectable({ providedIn: 'root' })
export class WishlistService {
  private readonly api = inject(ApiService);
  private readonly auth = inject(AuthService);

  private _items = signal<Product[]>([]);
  private _wishlistIds = signal<Set<number>>(new Set());

  readonly items = this._items.asReadonly();
  readonly count = computed(() => this._items().length);
  readonly isEmpty = computed(() => this._items().length === 0);

  isWishlisted(productId: number): boolean {
    return this._wishlistIds().has(productId);
  }

  load(): Observable<any> {
    if (!this.auth.isLoggedIn()) return of(null);

    return this.api.get<Product[]>('/wishlist').pipe(
      tap((res: any) => {
        const items = res.data || [];
        this._items.set(items);
        this._wishlistIds.set(new Set(items.map((i: Product) => i.id)));
      }),
      catchError(() => of(null))
    );
  }

  toggle(product: Product): Observable<any> {
    if (!this.auth.isLoggedIn()) return of(null);

    const isCurrentlyWishlisted = this.isWishlisted(product.id);

    // Optimistic update
    if (isCurrentlyWishlisted) {
      this._items.update(items => items.filter(i => i.id !== product.id));
      this._wishlistIds.update(ids => { const s = new Set(ids); s.delete(product.id); return s; });
    } else {
      this._items.update(items => [product, ...items]);
      this._wishlistIds.update(ids => new Set([...ids, product.id]));
    }

    return this.api.post(`/wishlist/${product.id}`).pipe(
      catchError(err => {
        // Revert on error
        if (isCurrentlyWishlisted) {
          this._items.update(items => [product, ...items]);
          this._wishlistIds.update(ids => new Set([...ids, product.id]));
        } else {
          this._items.update(items => items.filter(i => i.id !== product.id));
          this._wishlistIds.update(ids => { const s = new Set(ids); s.delete(product.id); return s; });
        }
        return of(null);
      })
    );
  }

  remove(productId: number): Observable<any> {
    if (!this.auth.isLoggedIn()) return of(null);
    this._items.update(items => items.filter(i => i.id !== productId));
    this._wishlistIds.update(ids => { const s = new Set(ids); s.delete(productId); return s; });
    return this.api.delete(`/wishlist/${productId}`).pipe(catchError(() => of(null)));
  }

  clear(): void {
    this._items.set([]);
    this._wishlistIds.set(new Set());
  }
}
