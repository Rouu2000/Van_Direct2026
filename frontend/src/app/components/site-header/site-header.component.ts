import {
  Component, OnInit, OnDestroy, HostListener, signal, computed, ElementRef
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, RouterLinkActive, Router, NavigationEnd } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { filter } from 'rxjs/operators';
import { Subscription } from 'rxjs';
import { BrandLogoComponent } from '../brand-logo/brand-logo.component';
import { UserPillComponent } from '../user-pill/user-pill.component';
import { AuthService } from '../../services/auth.service';
import { NotificationService, AppNotification } from '../../services/notification.service';

export interface MenuColumn {
  heading: string;
  links: { label: string; route: string; desc?: string; icon?: string }[];
}

export interface MenuPanel {
  id: string;
  label: string;
  columns: MenuColumn[];
  promo?: { headline: string; body: string; cta: string; ctaRoute: string; color: string };
}

@Component({
  selector: 'app-site-header',
  standalone: true,
  imports: [CommonModule, RouterLink, RouterLinkActive, FormsModule, BrandLogoComponent, UserPillComponent],
  templateUrl: './site-header.component.html',
  styleUrl: './site-header.component.css'
})
export class SiteHeaderComponent implements OnInit, OnDestroy {

  // ── Reactive state (signals) ───────────────────────────────
  scrolled      = signal(false);
  activePanel   = signal<string | null>(null);
  drawerOpen    = signal(false);
  drawerSection = signal<string | null>(null);
  accountOpen   = signal(false);
  notifOpen     = signal(false);
  trackQuery    = '';

  private hoverTimer: any = null;
  private closeTimer: any = null;
  private routeSub!: Subscription;

  // ── Auth helpers ───────────────────────────────────────────
  readonly loggedIn     = computed(() => this.auth.loggedIn());
  readonly isCustomer   = computed(() => this.auth.customer());
  readonly isDriver     = computed(() => this.auth.driver());
  readonly isAdmin      = computed(() => this.auth.admin());
  readonly displayName  = computed(() => this.auth.userName() || this.auth.currentUser()?.email || 'Account');
  readonly firstName    = computed(() => {
    const name = this.auth.userName() || '';
    return name.split(' ')[0] || 'Account';
  });
  readonly unreadCount  = computed(() => this.notifSvc.unreadCount());
  readonly notifications= computed(() => this.notifSvc.notifications());

  /**
   * Which mega-menu panels to show:
   * - Guest / CUSTOMER  → all 4 panels
   * - DRIVER            → no panels (stripped header: just My Deliveries + account)
   * - ADMIN             → no panels (stripped header: just admin area + account)
   */
  readonly visiblePanels = computed<MenuPanel[]>(() => {
    if (!this.loggedIn()) return this.panels;               // guest
    if (this.isCustomer()) return this.panels;              // customer — full menu
    return [];                                              // driver / admin — no panels
  });

  /** True for roles that should see the stripped, role-specific header instead of the mega-menu */
  readonly isStrippedHeader = computed(() => this.loggedIn() && (this.isDriver() || this.isAdmin()));

  /** Context links passed into UserPillComponent based on the current role */
  readonly pillContextLinks = computed(() => {
    if (this.isCustomer()) return [
      { label: 'My shipments',  icon: 'dashboard',       route: '/customer/dashboard' },
      { label: 'New shipment',  icon: 'add_box',         route: '/customer/shipments/new' },
      { label: 'Track a parcel',icon: 'gps_fixed',       route: '/track' },
    ];
    if (this.isDriver()) return [
      { label: 'My deliveries', icon: 'local_shipping',  route: '/driver/deliveries' },
    ];
    if (this.isAdmin()) return [
      { label: 'Admin dashboard', icon: 'dashboard',     route: '/admin/dashboard' },
    ];
    return [];
  });

