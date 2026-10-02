import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { SiteHeaderComponent } from '../site-header/site-header.component';
import { SiteFooterComponent } from '../site-footer/site-footer.component';

@Component({
  selector: 'app-site-shell',
  standalone: true,
  imports: [RouterOutlet, SiteHeaderComponent, SiteFooterComponent],
  template: `
    <app-site-header></app-site-header>
    <main id="main-content">
      <router-outlet></router-outlet>
    </main>
    <app-site-footer></app-site-footer>
  `,
  styles: [`
    main { min-height: calc(100vh - 64px); display: block; }
  `]
})
export class SiteShellComponent {}
