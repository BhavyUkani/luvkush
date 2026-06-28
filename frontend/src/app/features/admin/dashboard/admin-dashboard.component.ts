import { Component, OnInit, ChangeDetectionStrategy, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { ApiService } from '../../../core/services/api.service';

@Component({
  selector: 'lk-admin-dashboard',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, RouterLink],
  template: `
    <div class="page">
      <div class="page-header">
        <h1>Dashboard</h1>
        <span class="date">{{ today }}</span>
      </div>

      @if (loading()) {
        <div class="loading">Loading...</div>
      } @else if (error()) {
        <div class="error-msg">{{ error() }}</div>
      } @else {
        <div class="stats-grid">
          <div class="stat-card">
            <div class="stat-label">Total Orders</div>
            <div class="stat-value">{{ stats()?.orders?.total ?? 0 }}</div>
            <div class="stat-sub">{{ stats()?.orders?.today ?? 0 }} today</div>
          </div>
          <div class="stat-card">
            <div class="stat-label">Revenue This Month</div>
            <div class="stat-value">₹{{ (stats()?.revenue?.this_month ?? 0) | number:'1.0-0' }}</div>
            <div class="stat-sub">₹{{ (stats()?.revenue?.today ?? 0) | number:'1.0-0' }} today</div>
          </div>
          <div class="stat-card stat-warn">
            <div class="stat-label">Pending Orders</div>
            <div class="stat-value">{{ stats()?.orders?.pending ?? 0 }}</div>
            <div class="stat-sub">Needs action</div>
          </div>
          <div class="stat-card stat-alert">
            <div class="stat-label">Out of Stock</div>
            <div class="stat-value">{{ stats()?.products?.out_of_stock ?? 0 }}</div>
            <div class="stat-sub">{{ stats()?.products?.low_stock ?? 0 }} low stock</div>
          </div>
        </div>

        <div class="section-row">
          <h2>Recent Orders</h2>
          <a routerLink="/admin/orders" class="view-all">View All →</a>
        </div>

        <table class="data-table">
          <thead>
            <tr>
              <th>Order #</th>
              <th>Customer</th>
              <th>Amount</th>
              <th>Status</th>
              <th>Date</th>
            </tr>
          </thead>
          <tbody>
            @for (order of stats()?.recentOrders ?? []; track order.id) {
              <tr>
                <td><strong>{{ order.order_number }}</strong></td>
                <td>{{ order.first_name }} {{ order.last_name }}</td>
                <td>₹{{ order.total_amount | number:'1.0-0' }}</td>
                <td><span class="badge badge-{{ order.status }}">{{ order.status }}</span></td>
                <td>{{ order.created_at | date:'dd MMM, HH:mm' }}</td>
              </tr>
            }
            @if (!stats()?.recentOrders?.length) {
              <tr><td colspan="5" class="empty-cell">No orders yet</td></tr>
            }
          </tbody>
        </table>
      }
    </div>
  `,
  styles: [`
    .page { padding: 2rem; max-width: 1200px; }
    .page-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 2rem; }
    .page-header h1 { font-size: 1.375rem; font-weight: 700; margin: 0; color: #1C1C1C; letter-spacing: -0.01em; }
    .date { font-size: 0.8rem; color: #888; }
    .loading { color: #888; padding: 2rem; }
    .error-msg { color: #DC2626; padding: 0.875rem; background: rgba(220,38,38,0.06); border: 1px solid rgba(220,38,38,0.15); border-radius: 6px; margin-bottom: 1rem; font-size: 0.875rem; }
    .stats-grid { display: grid; grid-template-columns: repeat(4,1fr); gap: 1rem; margin-bottom: 2rem; }
    @media(max-width:900px) { .stats-grid { grid-template-columns: repeat(2,1fr); } }
    .stat-card { background: #fff; border: 1px solid #E8E8E8; border-radius: 10px; padding: 1.25rem 1.5rem; box-shadow: 0 1px 3px rgba(0,0,0,0.04); }
    .stat-card.stat-warn { border-color: rgba(184,115,51,0.35); background: rgba(184,115,51,0.04); }
    .stat-card.stat-alert { border-color: rgba(220,38,38,0.3); background: rgba(220,38,38,0.04); }
    .stat-label { font-size: 0.68rem; font-weight: 600; letter-spacing: 0.07em; text-transform: uppercase; color: #888; margin-bottom: 0.5rem; }
    .stat-value { font-size: 2rem; font-weight: 300; color: #1C1C1C; line-height: 1; margin-bottom: 0.25rem; letter-spacing: -0.02em; }
    .stat-sub { font-size: 0.75rem; color: #888; }
    .section-row { display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.875rem; }
    .section-row h2 { font-size: 0.95rem; font-weight: 600; color: #1C1C1C; margin: 0; }
    .view-all { font-size: 0.8rem; color: #B87333; text-decoration: none; font-weight: 500; }
    .view-all:hover { text-decoration: underline; }
    .data-table { width: 100%; border-collapse: collapse; font-size: 0.875rem; background: #fff; border: 1px solid #E8E8E8; border-radius: 8px; overflow: hidden; }
    .data-table th { text-align: left; padding: 0.65rem 1rem; font-size: 0.68rem; font-weight: 600; letter-spacing: 0.07em; text-transform: uppercase; color: #888; background: #FAFAFA; border-bottom: 1px solid #E8E8E8; }
    .data-table td { padding: 0.75rem 1rem; border-bottom: 1px solid #F0F0F0; color: #333; vertical-align: middle; }
    .data-table tr:last-child td { border-bottom: none; }
    .data-table tr:hover td { background: #F7F8FA; }
    .badge { display: inline-block; padding: 3px 8px; border-radius: 20px; font-size: 0.68rem; font-weight: 600; text-transform: uppercase; letter-spacing: 0.04em; background: #F0F0F0; color: #888; }
    .badge-pending { background: rgba(180,83,9,0.1); color: #B45309; }
    .badge-confirmed, .badge-processing { background: rgba(29,78,216,0.09); color: #1D4ED8; }
    .badge-shipped, .badge-out_for_delivery { background: rgba(124,58,237,0.09); color: #7C3AED; }
    .badge-delivered { background: rgba(21,128,61,0.09); color: #15803D; }
    .badge-cancelled, .badge-refunded { background: rgba(220,38,38,0.09); color: #DC2626; }
    .empty-cell { text-align: center; color: #AAAAAA; padding: 2rem; font-style: italic; }
  `]
})
export class AdminDashboardComponent implements OnInit {
  private readonly api = inject(ApiService);

  stats = signal<any>(null);
  loading = signal(true);
  error = signal('');
  readonly today = new Date().toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });

  ngOnInit(): void {
    this.api.get<any>('/admin/dashboard').subscribe({
      next: (res) => { this.stats.set(res.data); this.loading.set(false); },
      error: (err) => { this.error.set(err.userMessage || 'Failed to load dashboard'); this.loading.set(false); }
    });
  }
}