  // ── Mega-menu definitions ──────────────────────────────────
  readonly panels: MenuPanel[] = [
    {
      id: 'ship',
      label: 'Ship',
      columns: [
        {
          heading: 'Create a shipment',
          links: [
            { label: 'Book a pickup',      route: '/customer/shipments/new', desc: 'Door-to-door in minutes',      icon: 'add_box' },
            { label: 'Price estimate',     route: '/price-estimate',         desc: 'Calculate your cost',          icon: 'calculate' },
            { label: 'Multiple parcels',   route: '/multiple-parcels',       desc: 'Bundle items in one booking',  icon: 'inventory_2' },
          ]
        },
        {
          heading: 'Guidance',
          links: [
            { label: 'Packaging guide',    route: '/packaging-guide', icon: 'archive' },
            { label: 'Drop-off points',    route: '/drop-off-points', icon: 'location_on' },
            { label: 'Returns',            route: '/returns',         icon: 'undo', desc: 'Coming soon' },
          ]
        },
        {
          heading: 'Service tiers',
          links: [
            { label: 'STANDARD',           route: '/how-it-works',    desc: 'Same or next day' },
            { label: 'EXPRESS',            route: '/how-it-works',    desc: 'Priority — within the hour' },
          ]
        }
      ],
      promo: { headline: 'New to VAN DIRECT?', body: 'Register in 30 seconds and book your first delivery right away.', cta: 'Get started', ctaRoute: '/register', color: '#C41E3A' }
    },
    {
      id: 'track',
      label: 'Track',
      columns: [
        {
          heading: 'Track your shipment',
          links: [
            { label: 'Track a parcel',           route: '/track',                   desc: 'Enter your tracking number',          icon: 'gps_fixed' },
            { label: 'Live driver location',      route: '/live-tracking',           desc: 'Watch the driver move in real time',  icon: 'location_on' },
            { label: 'Delivery confirmation',     route: '/delivery-confirmation',   desc: 'Timestamped delivery record',         icon: 'verified' },
          ]
        },
        {
          heading: 'Notifications',
          links: [
            { label: 'In-app alerts',      route: '/in-app-notifications', desc: 'Status updates in the app',         icon: 'notifications' },
            { label: 'SMS updates',        route: '/sms-updates',          desc: 'Coming soon',                       icon: 'sms' },
          ]
        }
      ],
      promo: { headline: 'Real-time GPS', body: 'Watch your driver move on the map — updated every 5 seconds.', cta: 'Track now', ctaRoute: '/track', color: '#1B3A6B' }
    },
    {
      id: 'support',
      label: 'Support',
      columns: [
        {
          heading: 'Getting help',
          links: [
            { label: 'How it works',       route: '/how-it-works',    desc: 'Step-by-step guide',             icon: 'info' },
            { label: 'FAQ',                route: '/faq',             desc: 'Common questions answered',      icon: 'help_outline' },
            { label: 'Contact us',         route: '/contact',         desc: 'Phone, email and address',       icon: 'headset_mic' },
          ]
        },
        {
          heading: 'Issues',
          links: [
            { label: 'Report a problem',   route: '/report-problem',  desc: 'Missing or damaged parcel', icon: 'report_problem' },
            { label: 'Drop-off points',    route: '/drop-off-points', icon: 'location_on' },
          ]
        }
      ],
      promo: { headline: 'Here to help', body: 'Our support team is available Monday to Saturday, 8 am to 8 pm.', cta: 'Contact us', ctaRoute: '/contact', color: '#0369A1' }
    },
    {
      id: 'account',
      label: 'Account',
      columns: [
        {
          heading: 'Customers',
          links: [
            { label: 'Log in',             route: '/login',    icon: 'login' },
            { label: 'Create an account',  route: '/register', icon: 'person_add' },
          ]
        },
        {
          heading: 'Drivers',
          links: [
            { label: 'Become a driver',    route: '/register', desc: 'Earn on every delivery', icon: 'directions_car' },
          ]
        }
      ],
      promo: { headline: 'Already a member?', body: 'Log in to book shipments, check tracking and manage your account.', cta: 'Log in', ctaRoute: '/login', color: '#1B3A6B' }
    }
  ];

  constructor(
    public auth: AuthService,
    public notifSvc: NotificationService,
    private router: Router,
    private el: ElementRef
  ) {}

