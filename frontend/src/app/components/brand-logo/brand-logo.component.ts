import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';

type LogoSize    = 'sm' | 'md' | 'lg';
type LogoVariant = 'full' | 'badge-on-dark';

const SIZE_MAP: Record<LogoSize, number> = { sm: 40, md: 56, lg: 96 };

/**
 * BrandLogoComponent
 *
 * Displays the VAN DIRECT logo (public/images/vandirect.png).
 * The original file (1.16 MB) is used directly.
 * Run `npm run resize-logo` to generate optimised copies once sharp is installed.
 *
 * Props:
 *   size    – 'sm' (40px) | 'md' (56px, default) | 'lg' (96px)
 *   variant – 'full' | 'badge-on-dark' (adds white circle on dark backgrounds)
 *   link    – optional routerLink, e.g. '/' (default: no link)
 */
@Component({
  selector: 'app-brand-logo',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <ng-container *ngIf="link; else noLink">
      <a [routerLink]="link" class="bl-wrap" [class.badge-on-dark]="variant === 'badge-on-dark'"
         [style.width.px]="px" [style.height.px]="px" aria-label="VAN DIRECT home">
        <img [src]="src" alt="VAN DIRECT" [width]="px" [height]="px" class="bl-img"
             [attr.loading]="size === 'lg' ? null : 'lazy'">
      </a>
    </ng-container>
    <ng-template #noLink>
      <span class="bl-wrap" [class.badge-on-dark]="variant === 'badge-on-dark'"
            [style.width.px]="px" [style.height.px]="px">
        <img [src]="src" alt="VAN DIRECT" [width]="px" [height]="px" class="bl-img"
             loading="lazy">
      </span>
    </ng-template>
  `,
  styles: [`
    .bl-wrap {
      display: inline-flex; align-items: center; justify-content: center;
      flex-shrink: 0; text-decoration: none;
    }
    .bl-wrap.badge-on-dark {
      background: #fff; border-radius: 50%; padding: 4px;
      box-shadow: 0 2px 8px rgba(0,0,0,.25);
    }
    .bl-img { display: block; width: 100%; height: 100%; object-fit: contain; }
  `]
})
export class BrandLogoComponent {
  @Input() size: LogoSize = 'md';
  @Input() variant: LogoVariant = 'full';
  @Input() link: string | null = null;

  get px(): number { return SIZE_MAP[this.size]; }
  readonly src = 'images/vandirect.png';
}
