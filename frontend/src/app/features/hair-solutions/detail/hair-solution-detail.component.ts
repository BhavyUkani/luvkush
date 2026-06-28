import { Component, OnInit, ChangeDetectionStrategy, inject, signal, computed, PLATFORM_ID } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { ApiService } from '../../../core/services/api.service';
import { CartService } from '../../../core/services/cart.service';
import { AuthService } from '../../../core/services/auth.service';
import { ProductApiService, Review } from '../../../core/services/product-api.service';
import { imageUrl } from '../../../shared/utils/image-url';
import { Title } from '@angular/platform-browser';

@Component({
  selector: 'lk-hair-solution-detail',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, RouterLink],
  template: `
    @if (loading()) {
      <div class="hsd-loading">Loading...</div>
    } @else if (!item()) {
      <div class="hsd-error">
        <h2>Item Not Found</h2>
        <a routerLink="/hair-wigs">← Back to Collection</a>
      </div>
    } @else {
      <div class="hsd-page">

        <!-- Breadcrumb -->
        <div class="hsd-breadcrumb">
          <a routerLink="/">Home</a>
          <span>›</span>
          <a [routerLink]="item()!.type === 'patch' ? '/hair-patches' : '/hair-wigs'">
            {{ item()!.type === 'patch' ? 'Hair Patches' : 'Hair Wigs' }}
          </a>
          <span>›</span>
          <span>{{ item()!.name }}</span>
        </div>

        <div class="hsd-layout">
          <!-- Image Column -->
          <div class="hsd-images">
            <div class="hsd-main-img-wrap">
              <img [src]="imgUrl(activeImage())" [alt]="item()!.name" class="hsd-main-img" />
            </div>
            @if (allImages().length > 1) {
              <div class="hsd-thumbs">
                @for (img of allImages(); track img) {
                  <button class="hsd-thumb" [class.hsd-thumb--active]="img === activeImage()" (click)="activeImage.set(img)">
                    <img [src]="imgUrl(img)" [alt]="item()!.name" />
                  </button>
                }
              </div>
            }
          </div>

          <!-- Info Column -->
          <div class="hsd-info">
            <h1 class="hsd-info__title">{{ item()!.name }}</h1>
            
            <!-- Rating Header -->
            @if (product()?.rating_count && product()?.rating_count > 0) {
              <button class="hsd-rating" (click)="scrollToReviews()" type="button">
                <span class="hsd-stars" aria-hidden="true">
                  @for (s of stars; track s) {
                    <svg width="16" height="16" viewBox="0 0 24 24" [class.hsd-star--filled]="s <= (product()?.rating_avg ?? 0)"
                      [class.hsd-star--half]="s - 0.5 <= (product()?.rating_avg ?? 0) && s > (product()?.rating_avg ?? 0)">
                      <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"
                        stroke="currentColor" stroke-width="1.5" fill="none"/>
                    </svg>
                  }
                </span>
                <span class="hsd-rating-avg">{{ product()?.rating_avg | number:'1.1-1' }}</span>
                <span class="hsd-rating-count">({{ product()?.rating_count }} reviews)</span>
              </button>
            }

            @if (item()!.short_description) {
              <p class="hsd-info__sub">{{ item()!.short_description }}</p>
            }

            <div class="hsd-info__price-row">
              <span class="hsd-info__price">₹{{ finalPrice() | number:'1.0-0' }}</span>
              @if (item()!.mrp && item()!.mrp > finalPrice()) {
                <span class="hsd-info__mrp">₹{{ item()!.mrp | number:'1.0-0' }}</span>
                <span class="hsd-info__save">
                  Save ₹{{ (item()!.mrp - finalPrice()) | number:'1.0-0' }}
                </span>
              }
            </div>

            <!-- Attributes -->
            <div class="hsd-attrs">
              @if (item()!.gender) {
                <div class="hsd-attr">
                  <span class="hsd-attr__key">For</span>
                  <span class="hsd-attr__val">{{ item()!.gender | titlecase }}</span>
                </div>
              }
              @if (item()!.colour_info) {
                <div class="hsd-attr">
                  <span class="hsd-attr__key">Colours</span>
                  <span class="hsd-attr__val">{{ item()!.colour_info }}</span>
                </div>
              }
            </div>

            <!-- Sizes Selection Variant Block -->
            @if (parsedSizes().length > 0) {
              <div class="hsd-variants">
                <p class="hsd-variants-label">Select Size: <strong>{{ selectedSize() ?? 'Select' }}</strong></p>
                <div class="hsd-variant-btns">
                  @for (size of parsedSizes(); track size) {
                    <button
                      class="hsd-variant-btn"
                      [class.hsd-variant-btn--active]="selectedSize() === size"
                      (click)="selectSize(size)">
                      {{ size }}
                    </button>
                  }
                </div>
              </div>
            }

            <!-- Shopping Controls -->
            <div class="hsd-cta">
              @if (maxStock() === 0) {
                <p class="hsd-stock hsd-stock--oos">Out of Stock</p>
              } @else {
                <div class="hsd-actions">
                  <div class="hsd-qty">
                    <button class="hsd-qty-btn" (click)="decreaseQty()" [disabled]="quantity() <= 1" aria-label="Decrease quantity">−</button>
                    <span class="hsd-qty-val" aria-live="polite">{{ quantity() }}</span>
                    <button class="hsd-qty-btn" (click)="increaseQty()" [disabled]="quantity() >= maxStock()" aria-label="Increase quantity">+</button>
                  </div>
                  <div class="hsd-cta-row">
                    <button
                      class="hsd-btn hsd-btn--cart"
                      [class.hsd-btn--added]="addedToCart()"
                      [disabled]="addingToCart() || loadingProduct()"
                      (click)="addToCart()">
                      @if (addingToCart()) {
                        <span class="hsd-spinner"></span> Adding…
                      } @else if (addedToCart()) {
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M20 6L9 17l-5-5"/></svg>
                        Added
                      } @else {
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z"/><line x1="3" y1="6" x2="21" y2="6"/><path d="M16 10a4 4 0 01-8 0"/></svg>
                        Add to Cart
                      }
                    </button>
                    <button class="hsd-btn hsd-btn--buy" [disabled]="addingToCart() || loadingProduct()" (click)="buyNow()">
                      Buy Now
                    </button>
                  </div>

                  <!-- Payment Mode Banner Notice -->
                  @if (paymentMode() !== 'full_cod') {
                    <div class="hsd-payment-note">
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="1" y="4" width="22" height="16" rx="2"/><line x1="1" y1="10" x2="23" y2="10"/></svg>
                      @switch (paymentMode()) {
                        @case ('full_online') { <span>Online payment only — COD not available for this product</span> }
                        @case ('partial') { <span>₹{{ advanceAmount() | number:'1.0-0' }} advance online · remaining on delivery</span> }
                        @case ('hybrid') { <span>Choose: COD, Online, or Partial payment at checkout</span> }
                      }
                    </div>
                  }
                </div>
              }
              <p class="hsd-cta__note">Custom sizing & fitting available. Contact us for details.</p>
            </div>
          </div>
        </div>

        <!-- Tabs -->
        <div class="hsd-tabs" id="hsd-tabs-container">
          <div class="hsd-tab-nav">
            @for (tab of tabs; track tab) {
              @if (hasTabContent(tab)) {
                <button class="hsd-tab-btn" [class.active]="activeTab() === tab" (click)="activeTab.set(tab)">
                  {{ tab === 'Reviews' ? 'Reviews (' + (product()?.rating_count ?? 0) + ')' : tab }}
                </button>
              }
            }
          </div>
          <div class="hsd-tab-content">
            @if (activeTab() === 'Description' && item()!.description) {
              <div class="hsd-tab-text" [innerHTML]="item()!.description"></div>
            }
            @if (activeTab() === 'How To Use' && item()!.how_to_use) {
              <div class="hsd-tab-text" style="white-space: pre-line">{{ item()!.how_to_use }}</div>
            }
            @if (activeTab() === 'Specifications') {
              <table class="hsd-spec-table">
                @if (item()!.gender) { <tr><td>Gender</td><td>{{ item()!.gender | titlecase }}</td></tr> }
                @if (item()!.size_info) { <tr><td>Available Sizes</td><td>{{ item()!.size_info }}</td></tr> }
                @if (item()!.colour_info) { <tr><td>Colours</td><td>{{ item()!.colour_info }}</td></tr> }
                @if (item()!.type) { <tr><td>Type</td><td>{{ item()!.type | titlecase }}</td></tr> }
              </table>
            }
            @if (activeTab() === 'Reviews') {
              <div class="hsd-reviews-panel">
                @if (reviewsLoading()) {
                  <div class="hsd-reviews__loading">
                    @for (_ of [1,2,3]; track $index) {
                      <div class="hsd-review-skeleton">
                        <div class="hsd-review-skeleton__header shimmer"></div>
                        <div class="hsd-review-skeleton__body shimmer"></div>
                      </div>
                    }
                  </div>
                } @else {
                  <!-- Rating Summary -->
                  @if (ratingSummary(); as summary) {
                    <div class="hsd-rating-summary">
                      <div class="hsd-rating-summary__avg">
                        <span class="hsd-rating-summary__num">{{ summary.average }}</span>
                        <div class="hsd-rating-summary__stars" aria-hidden="true">
                          @for (s of stars; track s) {
                            <svg width="20" height="20" viewBox="0 0 24 24"
                              [attr.fill]="s <= summary.average ? 'currentColor' : 'none'"
                              stroke="currentColor" stroke-width="1.5">
                              <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
                            </svg>
                          }
                        </div>
                        <span class="hsd-rating-summary__total">{{ summary.total }} reviews</span>
                      </div>
                      <div class="hsd-rating-summary__bars">
                        @for (s of [5,4,3,2,1]; track s) {
                          <div class="hsd-rating-bar">
                            <span class="hsd-rating-bar__label">{{ s }} ★</span>
                            <div class="hsd-rating-bar__track">
                              <div class="hsd-rating-bar__fill" [style.width.%]="getRatingPct(s)"></div>
                            </div>
                            <span class="hsd-rating-bar__count">{{ getStar(s) }}</span>
                          </div>
                        }
                      </div>
                    </div>
                  }

                  <!-- Review List -->
                  @if (reviews().length > 0) {
                    <ul class="hsd-reviews__list" aria-label="Customer reviews">
                      @for (rev of reviews(); track rev.id) {
                        <li class="hsd-review">
                          <div class="hsd-review__header">
                            <span class="hsd-review__avatar" aria-hidden="true">{{ rev.user_name ? rev.user_name[0].toUpperCase() : 'A' }}</span>
                            <div class="hsd-review__meta">
                              <span class="hsd-review__author">{{ rev.user_name ?? 'Anonymous' }}</span>
                              @if (rev.is_verified_purchase) {
                                <span class="hsd-review__verified">Verified Purchase</span>
                              }
                              <time class="hsd-review__date" [attr.datetime]="rev.created_at">{{ rev.created_at | date:'MMM d, y' }}</time>
                            </div>
                            <div class="hsd-review__stars" aria-label="{{ rev.rating }} out of 5 stars">
                              @for (s of stars; track s) {
                                <svg width="14" height="14" viewBox="0 0 24 24"
                                  [attr.fill]="s <= rev.rating ? 'currentColor' : 'none'"
                                  stroke="currentColor" stroke-width="1.5">
                                  <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
                                </svg>
                              }
                            </div>
                          </div>
                          @if (rev.title) { <h4 class="hsd-review__title">{{ rev.title }}</h4> }
                          <p class="hsd-review__body">{{ rev.body }}</p>
                        </li>
                      }
                    </ul>
                  } @else {
                    <div class="hsd-reviews__empty">
                      <p>No reviews yet. Be the first to review this product!</p>
                    </div>
                  }

                  <!-- Write a Review -->
                  @if (auth.isLoggedIn()) {
                    <div class="hsd-review-form">
                      <h3 class="hsd-review-form__title">Write a Review</h3>
                      @if (reviewSubmitted()) {
                        <div class="hsd-review-form__success">
                          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M20 6L9 17l-5-5"/></svg>
                          Thank you! Your review has been submitted.
                        </div>
                      } @else {
                        <div class="hsd-review-form__stars">
                          @for (s of stars; track s) {
                            <button type="button" class="hsd-review-form__star"
                              [class.active]="s <= (reviewHover() || reviewForm().rating)"
                              (mouseenter)="reviewHover.set(s)"
                              (mouseleave)="reviewHover.set(0)"
                              (click)="setReviewRating(s)"
                              [attr.aria-label]="s + ' star'">
                              <svg width="28" height="28" viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" stroke-width="1"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>
                            </button>
                          }
                        </div>
                        <div class="hsd-review-form__fields">
                          <input type="text" [value]="reviewForm().title"
                            (input)="setReviewTitle($any($event.target).value)"
                            class="hsd-review-form__input" placeholder="Review title (optional)" maxlength="100" />
                          <textarea [value]="reviewForm().body"
                            (input)="setReviewBody($any($event.target).value)"
                            class="hsd-review-form__textarea" rows="4" placeholder="Share your experience with this product..." maxlength="2000"></textarea>
                        </div>
                        @if (reviewError()) {
                          <p class="hsd-review-form__error">{{ reviewError() }}</p>
                        }
                        <button class="hsd-review-form__submit" (click)="submitReview()" [disabled]="reviewSubmitting()">
                          {{ reviewSubmitting() ? 'Submitting...' : 'Submit Review' }}
                        </button>
                      }
                    </div>
                  } @else {
                    <div class="hsd-review-form__login-prompt">
                      <a routerLink="/login" [queryParams]="{returnUrl: router.url}">Sign in</a> to write a review
                    </div>
                  }
                }
              </div>
            }
          </div>
        </div>
      </div>
    }
  `,
  styles: [`
    .hsd-loading { text-align: center; padding: 6rem 2rem; color: #888; }
    .hsd-error { text-align: center; padding: 6rem 2rem; }
    .hsd-error h2 { color: #DC2626; }
    .hsd-error a { color: #B87333; }

    .hsd-page { max-width: 1200px; margin: 0 auto; padding: 2rem; }

    .hsd-breadcrumb { display: flex; align-items: center; gap: 0.5rem; font-size: 0.8125rem; color: #888; margin-bottom: 2rem; flex-wrap: wrap; }
    .hsd-breadcrumb a { color: #B87333; text-decoration: none; }
    .hsd-breadcrumb a:hover { text-decoration: underline; }

    .hsd-layout { display: grid; grid-template-columns: 1fr 1fr; gap: 3rem; margin-bottom: 3rem; }
    @media (max-width: 768px) { .hsd-layout { grid-template-columns: 1fr; } }

    .hsd-main-img-wrap { aspect-ratio: 1; border-radius: 12px; overflow: hidden; background: #F5F2EE; }
    .hsd-main-img { width: 100%; height: 100%; object-fit: cover; }
    .hsd-thumbs { display: flex; gap: 0.5rem; margin-top: 0.75rem; flex-wrap: wrap; }
    .hsd-thumb { width: 64px; height: 64px; border: 2px solid #E8E8E8; border-radius: 6px; overflow: hidden; cursor: pointer; padding: 0; background: none; }
    .hsd-thumb img { width: 100%; height: 100%; object-fit: cover; }
    .hsd-thumb--active { border-color: #B87333; }

    .hsd-info__title { font-size: clamp(1.5rem, 3vw, 2rem); font-weight: 700; color: #1C1C1C; margin: 0; }
    .hsd-info__sub { font-size: 0.9375rem; color: #888; margin: 0 0 1.25rem; }

    .hsd-info__price-row { display: flex; align-items: center; gap: 0.75rem; margin-bottom: 1.5rem; }
    .hsd-info__price { font-size: 1.75rem; font-weight: 700; color: #1C1C1C; }
    .hsd-info__mrp { font-size: 1.0625rem; color: #AAA; text-decoration: line-through; }
    .hsd-info__save { font-size: 0.875rem; font-weight: 600; color: #15803D; background: rgba(21,128,61,0.1); padding: 3px 8px; border-radius: 4px; }

    .hsd-attrs { display: flex; flex-direction: column; gap: 0.625rem; margin-bottom: 1.5rem; }
    .hsd-attr { display: flex; gap: 1rem; font-size: 0.875rem; }
    .hsd-attr__key { font-weight: 600; color: #888; min-width: 80px; }
    .hsd-attr__val { color: #1C1C1C; }

    .hsd-variants { margin-bottom: 1.5rem; }
    .hsd-variants-label { font-size: 0.875rem; font-weight: 600; color: #888; margin-bottom: 0.5rem; }
    .hsd-variants-label strong { color: #1C1C1C; }
    .hsd-variant-btns { display: flex; gap: 0.5rem; flex-wrap: wrap; }
    .hsd-variant-btn { padding: 0.5rem 1rem; border: 1.5px solid #EDE8E0; border-radius: 6px; background: #fff; cursor: pointer; font-size: 0.875rem; font-weight: 500; color: #1C1C1C; transition: all 0.15s; }
    .hsd-variant-btn:hover { border-color: #B87333; }
    .hsd-variant-btn--active { border-color: #B87333; background: rgba(184,115,51,0.05); font-weight: 600; }

    .hsd-cta { padding: 1.5rem; background: #FAF8F5; border: 1.5px solid #EDE8E0; border-radius: 10px; }
    .hsd-cta__note { font-size: 0.8125rem; color: #888; margin: 0.75rem 0 0; }

    .hsd-stock { font-size: 0.875rem; font-weight: 500; padding: 0.5rem 0.875rem; border-radius: 6px; display: inline-block; margin-bottom: 1rem; }
    .hsd-stock--oos { background: #FFF5F5; color: #C53030; border: 1px solid #FEB2B2; }

    .hsd-actions { display: flex; flex-direction: column; gap: 1rem; }
    .hsd-qty { display: flex; align-items: center; border: 1.5px solid #EDE8E0; border-radius: 6px; width: fit-content; overflow: hidden; background: #fff; }
    .hsd-qty-btn { width: 40px; height: 40px; border: none; background: #FAF8F5; font-size: 1.25rem; font-weight: 500; cursor: pointer; color: #1C1C1C; display: flex; align-items: center; justify-content: center; transition: background 0.15s; }
    .hsd-qty-btn:hover:not(:disabled) { background: #EDE8E0; }
    .hsd-qty-btn:disabled { opacity: 0.4; cursor: not-allowed; }
    .hsd-qty-val { width: 50px; text-align: center; font-size: 1rem; font-weight: 600; border-left: 1.5px solid #EDE8E0; border-right: 1.5px solid #EDE8E0; line-height: 40px; color: #1C1C1C; }

    .hsd-cta-row { display: flex; gap: 0.75rem; width: 100%; }
    @media (max-width: 480px) { .hsd-cta-row { flex-direction: column; } }

    .hsd-btn { display: inline-flex; align-items: center; justify-content: center; gap: 0.5rem; padding: 0.875rem 1.5rem; border-radius: 8px; font-size: 0.9375rem; font-weight: 700; border: none; cursor: pointer; transition: all 0.15s; flex: 1; text-decoration: none; }
    .hsd-btn:active { transform: scale(0.98); }
    .hsd-btn:disabled { opacity: 0.6; cursor: not-allowed; }

    .hsd-btn--cart { background: #B87333; color: #fff; }
    .hsd-btn--cart:hover:not(:disabled) { opacity: 0.9; }
    .hsd-btn--cart.hsd-btn--added { background: #276749; }

    .hsd-btn--buy { background: #fff; color: #B87333; border: 2px solid #B87333; }
    .hsd-btn--buy:hover:not(:disabled) { background: rgba(184,115,51,0.05); }

    .hsd-spinner { width: 16px; height: 16px; border: 2px solid rgba(255,255,255,0.4); border-top-color: #fff; border-radius: 50%; animation: hsd-spin 0.7s linear infinite; }
    @keyframes hsd-spin { to { transform: rotate(360deg); } }

    .hsd-payment-note { display: flex; align-items: center; gap: 0.5rem; margin-top: 1rem; padding: 0.75rem; background: rgba(184,115,51,0.06); border: 1px solid rgba(184,115,51,0.15); border-radius: 6px; font-size: 0.8125rem; color: #B87333; font-weight: 500; }
    .hsd-payment-note svg { flex-shrink: 0; }

    .hsd-tabs { border-top: 1.5px solid #EDE8E0; padding-top: 2rem; }
    .hsd-tab-nav { display: flex; gap: 0; border-bottom: 1.5px solid #EDE8E0; margin-bottom: 1.5rem; }
    .hsd-tab-btn { padding: 0.75rem 1.5rem; background: none; border: none; border-bottom: 2.5px solid transparent; font-size: 0.875rem; font-weight: 600; color: #888; cursor: pointer; margin-bottom: -1.5px; }
    .hsd-tab-btn.active { border-bottom-color: #B87333; color: #B87333; }
    .hsd-tab-content { font-size: 0.9375rem; color: #555; line-height: 1.7; }
    .hsd-tab-text { max-width: 720px; }
    .hsd-spec-table { width: 100%; max-width: 480px; border-collapse: collapse; }
    .hsd-spec-table td { padding: 0.625rem 0.875rem; border-bottom: 1px solid #F0EDE8; font-size: 0.875rem; }
    .hsd-spec-table td:first-child { font-weight: 600; color: #888; width: 160px; }

    /* Reviews and rating styles */
    .hsd-rating { display: inline-flex; align-items: center; gap: 0.5rem; background: none; border: none; padding: 0; cursor: pointer; color: inherit; margin-bottom: 1rem; }
    .hsd-stars { display: flex; gap: 2px; color: #B87333; }
    .hsd-stars svg { fill: none; stroke: currentColor; }
    .hsd-star--filled { fill: currentColor !important; }
    .hsd-star--half { position: relative; }
    .hsd-rating-avg { font-weight: 700; font-size: 0.9rem; color: #1C1C1C; }
    .hsd-rating-count { font-size: 0.8125rem; color: #888; }

    .hsd-rating-summary { display: flex; gap: 3rem; flex-wrap: wrap; padding: 1.5rem; background: #FAF8F5; border-radius: 8px; margin-bottom: 2rem; }
    .hsd-rating-summary__avg { display: flex; flex-direction: column; align-items: center; gap: 0.5rem; min-width: 120px; }
    .hsd-rating-summary__num { font-size: 3rem; font-weight: 700; color: #1C1C1C; line-height: 1; }
    .hsd-rating-summary__stars { display: flex; gap: 2px; color: #B87333; }
    .hsd-rating-summary__total { font-size: 0.875rem; color: #888; }
    .hsd-rating-summary__bars { flex: 1; display: flex; flex-direction: column; gap: 0.5rem; min-width: 200px; }
    
    .hsd-rating-bar { display: flex; align-items: center; gap: 0.75rem; }
    .hsd-rating-bar__label { font-size: 0.8125rem; color: #888; width: 32px; flex-shrink: 0; }
    .hsd-rating-bar__track { flex: 1; height: 8px; background: #FAF8F5; border: 1px solid #EDE8E0; border-radius: 4px; overflow: hidden; }
    .hsd-rating-bar__fill { height: 100%; background: #B87333; border-radius: 4px; transition: width 0.4s ease; }
    .hsd-rating-bar__count { font-size: 0.8125rem; color: #888; width: 24px; text-align: right; flex-shrink: 0; }

    .hsd-reviews__list { list-style: none; padding: 0; margin: 0; display: flex; flex-direction: column; gap: 0; }
    .hsd-review { padding: 1.5rem 0; border-bottom: 1px solid #EDE8E0; }
    .hsd-review:last-child { border-bottom: none; }
    .hsd-review__header { display: flex; align-items: center; flex-wrap: wrap; gap: 0.75rem; margin-bottom: 0.75rem; }
    .hsd-review__avatar { width: 36px; height: 36px; border-radius: 50%; background: #2e7d32; color: #fff; font-weight: 600; font-size: 0.875rem; display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
    .hsd-review__meta { display: flex; flex-direction: column; gap: 2px; flex: 1; }
    .hsd-review__author { font-weight: 600; font-size: 0.875rem; color: #1C1C1C; }
    .hsd-review__verified { font-size: 0.75rem; color: #276749; font-weight: 500; background: #F0FFF4; padding: 1px 6px; border-radius: 10px; display: inline-block; }
    .hsd-review__date { font-size: 0.75rem; color: #888; }
    .hsd-review__stars { display: flex; gap: 2px; color: #B87333; margin-left: auto; }
    .hsd-review__title { font-size: 0.9375rem; font-weight: 600; color: #1C1C1C; margin: 0 0 0.375rem; }
    .hsd-review__body { font-size: 0.9rem; color: #555; line-height: 1.65; margin: 0; }
    
    .hsd-reviews__empty { text-align: center; padding: 3rem 1rem; color: #888; }
    .hsd-review-form { margin-top: 2rem; padding-top: 1.5rem; border-top: 2px solid #EDE8E0; }
    .hsd-review-form__title { font-size: 1rem; font-weight: 700; color: #1C1C1C; margin: 0 0 1rem; }
    .hsd-review-form__stars { display: flex; gap: 0.25rem; margin-bottom: 1rem; }
    .hsd-review-form__star { background: none; border: none; cursor: pointer; padding: 0; color: #D1D5DB; transition: color 0.15s; }
    .hsd-review-form__star.active { color: #F59E0B; }
    .hsd-review-form__fields { display: flex; flex-direction: column; gap: 0.75rem; margin-bottom: 1rem; }
    .hsd-review-form__input, .hsd-review-form__textarea { width: 100%; padding: 0.6rem 0.875rem; border: 1px solid #EDE8E0; border-radius: 6px; font-size: 0.9rem; color: #1C1C1C; outline: none; font-family: inherit; transition: border-color 0.15s; box-sizing: border-box; }
    .hsd-review-form__input:focus, .hsd-review-form__textarea:focus { border-color: #B87333; box-shadow: 0 0 0 3px rgba(184,115,51,0.1); }
    .hsd-review-form__textarea { resize: vertical; min-height: 100px; line-height: 1.55; }
    .hsd-review-form__error { color: #DC2626; font-size: 0.8rem; margin: 0 0 0.75rem; }
    .hsd-review-form__success { display: flex; align-items: center; gap: 0.5rem; color: #15803D; background: rgba(21,128,61,0.06); border: 1px solid rgba(21,128,61,0.2); border-radius: 6px; padding: 0.75rem 1rem; font-size: 0.875rem; }
    .hsd-review-form__submit { padding: 0.55rem 1.5rem; background: #B87333; color: #fff; border: none; border-radius: 6px; font-size: 0.875rem; font-weight: 600; cursor: pointer; transition: opacity 0.15s; }
    .hsd-review-form__submit:hover { opacity: 0.9; }
    .hsd-review-form__submit:disabled { opacity: 0.5; cursor: not-allowed; }
    .hsd-review-form__login-prompt { margin-top: 1.5rem; padding: 1rem; text-align: center; background: #FAF8F5; border-radius: 8px; font-size: 0.875rem; color: #555; }
    .hsd-review-form__login-prompt a { color: #B87333; text-decoration: none; font-weight: 600; }

    .hsd-review-skeleton { display: flex; flex-direction: column; gap: 0.75rem; padding: 1.5rem 0; border-bottom: 1px solid #EDE8E0; }
    .hsd-review-skeleton__header { height: 36px; width: 50%; background: #EDE8E0; }
    .hsd-review-skeleton__body { height: 60px; background: #EDE8E0; }
    
    .shimmer { animation: shimmer 1.5s infinite linear; background: linear-gradient(to right, #FAF8F5 4%, #EDE8E0 25%, #FAF8F5 36%); background-size: 1000px 100%; }
    @keyframes shimmer { 0% { background-position: -1000px 0; } 100% { background-position: 1000px 0; } }
  `]
})
export class HairSolutionDetailComponent implements OnInit {
  private readonly api = inject(ApiService);
  private readonly cart = inject(CartService);
  readonly auth = inject(AuthService);
  private readonly productApi = inject(ProductApiService);
  private readonly route = inject(ActivatedRoute);
  readonly router = inject(Router);
  private readonly title = inject(Title);
  private readonly platformId = inject(PLATFORM_ID);
  readonly imgUrl = imageUrl;

