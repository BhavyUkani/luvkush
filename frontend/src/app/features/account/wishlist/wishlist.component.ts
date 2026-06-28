import { Component, OnInit, inject, signal, ChangeDetectionStrategy } from "@angular/core";
import { CommonModule } from "@angular/common";
import { RouterLink } from "@angular/router";
import { WishlistService } from "../../../core/services/wishlist.service";
import { CartService } from "../../../core/services/cart.service";
import { ToastService } from "../../../core/services/toast.service";
import { ProductCardComponent } from "../../../shared/components/product-card/product-card.component";
import { AccountNavComponent } from "../account-nav/account-nav.component";
import { Product } from "../../../core/services/product-api.service";

@Component({
  selector: "lk-account-wishlist",
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, RouterLink, ProductCardComponent, AccountNavComponent],
  templateUrl: "./wishlist.component.html",
  styleUrls: ["./wishlist.component.scss"]
})
export class AccountWishlistComponent implements OnInit {
  readonly wishlist = inject(WishlistService);
  private readonly cart  = inject(CartService);
  private readonly toast = inject(ToastService);

  loading = signal(true);

  ngOnInit(): void {
    this.wishlist.load().subscribe({
      next: () => this.loading.set(false),
      error: () => this.loading.set(false)
    });
  }

  remove(product: Product): void {
    this.wishlist.toggle(product).subscribe(() => this.toast.info("Removed from wishlist"));
  }

  moveToCart(product: Product): void {
    this.cart.addItem({
      productId: product.id, name: product.name, price: product.price,
      mrp: product.mrp ?? product.price, quantity: 1,
      image: product.primary_image ?? "", slug: product.slug
    }).subscribe({
      next: () => {
        this.toast.success("Added to cart!");
        this.wishlist.remove(product.id).subscribe();
      },
      error: () => this.toast.error("Could not add to cart")
    });
  }
}