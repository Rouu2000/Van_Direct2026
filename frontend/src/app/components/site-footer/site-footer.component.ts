import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-site-footer',
  standalone: true,
  imports: [CommonModule, RouterLink, FormsModule],
  templateUrl: './site-footer.component.html',
  styleUrl: './site-footer.component.css'
})
export class SiteFooterComponent {
  newsletterEmail = '';
  newsletterDone = signal(false);
  openSection = signal<string | null>(null);
  currentLang = signal<'EN' | 'FR'>('EN');

  readonly columns = [
    {
      id: 'company', heading: 'Company',
      links: [
        { label: 'About VAN DIRECT', route: '/about' },
        { label: 'Careers', route: '/careers' },
        { label: 'Become a driver', route: '/register' },
        { label: 'How it works', route: '/how-it-works' },
      ]
    },
    {
      id: 'ship', heading: 'New customers',
      links: [
        { label: 'Register',          route: '/register' },
        { label: 'How to ship',       route: '/how-it-works' },
        { label: 'Price estimate',    route: '/price-estimate' },
        { label: 'Multiple parcels',  route: '/multiple-parcels' },
        { label: 'Packaging guide',   route: '/packaging-guide' },
      ]
    },
    {
      id: 'support', heading: 'Support',
      links: [
        { label: 'FAQ',                   route: '/faq' },
        { label: 'Contact us',            route: '/contact' },
        { label: 'Track a parcel',        route: '/track' },
        { label: 'Live tracking',         route: '/live-tracking' },
        { label: 'In-app notifications',  route: '/in-app-notifications' },
        { label: 'Delivery confirmation', route: '/delivery-confirmation' },
        { label: 'Report a problem',      route: '/report-problem' },
        { label: 'Drop-off points',       route: '/drop-off-points' },
      ]
    },
    {
      id: 'legal', heading: 'Legal',
      links: [
        { label: 'Terms of service', route: '/terms' },
        { label: 'Privacy policy', route: '/privacy' },
        { label: 'Cookie policy', route: '/cookies' },
      ]
    }
  ];

  subscribe(): void {
    if (this.newsletterEmail.includes('@')) {
      this.newsletterDone.set(true);
    }
  }

  toggle(id: string): void {
    this.openSection.set(this.openSection() === id ? null : id);
  }

  setLang(lang: 'EN' | 'FR'): void {
    this.currentLang.set(lang);
    // UI-only for now — Stage B will wire i18n
  }
}