  item = signal<any>(null);
  product = signal<any>(null);
  loading = signal(true);
  loadingProduct = signal(true);
  addingToCart = signal(false);
  addedToCart = signal(false);
  quantity = signal(1);

  activeImage = signal('/assets/images/placeholder.webp');
  activeTab = signal('Description');

  selectedSize = signal<string | null>(null);
  reviews = signal<Review[]>([]);
  ratingSummary = signal<any>(null);
  reviewsLoading = signal(false);
  reviewForm = signal({ rating: 0, title: '', body: '' });
  reviewHover = signal(0);
  reviewSubmitting = signal(false);
  reviewSubmitted  = signal(false);
  reviewError      = signal('');

  readonly stars = [1, 2, 3, 4, 5];
  readonly tabs = ['Description', 'How To Use', 'Specifications', 'Reviews'];

  allImages = computed(() => {
    const it = this.item();
    if (!it) return [];
    let imgs: string[] = [];
    try { imgs = JSON.parse(it.images || '[]'); } catch { imgs = []; }
    if (it.primary_image && !imgs.includes(it.primary_image)) imgs.unshift(it.primary_image);
    return imgs.length ? imgs : ['/assets/images/placeholder.webp'];
  });

  parsedSizes = computed(() => {
    const it = this.item();
    if (!it || !it.size_info) return [];
    return it.size_info.split(',').map((s: string) => s.trim()).filter(Boolean);
  });

