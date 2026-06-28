import { Component, ChangeDetectionStrategy, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../../core/services/api.service';

interface Customer {
  id: number;
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  role: string;
  status: string;
  order_count: number;
  total_spent: number;
  created_at: string;
}

@Component({
  selector: 'lk-admin-customers',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="page">
      <div class="page-header">
        <h1>Customers <span class="count">{{ total() }}</span></h1>
      </div>

      <div class="filter-bar">
        <input type="text" class="search-input" placeholder="Search by name or email..." [(ngModel)]="searchQ" (input)="onSearch()" />
      </div>

      @if (selectedIds().size > 0) {
        <div class="bulk-bar">
          <span class="bulk-info">{{ selectedIds().size }} selected</span>
          <select class="bulk-select" [(ngModel)]="bulkAction">
            <option value="">Bulk Action</option>
            <option value="active">Activate Selected</option>
            <option value="suspended">Deactivate Selected</option>
            <option value="delete">Delete Selected</option>
          </select>
          <button class="btn-bulk-apply" (click)="applyBulk()" [disabled]="!bulkAction">Apply</button>
          <button class="btn-bulk-clear" (click)="clearSelection()">Clear</button>
        </div>
      }

      @if (loading()) {
        <div class="loading">Loading customers...</div>
      } @else if (error()) {
        <div class="error-msg">{{ error() }} <button (click)="load()">Retry</button></div>
      } @else {
        <table class="data-table">
          <thead>
            <tr>
              <th class="cb"><input type="checkbox" [checked]="allSelected()" (change)="toggleSelectAll()" /></th>
              <th>Customer</th>
              <th>Phone</th>
              <th>Orders</th>
              <th>Total Spent</th>
              <th>Status</th>
              <th>Joined</th>
            </tr>
          </thead>
          <tbody>
            @for (c of customers(); track c.id) {
              <tr [class.row-selected]="selectedIds().has(c.id)">
                <td class="cb"><input type="checkbox" [checked]="selectedIds().has(c.id)" (change)="toggleSelect(c.id)" /></td>
                <td>
                  <div class="cust-name">{{ c.first_name }} {{ c.last_name }}</div>
                  <div class="cust-email">{{ c.email }}</div>
                </td>
                <td class="muted">{{ c.phone || '—' }}</td>
                <td>{{ c.order_count ?? 0 }}</td>
                <td>₹{{ (c.total_spent ?? 0) | number:'1.0-0' }}</td>
                <td>
                  <span class="badge"
                    [class.badge-active]="c.status === 'active'"
                    [class.badge-pending]="c.status === 'pending'"
                    [class.badge-inactive]="c.status === 'suspended' || c.status === 'deleted'">
                    {{ c.status === 'active' ? 'Active' : c.status === 'pending' ? 'Pending' : 'Blocked' }}
                  </span>
                </td>
                <td class="muted">{{ c.created_at | date:'dd MMM yyyy' }}</td>
              </tr>
            }
            @if (!customers().length) {
              <tr><td colspan="7" class="empty-cell">No customers found</td></tr>
            }
          </tbody>
        </table>

        @if (pages() > 1) {
          <div class="pagination">
            <button [disabled]="page() === 1" (click)="goPage(page() - 1)">← Prev</button>
            <span>Page {{ page() }} of {{ pages() }}</span>
            <button [disabled]="page() === pages()" (click)="goPage(page() + 1)">Next →</button>
          </div>
        }
      }
    </div>

    @if (showBulkConfirm()) {
      <div class="modal-backdrop" (click)="showBulkConfirm.set(false)">
        <div class="modal" (click)="$event.stopPropagation()">
          <div class="modal-header">
            <h2>Confirm Bulk Action</h2>
            <button class="modal-close" (click)="showBulkConfirm.set(false)">✕</button>
          </div>
          <div class="modal-body">
            <p>{{ bulkActionLabel() }} <strong>{{ selectedIds().size }}</strong> customer(s)?</p>
            @if (bulkAction === 'delete') {
              <p style="color:#DC2626;font-size:0.85rem;">This cannot be undone.</p>
            }
          </div>
          <div class="modal-footer">
            <button class="btn-secondary" (click)="showBulkConfirm.set(false)">Cancel</button>
            <button [class]="bulkAction === 'delete' ? 'btn-danger' : 'btn-primary'" (click)="executeBulk()" [disabled]="bulkRunning()">
              {{ bulkRunning() ? 'Processing...' : 'Confirm' }}
            </button>
          </div>
        </div>
      </div>
    }
  `,
  styles: [`
    .page { padding: 2rem; max-width: 1440px; }
    .page-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 1.5rem; }
    .page-header h1 { font-size: 1.375rem; font-weight: 700; color: #1C1C1C; margin: 0; display: flex; align-items: center; gap: 0.5rem; letter-spacing: -0.01em; }
    .count { font-size: 0.8rem; font-weight: 500; color: #888; background: #F0F0F0; padding: 2px 8px; border-radius: 20px; }
    .filter-bar { display: flex; gap: 0.75rem; margin-bottom: 1.5rem; }
    .search-input { padding: 0.5rem 0.75rem; background: #fff; border: 1px solid #E8E8E8; border-radius: 6px; color: #333; font-size: 0.875rem; outline: none; flex: 1; min-width: 200px; transition: border-color 0.15s; }
    .search-input:focus { border-color: #B87333; }
    .search-input::placeholder { color: #AAAAAA; }
    .loading { color: #888; padding: 2rem; }
    .error-msg { color: #DC2626; padding: 0.75rem; background: rgba(220,38,38,0.06); border: 1px solid rgba(220,38,38,0.15); border-radius: 6px; margin-bottom: 1rem; font-size: 0.875rem; }
    .error-msg button { margin-left: 1rem; background: none; border: 1px solid #DC2626; color: #DC2626; padding: 2px 8px; border-radius: 4px; cursor: pointer; font-size: 0.75rem; }
    .data-table { width: 100%; border-collapse: collapse; font-size: 0.875rem; background: #fff; border: 1px solid #E8E8E8; border-radius: 8px; overflow: hidden; }
    .data-table th { text-align: left; padding: 0.65rem 0.875rem; font-size: 0.68rem; font-weight: 600; letter-spacing: 0.07em; text-transform: uppercase; color: #888; background: #FAFAFA; border-bottom: 1px solid #E8E8E8; }
    .data-table td { padding: 0.7rem 0.875rem; border-bottom: 1px solid #F0F0F0; color: #333; vertical-align: middle; }
    .data-table tr:last-child td { border-bottom: none; }
    .data-table tr:hover td { background: #F7F8FA; }
    .cust-name { font-weight: 600; color: #1C1C1C; }
    .cust-email { font-size: 0.75rem; color: #888; margin-top: 2px; }
    .muted { color: #888; }
    .badge { display: inline-block; padding: 3px 8px; border-radius: 20px; font-size: 0.68rem; font-weight: 600; text-transform: uppercase; letter-spacing: 0.04em; background: #F0F0F0; color: #888; }
    .badge-active { background: rgba(21,128,61,0.09); color: #15803D; }
    .badge-pending { background: rgba(217,119,6,0.09); color: #D97706; }
    .badge-inactive { background: rgba(220,38,38,0.09); color: #DC2626; }
    .empty-cell { text-align: center; color: #AAAAAA; padding: 3rem; font-style: italic; }
    .pagination { display: flex; gap: 1rem; align-items: center; justify-content: center; margin-top: 1.5rem; font-size: 0.875rem; color: #888; }
    .pagination button { padding: 0.4rem 0.75rem; background: #fff; border: 1px solid #E8E8E8; color: #555; border-radius: 4px; cursor: pointer; font-size: 0.8rem; transition: background 0.15s; }
    .pagination button:hover { background: #F7F8FA; }
    .pagination button:disabled { opacity: 0.4; cursor: not-allowed; }
    .bulk-bar { display: flex; align-items: center; gap: 0.75rem; padding: 0.6rem 1rem; background: #FFF8F2; border: 1px solid rgba(184,115,51,0.2); border-radius: 8px; margin-bottom: 1rem; }
    .bulk-info { font-size: 0.8rem; font-weight: 600; color: #B87333; }
    .bulk-select { padding: 0.35rem 0.6rem; border: 1px solid #E8E8E8; border-radius: 4px; font-size: 0.8rem; background: #fff; color: #333; }
    .btn-bulk-apply { padding: 0.35rem 0.8rem; background: #B87333; color: #fff; border: none; border-radius: 4px; font-size: 0.8rem; font-weight: 600; cursor: pointer; }
    .btn-bulk-apply:disabled { opacity: 0.5; cursor: not-allowed; }
    .btn-bulk-clear { padding: 0.35rem 0.8rem; background: none; border: 1px solid #E8E8E8; color: #888; border-radius: 4px; font-size: 0.8rem; cursor: pointer; }
    .cb { width: 36px; }
    .row-selected td { background: #FFF8F2 !important; }
    .modal-backdrop { position: fixed; inset: 0; background: rgba(0,0,0,0.4); z-index: 1000; display: flex; align-items: center; justify-content: center; padding: 2rem; }
    .modal { background: #fff; border-radius: 12px; width: 100%; max-width: 440px; box-shadow: 0 8px 40px rgba(0,0,0,0.12); }
    .modal-header { display: flex; justify-content: space-between; align-items: center; padding: 1.25rem 1.5rem; border-bottom: 1px solid #E8E8E8; }
    .modal-header h2 { font-size: 1rem; font-weight: 700; color: #1C1C1C; margin: 0; }
    .modal-close { background: none; border: none; color: #888; font-size: 1rem; cursor: pointer; padding: 4px 8px; border-radius: 4px; }
    .modal-body { padding: 1.5rem; }
    .modal-body p { margin: 0 0 0.5rem; font-size: 0.875rem; color: #333; }
    .modal-footer { display: flex; justify-content: flex-end; gap: 0.75rem; padding: 1rem 1.5rem; border-top: 1px solid #E8E8E8; }
    .btn-primary { padding: 0.5rem 1.25rem; background: #B87333; color: #fff; border: none; border-radius: 6px; font-size: 0.875rem; font-weight: 600; cursor: pointer; }
    .btn-primary:disabled { opacity: 0.5; cursor: not-allowed; }
    .btn-secondary { padding: 0.5rem 1.25rem; background: #fff; border: 1px solid #E8E8E8; color: #555; border-radius: 6px; font-size: 0.875rem; cursor: pointer; }
    .btn-danger { padding: 0.5rem 1.25rem; background: #DC2626; color: #fff; border: none; border-radius: 6px; font-size: 0.875rem; font-weight: 600; cursor: pointer; }
    .btn-danger:disabled { opacity: 0.5; cursor: not-allowed; }
  `]
})
export class AdminCustomersComponent implements OnInit {
  private readonly api = inject(ApiService);

  customers = signal<Customer[]>([]);
  loading = signal(true);
  error = signal('');
  total = signal(0);
  page = signal(1);
  pages = signal(1);
  searchQ = '';
  private searchTimer: any;

  selectedIds = signal<Set<number>>(new Set());
  bulkAction = '';
  showBulkConfirm = signal(false);
  bulkRunning = signal(false);

  allSelected = computed(() => {
    const list = this.customers();
    return list.length > 0 && list.every(c => this.selectedIds().has(c.id));
  });

  bulkActionLabel = computed(() => {
    if (this.bulkAction === 'delete') return 'Delete';
    if (this.bulkAction === 'active') return 'Activate';
    if (this.bulkAction === 'suspended') return 'Deactivate';
    return 'Apply action to';
  });

  toggleSelect(id: number): void {
    this.selectedIds.update(s => { const n = new Set(s); n.has(id) ? n.delete(id) : n.add(id); return n; });
  }

  toggleSelectAll(): void {
    if (this.allSelected()) {
      this.selectedIds.set(new Set());
    } else {
      this.selectedIds.set(new Set(this.customers().map(c => c.id)));
    }
  }

  clearSelection(): void { this.selectedIds.set(new Set()); this.bulkAction = ''; }

  applyBulk(): void {
    if (!this.bulkAction || this.selectedIds().size === 0) return;
    this.showBulkConfirm.set(true);
  }

  executeBulk(): void {
    this.bulkRunning.set(true);
    const ids = [...this.selectedIds()];
    let reqs: Promise<any>[];
    if (this.bulkAction === 'delete') {
      reqs = ids.map(id => this.api.delete<any>(`/admin/customers/${id}`).toPromise().catch(() => null));
    } else {
      const status = this.bulkAction;
      reqs = ids.map(id => this.api.put<any>(`/admin/customers/${id}`, { status }).toPromise().catch(() => null));
    }
    Promise.all(reqs).then(() => {
      this.bulkRunning.set(false);
      this.showBulkConfirm.set(false);
      this.clearSelection();
      this.load();
    });
  }

  ngOnInit(): void { this.load(); }

  load(): void {
    this.loading.set(true);
    this.error.set('');
    const params: any = { page: this.page(), limit: 20 };
    if (this.searchQ.trim()) params['search'] = this.searchQ.trim();

    this.api.get<any>('/admin/customers', params).subscribe({
      next: (res) => {
        this.customers.set(res.data || []);
        this.total.set(res.total || 0);
        this.pages.set(res.pages || 1);
        this.loading.set(false);
      },
      error: (err) => { this.error.set(err.userMessage || 'Failed to load customers'); this.loading.set(false); }
    });
  }

  onSearch(): void {
    clearTimeout(this.searchTimer);
    this.searchTimer = setTimeout(() => { this.page.set(1); this.load(); }, 400);
  }

  goPage(n: number): void { this.page.set(n); this.load(); }
}
