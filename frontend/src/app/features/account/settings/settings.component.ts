import { Component, inject, signal, ChangeDetectionStrategy } from "@angular/core";
import { FormBuilder, ReactiveFormsModule, Validators, AbstractControl, ValidationErrors } from "@angular/forms";
import { CommonModule } from "@angular/common";
import { Router } from "@angular/router";
import { ApiService } from "../../../core/services/api.service";
import { AuthService } from "../../../core/services/auth.service";
import { ToastService } from "../../../core/services/toast.service";
import { AccountNavComponent } from "../account-nav/account-nav.component";

function passwordsMatch(c: AbstractControl): ValidationErrors | null {
  const pw = c.get("new_password")?.value;
  const confirm = c.get("confirm_password")?.value;
  return pw && confirm && pw !== confirm ? { mismatch: true } : null;
}

@Component({
  selector: "lk-settings",
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, ReactiveFormsModule, AccountNavComponent],
  templateUrl: "./settings.component.html",
  styleUrls: ["./settings.component.scss"]
})
export class SettingsComponent {
  private readonly api    = inject(ApiService);
  private readonly auth   = inject(AuthService);
  private readonly toast  = inject(ToastService);
  private readonly router = inject(Router);
  private readonly fb     = inject(FormBuilder);

  savingPw      = signal(false);
  pwSubmitted   = false;
  showCurrentPw = signal(false);
  showNewPw     = signal(false);
  showConfirmPw = signal(false);
  deletingAcct  = signal(false);

  pwForm = this.fb.nonNullable.group({
    current_password: ["", [Validators.required]],
    new_password:     ["", [Validators.required, Validators.minLength(8)]],
    confirm_password: ["", [Validators.required]]
  }, { validators: passwordsMatch });

  get pf() { return this.pwForm.controls; }

  onChangePw(): void {
    this.pwSubmitted = true;
    if (this.pwForm.invalid) return;
    this.savingPw.set(true);
    this.api.post("/account/change-password", {
      current_password: this.pf.current_password.value,
      new_password: this.pf.new_password.value
    }).subscribe({
      next: () => {
        this.savingPw.set(false);
        this.pwForm.reset();
        this.pwSubmitted = false;
        this.toast.success("Password changed successfully!");
      },
      error: (err: any) => {
        this.savingPw.set(false);
        this.toast.error(err?.error?.message ?? "Failed to change password.");
      }
    });
  }

  deleteAccount(): void {
    const confirm1 = confirm("This will permanently delete your account and all data. Are you sure?");
    if (!confirm1) return;
    const confirm2 = confirm("This action cannot be undone. Proceed?");
    if (!confirm2) return;
    this.deletingAcct.set(true);
    this.api.delete("/account/delete").subscribe({
      next: () => {
        this.auth.logout();
        this.router.navigate(["/"]);
        this.toast.info("Your account has been deleted.");
      },
      error: () => { this.deletingAcct.set(false); this.toast.error("Failed to delete account."); }
    });
  }
}