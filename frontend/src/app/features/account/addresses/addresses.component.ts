import { Component, OnInit, inject, signal, ChangeDetectionStrategy } from "@angular/core";
import { FormBuilder, ReactiveFormsModule, Validators } from "@angular/forms";
import { CommonModule } from "@angular/common";
import { ApiService } from "../../../core/services/api.service";
import { ToastService } from "../../../core/services/toast.service";
import { AccountNavComponent } from "../account-nav/account-nav.component";

export interface Address {
  id: number;
  label?: string;
  full_name: string;
  phone: string;
  address_line1: string;
  address_line2?: string;
  city: string;
  state: string;
  pincode: string;
  is_default: boolean;
}

@Component({
  selector: "lk-addresses",
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, ReactiveFormsModule, AccountNavComponent],
  templateUrl: "./addresses.component.html",
  styleUrls: ["./addresses.component.scss"]
})
export class AddressesComponent implements OnInit {
  private readonly api   = inject(ApiService);
  private readonly toast = inject(ToastService);
  private readonly fb    = inject(FormBuilder);

  addresses   = signal<Address[]>([]);
  loading     = signal(true);
  saving      = signal(false);
  deleting    = signal<number | null>(null);
  showForm    = signal(false);
  editingId   = signal<number | null>(null);
  submitted   = false;

  readonly STATES = [
    "Andhra Pradesh","Arunachal Pradesh","Assam","Bihar","Chhattisgarh","Goa","Gujarat",
    "Haryana","Himachal Pradesh","Jharkhand","Karnataka","Kerala","Madhya Pradesh",
    "Maharashtra","Manipur","Meghalaya","Mizoram","Nagaland","Odisha","Punjab",
    "Rajasthan","Sikkim","Tamil Nadu","Telangana","Tripura","Uttar Pradesh",
    "Uttarakhand","West Bengal","Delhi","Jammu and Kashmir","Ladakh"
  ];

  form = this.fb.nonNullable.group({
    label:        ["Home"],
    full_name:    ["", [Validators.required]],
    phone:        ["", [Validators.required, Validators.pattern(/^[6-9]\d{9}$/)]],
    address_line1:["", [Validators.required]],
    address_line2:[""],
    city:         ["", [Validators.required]],
    state:        ["", [Validators.required]],
    pincode:      ["", [Validators.required, Validators.pattern(/^\d{6}$/)]],
    is_default:   [false]
  });

  ngOnInit(): void { this.fetchAddresses(); }

  get f() { return this.form.controls; }

  fetchAddresses(): void {
    this.loading.set(true);
    this.api.get<Address[]>("/account/addresses").subscribe({
      next: (res: any) => { this.addresses.set(res.data ?? []); this.loading.set(false); },
      error: () => this.loading.set(false)
    });
  }

  openAdd(): void {
    this.form.reset({ label: "Home", is_default: false });
    this.editingId.set(null);
    this.submitted = false;
    this.showForm.set(true);
  }

  openEdit(addr: Address): void {
    this.form.patchValue(addr);
    this.editingId.set(addr.id);
    this.submitted = false;
    this.showForm.set(true);
  }

  closeForm(): void { this.showForm.set(false); this.editingId.set(null); }

  onSave(): void {
    this.submitted = true;
    if (this.form.invalid) return;
    this.saving.set(true);
    const id = this.editingId();
    const req = id
      ? this.api.put(`/account/addresses/${id}`, this.form.value)
      : this.api.post("/account/addresses", this.form.value);
    req.subscribe({
      next: () => {
        this.saving.set(false);
        this.closeForm();
        this.fetchAddresses();
        this.toast.success(id ? "Address updated!" : "Address added!");
      },
      error: () => { this.saving.set(false); this.toast.error("Failed to save address."); }
    });
  }

  setDefault(addr: Address): void {
    this.api.put(`/account/addresses/${addr.id}/default`, {}).subscribe({
      next: () => { this.fetchAddresses(); this.toast.success("Default address updated!"); },
      error: () => this.toast.error("Failed to update default.")
    });
  }

  delete(addr: Address): void {
    if (!confirm("Delete this address?")) return;
    this.deleting.set(addr.id);
    this.api.delete(`/account/addresses/${addr.id}`).subscribe({
      next: () => {
        this.addresses.update(arr => arr.filter(a => a.id !== addr.id));
        this.deleting.set(null);
        this.toast.info("Address deleted.");
      },
      error: () => { this.deleting.set(null); this.toast.error("Failed to delete."); }
    });
  }
}