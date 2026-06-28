import { Component, ChangeDetectionStrategy } from '@angular/core';

interface Ingredient {
  name: string;
  sanskrit: string;
  latin: string;
  benefit: string;
  detail: string;
  icon: string;
  bgColor: string;
}

@Component({
  selector: 'lk-ingredients-showcase',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  styles: [`
    :host { display: block; }

    .is {
      background: #F1E8D8;
      padding: clamp(3rem, 6vw, 5rem) clamp(1rem, 4vw, 3rem);
    }

    .is__header {
      text-align: center;
      max-width: 600px;
      margin: 0 auto 1.5rem;
    }

    .is__eyebrow {
      font-family: 'Cinzel', serif;
      font-size: 0.6875rem;
      letter-spacing: 0.2em;
      text-transform: uppercase;
      color: #B88447;
      margin: 0 0 1rem;
    }

    .is__title {
      font-family: 'Cormorant Garamond', serif;
      font-size: clamp(2rem, 4vw, 2.75rem);
      font-weight: 600;
      color: #20362A;
      line-height: 1.2;
      margin: 0 0 1rem;
    }

    .is__sub {
      font-family: 'Manrope', sans-serif;
      font-size: 0.9375rem;
      color: #555;
      line-height: 1.7;
      margin: 0;
    }

    .is__ornament {
      display: flex;
      align-items: center;
      gap: 1rem;
      justify-content: center;
      margin: 1.75rem 0 2.75rem;
    }

    .is__ornament-line {
      flex: 1;
      max-width: 80px;
      height: 1px;
      background: #B88447;
      opacity: 0.35;
    }

    .is__ornament-mark {
      color: #B88447;
      font-size: 0.875rem;
      opacity: 0.7;
      letter-spacing: 4px;
    }

    .is__grid {
      display: grid;
      grid-template-columns: repeat(5, 1fr);
      gap: 1.25rem;
      max-width: 1200px;
      margin: 0 auto;
    }

    @media (max-width: 1100px) {
      .is__grid { grid-template-columns: repeat(3, 1fr); }
    }

    @media (max-width: 640px) {
      .is__grid {
        grid-template-columns: repeat(2, 1fr);
        gap: 0.875rem;
      }
    }

    .is__card {
      background: #FAF7F2;
      border: 1px solid rgba(184, 132, 71, 0.18);
      border-radius: 16px;
      padding: 1.75rem 1.25rem 1.5rem;
      text-align: center;
      transition: transform 0.38s cubic-bezier(0.22, 1, 0.36, 1),
                  box-shadow 0.38s cubic-bezier(0.22, 1, 0.36, 1),
                  background 0.25s ease;
      position: relative;
      overflow: hidden;
    }

    .is__card::after {
      content: '';
      position: absolute;
      bottom: 0;
      left: 0;
      right: 0;
      height: 3px;
      background: linear-gradient(90deg, #B88447 0%, #E2C97E 50%, #B88447 100%);
      transform: scaleX(0);
      transition: transform 0.35s cubic-bezier(0.22, 1, 0.36, 1);
      transform-origin: center;
    }

    .is__card:hover {
      transform: translateY(-8px);
      box-shadow: 0 20px 56px rgba(32, 54, 42, 0.12), 0 4px 12px rgba(32, 54, 42, 0.06);
      background: #fff;
    }

    .is__card:hover::after { transform: scaleX(1); }

    .is__icon-wrap {
      width: 68px;
      height: 68px;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      margin: 0 auto 1.125rem;
      font-size: 2rem;
    }

    .is__card-name {
      font-family: 'Cormorant Garamond', serif;
      font-size: 1.375rem;
      font-weight: 600;
      color: #20362A;
      margin: 0 0 0.2rem;
      line-height: 1.2;
    }

    .is__card-sanskrit {
      font-family: 'Cormorant Garamond', serif;
      font-size: 1rem;
      color: #B88447;
      font-style: italic;
      margin: 0 0 0.2rem;
    }

    .is__card-latin {
      font-family: 'Manrope', sans-serif;
      font-size: 0.6875rem;
      color: #999;
      font-style: italic;
      margin: 0 0 1rem;
      letter-spacing: 0.02em;
    }

    .is__card-benefit {
      font-family: 'Manrope', sans-serif;
      font-size: 0.8125rem;
      font-weight: 500;
      color: #36503B;
      line-height: 1.5;
      margin: 0 0 0.75rem;
    }

    .is__card-detail {
      font-family: 'Manrope', sans-serif;
      font-size: 0.75rem;
      color: #777;
      line-height: 1.65;
      margin: 0;
      max-height: 0;
      overflow: hidden;
      opacity: 0;
      transition: max-height 0.4s ease, opacity 0.3s ease 0.05s;
    }

    .is__card:hover .is__card-detail {
      max-height: 120px;
      opacity: 1;
    }
  `],
  template: `
    <section class="is" aria-labelledby="is-heading">
      <div class="is__header reveal">
        <p class="is__eyebrow">Ancient Botanicals</p>
        <h2 class="is__title" id="is-heading">The Wisdom of<br>Sacred Ingredients</h2>
        <p class="is__sub">Five time-tested botanicals, each revered for centuries in Ayurvedic tradition for their transformative hair-care properties.</p>
      </div>

      <div class="is__ornament reveal" aria-hidden="true">
        <span class="is__ornament-line"></span>
        <span class="is__ornament-mark">✦ ✦ ✦</span>
        <span class="is__ornament-line"></span>
      </div>

      <div class="is__grid reveal-stagger">
        @for (ing of ingredients; track ing.name) {
          <div class="is__card">
            <div class="is__icon-wrap" [style.background]="ing.bgColor" [attr.aria-label]="ing.name">
              <span aria-hidden="true">{{ ing.icon }}</span>
            </div>
            <p class="is__card-name">{{ ing.name }}</p>
            <p class="is__card-sanskrit">{{ ing.sanskrit }}</p>
            <p class="is__card-latin">{{ ing.latin }}</p>
            <p class="is__card-benefit">{{ ing.benefit }}</p>
            <p class="is__card-detail">{{ ing.detail }}</p>
          </div>
        }
      </div>
    </section>
  `
})
export class IngredientsShowcaseComponent {
  readonly ingredients: Ingredient[] = [
    {
      name: 'Amla',
      sanskrit: 'आँवला',
      latin: 'Phyllanthus emblica',
      benefit: 'Strengthens follicles, boosts growth',
      detail: 'Rich in Vitamin C and antioxidants, Amla nourishes the scalp deeply and promotes thick, lustrous hair growth from within.',
      icon: '🫐',
      bgColor: 'rgba(74, 124, 89, 0.12)'
    },
    {
      name: 'Bhringraj',
      sanskrit: 'भृंगराज',
      latin: 'Eclipta prostrata',
      benefit: 'Prevents greying, revitalises roots',
      detail: 'The "King of Herbs" in Ayurveda — revitalizes dormant follicles and helps restore natural hair colour over time.',
      icon: '🌿',
      bgColor: 'rgba(61, 90, 71, 0.12)'
    },
    {
      name: 'Brahmi',
      sanskrit: 'ब्राह्मी',
      latin: 'Bacopa monnieri',
      benefit: 'Reduces hair fall, calms the scalp',
      detail: 'Strengthens the hair shaft from root to tip, reducing breakage and calming scalp inflammation caused by stress.',
      icon: '🍃',
      bgColor: 'rgba(122, 158, 126, 0.15)'
    },
    {
      name: 'Hibiscus',
      sanskrit: 'जपाकुसुम',
      latin: 'Hibiscus rosa-sinensis',
      benefit: 'Deep conditioning, prevents fall',
      detail: 'Rich in amino acids that nourish the keratin structure of each strand — leaving hair silky, smooth, and resilient.',
      icon: '🌺',
      bgColor: 'rgba(168, 66, 101, 0.1)'
    },
    {
      name: 'Neem',
      sanskrit: 'नीम',
      latin: 'Azadirachta indica',
      benefit: 'Purifies scalp, fights dandruff',
      detail: "Neem's antibacterial and antifungal properties create a clean, balanced scalp environment for optimal hair growth.",
      icon: '🌱',
      bgColor: 'rgba(74, 103, 65, 0.12)'
    }
  ];
}
