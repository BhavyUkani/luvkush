import { Component, ChangeDetectionStrategy, signal, inject } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet, Router } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';

interface NavItem {
  icon: string;
  label: string;
  path: string;
  badge?: string;
}

@Component({
  selector: 'lk-admin-layout',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink, RouterLinkActive, RouterOutlet],
  templateUrl: './admin-layout.component.html',
  styleUrls: ['./admin-layout.component.scss']
})
export class AdminLayoutComponent {
  readonly auth   = inject(AuthService);
  private readonly router = inject(Router);
  sidebarOpen = signal(true);

  readonly navItems: NavItem[] = [
    { icon: 'dashboard',  label: 'Dashboard',   path: '/admin/dashboard' },
    { icon: 'products',   label: 'Products',    path: '/admin/products' },
    { icon: 'categories', label: 'Categories',  path: '/admin/categories' },
    { icon: 'hair',       label: 'Hair Wigs',    path: '/admin/wigs' },
    { icon: 'hair',       label: 'Hair Patches', path: '/admin/hair-patches' },
    { icon: 'orders',     label: 'Orders',      path: '/admin/orders' },
    { icon: 'customers',  label: 'Customers',   path: '/admin/customers' },
    { icon: 'calculator', label: 'Rate Calculator', path: '/admin/rate-calculator' },
  ];

  readonly today = new Date().toLocaleDateString('en-IN', {
    weekday: 'short', day: 'numeric', month: 'short', year: 'numeric'
  });

  toggleSidebar(): void {
    this.sidebarOpen.update(v => !v);
  }

  logout(): void {
    this.auth.logout();
    this.router.navigate(['/login']);
  }
}