  ngOnInit(): void {
    this.auth.hydrateFromStorage();
    if (this.auth.isLoggedIn()) {
      this.notifSvc.fetchNotifications().subscribe({ error: () => {} });
    }
    // Close panels on route change
    this.routeSub = this.router.events
      .pipe(filter(e => e instanceof NavigationEnd))
      .subscribe(() => { this.closeAll(); });
  }

  ngOnDestroy(): void {
    this.routeSub?.unsubscribe();
    clearTimeout(this.hoverTimer);
    clearTimeout(this.closeTimer);
  }

  @HostListener('window:scroll')
  onScroll(): void { this.scrolled.set(window.scrollY > 4); }

  @HostListener('document:keydown.escape')
  onEsc(): void { this.closeAll(); }

  // ── Panel open / close with hover delay ───────────────────
  onNavEnter(id: string): void {
    clearTimeout(this.closeTimer);
    this.hoverTimer = setTimeout(() => this.activePanel.set(id), 120);
  }

  onNavLeave(): void {
    clearTimeout(this.hoverTimer);
    this.closeTimer = setTimeout(() => this.activePanel.set(null), 200);
  }

  onPanelEnter(): void { clearTimeout(this.closeTimer); }
  onPanelLeave(): void { this.closeTimer = setTimeout(() => this.activePanel.set(null), 200); }

  togglePanel(id: string): void {
    this.activePanel.set(this.activePanel() === id ? null : id);
    this.accountOpen.set(false);
    this.notifOpen.set(false);
  }

  closeAll(): void {
    clearTimeout(this.hoverTimer);
    clearTimeout(this.closeTimer);
    this.activePanel.set(null);
    this.accountOpen.set(false);
    this.notifOpen.set(false);
  }

  // ── Account dropdown ───────────────────────────────────────
  toggleAccount(e: Event): void {
    e.stopPropagation();
    this.accountOpen.set(!this.accountOpen());
    this.activePanel.set(null);
    this.notifOpen.set(false);
  }

  // ── Notifications dropdown ─────────────────────────────────
  toggleNotif(e: Event): void {
    e.stopPropagation();
    this.notifOpen.set(!this.notifOpen());
    this.accountOpen.set(false);
    this.activePanel.set(null);
  }

  markRead(n: AppNotification, e: Event): void {
    e.stopPropagation();
    if (!n.readFlag) this.notifSvc.markAsRead(n.id).subscribe();
  }

  markAllRead(): void {
    this.notifications().filter(n => !n.readFlag).forEach(n => this.notifSvc.markAsRead(n.id).subscribe());
  }

  logout(): void {
    this.auth.logout();
    this.closeAll();
    this.router.navigate(['/login']);
  }

  // ── Tracking inside the panel ──────────────────────────────
  doTrack(): void {
    if (this.trackQuery.trim()) {
      this.closeAll();
      this.router.navigate(['/track'], { queryParams: { tn: this.trackQuery.trim() } });
      this.trackQuery = '';
    }
  }

  /** Keyboard navigation inside the account dropdown (arrow keys cycle items, Escape closes) */
  onMenuKey(e: KeyboardEvent): void {
    const panel = (e.currentTarget as HTMLElement);
    const items = Array.from(panel.querySelectorAll<HTMLElement>('[role="menuitem"]'));
    const idx   = items.indexOf(document.activeElement as HTMLElement);
    if (e.key === 'Escape') { this.closeAll(); return; }
    if (e.key === 'ArrowDown') { e.preventDefault(); items[(idx + 1) % items.length]?.focus(); }
    if (e.key === 'ArrowUp')   { e.preventDefault(); items[(idx - 1 + items.length) % items.length]?.focus(); }
  }

  // ── Mobile drawer ──────────────────────────────────────────
  openDrawer(): void  {
    this.drawerOpen.set(true);
    document.body.style.overflow = 'hidden';
  }
  closeDrawer(): void {
    this.drawerOpen.set(false);
    document.body.style.overflow = '';
    this.drawerSection.set(null);
  }
  toggleDrawerSection(id: string): void {
    this.drawerSection.set(this.drawerSection() === id ? null : id);
  }

  getMyAreaRoute(): string {
    if (this.isAdmin())    return '/admin/dashboard';
    if (this.isDriver())   return '/driver/deliveries';
    return '/customer/dashboard';
  }
}
