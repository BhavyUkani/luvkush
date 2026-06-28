import {
  Component, OnInit, OnDestroy, inject, signal, computed, ChangeDetectionStrategy
} from "@angular/core";
import { ActivatedRoute, Router, RouterLink } from "@angular/router";
import { CommonModule } from "@angular/common";
import { FormsModule } from "@angular/forms";
import { Subject } from "rxjs";
import { takeUntil } from "rxjs/operators";
import { ProductApiService, Product, Category, ProductFilters } from "../../../core/services/product-api.service";
import { ProductCardComponent } from "../../../shared/components/product-card/product-card.component";
import { SeoService } from "../../../core/services/seo.service";

@Component({
  selector: "lk-collection",
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, RouterLink, FormsModule, ProductCardComponent],
  templateUrl: "./collection.component.html",
  styleUrls: ["./collection.component.scss"]
})
export class CollectionComponent implements OnInit, OnDestroy {
  private readonly productApi = inject(ProductApiService);
  private readonly seo        = inject(SeoService);
  private readonly route      = inject(ActivatedRoute);
  private readonly router     = inject(Router);
  private readonly destroy$   = new Subject<void>();

  products       = signal<Product[]>([]);
  categories     = signal<Category[]>([]);
  loading        = signal(true);
  filterOpen     = signal(false);
  viewMode       = signal<"grid" | "list">("grid");
  totalProducts  = signal(0);
  currentPage    = signal(1);
  totalPages     = signal(1);

  selectedCategory = "";
  sortBy           = "created_at:DESC";
  minPrice         = "";
  maxPrice         = "";
  inStockOnly      = false;
  ratingMin        = 0;
  searchQuery      = "";

  readonly PAGE_SIZE = 12;
  readonly SORT_OPTIONS = [
    { value: "created_at:DESC", label: "Newest First" },
    { value: "sales_count:DESC", label: "Best Selling" },
    { value: "price:ASC",        label: "Price: Low to High" },
    { value: "price:DESC",       label: "Price: High to Low" },
    { value: "rating_avg:DESC",  label: "Highest Rated" }
  ];

  readonly RATING_OPTIONS = [
    { value: 4, label: "4★ & above" },
    { value: 3, label: "3★ & above" },
    { value: 2, label: "2★ & above" }
  ];

  currentCategory = computed(() =>
    this.categories().find(c => c.slug === this.selectedCategory) ?? null
  );

  pageRange = computed(() => {
    const total = this.totalPages();
    const cur   = this.currentPage();
    const delta = 2;
    const range: number[] = [];
    for (let i = Math.max(1, cur - delta); i <= Math.min(total, cur + delta); i++) range.push(i);
    return range;
  });

  activeFilterCount = computed(() => {
    let n = 0;
    if (this.selectedCategory) n++;
    if (this.minPrice || this.maxPrice) n++;
    if (this.inStockOnly) n++;
    if (this.ratingMin > 0) n++;
    return n;
  });

  ngOnInit(): void {
    this.productApi.getCategories().pipe(takeUntil(this.destroy$)).subscribe(res => {
      this.categories.set(res.data ?? []);
    });

    this.route.params.pipe(takeUntil(this.destroy$)).subscribe(params => {
      if (params["slug"]) this.selectedCategory = params["slug"];
      this.loadProducts();
    });

    this.route.queryParams.pipe(takeUntil(this.destroy$)).subscribe(qp => {
      if (qp["search"]) this.searchQuery = qp["search"];
      if (qp["category"]) { this.selectedCategory = qp["category"]; this.loadProducts(); }
      if (qp["sort"]) this.sortBy = qp["sort"];
    });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  loadProducts(): void {
    this.loading.set(true);
    const [sort, order] = this.sortBy.split(":");

    const filters: ProductFilters = {
      page: this.currentPage(),
      limit: this.PAGE_SIZE,
      sort,
      order: (order ?? "DESC") as "ASC" | "DESC"
    };

    if (this.selectedCategory) filters.category = this.selectedCategory;
    if (this.minPrice) filters.minPrice = Number(this.minPrice);
    if (this.maxPrice) filters.maxPrice = Number(this.maxPrice);
    if (this.inStockOnly) filters.inStock = true;
    if (this.searchQuery) filters.search = this.searchQuery;

    this.productApi.getProducts(filters).pipe(takeUntil(this.destroy$)).subscribe({
      next: (res: any) => {
        let prods = res.data ?? [];
        if (this.ratingMin > 0) prods = prods.filter((p: Product) => (p.rating_avg ?? 0) >= this.ratingMin);
        this.products.set(prods);
        this.totalProducts.set(res.total ?? 0);
        this.totalPages.set(res.pages ?? 1);
        this.loading.set(false);
        const cat = this.currentCategory();
        this.seo.updateSeo({
          title: cat ? `${cat.name} — Luv Kush Natural` : "Shop All Products — Luv Kush Natural",
          description: cat?.description || "Premium Ayurvedic hair care products. 100% natural ingredients."
        });
      },
      error: () => this.loading.set(false)
    });
  }

  onFilterChange(): void { this.currentPage.set(1); this.loadProducts(); }
  onSortChange():  void { this.currentPage.set(1); this.loadProducts(); }

  clearFilters(): void {
    this.selectedCategory = "";
    this.sortBy = "created_at:DESC";
    this.minPrice = "";
    this.maxPrice = "";
    this.inStockOnly = false;
    this.ratingMin = 0;
    this.searchQuery = "";
    this.currentPage.set(1);
    this.filterOpen.set(false);
    this.loadProducts();
  }

  goToPage(page: number): void {
    if (page < 1 || page > this.totalPages()) return;
    this.currentPage.set(page);
    this.loadProducts();
    if (typeof window !== "undefined") window.scrollTo({ top: 0, behavior: "smooth" });
  }
}