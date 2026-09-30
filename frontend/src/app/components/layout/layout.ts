import { Component, OnInit, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, RouterLinkActive, Router } from '@angular/router';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { MatDividerModule } from '@angular/material/divider';
import { MatBadgeModule } from '@angular/material/badge';
import { AuthService } from '../../services/auth.service';
import { DriverService } from '../../services/driver.service';
import { NotificationService, AppNotification } from '../../services/notification.service';

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
  readonly isLoggedIn = computed(() => this.authService.loggedIn());
  readonly isAdmin = computed(() => this.authService.admin());
  readonly isCustomer = computed(() => this.authService.customer());
  readonly isDriver = computed(() => this.authService.driver());
  readonly displayName = computed(
    () => this.authService.userName() || this.authService.currentUser()?.email || 'User'
  );
  readonly unreadCount = computed(() => this.notificationService.unreadCount());
  readonly notifications = computed(() => this.notificationService.notifications());
  driverOnline = false;

  constructor(
    public authService: AuthService,
    private driverService: DriverService,
    public notificationService: NotificationService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.authService.hydrateFromStorage();
    if (this.authService.isLoggedIn()) {
      this.notificationService.fetchNotifications().subscribe({
        error: () => {}
      });
    }
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

  toggleDriverAvailability(online: boolean): void {
    const driverId = this.authService.getUserId();
    if (!driverId) return;

    this.driverService.setAvailability(driverId, online ? 'AVAILABLE' : 'OFFLINE').subscribe({
      next: () => {
        this.driverOnline = online;
      },
      error: () => {
        this.driverOnline = !online;
      }
    });
  }
}