  selectedVariant = computed(() => {
    const size = this.selectedSize();
    const prod = this.product();
    if (!size || !prod || !prod.variants) return null;
    return prod.variants.find((v: any) => v.value.toLowerCase() === size.toLowerCase()) || null;
  });

  finalPrice = computed(() => {
    const base = this.product() ? this.product().price : (this.item()?.base_price ?? 0);
    const modifier = this.selectedVariant()?.price_modifier ?? 0;
    return base + modifier;
  });

  paymentMode = computed(() => this.product()?.payment_mode || this.item()?.payment_mode || 'full_cod');
  advanceAmount = computed(() => this.product()?.advance_amount || this.item()?.advance_amount || null);

  maxStock = computed(() => {
    const v = this.selectedVariant();
    if (v) return v.stock;
    return this.product()?.stock_quantity ?? 99;
  });

  hasTabContent(tab: string): boolean {
    const it = this.item();
    if (!it) return false;
    if (tab === 'Description') return !!it.description;
    if (tab === 'How To Use') return !!it.how_to_use;
    if (tab === 'Specifications') return !!(it.gender || it.size_info || it.colour_info);
    if (tab === 'Reviews') return true;
    return false;
  }

  ngOnInit(): void {
    this.route.paramMap.subscribe(params => {
      const slug = params.get('slug') || '';
      this.load(slug);
    });
  }

