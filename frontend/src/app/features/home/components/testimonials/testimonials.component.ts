import { Component, ChangeDetectionStrategy } from '@angular/core';

interface Testimonial {
  quote: string;
  name: string;
  city: string;
  product: string;
  initials: string;
  rating: number;
}

@Component({
  selector: 'lk-testimonials',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  styles: [`
    :host { display: block; }

    .tm {
      background: #FAF7F2;
      padding: clamp(3rem, 6vw, 5rem) clamp(1rem, 4vw, 3rem);
    }

    .tm__header {
      text-align: center;
      max-width: 520px;
      margin: 0 auto 3rem;
    }

    .tm__eyebrow {
      font-family: 'Cinzel', serif;
      font-size: 0.6875rem;
      letter-spacing: 0.2em;
      text-transform: uppercase;
      color: #B88447;
      margin: 0 0 1rem;
    }

    .tm__title {
      font-family: 'Cormorant Garamond', serif;
      font-size: clamp(2rem, 4vw, 2.75rem);
      font-weight: 600;
      color: #1E1E1E;
      line-height: 1.2;
      margin: 0 0 0.875rem;
    }

    .tm__sub {
      font-family: 'Manrope', sans-serif;
      font-size: 0.9375rem;
      color: #666;
      line-height: 1.6;
      margin: 0;
    }

    .tm__grid {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 1.5rem;
      max-width: 1100px;
      margin: 0 auto;
    }

    @media (max-width: 900px) {
      .tm__grid { grid-template-columns: 1fr; max-width: 520px; }
    }

    .tm__card {
      background: #fff;
      border: 1px solid #E8E8E8;
      border-radius: 16px;
      padding: 2rem 1.75rem;
      position: relative;
      transition: transform 0.3s cubic-bezier(0.22, 1, 0.36, 1),
                  box-shadow 0.3s ease;
    }

    .tm__card:hover {
      transform: translateY(-4px);
      box-shadow: 0 16px 48px rgba(32, 54, 42, 0.08);
    }

    .tm__quote-mark {
      font-family: 'Cormorant Garamond', serif;
      font-size: 5rem;
      line-height: 1;
      color: #E2C97E;
      opacity: 0.5;
      position: absolute;
      top: 0.75rem;
      left: 1.5rem;
      pointer-events: none;
      user-select: none;
    }

    .tm__stars {
      display: flex;
      gap: 0.2rem;
      margin-bottom: 1.125rem;
      margin-top: 0.5rem;
    }

    .tm__star {
      color: #C8891A;
      font-size: 0.875rem;
    }

    .tm__quote {
      font-family: 'Cormorant Garamond', serif;
      font-size: 1.1rem;
      color: #333;
      line-height: 1.7;
      font-style: italic;
      margin: 0 0 1.5rem;
    }

    .tm__divider {
      height: 1px;
      background: #F0F0F0;
      margin-bottom: 1.25rem;
    }

    .tm__author {
      display: flex;
      align-items: center;
      gap: 0.875rem;
    }

    .tm__avatar {
      width: 40px;
      height: 40px;
      border-radius: 50%;
      background: linear-gradient(135deg, #36503B, #20362A);
      display: flex;
      align-items: center;
      justify-content: center;
      font-family: 'Manrope', sans-serif;
      font-size: 0.875rem;
      font-weight: 600;
      color: #E2C97E;
      flex-shrink: 0;
    }

    .tm__author-name {
      font-family: 'Manrope', sans-serif;
      font-size: 0.9375rem;
      font-weight: 600;
      color: #1E1E1E;
      margin: 0 0 0.125rem;
    }

    .tm__author-meta {
      font-family: 'Manrope', sans-serif;
      font-size: 0.75rem;
      color: #999;
      margin: 0;
    }

    .tm__verified {
      display: flex;
      align-items: center;
      gap: 0.375rem;
      margin-top: 0.25rem;
      font-family: 'Manrope', sans-serif;
      font-size: 0.6875rem;
      color: #3D5A47;
      font-weight: 500;
    }

    .tm__verified svg { flex-shrink: 0; }
  `],
  template: `
    <section class="tm" aria-labelledby="tm-heading">
      <div class="tm__header reveal">
        <p class="tm__eyebrow">Real Results</p>
        <h2 class="tm__title" id="tm-heading">Transformations That<br>Speak for Themselves</h2>
        <p class="tm__sub">Thousands of happy customers trust Luv Kush Natural for their daily hair care rituals.</p>
      </div>

      <div class="tm__grid reveal-stagger">
        @for (t of testimonials; track t.name) {
          <div class="tm__card">
            <span class="tm__quote-mark" aria-hidden="true">"</span>
            <div class="tm__stars" [attr.aria-label]="t.rating + ' out of 5 stars'">
              @for (s of starArray(t.rating); track $index) {
                <span class="tm__star" aria-hidden="true">★</span>
              }
            </div>
            <p class="tm__quote">{{ t.quote }}</p>
            <div class="tm__divider"></div>
            <div class="tm__author">
              <div class="tm__avatar" [attr.aria-label]="t.name">{{ t.initials }}</div>
              <div>
                <p class="tm__author-name">{{ t.name }}</p>
                <p class="tm__author-meta">{{ t.city }} · {{ t.product }}</p>
                <span class="tm__verified">
                  <svg width="11" height="11" viewBox="0 0 12 12" fill="none" aria-hidden="true">
                    <circle cx="6" cy="6" r="6" fill="#3D5A47"/>
                    <path d="M3.5 6L5.5 8L8.5 4.5" stroke="white" stroke-width="1.3" stroke-linecap="round" stroke-linejoin="round"/>
                  </svg>
                  Verified Purchase
                </span>
              </div>
            </div>
          </div>
        }
      </div>
    </section>
  `
})
export class TestimonialsComponent {
  readonly testimonials: Testimonial[] = [
    {
      quote: "I have been using Luv Kush Natural Bhringraj oil for three months now. My hair fall has reduced dramatically and my scalp feels healthier than it has in years. Truly Ayurvedic quality.",
      name: "Priya Mehta",
      city: "Mumbai",
      product: "Bhringraj Hair Oil",
      initials: "PM",
      rating: 5
    },
    {
      quote: "The Amla & Brahmi oil is nothing short of miraculous. Thick, aromatic, and it works. My mother used to make something similar at home — this is even better. Will order again without hesitation.",
      name: "Rajesh Sharma",
      city: "Jaipur",
      product: "Amla & Brahmi Oil",
      initials: "RS",
      rating: 5
    },
    {
      quote: "Ordered the hair wig for my mother who was struggling with hair loss. The quality and natural hairline are absolutely unmatched for this price. Excellent packaging and fast delivery too.",
      name: "Anjali Verma",
      city: "Delhi",
      product: "Premium Hair Wig",
      initials: "AV",
      rating: 5
    }
  ];

  starArray(count: number): number[] {
    return Array(count).fill(0);
  }
}
