import {
  Component, OnInit, ChangeDetectionStrategy, inject, signal
} from "@angular/core";
import { CommonModule } from "@angular/common";
import { RouterLink } from "@angular/router";
import { ProductApiService, Product } from "../../../../core/services/product-api.service";
import { ProductCardComponent } from "../../../../shared/components/product-card/product-card.component";

@Component({
  selector: "lk-best-sellers",
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, RouterLink, ProductCardComponent],
  templateUrl: "./best-sellers.component.html",
  styleUrls: ["./best-sellers.component.scss"]
})
export class BestSellersComponent implements OnInit {
  private readonly productApi = inject(ProductApiService);

  products = signal<Product[]>([]);
  loading  = signal(true);

  ngOnInit(): void {
    this.productApi.getBestSellers(8).subscribe({
      next: (res) => {
        this.products.set(res.data ?? []);
        this.loading.set(false);
      },
      error: () => this.loading.set(false)
    });
  }

  trackById(_: number, item: Product): number {
    return item.id;
  }
}
