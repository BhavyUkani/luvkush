import { Component, OnInit, ChangeDetectionStrategy, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../../core/services/api.service';
import { imageUrl } from '../../../shared/utils/image-url';

interface Category {
  id: number;
  name: string;
  slug: string;
  description: string | null;
  image_url: string | null;
  status: string;
  display_order: number;
  product_count?: number;
}

const EMPTY_FORM = () => ({ name: '', description: '', image_url: '', display_order: '0', status: 'active' });
const DEDICATED_SLUGS = ['hair-wigs', 'hair-patches'];

@Component({
  selector: 'lk-admin-categories',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="page">
      <div class="page-header">
        <h1>Categories <span class="count">{{ visibleCategories().length }}</span></h1>
        <button class="btn-primary" (click)="openCreate()">+ Add Category</button>
      </div>

      <div class="info-note">Hair Wigs and Hair Patches are managed as dedicated modules and are excluded from this list.</div>

      <!-- Bulk Actions Bar -->
      @if (selectedIds().size > 0) {
        <div class="bulk-bar">
          <span class="bulk-count">{{ selectedIds().size }} selected</span>
          <select class="bulk-select" [(ngModel)]="bulkAction">
            <option value="">Bulk Action...</option>
            <option value="active">Activate Selected</option>
            <option value="inactive">Deactivate Selected</option>
            <option value="delete">Delete Selected</option>
          </select>
          <button class="btn-bulk-apply" [disabled]="!bulkAction" (click)="applyBulk()">Apply</button>
          <button class="btn-bulk-clear" (click)="clearSelection()">✕ Clear</button>
        </div>
      }

      @if (loading()) {
        <div class="loading">Loading categories...</div>
      } @else if (error()) {
        <div class="error-msg">{{ error() }} <button (click)="load()">Retry</button></div>
      } @else {
        <table class="data-table">
          <thead>
            <tr>
              <th style="width:36px"><input type="checkbox" class="cb" [checked]="allSelected()" (change)="toggleSelectAll()" /></th>
              <th>Image</th>
              <th>Name</th>
              <th>Slug</th>
              <th>Products</th>
              <th>Order</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            @for (cat of visibleCategories(); track cat.id) {
              <tr [class.row-selected]="selectedIds().has(cat.id)">
                <td><input type="checkbox" class="cb" [checked]="selectedIds().has(cat.id)" (change)="toggleSelect(cat.id)" /></td>
                <td>
                  @if (cat.image_url) {
                    <img [src]="imgUrl(cat.image_url)" class="thumb" [alt]="cat.name" />
                  } @else {
                    <div class="thumb-empty">—</div>
                  }
                </td>
                <td>
                  <div class="cat-name">{{ cat.name }}</div>
                  @if (cat.description) { <div class="cat-desc">{{ cat.description }}</div> }
                </td>
                <td class="muted">{{ cat.slug }}</td>
                <td class="muted">{{ cat.product_count ?? 0 }}</td>
                <td class="muted">{{ cat.display_order }}</td>
                <td>
                  <span class="badge" [class.badge-active]="cat.status === 'active'" [class.badge-inactive]="cat.status !== 'active'">
                    {{ cat.status }}
                  </span>
                </td>
                <td>
                  <div class="action-btns">
                    <button class="btn-edit" (click)="openEdit(cat)">Edit</button>
                    <button class="btn-delete" (click)="confirmDelete(cat)">Delete</button>
                  </div>
                </td>
              </tr>
            }
            @if (!visibleCategories().length) {
              <tr><td colspan="8" class="empty-cell">No categories found</td></tr>
            }
          </tbody>
        </table>
      }
    </div>

    <!-- Create / Edit Modal -->
    @if (showForm()) {
      <div class="modal-backdrop" (click)="closeForm()">
        <div class="modal" (click)="$event.stopPropagation()">
          <div class="modal-header">
            <h2>{{ editingId() ? 'Edit Category' : 'Add Category' }}</h2>
            <button class="modal-close" (click)="closeForm()">✕</button>
          </div>
          <div class="modal-body">
            <div class="form-grid">
              <div class="field field-full">
                <label>Category Name *</label>
                <input type="text" [(ngModel)]="form().name" class="form-input" placeholder="e.g. Hair Care" />
              </div>
              <div class="field field-full">
                <label>Description</label>
                <input type="text" [(ngModel)]="form().description" class="form-input" placeholder="Short description..." />
              </div>
              <div class="field field-full">
                <label>Category Image</label>
                <div class="img-upload-zone">
                  @if (catImgPreview()) {
                    <div class="img-preview-wrap">
                      <img [src]="catImgPreview()" class="img-preview" alt="Category preview" />
                      <button type="button" class="img-remove-btn" (click)="removeImage()">✕ Remove</button>
                    </div>
                  }
                  <label class="img-upload-btn">
                    <input type="file" accept="image/*" (change)="onImagePick($event)" style="display:none" />
                    {{ catImgPreview() ? 'Change Image' : 'Upload Image' }}
                  </label>
                </div>
              </div>
              <div class="field">
                <label>Display Order</label>
                <input type="number" [(ngModel)]="form().display_order" class="form-input" placeholder="0" />
              </div>
              <div class="field">
                <label>Status</label>
                <select [(ngModel)]="form().status" class="form-input">
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                </select>
              </div>
            </div>
            @if (formError()) { <div class="error-msg" style="margin-top:1rem">{{ formError() }}</div> }
          </div>
          <div class="modal-footer">
            <button class="btn-secondary" (click)="closeForm()">Cancel</button>
            <button class="btn-primary" (click)="saveCategory()" [disabled]="saving()">
              {{ saving() ? 'Saving...' : (editingId() ? 'Update Category' : 'Create Category') }}
            </button>
          </div>
        </div>
      </div>
    }

    @if (showBulkConfirm()) {
      <div class="modal-backdrop" (click)="showBulkConfirm.set(false)">
        <div class="modal" style="max-width:440px" (click)="$event.stopPropagation()">
          <div class="modal-header">
            <h2>Confirm Bulk Action</h2>
            <button class="modal-close" (click)="showBulkConfirm.set(false)">✕</button>
          </div>
          <div class="modal-body">
            <p>Apply <strong>{{ bulkActionLabel() }}</strong> to <strong>{{ selectedIds().size }}</strong> categories?</p>
          </div>
          <div class="modal-footer">
            <button class="btn-secondary" (click)="showBulkConfirm.set(false)">Cancel</button>
            <button class="btn-primary" (click)="executeBulk()" [disabled]="bulkRunning()">
              {{ bulkRunning() ? 'Applying...' : 'Confirm' }}
            </button>
          </div>
        </div>
      </div>
    }
  `,
  styles: [`
    .page { padding: 2rem; max-width: 1440px; }
    .info-note { font-size: 0.78rem; color: #888; background: #F7F8FA; border: 1px solid #E8E8E8; border-radius: 6px; padding: 0.5rem 0.875rem; margin-bottom: 1rem; }
    .bulk-bar { display: flex; align-items: center; gap: 0.75rem; padding: 0.6rem 1rem; background: rgba(184,115,51,0.06); border: 1px solid rgba(184,115,51,0.2); border-radius: 6px; margin-bottom: 1rem; }
    .bulk-count { font-size: 0.8rem; font-weight: 600; color: #B87333; }
    .bulk-select { padding: 0.4rem 0.6rem; border: 1px solid #E8E8E8; border-radius: 4px; font-size: 0.8rem; outline: none; background: #fff; }
    .btn-bulk-apply { padding: 0.35rem 0.75rem; background: #B87333; color: #fff; border: none; border-radius: 4px; font-size: 0.8rem; cursor: pointer; }
    .btn-bulk-apply:disabled { opacity: 0.4; cursor: not-allowed; }
    .btn-bulk-clear { padding: 0.35rem 0.75rem; background: none; border: 1px solid #E8E8E8; color: #888; border-radius: 4px; font-size: 0.8rem; cursor: pointer; }
    .cb { width: 15px; height: 15px; cursor: pointer; accent-color: #B87333; }
    .row-selected td { background: rgba(184,115,51,0.05) !important; }
    .page-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 1.5rem; }
    .page-header h1 { font-size: 1.375rem; font-weight: 700; color: #1C1C1C; margin: 0; display: flex; align-items: center; gap: 0.5rem; letter-spacing: -0.01em; }
    .count { font-size: 0.8rem; font-weight: 500; color: #888; background: #F0F0F0; padding: 2px 8px; border-radius: 20px; }
    .loading { color: #888; padding: 2rem; }
    .error-msg { color: #DC2626; padding: 0.75rem; background: rgba(220,38,38,0.06); border: 1px solid rgba(220,38,38,0.15); border-radius: 6px; margin-bottom: 1rem; font-size: 0.875rem; }
    .error-msg button { margin-left: 1rem; background: none; border: 1px solid #DC2626; color: #DC2626; padding: 2px 8px; border-radius: 4px; cursor: pointer; font-size: 0.75rem; }
    .data-table { width: 100%; border-collapse: collapse; font-size: 0.875rem; background: #fff; border: 1px solid #E8E8E8; border-radius: 8px; overflow: hidden; }
    .data-table th { text-align: left; padding: 0.65rem 0.875rem; font-size: 0.68rem; font-weight: 600; letter-spacing: 0.07em; text-transform: uppercase; color: #888; background: #FAFAFA; border-bottom: 1px solid #E8E8E8; }
    .data-table td { padding: 0.7rem 0.875rem; border-bottom: 1px solid #F0F0F0; color: #333; vertical-align: middle; }
    .data-table tr:last-child td { border-bottom: none; }
    .data-table tr:hover td { background: #F7F8FA; }
    .thumb { width: 40px; height: 40px; object-fit: cover; border-radius: 6px; border: 1px solid #E8E8E8; }
    .thumb-empty { width: 40px; height: 40px; background: #F0F0F0; border-radius: 6px; display: flex; align-items: center; justify-content: center; color: #AAAAAA; font-size: 0.75rem; }
    .cat-name { font-weight: 600; color: #1C1C1C; }
    .cat-desc { font-size: 0.75rem; color: #888; margin-top: 2px; }
    .muted { color: #888; }
    .badge { display: inline-block; padding: 3px 8px; border-radius: 20px; font-size: 0.68rem; font-weight: 600; text-transform: uppercase; letter-spacing: 0.04em; background: #F0F0F0; color: #888; }
    .badge-active { background: rgba(21,128,61,0.09); color: #15803D; }
    .badge-inactive { background: rgba(220,38,38,0.09); color: #DC2626; }
    .action-btns { display: flex; gap: 0.5rem; }
    .btn-edit { padding: 4px 10px; background: rgba(184,115,51,0.08); border: 1px solid rgba(184,115,51,0.3); color: #B87333; border-radius: 4px; font-size: 0.75rem; cursor: pointer; transition: background 0.15s; }
    .btn-edit:hover { background: rgba(184,115,51,0.15); }
    .btn-delete { padding: 4px 10px; background: none; border: 1px solid rgba(220,38,38,0.3); color: #DC2626; border-radius: 4px; font-size: 0.75rem; cursor: pointer; transition: background 0.15s; }
    .btn-delete:hover { background: rgba(220,38,38,0.06); }
    .btn-primary { padding: 0.5rem 1.25rem; background: #B87333; color: #fff; border: none; border-radius: 6px; font-size: 0.875rem; font-weight: 600; cursor: pointer; transition: opacity 0.15s; }
    .btn-primary:hover { opacity: 0.9; }
    .btn-primary:disabled { opacity: 0.5; cursor: not-allowed; }
    .btn-secondary { padding: 0.5rem 1.25rem; background: #fff; border: 1px solid #E8E8E8; color: #555; border-radius: 6px; font-size: 0.875rem; cursor: pointer; transition: background 0.15s; }
    .btn-secondary:hover { background: #F7F8FA; }
    .empty-cell { text-align: center; color: #AAAAAA; padding: 3rem; font-style: italic; }
    .modal-backdrop { position: fixed; inset: 0; background: rgba(0,0,0,0.4); z-index: 1000; display: flex; align-items: center; justify-content: center; padding: 2rem; }
    .modal { background: #fff; border: 1px solid #E8E8E8; border-radius: 12px; width: 100%; max-width: 500px; box-shadow: 0 8px 40px rgba(0,0,0,0.12); }
    .modal-header { display: flex; justify-content: space-between; align-items: center; padding: 1.25rem 1.5rem; border-bottom: 1px solid #E8E8E8; }
    .modal-header h2 { font-size: 1rem; font-weight: 700; color: #1C1C1C; margin: 0; }
    .modal-close { background: none; border: none; color: #888; font-size: 1rem; cursor: pointer; padding: 4px 8px; border-radius: 4px; transition: color 0.15s; }
    .modal-close:hover { color: #1C1C1C; }
    .modal-body { padding: 1.5rem; }
    .modal-footer { display: flex; justify-content: flex-end; gap: 0.75rem; padding: 1rem 1.5rem; border-top: 1px solid #E8E8E8; }
    .form-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; }
    .field { display: flex; flex-direction: column; gap: 0.4rem; }
    .field-full { grid-column: 1 / -1; }
    .field label { font-size: 0.68rem; font-weight: 600; letter-spacing: 0.07em; text-transform: uppercase; color: #888; }
    .form-input { padding: 0.5rem 0.75rem; background: #fff; border: 1px solid #E8E8E8; border-radius: 6px; color: #1C1C1C; font-size: 0.875rem; outline: none; width: 100%; box-sizing: border-box; transition: border-color 0.15s; }
    .form-input:focus { border-color: #B87333; box-shadow: 0 0 0 3px rgba(184,115,51,0.1); }
    .form-input::placeholder { color: #AAAAAA; }
    .img-upload-zone { display: flex; flex-direction: column; gap: 0.75rem; }
    .img-preview-wrap { display: flex; align-items: center; gap: 1rem; }
    .img-preview { width: 80px; height: 80px; object-fit: cover; border-radius: 8px; border: 1px solid #E8E8E8; }
    .img-remove-btn { padding: 4px 10px; background: none; border: 1px solid rgba(220,38,38,0.3); color: #DC2626; border-radius: 4px; font-size: 0.75rem; cursor: pointer; }
    .img-remove-btn:hover { background: rgba(220,38,38,0.06); }
    .img-upload-btn { display: inline-flex; align-items: center; padding: 0.45rem 1rem; border: 1px dashed #B87333; border-radius: 6px; color: #B87333; font-size: 0.8rem; font-weight: 600; cursor: pointer; background: rgba(184,115,51,0.04); transition: background 0.15s; }
    .img-upload-btn:hover { background: rgba(184,115,51,0.1); }
  `]
})
export class AdminCategoriesComponent implements OnInit {
  private readonly api = inject(ApiService);

  categories = signal<Category[]>([]);
  loading = signal(true);
  error = signal('');

  showForm = signal(false);
  editingId = signal<number | null>(null);
  saving = signal(false);
  formError = signal('');
  form = signal(EMPTY_FORM());
  catImgPreview = signal<string>('');
  catImgFile = signal<File | null>(null);
  readonly imgUrl = imageUrl;

  // Bulk (P3)
  selectedIds = signal<Set<number>>(new Set());
  bulkAction = '';
  showBulkConfirm = signal(false);
  bulkRunning = signal(false);

  readonly visibleCategories = computed(() =>
    this.categories().filter(c => !DEDICATED_SLUGS.includes(c.slug))
  );

  readonly allSelected = computed(() => {
    const ids = this.visibleCategories().map(c => c.id);
    const sel = this.selectedIds();
    return ids.length > 0 && ids.every(id => sel.has(id));
  });

  readonly bulkActionLabel = computed(() => {
    const map: Record<string, string> = { active: 'Activate', inactive: 'Deactivate', delete: 'Delete' };
    return map[this.bulkAction] || this.bulkAction;
  });

  ngOnInit(): void { this.load(); }

  toggleSelect(id: number): void {
    this.selectedIds.update(s => { const n = new Set(s); n.has(id) ? n.delete(id) : n.add(id); return n; });
  }

  toggleSelectAll(): void {
    if (this.allSelected()) {
      this.selectedIds.set(new Set());
    } else {
      this.selectedIds.set(new Set(this.visibleCategories().map(c => c.id)));
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
      reqs = ids.map(id => this.api.delete<any>(`/admin/categories/${id}`).toPromise().catch(() => null));
    } else {
      const status = this.bulkAction;
      reqs = ids.map(id => this.api.put<any>(`/admin/categories/${id}`, { status }).toPromise().catch(() => null));
    }
    Promise.all(reqs).then(() => {
      this.bulkRunning.set(false);
      this.showBulkConfirm.set(false);
      this.clearSelection();
      this.load();
    });
  }

  load(): void {
    this.loading.set(true);
    this.error.set('');
    this.api.get<any>('/admin/categories').subscribe({
      next: (res) => { this.categories.set(res.data || []); this.loading.set(false); },
      error: (err) => { this.error.set(err.userMessage || 'Failed to load categories'); this.loading.set(false); }
    });
  }

  openCreate(): void {
    this.editingId.set(null);
    this.form.set(EMPTY_FORM());
    this.formError.set('');
    this.catImgPreview.set('');
    this.catImgFile.set(null);
    this.showForm.set(true);
  }

  openEdit(cat: Category): void {
    this.editingId.set(cat.id);
    this.form.set({
      name: cat.name, description: cat.description || '',
      image_url: cat.image_url || '', display_order: String(cat.display_order),
      status: cat.status
    });
    this.formError.set('');
    this.catImgPreview.set(imageUrl(cat.image_url));
    this.catImgFile.set(null);
    this.showForm.set(true);
  }

  closeForm(): void {
    this.showForm.set(false);
    this.catImgPreview.set('');
    this.catImgFile.set(null);
  }

  onImagePick(event: Event): void {
    const file = (event.target as HTMLInputElement).files?.[0];
    if (!file) return;
    this.catImgFile.set(file);
    const reader = new FileReader();
    reader.onload = (e) => this.catImgPreview.set(e.target!.result as string);
    reader.readAsDataURL(file);
  }

  removeImage(): void {
    this.catImgPreview.set('');
    this.catImgFile.set(null);
    this.form.update(f => ({ ...f, image_url: '' }));
  }

  saveCategory(): void {
    const f = this.form();
    if (!f.name.trim()) { this.formError.set('Category name is required'); return; }

    this.saving.set(true);
    this.formError.set('');

    const payload = {
      name: f.name.trim(),
      description: f.description || null,
      display_order: Number(f.display_order) || 0,
      status: f.status
    };

    const editId = this.editingId();
    const req = editId
      ? this.api.put<any>(`/admin/categories/${editId}`, payload)
      : this.api.post<any>('/admin/categories', payload);

    req.subscribe({
      next: (res: any) => {
        const savedId: number = res.data?.id ?? editId;
        const file = this.catImgFile();
        if (file && savedId) {
          const fd = new FormData();
          fd.append('image', file);
          this.api.uploadFormData<any>(`/categories/${savedId}/upload-image`, fd).subscribe({
            next: () => { this.saving.set(false); this.showForm.set(false); this.catImgFile.set(null); this.load(); },
            error: (err: any) => { this.saving.set(false); this.formError.set(err.userMessage || 'Image upload failed'); }
          });
        } else {
          this.saving.set(false);
          this.showForm.set(false);
          this.load();
        }
      },
      error: (err: any) => { this.saving.set(false); this.formError.set(err.userMessage || 'Save failed'); }
    });
  }

  confirmDelete(cat: Category): void {
    if (!confirm(`Delete category "${cat.name}"? Products in this category will be unassigned.`)) return;
    this.api.delete<any>(`/admin/categories/${cat.id}`).subscribe({
      next: () => this.load(),
      error: (err) => alert(err.userMessage || 'Delete failed')
    });
  }
}