  increaseQty(): void { if (this.quantity() < this.maxStock()) this.quantity.update(q => q + 1); }
  decreaseQty(): void { if (this.quantity() > 1) this.quantity.update(q => q - 1); }

  selectSize(size: string): void {
    this.selectedSize.set(size);
  }

  addToCart(): void {
    const it = this.item();
    const p = this.product();
    if (!it) return;
    if (!this.auth.isLoggedIn()) {
      this.router.navigate(['/login'], { queryParams: { returnUrl: this.router.url } });
      return;
    }
    this.addingToCart.set(true);

    const productId = p ? p.id : it.id;
    const finalPrice = this.finalPrice();
    const mrp = p ? p.mrp : it.mrp;

    this.cart.addItem({
      productId: productId,
      variantId: this.selectedVariant()?.id,
      name: it.name,
      variant: this.selectedVariant()?.value,
      price: finalPrice,
      mrp: mrp || finalPrice,
      quantity: this.quantity(),
      image: it.primary_image ?? "",
      slug: it.slug
    }).subscribe({
      next: () => {
        this.addingToCart.set(false);
        this.addedToCart.set(true);
        setTimeout(() => this.addedToCart.set(false), 3000);
      },
      error: () => this.addingToCart.set(false)
    });
  }

  buyNow(): void {
    const it = this.item();
    const p = this.product();
    if (!it) return;
    if (!this.auth.isLoggedIn()) {
      this.router.navigate(['/login'], { queryParams: { returnUrl: this.router.url } });
      return;
    }
    this.addingToCart.set(true);

    const productId = p ? p.id : it.id;
    const finalPrice = this.finalPrice();
    const mrp = p ? p.mrp : it.mrp;

    this.cart.addItem({
      productId: productId,
      variantId: this.selectedVariant()?.id,
      name: it.name,
      variant: this.selectedVariant()?.value,
      price: finalPrice,
      mrp: mrp || finalPrice,
      quantity: this.quantity(),
      image: it.primary_image ?? "",
      slug: it.slug
    }).subscribe({
      next: () => {
        this.addingToCart.set(false);
        this.router.navigate(["/checkout"]);
      },
      error: () => this.addingToCart.set(false)
    });
  }

