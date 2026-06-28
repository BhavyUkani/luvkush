import {
  Component, OnInit, OnDestroy, inject, signal, ChangeDetectionStrategy, PLATFORM_ID
} from "@angular/core";
import { CommonModule, isPlatformBrowser } from "@angular/common";
import { RouterLink, ActivatedRoute, Router } from "@angular/router";
import { FormsModule } from "@angular/forms";
import { Subject } from "rxjs";
import { takeUntil, debounceTime, distinctUntilChanged } from "rxjs/operators";
import { ProductApiService, Product } from "../../../core/services/product-api.service";
import { ProductCardComponent } from "../../../shared/components/product-card/product-card.component";
import { SeoService } from "../../../core/services/seo.service";

@Component({
  selector: "lk-search",
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, FormsModule, ProductCardComponent],
  templateUrl: "./search.component.html",
  styleUrls: ["./search.component.scss"]
})
export class SearchComponent implements OnInit, OnDestroy {
  private readonly productApi = inject(ProductApiService);
  private readonly seo        = inject(SeoService);
  private readonly route      = inject(ActivatedRoute);
  private readonly router     = inject(Router);
  private readonly platformId = inject(PLATFORM_ID);
  private readonly destroy$   = new Subject<void>();
  private readonly input$     = new Subject<string>();

  query     = signal("");
  results   = signal<Product[]>([]);
  loading   = signal(false);
  searched  = signal(false);
  history   = signal<string[]>([]);

  readonly TRENDING = ["Hair Oil", "Bhringraj", "Hair Wig", "Hair Patch", "Amla"];

  ngOnInit(): void {
    this.loadHistory();

    this.input$.pipe(
      debounceTime(350),
      distinctUntilChanged(),
      takeUntil(this.destroy$)
    ).subscribe(q => this.doSearch(q));

    this.route.queryParams.pipe(takeUntil(this.destroy$)).subscribe(qp => {
      if (qp["q"]) {
        this.query.set(qp["q"]);
        this.doSearch(qp["q"]);
      }
    });
  }

  ngOnDestroy(): void { this.destroy$.next(); this.destroy$.complete(); }

  onInput(q: string): void {
    this.query.set(q);
    this.input$.next(q);
  }

  onSubmit(): void {
    const q = this.query().trim();
    if (!q) return;
    this.router.navigate([], { queryParams: { q }, replaceUrl: true });
    this.doSearch(q);
  }

  doSearch(q: string): void {
    const trimmed = q.trim();
    if (!trimmed) { this.results.set([]); this.searched.set(false); return; }
    this.loading.set(true);
    this.searched.set(true);
    this.seo.updateSeo({ title: `"${trimmed}" â€” Search â€” Luv Kush Natural` });
    this.productApi.search(trimmed, 24).pipe(takeUntil(this.destroy$)).subscribe({
      next: (res) => {
        this.results.set(res.data ?? []);
        this.loading.set(false);
        this.saveHistory(trimmed);
      },
      error: () => this.loading.set(false)
    });
  }

  searchTrend(term: string): void { this.query.set(term); this.doSearch(term); }
  searchHistory(term: string): void { this.query.set(term); this.doSearch(term); }
  clearHistory(): void { this.history.set([]); if (isPlatformBrowser(this.platformId)) localStorage.removeItem("lk_search_history"); }

  private loadHistory(): void {
    if (!isPlatformBrowser(this.platformId)) return;
    try {
      const raw = localStorage.getItem("lk_search_history");
      this.history.set(raw ? JSON.parse(raw) : []);
    } catch { /* ignore */ }
  }

  private saveHistory(q: string): void {
    if (!isPlatformBrowser(this.platformId)) return;
    try {
      const arr = [q, ...this.history().filter(h => h !== q)].slice(0, 6);
      this.history.set(arr);
      localStorage.setItem("lk_search_history", JSON.stringify(arr));
    } catch { /* ignore */ }
  }
}