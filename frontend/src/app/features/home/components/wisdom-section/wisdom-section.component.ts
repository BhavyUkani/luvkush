import { Component, ChangeDetectionStrategy } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'lk-wisdom-section',
  standalone: true,
  imports: [RouterLink],
  changeDetection: ChangeDetectionStrategy.OnPush,
  styles: [`
    :host { display: block; }

    .ws {
      background: #20362A;
      padding: clamp(4rem, 8vw, 6.5rem) clamp(1rem, 4vw, 3rem);
      position: relative;
      overflow: hidden;
    }

    .ws::before {
      content: '';
      position: absolute;
      top: -120px;
      right: -80px;
      width: 480px;
      height: 480px;
      border-radius: 50%;
      background: radial-gradient(circle, rgba(184, 132, 71, 0.08) 0%, transparent 70%);
      pointer-events: none;
    }

    .ws::after {
      content: '';
      position: absolute;
      bottom: -100px;
      left: -60px;
      width: 360px;
      height: 360px;
      border-radius: 50%;
      background: radial-gradient(circle, rgba(54, 80, 59, 0.5) 0%, transparent 70%);
      pointer-events: none;
    }

    .ws__inner {
      max-width: 1200px;
      margin: 0 auto;
      display: grid;
      grid-template-columns: 1fr auto;
      gap: 4rem;
      align-items: center;
      position: relative;
      z-index: 1;
    }

    @media (max-width: 768px) {
      .ws__inner {
        grid-template-columns: 1fr;
        gap: 2.5rem;
      }
    }

    .ws__text { max-width: 620px; }

    .ws__eyebrow {
      font-family: 'Cinzel', serif;
      font-size: 0.6875rem;
      letter-spacing: 0.25em;
      text-transform: uppercase;
      color: #B88447;
      margin: 0 0 1.25rem;
      display: flex;
      align-items: center;
      gap: 0.75rem;
    }

    .ws__eyebrow::before {
      content: '';
      display: block;
      width: 32px;
      height: 1px;
      background: #B88447;
      opacity: 0.6;
    }

    .ws__title {
      font-family: 'Cormorant Garamond', serif;
      font-size: clamp(2.25rem, 5vw, 3.5rem);
      font-weight: 500;
      color: #FAF7F2;
      line-height: 1.15;
      margin: 0 0 1.5rem;
      letter-spacing: -0.01em;
    }

    .ws__title em {
      font-style: italic;
      color: #E2C97E;
    }

    .ws__body {
      font-family: 'Manrope', sans-serif;
      font-size: 1rem;
      color: rgba(250, 247, 242, 0.7);
      line-height: 1.8;
      margin: 0 0 2.25rem;
    }

    .ws__cta {
      display: inline-flex;
      align-items: center;
      gap: 0.625rem;
      padding: 0.875rem 2rem;
      background: transparent;
      border: 1.5px solid rgba(184, 132, 71, 0.6);
      border-radius: 4px;
      font-family: 'Cinzel', serif;
      font-size: 0.75rem;
      letter-spacing: 0.15em;
      text-transform: uppercase;
      color: #E2C97E;
      text-decoration: none;
      transition: background 0.3s ease, border-color 0.3s ease, color 0.3s ease;
    }

    .ws__cta:hover {
      background: rgba(184, 132, 71, 0.15);
      border-color: #B88447;
      color: #FAF7F2;
    }

    .ws__cta svg { transition: transform 0.25s ease; }
    .ws__cta:hover svg { transform: translateX(3px); }

    .ws__stats {
      display: flex;
      flex-direction: column;
      gap: 1rem;
    }

    @media (max-width: 768px) {
      .ws__stats {
        flex-direction: row;
        justify-content: center;
        gap: 1.25rem;
        flex-wrap: wrap;
      }
    }

    .ws__stat {
      text-align: center;
      padding: 1.75rem 2rem;
      border: 1px solid rgba(184, 132, 71, 0.2);
      border-radius: 12px;
      background: rgba(255, 255, 255, 0.04);
      backdrop-filter: blur(4px);
      min-width: 160px;
    }

    .ws__stat-num {
      font-family: 'Cormorant Garamond', serif;
      font-size: 2.75rem;
      font-weight: 600;
      color: #E2C97E;
      line-height: 1;
      margin: 0 0 0.375rem;
    }

    .ws__stat-label {
      font-family: 'Manrope', sans-serif;
      font-size: 0.8125rem;
      color: rgba(250, 247, 242, 0.65);
      line-height: 1.4;
      margin: 0;
    }
  `],
  template: `
    <section class="ws" aria-labelledby="ws-heading">
      <div class="ws__inner">
        <div class="ws__text reveal">
          <p class="ws__eyebrow">Our Heritage</p>
          <h2 class="ws__title" id="ws-heading">
            <em>5000 Years</em> of Ayurveda,<br>
            Modern Hair Restoration
          </h2>
          <p class="ws__body">
            Ancient Indian sages documented the healing properties of these sacred botanicals
            in the Charaka Samhita. Luv Kush Natural honours this living tradition — cold-pressing
            and steam-extracting each herb at peak potency, then blending them into formulations
            that work in harmony with your body's own healing intelligence.
          </p>
          <a routerLink="/about" class="ws__cta" aria-label="Learn more about our story">
            Discover Our Story
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true">
              <path d="M3 7H11M8 4L11 7L8 10" stroke="currentColor" stroke-width="1.3" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
          </a>
        </div>

        <div class="ws__stats reveal">
          <div class="ws__stat">
            <p class="ws__stat-num">5000+</p>
            <p class="ws__stat-label">Years of<br>Ayurvedic Wisdom</p>
          </div>
          <div class="ws__stat">
            <p class="ws__stat-num">10K+</p>
            <p class="ws__stat-label">Happy<br>Customers</p>
          </div>
          <div class="ws__stat">
            <p class="ws__stat-num">100%</p>
            <p class="ws__stat-label">Natural<br>Ingredients</p>
          </div>
        </div>
      </div>
    </section>
  `
})
export class WisdomSectionComponent {}
