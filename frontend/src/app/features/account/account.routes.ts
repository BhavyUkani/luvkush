import { Routes } from '@angular/router';

export const accountRoutes: Routes = [
  { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
  {
    path: 'dashboard',
    loadComponent: () => import('./dashboard/dashboard.component').then(m => m.DashboardComponent),
    title: 'My Account — Luv Kush Natural'
  },
  {
    path: 'orders',
    loadComponent: () => import('./orders/orders.component').then(m => m.OrdersComponent),
    title: 'My Orders — Luv Kush Natural'
  },
  {
    path: 'orders/:id',
    loadComponent: () => import('./order-detail/order-detail.component').then(m => m.OrderDetailComponent),
    title: 'Order Detail — Luv Kush Natural'
  },
  {
    path: 'wishlist',
    loadComponent: () => import('./wishlist/wishlist.component').then(m => m.AccountWishlistComponent),
    title: 'Wishlist — Luv Kush Natural'
  },
  {
    path: 'addresses',
    loadComponent: () => import('./addresses/addresses.component').then(m => m.AddressesComponent),
    title: 'Saved Addresses — Luv Kush Natural'
  },
  {
    path: 'profile',
    loadComponent: () => import('./profile/profile.component').then(m => m.ProfileComponent),
    title: 'Edit Profile — Luv Kush Natural'
  },
  {
    path: 'settings',
    loadComponent: () => import('./settings/settings.component').then(m => m.SettingsComponent),
    title: 'Account Settings — Luv Kush Natural'
  },
];
