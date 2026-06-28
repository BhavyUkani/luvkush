import { Component, ChangeDetectionStrategy } from '@angular/core';

interface Reason {
  icon: string;
  title: string;
  desc: string;
  accent: string;
}

@Component({
  selector: 'lk-why-choose-us',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  styles: [`
    :host { display: block; }

    .wc {
      background: #fff;
      padding: clamp(3rem, 6vw, 5rem) clamp(1rem, 4vw, 3rem);
    }

    .wc__header {
      text-align: center;
      max-width: 540px;
      margin: 0 auto 3rem;
    }

    .wc__eyebrow {
      font-family: 'Cinzel', serif;
      font-size: 0.6875rem;
      letter-spacing: 0.2em;
      text-transform: uppercase;
      color: #B88447;
      margin: 0 0 1rem;
    }

    .wc__title {
      font-family: 'Cormorant Garamond', serif;
      font-size: clamp(2rem, 4vw, 2.75rem);
      font-weight: 600;
      color: #1E1E1E;
      line-height: 1.2;
      margin: 0 0 0.875rem;
    }

    .wc__sub {
      font-family: 'Manrope', sans-serif;
      font-size: 0.9375rem;
      color: #666;
      line-height: 1.6;
      margin: 0;
    }

    .wc__grid {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 1.5rem;
      max-width: 1200px;
      margin: 0 auto;
    }

    @media (max-width: 1024px) {
      .wc__grid { grid-template-columns: repeat(2, 1fr); }
    }

    @media (max-width: 540px) {
      .wc__grid { grid-template-columns: 1fr; gap: 1rem; }
    }

    .wc__card {
      padding: 2rem 1.5rem;
      border: 1px solid #E8E8E8;
      border-radius: 14px;
      text-align: center;
      transition: transform 0.3s cubic-bezier(0.22, 1, 0.36, 1),
                  box-shadow 0.3s cubic-bezier(0.22, 1, 0.36, 1),
                  border-color 0.25s ease;
    }

    .wc__card:hover {
      transform: translateY(-4px);
      box-shadow: 0 12px 36px rgba(32, 54, 42, 0.1);
      border-color: rgba(54, 80, 59, 0.3);
    }

    .wc__icon {
      width: 72px;
      height: 72px;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      margin: 0 auto 1.25rem;
      font-size: 2rem;
    }

    .wc__card-title {
      font-family: 'Cormorant Garamond', serif;
      font-size: 1.25rem;
      font-weight: 600;
      color: #20362A;
      margin: 0 0 0.625rem;
      line-height: 1.3;
    }

    .wc__card-desc {
      font-family: 'Manrope', sans-serif;
      font-size: 0.875rem;
      color: #666;
      line-height: 1.6;
      margin: 0;
    }

    .wc__badge {
      display: inline-block;
      margin-top: 1rem;
      padding: 0.25rem 0.75rem;
      background: #F1E8D8;
      border-radius: 99px;
      font-family: 'Manrope', sans-serif;
      font-size: 0.6875rem;
      font-weight: 600;
      color: #B88447;
      letter-spacing: 0.05em;
      text-transform: uppercase;
    }
  `],
  template: `
    <section class="wc" aria-labelledby="wc-heading">
      <div class="wc__header reveal">
        <p class="wc__eyebrow">The Luv Kush Difference</p>
        <h2 class="wc__title" id="wc-heading">Why Choose Luv Kush Natural</h2>
        <p class="wc__sub">We combine the purity of ancient Ayurveda with the rigour of modern quality standards.</p>
      </div>

      <div class="wc__grid reveal-stagger">
        @for (reason of reasons; track reason.title) {
          <div class="wc__card">
            <div class="wc__icon" [style.background]="reason.bgColor" [attr.aria-label]="reason.title">
              <span aria-hidden="true">{{ reason.icon }}</span>
            </div>
            <h3 class="wc__card-title">{{ reason.title }}</h3>
            <p class="wc__card-desc">{{ reason.desc }}</p>
            <span class="wc__badge">{{ reason.badge }}</span>
          </div>
        }
      </div>
    </section>
  `
})
export class WhyChooseUsComponent {
  readonly reasons = [
    {
      icon: '🌿',
      title: '100% Ayurvedic',
      desc: 'Ancient botanical formulas perfected over generations. Every ingredient sourced from trusted farms across India.',
      badge: 'No Compromise',
      bgColor: 'rgba(54, 80, 59, 0.1)'
    },
    {
      icon: '🔬',
      title: 'Zero Harmful Chemicals',
      desc: 'Free from parabens, sulfates, mineral oils and synthetic fragrances. What you see on the label is what goes on your scalp.',
      badge: 'Lab Verified',
      bgColor: 'rgba(61, 90, 71, 0.1)'
    },
    {
      icon: '🛡️',
      title: 'Trusted by Families',
      desc: 'Over 10,000 happy customers — from first-time buyers to multi-generational households who swear by our oils.',
      badge: '10,000+ Orders',
      bgColor: 'rgba(184, 132, 71, 0.1)'
    },
    {
      icon: '🚚',
      title: 'Free Delivery',
      desc: 'Free shipping on all orders above ₹499. Safe, eco-friendly packaging. Delivered to your door across India.',
      badge: 'Above ₹499',
      bgColor: 'rgba(32, 54, 42, 0.08)'
    }
  ];
}
