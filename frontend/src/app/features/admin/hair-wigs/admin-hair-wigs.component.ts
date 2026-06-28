import { Component, OnInit, ChangeDetectionStrategy, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../../core/services/api.service';
import { imageUrl } from '../../../shared/utils/image-url';

interface HairWig {
  id: number;
  name: string;
  slug: string;
  description: string | null;
  short_description: string | null;
  base_price: number;
  mrp: number | null;
  gender: string | null;
  size_info: string | null;
  colour_info: string | null;
  how_to_use: string | null;
  primary_image: string | null;
  images: string | null;
  status: string;
  payment_mode?: string;
  advance_amount?: number | null;
}

const EMPTY = () => ({
  name: '', description: '', short_description: '', base_price: 0, mrp: null,
  gender: '', size_info: '', colour_info: '', how_to_use: '',
  primary_image: null, images: null, status: 'active',
  payment_mode: 'full_cod', advance_amount: ''
});

@Component({
  selector: 'lk-admin-hair-wigs',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="page">
      <div class="page-header">
        <h1>Hair Wigs <span class="count">{{ items().length }}</span></h1>
        <button class="btn-primary" (click)="openCreate()">+ Add Wig</button>
      </div>

      @if (selectedIds().size > 0) {
        <div class="bulk-bar">
          <span class="bulk-info">{{ selectedIds().size }} selected</span>
          <select class="bulk-select" [(ngModel)]="bulkAction">
            <option value="">Bulk Action</option>
            <option value="active">Activate Selected</option>
            <option value="archived">Deactivate Selected</option>
            <option value="delete">Delete Selected</option>
          </select>
          <button class="btn-bulk-apply" (click)="applyBulk()" [disabled]="!bulkAction">Apply</button>
          <button class="btn-bulk-clear" (click)="clearSelection()">Clear</button>
        </div>
      }

      @if (loading()) { <div class="loading">Loading...</div> }
      @else if (error()) { <div class="error-msg">{{ error() }} <button (click)="load()">Retry</button></div> }
      @else {
        <table class="data-table">
          <thead><tr>
            <th class="cb"><input type="checkbox" [checked]="allSelected()" (change)="toggleSelectAll()" /></th>
            <th>Image</th><th>Name</th><th>Gender</th><th>Price</th><th>Status</th><th>Actions</th>
          </tr></thead>
          <tbody>
            @for (item of items(); track item.id) {
              <tr [class.row-selected]="selectedIds().has(item.id)">
                <td class="cb"><input type="checkbox" [checked]="selectedIds().has(item.id)" (change)="toggleSelect(item.id)" /></td>
                <td>
                  @if (item.primary_image) {
                    <img [src]="imgUrl(item.primary_image)" class="thumb" [alt]="item.name" />
                  } @else { <div class="thumb-empty">—</div> }
                </td>
                <td>
                  <div class="item-name">{{ item.name }}</div>
                  @if (item.short_description) { <div class="item-sub">{{ item.short_description }}</div> }
                </td>
                <td class="muted">{{ item.gender || '—' }}</td>
                <td class="price">₹{{ item.base_price | number:'1.0-0' }}</td>
                <td>
                  <span class="badge" [class.badge-active]="item.status === 'active'" [class.badge-inactive]="item.status !== 'active'">
                    {{ item.status }}
                  </span>
                </td>
                <td>
                  <div class="action-btns">
                    <button class="btn-edit" (click)="openEdit(item)">Edit</button>
                    <button class="btn-delete" (click)="confirmDelete(item)">Delete</button>
                  </div>
                </td>
              </tr>
            }
            @if (!items().length) {
              <tr><td colspan="7" class="empty-cell">No hair wigs yet. Click "+ Add Wig" to create one.</td></tr>
            }
          </tbody>
        </table>
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
            <p>{{ bulkActionLabel() }} <strong>{{ selectedIds().size }}</strong> item(s)?</p>
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

    <!-- Modal -->
    @if (showForm()) {
      <div class="modal-backdrop" (click)="closeForm()">
        <div class="modal modal-lg" (click)="$event.stopPropagation()">
          <div class="modal-header">
            <h2>{{ editingId() ? 'Edit Wig' : 'Add Hair Wig' }}</h2>
            <button class="modal-close" (click)="closeForm()">✕</button>
          </div>
          <div class="modal-body">
            <div class="form-grid">
              <div class="field field-full">
                <label>Name *</label>
                <input type="text" [(ngModel)]="form().name" class="form-input" placeholder="Wig name" />
              </div>
              <div class="field field-full">
                <label>Short Description</label>
                <input type="text" [(ngModel)]="form().short_description" class="form-input" placeholder="Brief tagline" />
              </div>
              <div class="field field-full">
                <label>Description</label>
                <textarea [(ngModel)]="form().description" class="form-input" rows="3" placeholder="Full description"></textarea>
              </div>
              <div class="field">
                <label>Price (₹) *</label>
                <input type="number" [(ngModel)]="form().base_price" class="form-input" placeholder="0" />
              </div>
              <div class="field">
                <label>MRP (₹)</label>
                <input type="number" [(ngModel)]="form().mrp" class="form-input" placeholder="0" />
              </div>
              <div class="field">
                <label>Gender</label>
                <select [(ngModel)]="form().gender" class="form-input">
                  <option value="">Select</option>
                  <option value="male">Men</option>
                  <option value="female">Women</option>
                  <option value="unisex">Unisex</option>
                </select>
              </div>
              <div class="field">
                <label>Status</label>
                <select [(ngModel)]="form().status" class="form-input">
                  <option value="active">Active</option>
                  <option value="draft">Draft</option>
                  <option value="archived">Archived</option>
                </select>
              </div>
              <div class="field field-full">
                <label>Size Info</label>
                <input type="text" [(ngModel)]="form().size_info" class="form-input" placeholder="e.g. Small (54cm), Medium (56cm), Large (58cm)" />
              </div>
              <div class="field field-full">
                <label>Colour / Shades Available</label>
                <input type="text" [(ngModel)]="form().colour_info" class="form-input" placeholder="e.g. Natural Black, Dark Brown, Medium Brown" />
              </div>
              <div class="field field-full">
                <label>How To Use</label>
                <textarea [(ngModel)]="form().how_to_use" class="form-input" rows="4" placeholder="Step-by-step application instructions..."></textarea>
              </div>

              <!-- Payment Mode -->
              <div class="field field-full">
                <label>Payment Mode</label>
                <select [(ngModel)]="form().payment_mode" class="form-input">
                  <option value="full_cod">Complete COD (Pay everything on delivery)</option>
                  <option value="full_online">Complete Online (No COD)</option>
                  <option value="partial">Partial Online + Partial COD (advance required)</option>
                  <option value="hybrid">Customer Choice (COD / Online / Partial)</option>
                </select>
              </div>
              @if (form().payment_mode === 'partial') {
                <div class="field">
                  <label>Advance Amount (₹)</label>
                  <input type="number" [(ngModel)]="form().advance_amount" class="form-input" placeholder="500" />
                  <span class="hint">Customer pays this amount online; rest on delivery.</span>
                </div>
              }

              @if (editingId()) {
                <div class="field field-full" style="margin-top: 1rem;">
                  <label>Upload Image</label>
                  <div class="img-upload-zone">
                    @if (imgPreview()) {
                      <div class="img-preview-wrap">
                        <img [src]="imgPreview()" class="img-preview" alt="Preview" />
                      </div>
                    } @else if (form().primary_image) {
                      <div class="img-preview-wrap">
                        <img [src]="imgUrl(form().primary_image)" class="img-preview" alt="Current" />
                      </div>
                    }
                    <label class="img-upload-btn">
                      <input type="file" accept="image/*" (change)="onImagePick($event)" style="display:none" />
                      {{ imgPreview() ? 'Change Image' : 'Upload Image' }}
                    </label>
                    @if (imgUploading()) { <span class="uploading-msg">Uploading...</span> }
                  </div>
                </div>
              }
            </div>
            @if (formError()) { <div class="error-msg" style="margin-top:1rem">{{ formError() }}</div> }
          </div>
          <div class="modal-footer">
            <button class="btn-secondary" (click)="closeForm()">Cancel</button>
            <button class="btn-primary" (click)="save()" [disabled]="saving()">
              {{ saving() ? 'Saving...' : (editingId() ? 'Update' : 'Create Wig') }}
            </button>
          </div>
        </div>
      </div>
    }
  `,
  styles: [`
    .page { padding: 2rem; max-width: 1440px; }
    .page-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 1.5rem; }
    .page-header h1 { font-size: 1.375rem; font-weight: 700; color: #1C1C1C; margin: 0; display: flex; align-items: center; gap: 0.5rem; }
    .count { font-size: 0.8rem; font-weight: 500; color: #888; background: #F0F0F0; padding: 2px 8px; border-radius: 20px; }
    .loading { color: #888; padding: 2rem; }
    .error-msg { color: #DC2626; padding: 0.75rem; background: rgba(220,38,38,0.06); border: 1px solid rgba(220,38,38,0.15); border-radius: 6px; font-size: 0.875rem; }
    .error-msg button { margin-left: 1rem; background: none; border: 1px solid #DC2626; color: #DC2626; padding: 2px 8px; border-radius: 4px; cursor: pointer; font-size: 0.75rem; }
    .data-table { width: 100%; border-collapse: collapse; font-size: 0.875rem; background: #fff; border: 1px solid #E8E8E8; border-radius: 8px; overflow: hidden; }
    .data-table th { text-align: left; padding: 0.65rem 0.875rem; font-size: 0.68rem; font-weight: 600; letter-spacing: 0.07em; text-transform: uppercase; color: #888; background: #FAFAFA; border-bottom: 1px solid #E8E8E8; }
    .data-table td { padding: 0.7rem 0.875rem; border-bottom: 1px solid #F0F0F0; color: #333; vertical-align: middle; }
    .data-table tr:last-child td { border-bottom: none; }
    .data-table tr:hover td { background: #F7F8FA; }
    .thumb { width: 44px; height: 44px; object-fit: cover; border-radius: 6px; border: 1px solid #E8E8E8; }
    .thumb-empty { width: 44px; height: 44px; background: #F0F0F0; border-radius: 6px; display: flex; align-items: center; justify-content: center; color: #AAA; font-size: 0.75rem; }
    .item-name { font-weight: 600; color: #1C1C1C; }
    .item-sub { font-size: 0.75rem; color: #888; margin-top: 2px; }
    .price { font-weight: 600; color: #B87333; }
    .muted { color: #888; }
    .badge { display: inline-block; padding: 3px 8px; border-radius: 20px; font-size: 0.68rem; font-weight: 600; text-transform: uppercase; background: #F0F0F0; color: #888; }
    .badge-active { background: rgba(21,128,61,0.09); color: #15803D; }
    .badge-inactive { background: rgba(220,38,38,0.09); color: #DC2626; }
    .action-btns { display: flex; gap: 0.5rem; }
    .btn-edit { padding: 4px 10px; background: rgba(184,115,51,0.08); border: 1px solid rgba(184,115,51,0.3); color: #B87333; border-radius: 4px; font-size: 0.75rem; cursor: pointer; }
    .btn-edit:hover { background: rgba(184,115,51,0.15); }
    .btn-delete { padding: 4px 10px; background: none; border: 1px solid rgba(220,38,38,0.3); color: #DC2626; border-radius: 4px; font-size: 0.75rem; cursor: pointer; }
    .btn-delete:hover { background: rgba(220,38,38,0.06); }
    .btn-primary { padding: 0.5rem 1.25rem; background: #B87333; color: #fff; border: none; border-radius: 6px; font-size: 0.875rem; font-weight: 600; cursor: pointer; }
    .btn-primary:hover { opacity: 0.9; }
    .btn-primary:disabled { opacity: 0.5; cursor: not-allowed; }
    .btn-secondary { padding: 0.5rem 1.25rem; background: #fff; border: 1px solid #E8E8E8; color: #555; border-radius: 6px; font-size: 0.875rem; cursor: pointer; }
    .empty-cell { text-align: center; color: #AAA; padding: 3rem; font-style: italic; }
    .modal-backdrop { position: fixed; inset: 0; background: rgba(0,0,0,0.4); z-index: 1000; display: flex; align-items: center; justify-content: center; padding: 2rem; overflow-y: auto; }
    .modal { background: #fff; border-radius: 12px; width: 100%; max-width: 560px; box-shadow: 0 8px 40px rgba(0,0,0,0.12); }
    .modal-lg { max-width: 680px; }
    .modal-header { display: flex; justify-content: space-between; align-items: center; padding: 1.25rem 1.5rem; border-bottom: 1px solid #E8E8E8; }
    .modal-header h2 { font-size: 1rem; font-weight: 700; color: #1C1C1C; margin: 0; }
    .modal-close { background: none; border: none; color: #888; font-size: 1rem; cursor: pointer; padding: 4px 8px; border-radius: 4px; }
    .modal-body { padding: 1.5rem; max-height: 70vh; overflow-y: auto; }
    .modal-footer { display: flex; justify-content: flex-end; gap: 0.75rem; padding: 1rem 1.5rem; border-top: 1px solid #E8E8E8; }
    .form-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; }
    .field { display: flex; flex-direction: column; gap: 0.4rem; }
    .field-full { grid-column: 1 / -1; }
    .field label { font-size: 0.68rem; font-weight: 600; letter-spacing: 0.07em; text-transform: uppercase; color: #888; }
    .form-input { padding: 0.5rem 0.75rem; background: #fff; border: 1px solid #E8E8E8; border-radius: 6px; color: #1C1C1C; font-size: 0.875rem; outline: none; width: 100%; box-sizing: border-box; resize: vertical; }
    .form-input:focus { border-color: #B87333; box-shadow: 0 0 0 3px rgba(184,115,51,0.1); }
    .img-upload-zone { display: flex; flex-direction: column; gap: 0.75rem; }
    .img-preview-wrap { display: flex; align-items: center; gap: 1rem; }
    .img-preview { width: 80px; height: 80px; object-fit: cover; border-radius: 8px; border: 1px solid #E8E8E8; }
    .img-upload-btn { display: inline-flex; align-items: center; padding: 0.45rem 1rem; border: 1px dashed #B87333; border-radius: 6px; color: #B87333; font-size: 0.8rem; font-weight: 600; cursor: pointer; background: rgba(184,115,51,0.04); }
    .img-upload-btn:hover { background: rgba(184,115,51,0.1); }
    .uploading-msg { font-size: 0.8rem; color: #B87333; }
    .hint { font-size: 0.7rem; color: #888; }
    .bulk-bar { display: flex; align-items: center; gap: 0.75rem; padding: 0.6rem 1rem; background: #FFF8F2; border: 1px solid rgba(184,115,51,0.2); border-radius: 8px; margin-bottom: 1rem; }
    .bulk-info { font-size: 0.8rem; font-weight: 600; color: #B87333; }
    .bulk-select { padding: 0.35rem 0.6rem; border: 1px solid #E8E8E8; border-radius: 4px; font-size: 0.8rem; background: #fff; color: #333; }
    .btn-bulk-apply { padding: 0.35rem 0.8rem; background: #B87333; color: #fff; border: none; border-radius: 4px; font-size: 0.8rem; font-weight: 600; cursor: pointer; }
    .btn-bulk-apply:disabled { opacity: 0.5; cursor: not-allowed; }
    .btn-bulk-clear { padding: 0.35rem 0.8rem; background: none; border: 1px solid #E8E8E8; color: #888; border-radius: 4px; font-size: 0.8rem; cursor: pointer; }
    .cb { width: 36px; }
    .row-selected td { background: #FFF8F2 !important; }
    .btn-danger { padding: 0.5rem 1.25rem; background: #DC2626; color: #fff; border: none; border-radius: 6px; font-size: 0.875rem; font-weight: 600; cursor: pointer; }
    .btn-danger:disabled { opacity: 0.5; cursor: not-allowed; }
  `]
})
export class AdminHairWigsComponent implements OnInit {
  private readonly api = inject(ApiService);
  readonly imgUrl = imageUrl;

  items = signal<HairWig[]>([]);
  loading = signal(true);
  error = signal('');
  showForm = signal(false);
  editingId = signal<number | null>(null);
  saving = signal(false);
  formError = signal('');
  form = signal<any>(EMPTY());
  imgPreview = signal('');
  imgUploading = signal(false);

  selectedIds = signal<Set<number>>(new Set());
  bulkAction = '';
  showBulkConfirm = signal(false);
  bulkRunning = signal(false);

  allSelected = computed(() => {
    const list = this.items();
    return list.length > 0 && list.every(i => this.selectedIds().has(i.id));
  });

  bulkActionLabel = computed(() => {
    if (this.bulkAction === 'delete') return 'Delete';
    if (this.bulkAction === 'active') return 'Activate';
    if (this.bulkAction === 'archived') return 'Deactivate';
    return 'Apply action to';
  });

  toggleSelect(id: number): void {
    this.selectedIds.update(s => { const n = new Set(s); n.has(id) ? n.delete(id) : n.add(id); return n; });
  }

  toggleSelectAll(): void {
    if (this.allSelected()) {
      this.selectedIds.set(new Set());
    } else {
      this.selectedIds.set(new Set(this.items().map(i => i.id)));
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
      reqs = ids.map(id => this.api.delete<any>(`/admin/hair-solutions/${id}`).toPromise().catch(() => null));
    } else {
      const status = this.bulkAction;
      reqs = ids.map(id => this.api.put<any>(`/admin/hair-solutions/${id}`, { status }).toPromise().catch(() => null));
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
    this.api.get<any>('/admin/hair-solutions?type=wig').subscribe({
      next: (res: any) => { this.items.set(res.data || []); this.loading.set(false); },
      error: (err: any) => { this.error.set(err.userMessage || 'Failed to load'); this.loading.set(false); }
    });
  }

  openCreate(): void {
    this.editingId.set(null);
    this.form.set(EMPTY());
    this.imgPreview.set('');
    this.formError.set('');
    this.showForm.set(true);
  }

  openEdit(item: HairWig): void {
    this.editingId.set(item.id);
    this.form.set({
      ...item,
      payment_mode: item.payment_mode || 'full_cod',
      advance_amount: item.advance_amount != null ? String(item.advance_amount) : ''
    });
    this.imgPreview.set('');
    this.formError.set('');
    this.showForm.set(true);
  }

  closeForm(): void {
    this.showForm.set(false);
    this.imgPreview.set('');
  }

  onImagePick(event: Event): void {
    const file = (event.target as HTMLInputElement).files?.[0];
    if (!file || !this.editingId()) return;
    const reader = new FileReader();
    reader.onload = (e) => this.imgPreview.set(e.target!.result as string);
    reader.readAsDataURL(file);

    this.imgUploading.set(true);
    const fd = new FormData();
    fd.append('image', file);
    this.api.uploadFormData<any>(`/admin/hair-solutions/${this.editingId()}/upload-image`, fd).subscribe({
      next: (res: any) => {
        this.imgUploading.set(false);
        this.form.update((f: any) => ({ ...f, primary_image: res.data?.primary_image }));
      },
      error: () => { this.imgUploading.set(false); alert('Image upload failed'); }
    });
  }

  save(): void {
    const f = this.form();
    if (!f.name?.trim()) { this.formError.set('Name is required'); return; }
    if (!f.base_price) { this.formError.set('Price is required'); return; }

    this.saving.set(true);
    this.formError.set('');

    const payload = {
      ...f,
      type: 'wig',
      advance_amount: f.payment_mode === 'partial' ? (Number(f.advance_amount) || null) : null
    };

    const id = this.editingId();
    const req = id
      ? this.api.put<any>(`/admin/hair-solutions/${id}`, payload)
      : this.api.post<any>('/admin/hair-solutions', payload);

    req.subscribe({
      next: () => { this.saving.set(false); this.showForm.set(false); this.load(); },
      error: (err: any) => { this.saving.set(false); this.formError.set(err.userMessage || 'Save failed'); }
    });
  }

  confirmDelete(item: HairWig): void {
    if (!confirm(`Delete "${item.name}"?`)) return;
    this.api.delete<any>(`/admin/hair-solutions/${item.id}`).subscribe({
      next: () => this.load(),
      error: (err: any) => alert(err.userMessage || 'Delete failed')
    });
  }
}
