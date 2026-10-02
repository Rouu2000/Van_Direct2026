import { Component, OnInit, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { HeroTabsComponent } from './components/hero-tabs.component';
import { QuickActionsComponent } from './components/quick-actions.component';
import { ImageSectionComponent } from './components/image-section.component';
import { ServiceCardsComponent } from './components/service-cards.component';
import { DriveBandComponent } from './components/drive-band.component';
import { ImageCardsComponent } from './components/image-cards.component';
import { TrustStripComponent } from './components/trust-strip.component';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [
    CommonModule, RouterLink,
    HeroTabsComponent, QuickActionsComponent,
    ImageSectionComponent, ServiceCardsComponent,
    DriveBandComponent, ImageCardsComponent, TrustStripComponent
  ],
  templateUrl: './home.html',
  styleUrl: './home.css'
})
export class HomeComponent implements OnInit {
  readonly isLoggedIn  = computed(() => this.auth.loggedIn());
  readonly isCustomer  = computed(() => this.auth.customer());

  constructor(public auth: AuthService) {}

  ngOnInit(): void {
    this.auth.hydrateFromStorage();
    // NOTE: per Stage B spec, logged-in users still see the home page.
    // They are NOT redirected — the header shows in logged-in mode instead.
  }

  get heroShipRoute(): string {
    if (!this.auth.isLoggedIn()) return '/register';
    if (this.auth.isCustomer())  return '/customer/dashboard';
    return '/';
  }

  get heroShipLabel(): string {
    return this.auth.isCustomer() ? 'My shipments' : 'Ship a parcel';
  }
}
