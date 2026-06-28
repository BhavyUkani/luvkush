import { Component, OnInit, inject, signal, ChangeDetectionStrategy } from "@angular/core";
import { FormBuilder, ReactiveFormsModule, Validators } from "@angular/forms";
import { CommonModule } from "@angular/common";
import { AuthService } from "../../../core/services/auth.service";
import { ApiService } from "../../../core/services/api.service";
import { ToastService } from "../../../core/services/toast.service";
import { AccountNavComponent } from "../account-nav/account-nav.component";

@Component({
  selector: "lk-profile",
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, ReactiveFormsModule, AccountNavComponent],
  templateUrl: "./profile.component.html",
  styleUrls: ["./profile.component.scss"]
})
export class ProfileComponent implements OnInit {
  private readonly fb    = inject(FormBuilder);
  readonly auth  = inject(AuthService);
  private readonly api   = inject(ApiService);
  private readonly toast = inject(ToastService);

  saving    = signal(false);
  submitted = false;

  form = this.fb.nonNullable.group({
    first_name: ["", [Validators.required, Validators.minLength(2)]],
    last_name:  ["", [Validators.required, Validators.minLength(2)]],
    phone:      ["", Validators.pattern(/^[6-9]\d{9}$/)]
  });

  ngOnInit(): void {
    const u = this.auth.user();
    if (u) this.form.patchValue({ first_name: u.first_name, last_name: u.last_name, phone: u.phone ?? "" });
  }

  get f() { return this.form.controls; }

  onSave(): void {
    this.submitted = true;
    if (this.form.invalid) return;
    this.saving.set(true);
    this.api.put("/account/profile", this.form.value).subscribe({
      next: (res: any) => {
        this.saving.set(false);
        this.auth.updateProfile(res.data);
        this.toast.success("Profile updated successfully!");
      },
      error: () => { this.saving.set(false); this.toast.error("Failed to update profile."); }
    });
  }
}