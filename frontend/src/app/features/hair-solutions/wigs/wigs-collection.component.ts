import { Component, OnInit, ChangeDetectionStrategy, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { ApiService } from '../../../core/services/api.service';
import { imageUrl } from '../../../shared/utils/image-url';

interface Wig {
  id: number;
  name: string;
  slug: string;
  short_description: string | null;
  price: number;
  mrp: number | null;
  primary_image: string | null;
  gender: string | null;
  size_info: string | null;
  colour_info: string | null;
}

@Component({
  selector: 'lk-wigs-collection',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, RouterLink],
  template: `
    <div class="wigs-page">
      <!-- Premium Hero Banner -->
      <div class="wigs-hero">
        <div class="wigs-hero__inner">
          <p class="wigs-hero__eyebrow">Luv Kush Natural · Hair Solutions</p>
          <h1 class="wigs-hero__title">Premium Hair Wigs</h1>
          <p class="wigs-hero__sub">Undetectable natural hairlines, crafted with care. Restore your confidence — naturally, beautifully, permanently.</p>
          <div class="wigs-hero__trust">
            <span>🌿 100% Natural Hair</span>
            <span>✦</span>
            <span>Undetectable Hairline</span>
            <span>✦</span>
            <span>Custom Fit Available</span>
          </div>
        </div>
        <div class="wigs-hero__leaf" aria-hidden="true">🌿</div>
      </div>

      <!-- Gender Filters -->
      <div class="wigs-filters">
        <div class="wigs-filters__inner">
          <button class="wigs-filter-btn" [class.active]="genderFilter() === ''" (click)="genderFilter.set('')">View All</button>
          <button class="wigs-filter-btn" [class.active]="genderFilter() === 'male'" (click)="genderFilter.set('male')">Men's</button>
          <button class="wigs-filter-btn" [class.active]="genderFilter() === 'female'" (click)="genderFilter.set('female')">Women's</button>
          <button class="wigs-filter-btn" [class.active]="genderFilter() === 'unisex'" (click)="genderFilter.set('unisex')">Unisex</button>
        </div>
      </div>

      <!-- Content -->
      <div class="wigs-content">
        @if (loading()) {
          <div class="loading-grid">
            @for (i of [1,2,3,4,6]; track i) { <div class="wig-card-skeleton"></div> }
          </div>
        } @else if (error()) {
          <div class="error-state">{{ error() }}</div>
        } @else if (!filtered().length) {
          <div class="empty-state">
            <p>No wigs found for this filter.</p>
            <button (click)="genderFilter.set('')">View All</button>
          </div>
        } @else {
          <div class="wigs-grid">
            @for (wig of filtered(); track wig.id) {
              <a class="wig-card" [routerLink]="['/hair-wigs', wig.slug]">
                <div class="wig-card__img-wrap">
                  <img [src]="imgUrl(wig.primary_image)" [alt]="wig.name" class="wig-card__img" loading="lazy" />
                  @if (wig.gender) {
                    <span class="wig-card__gender-badge">{{ wig.gender | titlecase }}</span>
                  }
                </div>
                <div class="wig-card__body">
                  <h3 class="wig-card__name">{{ wig.name }}</h3>
                  @if (wig.short_description) { <p class="wig-card__desc">{{ wig.short_description }}</p> }
                  @if (wig.size_info) { <p class="wig-card__meta">Sizes: {{ wig.size_info }}</p> }
                  <div class="wig-card__price-row">
                    <span class="wig-card__price">₹{{ wig.price | number:'1.0-0' }}</span>
                    @if (wig.mrp && wig.mrp > wig.price) {
                      <span class="wig-card__mrp">₹{{ wig.mrp | number:'1.0-0' }}</span>
                    }
                  </div>
                  <button class="wig-card__btn">View Details</button>
                </div>
              </a>
            }
          </div>
        }
      </div>
    </div>
  `,
  styles: [`
    .wigs-page { min-height: 60vh; }

    /* ─── Hero ─── */
    .wigs-hero {
      background: linear-gradient(135deg, #20362A 0%, #36503B 100%);
      color: #fff;
      padding: clamp(3.5rem, 7vw, 5.5rem) clamp(1.5rem, 5vw, 4rem);
      display: flex;
      align-items: center;
      justify-content: space-between;
      overflow: hidden;
      position: relative;
    }
    .wigs-hero::before {
      content: '';
      position: absolute;
      top: -80px; right: 15%;
      width: 300px; height: 300px;
      border-radius: 50%;
      background: radial-gradient(circle, rgba(184,132,71,0.1) 0%, transparent 70%);
      pointer-events: none;
    }
    .wigs-hero__inner { max-width: 640px; position: relative; z-index: 1; }
    .wigs-hero__eyebrow { font-family: 'Cinzel', serif; font-size: 0.6875rem; letter-spacing: 0.2em; text-transform: uppercase; color: rgba(226,201,126,0.8); margin: 0 0 1rem; }
    .wigs-hero__title { font-family: 'Cormorant Garamond', serif; font-size: clamp(2.25rem, 5vw, 3.5rem); font-weight: 500; color: #FAF7F2; line-height: 1.15; margin: 0 0 1.125rem; letter-spacing: -0.01em; }
    .wigs-hero__sub { font-family: 'Manrope', sans-serif; font-size: 1rem; color: rgba(250,247,242,0.72); line-height: 1.75; margin: 0 0 1.5rem; max-width: 520px; }
    .wigs-hero__trust { display: flex; align-items: center; gap: 0.75rem; flex-wrap: wrap; font-family: 'Manrope', sans-serif; font-size: 0.8125rem; color: rgba(226,201,126,0.9); }
    .wigs-hero__leaf { font-size: 5rem; opacity: 0.15; flex-shrink: 0; margin-left: 2rem; line-height: 1; }

    /* ─── Filters ─── */
    .wigs-filters { background: #F1E8D8; border-bottom: 1px solid #E5D5BC; padding: 1rem 2rem; }
    .wigs-filters__inner { max-width: 1200px; margin: 0 auto; display: flex; gap: 0.625rem; flex-wrap: wrap; align-items: center; }
    .wigs-filter-btn { padding: 0.5rem 1.375rem; border: 1.5px solid #E5D5BC; border-radius: 99px; background: #FAF7F2; color: #555; font-family: 'Manrope', sans-serif; font-size: 0.875rem; font-weight: 500; cursor: pointer; transition: all 0.18s; }
    .wigs-filter-btn:hover { border-color: #36503B; color: #36503B; }
    .wigs-filter-btn.active { background: #20362A; border-color: #20362A; color: #FAF7F2; }

    /* ─── Content ─── */
    .wigs-content { max-width: 1200px; margin: 0 auto; padding: 3rem 2rem; }

    .loading-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(260px, 1fr)); gap: 1.5rem; }
    .wig-card-skeleton { height: 380px; background: linear-gradient(90deg, #F1E8D8 25%, #EDE0CC 50%, #F1E8D8 75%); border-radius: 14px; animation: shimmer 1.5s infinite; background-size: 200% 100%; }
    @keyframes shimmer { 0% { background-position: 200% 0; } 100% { background-position: -200% 0; } }

    .error-state, .empty-state { text-align: center; padding: 4rem 2rem; color: #888; }
    .empty-state button { margin-top: 1rem; padding: 0.625rem 1.5rem; background: #20362A; color: #FAF7F2; border: none; border-radius: 8px; font-size: 0.875rem; cursor: pointer; font-family: 'Manrope', sans-serif; }

    .wigs-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(260px, 1fr)); gap: 1.5rem; }

    /* ─── Card ─── */
    .wig-card { display: flex; flex-direction: column; background: #fff; border: 1px solid rgba(184,132,71,0.15); border-radius: 16px; overflow: hidden; text-decoration: none; color: inherit; transition: box-shadow 0.32s cubic-bezier(0.22,1,0.36,1), transform 0.32s cubic-bezier(0.22,1,0.36,1); }
    .wig-card:hover { box-shadow: 0 16px 48px rgba(32,54,42,0.12); transform: translateY(-6px); }

    .wig-card__img-wrap { position: relative; aspect-ratio: 1; overflow: hidden; background: #FAF7F2; }
    .wig-card__img { width: 100%; height: 100%; object-fit: cover; transition: transform 0.4s ease; }
    .wig-card:hover .wig-card__img { transform: scale(1.06); }
    .wig-card__gender-badge { position: absolute; top: 0.75rem; left: 0.75rem; background: rgba(32,54,42,0.85); color: #FAF7F2; font-family: 'Manrope', sans-serif; font-size: 0.6875rem; font-weight: 600; padding: 3px 9px; border-radius: 99px; text-transform: uppercase; letter-spacing: 0.06em; }

    .wig-card__body { padding: 1.25rem; display: flex; flex-direction: column; flex: 1; gap: 0.375rem; }
    .wig-card__name { font-family: 'Cormorant Garamond', serif; font-size: 1.125rem; font-weight: 600; color: #1E1E1E; margin: 0; line-height: 1.3; }
    .wig-card__desc { font-family: 'Manrope', sans-serif; font-size: 0.8125rem; color: #888; margin: 0; line-height: 1.5; }
    .wig-card__meta { font-family: 'Manrope', sans-serif; font-size: 0.75rem; color: #B88447; margin: 0; font-weight: 500; }
    .wig-card__price-row { display: flex; align-items: center; gap: 0.5rem; margin-top: auto; padding-top: 0.75rem; }
    .wig-card__price { font-family: 'Cormorant Garamond', serif; font-size: 1.25rem; font-weight: 600; color: #1E1E1E; }
    .wig-card__mrp { font-family: 'Manrope', sans-serif; font-size: 0.875rem; color: #AAA; text-decoration: line-through; }
    .wig-card__btn { margin-top: 0.75rem; padding: 0.75rem 1rem; background: linear-gradient(135deg, #20362A 0%, #36503B 100%); color: #FAF7F2; border: none; border-radius: 8px; font-family: 'Manrope', sans-serif; font-size: 0.875rem; font-weight: 600; cursor: pointer; text-align: center; transition: opacity 0.18s; }
    .wig-card__btn:hover { opacity: 0.88; }
  `]
})
export class WigsCollectionComponent implements OnInit {
  private readonly api = inject(ApiService);
  readonly imgUrl = imageUrl;

  allWigs = signal<Wig[]>([]);
  loading = signal(true);
  error = signal('');
  genderFilter = signal('');

  filtered = computed(() => {
    const g = this.genderFilter();
    const wigs = this.allWigs();
    if (!g) return wigs;
    return wigs.filter(w => w.gender === g);
  });

  ngOnInit(): void {
    this.api.get<any>('/hair-solutions/wigs').subscribe({
      next: (res: any) => { this.allWigs.set(res.data || []); this.loading.set(false); },
      error: () => { this.error.set('Failed to load wigs. Please try again.'); this.loading.set(false); }
    });
  }
}
