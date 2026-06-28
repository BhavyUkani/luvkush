import { Component, OnInit, ChangeDetectionStrategy, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { ApiService } from '../../../core/services/api.service';
import { imageUrl } from '../../../shared/utils/image-url';

interface Patch {
  id: number;
  name: string;
  slug: string;
  short_description: string | null;
  price: number;
  mrp: number | null;
  primary_image: string | null;
  size_info: string | null;
  colour_info: string | null;
}

@Component({
  selector: 'lk-patches-collection',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, RouterLink],
  template: `
    <div class="patches-page">
      <div class="patches-hero">
        <div class="patches-hero__inner">
          <p class="patches-hero__eyebrow">Luv Kush Natural · Hair Solutions</p>
          <h1 class="patches-hero__title">Custom Hair Patches</h1>
          <p class="patches-hero__sub">Seamless coverage, instant density. Crafted to match your natural hair — colour, texture, and style — for a completely undetectable result.</p>
          <div class="patches-hero__trust">
            <span>🎯 Precision Fit</span>
            <span>✦</span>
            <span>Colour Matched</span>
            <span>✦</span>
            <span>Long-Lasting Bond</span>
          </div>
        </div>
        <div class="patches-hero__leaf" aria-hidden="true">🌿</div>
      </div>

      <div class="patches-content">
        @if (loading()) {
          <div class="loading-grid">
            @for (i of [1,2,3,4]; track i) { <div class="card-skeleton"></div> }
          </div>
        } @else if (error()) {
          <div class="error-state">{{ error() }}</div>
        } @else if (!items().length) {
          <div class="empty-state"><p>No hair patches available yet.</p></div>
        } @else {
          <div class="patches-grid">
            @for (item of items(); track item.id) {
              <a class="patch-card" [routerLink]="['/hair-patches', item.slug]">
                <div class="patch-card__img-wrap">
                  <img [src]="imgUrl(item.primary_image)" [alt]="item.name" class="patch-card__img" loading="lazy" />
                </div>
                <div class="patch-card__body">
                  <h3 class="patch-card__name">{{ item.name }}</h3>
                  @if (item.short_description) { <p class="patch-card__desc">{{ item.short_description }}</p> }
                  @if (item.size_info) { <p class="patch-card__meta">Sizes: {{ item.size_info }}</p> }
                  <div class="patch-card__price-row">
                    <span class="patch-card__price">₹{{ item.price | number:'1.0-0' }}</span>
                    @if (item.mrp && item.mrp > item.price) {
                      <span class="patch-card__mrp">₹{{ item.mrp | number:'1.0-0' }}</span>
                    }
                  </div>
                  <button class="patch-card__btn">View Details</button>
                </div>
              </a>
            }
          </div>
        }
      </div>
    </div>
  `,
  styles: [`
    .patches-page { min-height: 60vh; }

    /* ─── Hero ─── */
    .patches-hero {
      background: linear-gradient(135deg, #20362A 0%, #36503B 100%);
      color: #fff;
      padding: clamp(3.5rem, 7vw, 5.5rem) clamp(1.5rem, 5vw, 4rem);
      display: flex;
      align-items: center;
      justify-content: space-between;
      overflow: hidden;
      position: relative;
    }
    .patches-hero::before {
      content: '';
      position: absolute;
      top: -80px; right: 15%;
      width: 300px; height: 300px;
      border-radius: 50%;
      background: radial-gradient(circle, rgba(184,132,71,0.1) 0%, transparent 70%);
      pointer-events: none;
    }
    .patches-hero__inner { max-width: 640px; position: relative; z-index: 1; }
    .patches-hero__eyebrow { font-family: 'Cinzel', serif; font-size: 0.6875rem; letter-spacing: 0.2em; text-transform: uppercase; color: rgba(226,201,126,0.8); margin: 0 0 1rem; }
    .patches-hero__title { font-family: 'Cormorant Garamond', serif; font-size: clamp(2.25rem, 5vw, 3.5rem); font-weight: 500; color: #FAF7F2; line-height: 1.15; margin: 0 0 1.125rem; letter-spacing: -0.01em; }
    .patches-hero__sub { font-family: 'Manrope', sans-serif; font-size: 1rem; color: rgba(250,247,242,0.72); line-height: 1.75; margin: 0 0 1.5rem; max-width: 520px; }
    .patches-hero__trust { display: flex; align-items: center; gap: 0.75rem; flex-wrap: wrap; font-family: 'Manrope', sans-serif; font-size: 0.8125rem; color: rgba(226,201,126,0.9); }
    .patches-hero__leaf { font-size: 5rem; opacity: 0.15; flex-shrink: 0; margin-left: 2rem; line-height: 1; }

    /* ─── Content ─── */
    .patches-content { max-width: 1200px; margin: 0 auto; padding: 3rem 2rem; }

    .loading-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(260px, 1fr)); gap: 1.5rem; }
    .card-skeleton { height: 380px; background: linear-gradient(90deg, #F1E8D8 25%, #EDE0CC 50%, #F1E8D8 75%); border-radius: 14px; animation: shimmer 1.5s infinite; background-size: 200% 100%; }
    @keyframes shimmer { 0% { background-position: 200% 0; } 100% { background-position: -200% 0; } }

    .error-state, .empty-state { text-align: center; padding: 4rem 2rem; color: #888; }

    .patches-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(260px, 1fr)); gap: 1.5rem; }

    /* ─── Card ─── */
    .patch-card { display: flex; flex-direction: column; background: #fff; border: 1px solid rgba(184,132,71,0.15); border-radius: 16px; overflow: hidden; text-decoration: none; color: inherit; transition: box-shadow 0.32s cubic-bezier(0.22,1,0.36,1), transform 0.32s cubic-bezier(0.22,1,0.36,1); }
    .patch-card:hover { box-shadow: 0 16px 48px rgba(32,54,42,0.12); transform: translateY(-6px); }

    .patch-card__img-wrap { aspect-ratio: 1; overflow: hidden; background: #FAF7F2; }
    .patch-card__img { width: 100%; height: 100%; object-fit: cover; transition: transform 0.4s ease; }
    .patch-card:hover .patch-card__img { transform: scale(1.06); }

    .patch-card__body { padding: 1.25rem; display: flex; flex-direction: column; flex: 1; gap: 0.375rem; }
    .patch-card__name { font-family: 'Cormorant Garamond', serif; font-size: 1.125rem; font-weight: 600; color: #1E1E1E; margin: 0; line-height: 1.3; }
    .patch-card__desc { font-family: 'Manrope', sans-serif; font-size: 0.8125rem; color: #888; margin: 0; line-height: 1.5; }
    .patch-card__meta { font-family: 'Manrope', sans-serif; font-size: 0.75rem; color: #B88447; margin: 0; font-weight: 500; }
    .patch-card__price-row { display: flex; align-items: center; gap: 0.5rem; margin-top: auto; padding-top: 0.75rem; }
    .patch-card__price { font-family: 'Cormorant Garamond', serif; font-size: 1.25rem; font-weight: 600; color: #1E1E1E; }
    .patch-card__mrp { font-family: 'Manrope', sans-serif; font-size: 0.875rem; color: #AAA; text-decoration: line-through; }
    .patch-card__btn { margin-top: 0.75rem; padding: 0.75rem 1rem; background: linear-gradient(135deg, #20362A 0%, #36503B 100%); color: #FAF7F2; border: none; border-radius: 8px; font-family: 'Manrope', sans-serif; font-size: 0.875rem; font-weight: 600; cursor: pointer; text-align: center; transition: opacity 0.18s; }
    .patch-card__btn:hover { opacity: 0.88; }
  `]
})
export class PatchesCollectionComponent implements OnInit {
  private readonly api = inject(ApiService);
  readonly imgUrl = imageUrl;

  items = signal<Patch[]>([]);
  loading = signal(true);
  error = signal('');

  ngOnInit(): void {
    this.api.get<any>('/hair-solutions/patches').subscribe({
      next: (res: any) => { this.items.set(res.data || []); this.loading.set(false); },
      error: () => { this.error.set('Failed to load. Please try again.'); this.loading.set(false); }
    });
  }
}