  scrollToReviews(): void {
    this.activeTab.set("Reviews");
    setTimeout(() => {
      if (isPlatformBrowser(this.platformId)) {
        document.getElementById("hsd-tabs-container")?.scrollIntoView({ behavior: "smooth", block: "start" });
      }
    }, 80);
  }

  private loadReviews(id: number): void {
    this.reviewsLoading.set(true);
    this.productApi.getProductReviews(id).subscribe({
      next: (res: any) => {
        this.reviews.set(res.data ?? []);
        this.reviewsLoading.set(false);
      },
      error: () => this.reviewsLoading.set(false)
    });
    this.productApi.getRatingSummary(id).subscribe({
      next: (res) => this.ratingSummary.set(res.data),
      error: () => {}
    });
  }

  getRatingPct(star: number): number {
    const s = this.ratingSummary();
    if (!s?.total) return 0;
    const key = `${["", "one", "two", "three", "four", "five"][star]}_star`;
    return Math.round((s[key] ?? 0) / s.total * 100);
  }

  getStar(star: number): number {
    const s = this.ratingSummary();
    if (!s) return 0;
    return s[`${["", "one", "two", "three", "four", "five"][star]}_star`] ?? 0;
  }

  setReviewRating(r: number): void { this.reviewForm.update(f => ({ ...f, rating: r })); }
  setReviewTitle(v: string): void  { this.reviewForm.update(f => ({ ...f, title: v })); }
  setReviewBody(v: string): void   { this.reviewForm.update(f => ({ ...f, body: v })); }

