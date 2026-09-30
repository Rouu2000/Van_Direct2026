import { Routes } from '@angular/router';
import { HomeComponent } from './pages/home/home';
import { ShipmentListComponent } from './pages/shipment-list/shipment-list';
import { ParcelListComponent } from './pages/parcel-list/parcel-list';
import { LoginComponent } from './pages/login/login';
import { RegisterComponent } from './pages/register/register';
import { ForgotPasswordComponent } from './pages/forgot-password/forgot-password.component';
import { ResetPasswordComponent } from './pages/reset-password/reset-password.component';
import { PendingDriversComponent } from './pages/admin/pending-drivers/pending-drivers';
import { UsersListComponent } from './pages/admin/users-list/users-list';
import { TrackingComponent } from './pages/tracking/tracking';
import { authGuard } from './guards/auth.guard';
import { roleGuard } from './guards/role.guard';

export const routes: Routes = [
  // Public routes
  { path: '', component: HomeComponent },
  { path: 'login', component: LoginComponent },
  { path: 'register', component: RegisterComponent },
  { path: 'forgot-password', component: ForgotPasswordComponent },
  { path: 'reset-password', component: ResetPasswordComponent },
  { path: 'track', component: TrackingComponent },

  // ADMIN routes
  {
    path: 'admin/dashboard',
    component: HomeComponent,
    canActivate: [authGuard, roleGuard],
    data: { roles: ['ADMIN'] }
  },
  {
    path: 'admin/users',
    component: UsersListComponent,
    canActivate: [authGuard, roleGuard],
    data: { roles: ['ADMIN'] }
  },
  {
    path: 'admin/shipments',
    component: ShipmentListComponent,
    canActivate: [authGuard, roleGuard],
    data: { roles: ['ADMIN'] }
  },
  {
    path: 'admin/parcels',
    component: ParcelListComponent,
    canActivate: [authGuard, roleGuard],
    data: { roles: ['ADMIN'] }
  },
  {
    path: 'admin/pending-drivers',
    component: PendingDriversComponent,
    canActivate: [authGuard, roleGuard],
    data: { roles: ['ADMIN'] }
  },
  {
    path: 'admin/charts',
    loadComponent: () => import('./pages/admin/charts/charts.component').then(m => m.AdminChartsComponent),
    canActivate: [authGuard, roleGuard],
    data: { roles: ['ADMIN'] }
  },
  {
    path: 'admin/live-shipments',
    loadComponent: () => import('./pages/admin/live-shipments/live-shipments.component').then(m => m.LiveShipmentsComponent),
    canActivate: [authGuard, roleGuard],
    data: { roles: ['ADMIN'] }
  },
  {
    path: 'admin/drivers',
    loadComponent: () => import('./pages/admin/drivers-management/drivers-management.component').then(m => m.DriversManagementComponent),
    canActivate: [authGuard, roleGuard],
    data: { roles: ['ADMIN'] }
  },

  // CUSTOMER routes
  {
    path: 'customer/dashboard',
    loadComponent: () => import('./pages/customer/dashboard/dashboard.component').then(m => m.CustomerDashboardComponent),
    canActivate: [authGuard, roleGuard],
    data: { roles: ['CUSTOMER'] }
  },
  {
    path: 'customer/shipments/new',
    loadComponent: () => import('./pages/customer/create-shipment/create-shipment.component').then(m => m.CreateShipmentComponent),
    canActivate: [authGuard, roleGuard],
    data: { roles: ['CUSTOMER'] }
  },
  {
    path: 'customer/track',
    component: TrackingComponent,
    canActivate: [authGuard, roleGuard],
    data: { roles: ['CUSTOMER'] }
  },

  // DRIVER routes
  {
    path: 'driver/deliveries',
    loadComponent: () => import('./pages/driver/deliveries/deliveries.component').then(m => m.DriverDeliveriesComponent),
    canActivate: [authGuard, roleGuard],
    data: { roles: ['DRIVER'] }
  },
  {
    path: 'driver/delivery/:id',
    loadComponent: () => import('./pages/driver/deliveries/deliveries.component').then(m => m.DriverDeliveriesComponent),
    canActivate: [authGuard, roleGuard],
    data: { roles: ['DRIVER'] }
  },

  // Legacy redirects
  { path: 'shipments', redirectTo: 'admin/shipments', pathMatch: 'full' },
  { path: 'parcels', redirectTo: 'admin/parcels', pathMatch: 'full' },

  { path: '**', redirectTo: '' }
];
