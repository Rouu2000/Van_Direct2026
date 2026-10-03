import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { BrandLogoComponent } from '../brand-logo/brand-logo.component';
import { RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { EMAIL_RE } from '../../shared/validators';

@Component({
  selector: 'app-site-footer',
  standalone: true,
  imports: [CommonModule, BrandLogoComponent, RouterLink, FormsModule],
  templateUrl: './site-footer.component.html',
  styleUrl: './site-footer.component.css'
})
export class SiteFooterComponent {
  newsletterEmail = '';
  newsletterError = '';
  newsletterDone = signal(false);
  newsletterSubmitting = false;
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
    this.newsletterError = '';
    if (!this.newsletterEmail.trim()) { this.newsletterError = 'Please enter your email address.'; return; }
    if (!EMAIL_RE.test(this.newsletterEmail.trim())) { this.newsletterError = 'Enter a valid email address.'; return; }
    this.newsletterSubmitting = true;
    setTimeout(() => { this.newsletterSubmitting = false; this.newsletterDone.set(true); }, 400);
  }

  toggle(id: string): void {
    this.openSection.set(this.openSection() === id ? null : id);
  }

  setLang(lang: 'EN' | 'FR'): void {
    this.currentLang.set(lang);
    // UI-only for now — Stage B will wire i18n
  }
}