  submitReview(): void {
    const f = this.reviewForm();
    const p = this.product();
    if (!p) return;
    if (!f.rating) { this.reviewError.set('Please select a star rating'); return; }
    if (!f.body.trim()) { this.reviewError.set('Please write your review'); return; }

    this.reviewSubmitting.set(true);
    this.reviewError.set('');
    this.productApi.submitReview({ product_id: p.id, rating: f.rating, title: f.title || undefined, body: f.body }).subscribe({
      next: () => {
        this.reviewSubmitting.set(false);
        this.reviewSubmitted.set(true);
        this.reviewForm.set({ rating: 0, title: '', body: '' });
        this.loadReviews(p.id);
      },
      error: (err: any) => {
        this.reviewSubmitting.set(false);
        this.reviewError.set(err?.error?.message || err?.userMessage || 'Failed to submit review');
      }
    });
  }

  private load(slug: string): void {
    this.loading.set(true);
    this.loadingProduct.set(true);
    this.api.get<any>(`/hair-solutions/${slug}`).subscribe({
      next: (res: any) => {
        const it = res.data;
        this.item.set(it);
        this.loading.set(false);
        
        const sizesList = this.parsedSizes();
        if (sizesList.length > 0) {
          this.selectedSize.set(sizesList[0]);
        } else {
          this.selectedSize.set(null);
        }

        const imgs = this.allImages();
        this.activeImage.set(imgs[0] || '/assets/images/placeholder.webp');
        const firstTab = this.tabs.find(t => this.hasTabContent(t)) || 'Description';
        this.activeTab.set(firstTab);
        if (it?.name) this.title.setTitle(`${it.name} — Luv Kush Natural`);

        // Load the matching product by slug to retrieve correct product_id, price and stock_quantity
        this.api.get<any>(`/products/${slug}`).subscribe({
          next: (prodRes: any) => {
            const p = prodRes.data || null;
            this.product.set(p);
            this.loadingProduct.set(false);
            if (p) {
              this.loadReviews(p.id);
            }
          },
          error: () => {
            this.product.set(null);
            this.loadingProduct.set(false);
          }
        });
      },
      error: () => {
        this.item.set(null);
        this.loading.set(false);
        this.loadingProduct.set(false);
      }
    });
  }
}

