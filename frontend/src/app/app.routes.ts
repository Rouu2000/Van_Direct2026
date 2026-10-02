import { Routes } from '@angular/router';
import { SiteShellComponent } from './components/site-shell/site-shell.component';
import { AdminShellComponent } from './components/admin-shell/admin-shell.component';
import { ShipmentListComponent } from './pages/shipment-list/shipment-list';
import { ParcelListComponent } from './pages/parcel-list/parcel-list';
import { PendingDriversComponent } from './pages/admin/pending-drivers/pending-drivers';
import { UsersListComponent } from './pages/admin/users-list/users-list';
import { authGuard } from './guards/auth.guard';
import { roleGuard } from './guards/role.guard';

export const routes: Routes = [

  // ── Admin shell (its own layout, no site header/footer) ──
  {
    path: 'admin',
    component: AdminShellComponent,
    canActivate: [authGuard, roleGuard],
    data: { roles: ['ADMIN'] },
    children: [
      { path: 'dashboard',      loadComponent: () => import('./pages/admin/dashboard/admin-dashboard.component').then(m => m.AdminDashboardComponent) },
      { path: 'users',          component: UsersListComponent },
      { path: 'shipments',      component: ShipmentListComponent },
      { path: 'parcels',        component: ParcelListComponent },
      { path: 'pending-drivers',component: PendingDriversComponent },
      { path: 'charts',         loadComponent: () => import('./pages/admin/charts/charts.component').then(m => m.AdminChartsComponent) },
      { path: 'live-shipments', loadComponent: () => import('./pages/admin/live-shipments/live-shipments.component').then(m => m.LiveShipmentsComponent) },
      { path: 'drivers',        loadComponent: () => import('./pages/admin/drivers-management/drivers-management.component').then(m => m.DriversManagementComponent) },
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' }
    ]
  },

  // ── Driver routes (site shell — no admin sidebar) ─────────
  {
    path: 'driver',
    component: SiteShellComponent,
    canActivate: [authGuard, roleGuard],
    data: { roles: ['DRIVER'] },
    children: [
      { path: 'deliveries', loadComponent: () => import('./pages/driver/deliveries/deliveries.component').then(m => m.DriverDeliveriesComponent) },
      { path: 'delivery/:id', loadComponent: () => import('./pages/driver/deliveries/deliveries.component').then(m => m.DriverDeliveriesComponent) },
      { path: '', redirectTo: 'deliveries', pathMatch: 'full' }
    ]
  },

  // ── Everything else through SiteShell ─────────────────────
  {
    path: '',
    component: SiteShellComponent,
    children: [

      // Public
      { path: '', loadComponent: () => import('./pages/home/home').then(m => m.HomeComponent) },
      { path: 'login',           loadComponent: () => import('./pages/login/login').then(m => m.LoginComponent) },
      { path: 'register',        loadComponent: () => import('./pages/register/register').then(m => m.RegisterComponent) },
      { path: 'forgot-password', loadComponent: () => import('./pages/forgot-password/forgot-password.component').then(m => m.ForgotPasswordComponent) },
      { path: 'reset-password',  loadComponent: () => import('./pages/reset-password/reset-password.component').then(m => m.ResetPasswordComponent) },
      { path: 'track',           loadComponent: () => import('./pages/tracking/tracking').then(m => m.TrackingComponent) },

      // Content pages
      { path: 'how-it-works',    loadComponent: () => import('./pages/content/how-it-works.component').then(m => m.HowItWorksComponent) },
      { path: 'faq',             loadComponent: () => import('./pages/content/faq.component').then(m => m.FaqComponent) },
      { path: 'contact',         loadComponent: () => import('./pages/content/contact.component').then(m => m.ContactComponent) },
      { path: 'price-estimate',  loadComponent: () => import('./pages/content/price-estimate.component').then(m => m.PriceEstimateComponent) },
      { path: 'packaging-guide', loadComponent: () => import('./pages/content/packaging-guide.component').then(m => m.PackagingGuideComponent) },
      { path: 'drop-off-points', loadComponent: () => import('./pages/content/drop-off-points.component').then(m => m.DropOffPointsComponent) },
      { path: 'report-problem',  loadComponent: () => import('./pages/content/report-problem.component').then(m => m.ReportProblemComponent) },
      { path: 'about',           loadComponent: () => import('./pages/content/about.component').then(m => m.AboutComponent) },
      { path: 'careers',         loadComponent: () => import('./pages/content/careers.component').then(m => m.CareersComponent) },
      { path: 'terms',           loadComponent: () => import('./pages/content/legal.component').then(m => m.TermsComponent) },
      { path: 'privacy',         loadComponent: () => import('./pages/content/legal.component').then(m => m.PrivacyComponent) },
      { path: 'cookies',         loadComponent: () => import('./pages/content/legal.component').then(m => m.CookiesComponent) },

      // New feature pages (Fix 3 — correct links)
      { path: 'multiple-parcels',         loadComponent: () => import('./pages/content/multiple-parcels.component').then(m => m.MultipleParcelsComponent) },
      { path: 'live-tracking',            loadComponent: () => import('./pages/content/live-tracking.component').then(m => m.LiveTrackingComponent) },
      { path: 'in-app-notifications',     loadComponent: () => import('./pages/content/in-app-notifications.component').then(m => m.InAppNotificationsComponent) },
      { path: 'delivery-confirmation',    loadComponent: () => import('./pages/content/delivery-confirmation.component').then(m => m.DeliveryConfirmationComponent) },
      { path: 'returns',                  loadComponent: () => import('./pages/content/coming-soon.component').then(m => m.ReturnsComponent) },
      { path: 'sms-updates',              loadComponent: () => import('./pages/content/coming-soon.component').then(m => m.SmsUpdatesComponent) },

      // Customer (authenticated)
      {
        path: 'customer/dashboard',
        canActivate: [authGuard, roleGuard],
        data: { roles: ['CUSTOMER'] },
        loadComponent: () => import('./pages/customer/dashboard/dashboard.component').then(m => m.CustomerDashboardComponent)
      },
      {
        path: 'customer/shipments/new',
        canActivate: [authGuard, roleGuard],
        data: { roles: ['CUSTOMER'] },
        loadComponent: () => import('./pages/customer/create-shipment/create-shipment.component').then(m => m.CreateShipmentComponent)
      },
      {
        path: 'customer/track',
        canActivate: [authGuard, roleGuard],
        data: { roles: ['CUSTOMER'] },
        loadComponent: () => import('./pages/tracking/tracking').then(m => m.TrackingComponent)
      },

      // Legacy redirects
      { path: 'shipments', redirectTo: '/admin/shipments', pathMatch: 'full' },
      { path: 'parcels',   redirectTo: '/admin/parcels',   pathMatch: 'full' },

      // Catch-all
      { path: '**', redirectTo: '' }
    ]
  }
];
