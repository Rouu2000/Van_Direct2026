import { Component, OnInit, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, RouterLinkActive, Router, NavigationEnd } from '@angular/router';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { MatDividerModule } from '@angular/material/divider';
import { MatBadgeModule } from '@angular/material/badge';
import { AuthService } from '../../services/auth.service';
import { NotificationService, AppNotification } from '../../services/notification.service';
import { filter } from 'rxjs/operators';

@Component({
  selector: 'app-layout',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    RouterLinkActive,
    MatToolbarModule,
    MatButtonModule,
    MatIconModule,
    MatMenuModule,
    MatDividerModule,
    MatBadgeModule
  ],
  templateUrl: './layout.html',
  styleUrl: './layout.css'
})
export class LayoutComponent implements OnInit {
  /** Hide the global nav for admin routes — they have their own shell */
  isAdminRoute = false;

  readonly isLoggedIn = computed(() => this.authService.loggedIn());
  readonly isAdmin = computed(() => this.authService.admin());
  readonly isCustomer = computed(() => this.authService.customer());
  readonly isDriver = computed(() => this.authService.driver());
  readonly displayName = computed(
    () => this.authService.userName() || this.authService.currentUser()?.email || 'User'
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
    if (this.authService.isLoggedIn()) {
      this.notificationService.fetchNotifications().subscribe({ error: () => {} });
    }
    // Track current route to hide nav for admin shell
    this.isAdminRoute = this.router.url.startsWith('/admin');
    this.router.events
      .pipe(filter(e => e instanceof NavigationEnd))
      .subscribe((e: any) => {
        this.isAdminRoute = (e.urlAfterRedirects || e.url || '').startsWith('/admin');
      });
  }

  markNotificationAsRead(notification: AppNotification, event: Event): void {
    event.stopPropagation();
    if (!notification.readFlag) {
      this.notificationService.markAsRead(notification.id).subscribe();
    }
  }

  logout(): void {
    this.authService.logout();
    this.router.navigate(['/login']);
  }
}
