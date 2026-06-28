import { Routes } from '@angular/router';
import { adminGuard } from '../../core/guards/admin.guard';

export const adminRoutes: Routes = [
  {
    path: '',
    canActivate: [adminGuard],
    loadComponent: () => import('./layout/admin-layout.component').then(m => m.AdminLayoutComponent),
    children: [
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
      {
        path: 'dashboard',
        loadComponent: () => import('./dashboard/admin-dashboard.component').then(m => m.AdminDashboardComponent),
        title: 'Dashboard — Admin'
      },
      {
        path: 'products',
        loadComponent: () => import('./products/admin-products.component').then(m => m.AdminProductsComponent),
        title: 'Products — Admin'
      },
      {
        path: 'categories',
        loadComponent: () => import('./categories/admin-categories.component').then(m => m.AdminCategoriesComponent),
        title: 'Categories — Admin'
      },
      {
        path: 'orders',
        loadComponent: () => import('./orders/admin-orders.component').then(m => m.AdminOrdersComponent),
        title: 'Orders — Admin'
      },
      {
        path: 'customers',
        loadComponent: () => import('./customers/admin-customers.component').then(m => m.AdminCustomersComponent),
        title: 'Customers — Admin'
      },
      {
        path: 'rate-calculator',
        loadComponent: () => import('./rate-calculator/admin-rate-calculator.component').then(m => m.AdminRateCalculatorComponent),
        title: 'Rate Calculator — Admin'
      },
      {
        path: 'wigs',
        loadComponent: () => import('./hair-wigs/admin-hair-wigs.component').then(m => m.AdminHairWigsComponent),
        title: 'Hair Wigs — Admin'
      },
      {
        path: 'hair-wigs',
        redirectTo: 'wigs',
        pathMatch: 'full'
      },
      {
        path: 'hair-patches',
        loadComponent: () => import('./hair-patches/admin-hair-patches.component').then(m => m.AdminHairPatchesComponent),
        title: 'Hair Patches — Admin'
      }
    ]
  }
];
