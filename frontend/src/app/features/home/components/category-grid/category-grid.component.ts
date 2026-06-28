import {
  Component, OnInit, ChangeDetectionStrategy, inject, signal
} from "@angular/core";
import { CommonModule } from "@angular/common";
import { RouterLink } from "@angular/router";
import { ProductApiService, Category } from "../../../../core/services/product-api.service";
import { imageUrl } from "../../../../shared/utils/image-url";

@Component({
  selector: "lk-category-grid",
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, RouterLink],
  templateUrl: "./category-grid.component.html",
  styleUrls: ["./category-grid.component.scss"]
})
export class CategoryGridComponent implements OnInit {
  private readonly productApi = inject(ProductApiService);

  categories = signal<Category[]>([]);
  loading    = signal(true);
  readonly imgUrl = imageUrl;

  ngOnInit(): void {
    this.productApi.getCategories().subscribe({
      next: (res) => {
        this.categories.set((res.data ?? []).slice(0, 6));
        this.loading.set(false);
      },
      error: () => this.loading.set(false)
    });
  }

  trackById(_: number, item: Category): number {
    return item.id;
  }
}
