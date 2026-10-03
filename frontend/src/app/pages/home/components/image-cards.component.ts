import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-image-cards',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
<section class="ic-section">
  <div class="ic-inner">
    <div class="ic-grid">
      <article *ngFor="let c of cards" class="ic-card" [class.ic-wide]="c.wide">
        <div class="ic-img-wrap">
          <img [src]="c.img" [alt]="c.imgAlt" width="600" height="320"
               class="ic-img" loading="lazy" decoding="async">
          <span *ngIf="c.tag" class="ic-tag">{{ c.tag }}</span>
        </div>
        <div class="ic-body">
          <p class="ic-meta">{{ c.meta }}</p>
          <h3 class="ic-title">{{ c.title }}</h3>
          <p class="ic-text">{{ c.text }}</p>
          <a [routerLink]="c.route" class="ic-link">{{ c.cta }} →</a>
        </div>
      </article>
    </div>
  </div>
</section>`,
  styles: [`
    .ic-section { background: var(--surface-2); padding: 80px 24px; }
    .ic-inner   { max-width: 1200px; margin: 0 auto; }
    .ic-grid {
      display: grid;
      grid-template-columns: repeat(3, 1fr) 1.4fr;
      gap: 20px; align-items: start;
    }
    .ic-card {
      background: var(--surface); border-radius: var(--radius-xl);
      overflow: hidden; border: 1px solid var(--border); box-shadow: var(--shadow-xs);
      transition: box-shadow 200ms, transform 200ms;
    }
    .ic-card:hover { box-shadow: var(--shadow-lg); transform: translateY(-4px); }
    @media (prefers-reduced-motion: reduce) { .ic-card:hover { transform: none; } }
    .ic-img-wrap { position: relative; overflow: hidden; }
    .ic-img { width: 100%; height: 200px; object-fit: cover; display: block; transition: transform 300ms; }
    .ic-wide .ic-img { height: 240px; }
    .ic-card:hover .ic-img { transform: scale(1.04); }
    @media (prefers-reduced-motion: reduce) { .ic-card:hover .ic-img { transform: none; } }
    .ic-tag {
      position: absolute; top: 12px; left: 12px;
      background: var(--brand); color: #fff; font-size: .7rem; font-weight: 700;
      padding: 3px 10px; border-radius: var(--radius-pill); text-transform: uppercase; letter-spacing: .4px;
    }
    .ic-body  { padding: 20px; display: flex; flex-direction: column; gap: 8px; }
    .ic-meta  { font-size: .72rem; text-transform: uppercase; letter-spacing: .8px; color: var(--brand); font-weight: 700; }
    .ic-title { font-size: 1rem; font-weight: 700; color: var(--navy); line-height: 1.3; }
    .ic-text  { font-size: .85rem; color: var(--text-muted); line-height: 1.6; }
    .ic-link  { font-size: .825rem; font-weight: 700; color: var(--brand); text-decoration: none; margin-top: 4px; }
    .ic-link:hover { text-decoration: underline; }
    @media (max-width: 900px) {
      .ic-grid { grid-template-columns: 1fr 1fr; }
      .ic-wide { grid-column: 1 / -1; }
      .ic-wide .ic-img { height: 240px; }
    }
    @media (max-width: 540px) { .ic-grid { grid-template-columns: 1fr; } }
  `]
})
export class ImageCardsComponent {
  cards = [
    { img: 'images/parcels.jpg',   imgAlt: 'Parcels being packed',       meta: 'Guide',       title: 'How to pack your parcel',      text: 'The right packaging keeps your items safe and avoids damage claims. Here is what to know.',     route: '/packaging-guide',   cta: 'Read guide',   tag: '',        wide: false },
    { img: 'images/van.jpg',       imgAlt: 'Delivery van on the road',   meta: 'Feature',     title: 'How live tracking works',       text: 'Your driver\'s GPS position is pushed to your screen every 5 seconds over a WebSocket.',         route: '/live-tracking',     cta: 'Learn more',   tag: '',        wide: false },
    { img: 'images/city.jpg',      imgAlt: 'City street from above',     meta: 'Tips',        title: 'Tips for faster delivery',      text: 'A precise address and a weight that matches the booking means a smoother handoff and no delays.', route: '/how-it-works',      cta: 'Read tips',    tag: '',        wide: false },
    /* Placeholder news card — replace content before go-live */
    { img: 'images/warehouse.jpg', imgAlt: 'Sorting warehouse interior', meta: 'News',        title: 'VAN DIRECT launches service in Kanata and Orleans', text: 'We are delighted to announce that our delivery network now covers two new Ottawa neighbourhoods, with more on the way.', route: '/about', cta: 'Read announcement', tag: 'New', wide: true },
  ];
}
