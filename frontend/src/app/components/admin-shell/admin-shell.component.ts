import { Component, OnInit, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, RouterLinkActive, RouterOutlet, Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { NotificationService, AppNotification } from '../../services/notification.service';

interface NavItem {
  label: string;
  icon: string;
  route: string;
}

@Component({
  selector: 'app-admin-shell',
  standalone: true,
  imports: [CommonModule, RouterLink, RouterLinkActive, RouterOutlet],
  templateUrl: './admin-shell.component.html',
  styleUrl: './admin-shell.component.css'
})
export class AdminShellComponent implements OnInit {
  sidebarOpen = true;
  notifOpen = false;
  userMenuOpen = false;
  darkMode = false;

  readonly navItems: NavItem[] = [
    { label: 'Dashboard',      icon: 'dashboard',       route: '/admin/dashboard' },
    { label: 'Shipments',      icon: 'local_shipping',  route: '/admin/shipments' },
    { label: 'Live Map',       icon: 'map',             route: '/admin/live-shipments' },
    { label: 'All Drivers',    icon: 'directions_car',  route: '/admin/drivers' },
    { label: 'Pending Drivers',icon: 'hourglass_top',   route: '/admin/pending-drivers' },
    { label: 'Users',          icon: 'group',           route: '/admin/users' },
    { label: 'Analytics',      icon: 'bar_chart',       route: '/admin/charts' },
  ];

  readonly displayName = computed(() =>
    this.authService.userName() || this.authService.currentUser()?.email || 'Admin'
  );
  readonly unreadCount = computed(() => this.notificationService.unreadCount());
  readonly notifications = computed(() => this.notificationService.notifications());

  constructor(
    public authService: AuthService,
    public notificationService: NotificationService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.authService.hydrateFromStorage();
    this.notificationService.fetchNotifications().subscribe({ error: () => {} });
    // Restore dark mode preference
    const saved = localStorage.getItem('vd-theme');
    if (saved === 'dark') { this.enableDark(); }
  }

  toggleSidebar(): void { this.sidebarOpen = !this.sidebarOpen; }
  toggleNotif(): void  { this.notifOpen = !this.notifOpen; this.userMenuOpen = false; }
  toggleUserMenu(): void { this.userMenuOpen = !this.userMenuOpen; this.notifOpen = false; }
  closeDropdowns(): void { this.notifOpen = false; this.userMenuOpen = false; }

  toggleDarkMode(): void {
    this.darkMode ? this.disableDark() : this.enableDark();
  }

  private enableDark(): void {
    this.darkMode = true;
    document.documentElement.setAttribute('data-theme', 'dark');
    localStorage.setItem('vd-theme', 'dark');
  }
  private disableDark(): void {
    this.darkMode = false;
    document.documentElement.removeAttribute('data-theme');
    localStorage.setItem('vd-theme', 'light');
  }

  markRead(n: AppNotification, e: Event): void {
    e.stopPropagation();
    if (!n.readFlag) this.notificationService.markAsRead(n.id).subscribe();
  }

  markAllRead(): void {
    this.notifications()
      .filter(n => !n.readFlag)
      .forEach(n => this.notificationService.markAsRead(n.id).subscribe());
  }

  logout(): void {
    this.authService.logout();
    this.router.navigate(['/login']);
  }
}
