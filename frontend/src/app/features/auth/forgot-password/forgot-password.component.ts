import { Component, inject, signal, ChangeDetectionStrategy } from "@angular/core";
import { FormBuilder, Validators, ReactiveFormsModule } from "@angular/forms";
import { RouterLink } from "@angular/router";
import { CommonModule } from "@angular/common";
import { AuthService } from "../../../core/services/auth.service";

@Component({
  selector: "lk-forgot-password",
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  templateUrl: "./forgot-password.component.html",
  styleUrls: ["./forgot-password.component.scss"]
})
export class ForgotPasswordComponent {
  private readonly fb   = inject(FormBuilder);
  private readonly auth = inject(AuthService);

  form = this.fb.nonNullable.group({ email: ["", [Validators.required, Validators.email]] });

  loading   = signal(false);
  sent      = signal(false);
  error     = signal("");
  submitted = false;

  get f() { return this.form.controls; }

  onSubmit(): void {
    this.submitted = true;
    this.error.set("");
    if (this.form.invalid) return;
    this.loading.set(true);
    this.auth.forgotPassword(this.f.email.value).subscribe({
      next: () => { this.loading.set(false); this.sent.set(true); },
      error: (err) => {
        this.loading.set(false);
        this.error.set(err?.error?.message ?? "Something went wrong. Please try again.");
      }
    });
  }
}