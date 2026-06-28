import {
  Component, OnInit, ChangeDetectionStrategy, inject, signal, afterNextRender, CUSTOM_ELEMENTS_SCHEMA
} from "@angular/core";
import { CommonModule } from "@angular/common";
import { Router, RouterLink } from "@angular/router";
import { ProductApiService, Product } from "../../../../core/services/product-api.service";
import { CartService } from "../../../../core/services/cart.service";
import { WishlistService } from "../../../../core/services/wishlist.service";
import { AuthService } from "../../../../core/services/auth.service";
import { imageUrl } from "../../../../shared/utils/image-url";

@Component({
  selector: "lk-hero",
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, RouterLink],
  templateUrl: "./hero.component.html",
  styleUrls: ["./hero.component.scss"],
  schemas: [CUSTOM_ELEMENTS_SCHEMA]
})
export class HeroComponent implements OnInit {
  private readonly productApi = inject(ProductApiService);
  private readonly cart       = inject(CartService);
  private readonly auth       = inject(AuthService);
  private readonly router     = inject(Router);
  readonly wishlist            = inject(WishlistService);

  products    = signal<Product[]>([]);
  loading     = signal(true);
  addedProductIds = signal<Set<number>>(new Set());
  swiperReady = signal(false);
  readonly imgUrl = imageUrl;

  constructor() {
    afterNextRender(() => {
      import('swiper/element/bundle').then(({ register }) => {
        register();
        this.swiperReady.set(true);
      });
    });
  }

  ngOnInit(): void {
    this.productApi.getBestSellers(5).subscribe({
      next: (res) => {
        this.products.set(res.data ?? []);
        this.loading.set(false);
      },
      error: () => this.loading.set(false)
    });
  }

  getDiscount(p: Product): number {
    if (!p || !p.mrp || p.mrp <= p.price) return 0;
    return Math.round(((p.mrp - p.price) / p.mrp) * 100);
  }

  getRatingInt(p: Product): number {
    return Math.round(p?.rating_avg ?? 0);
  }

  addToCart(product: Product): void {
    if (!this.auth.isLoggedIn()) {
      this.router.navigate(['/login'], { queryParams: { returnUrl: '/shop' } });
      return;
    }
    this.cart.addItem({
      productId: product.id, name: product.name,
      price: product.price, mrp: product.mrp,
      quantity: 1, image: product.primary_image ?? "", slug: product.slug
    }).subscribe();

    this.addedProductIds.update(set => {
      const newSet = new Set(set);
      newSet.add(product.id);
      return newSet;
    });

    setTimeout(() => {
      this.addedProductIds.update(set => {
        const newSet = new Set(set);
        newSet.delete(product.id);
        return newSet;
      });
    }, 2200);
  }

  toggleWishlist(product: Product): void {
    if (!this.auth.isLoggedIn()) {
      this.router.navigate(['/login'], { queryParams: { returnUrl: '/shop' } });
      return;
    }
    this.wishlist.toggle(product).subscribe();
  }
}
