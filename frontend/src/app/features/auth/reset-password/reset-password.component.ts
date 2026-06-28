import { Component, OnInit, inject, signal, ChangeDetectionStrategy } from "@angular/core";
import { FormBuilder, Validators, AbstractControl, ReactiveFormsModule } from "@angular/forms";
import { Router, RouterLink, ActivatedRoute } from "@angular/router";
import { CommonModule } from "@angular/common";
import { AuthService } from "../../../core/services/auth.service";

function passwordMatch(c: AbstractControl) {
  const pw = c.get("password");
  const cp = c.get("confirmPassword");
  return pw && cp && pw.value !== cp.value ? { mismatch: true } : null;
}

@Component({
  selector: "lk-reset-password",
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  templateUrl: "./reset-password.component.html",
  styleUrls: ["./reset-password.component.scss"]
})
export class ResetPasswordComponent implements OnInit {
  private readonly fb     = inject(FormBuilder);
  private readonly auth   = inject(AuthService);
  private readonly router = inject(Router);
  private readonly route  = inject(ActivatedRoute);

  token = "";

  form = this.fb.nonNullable.group({
    password:        ["", [Validators.required, Validators.minLength(8)]],
    confirmPassword: ["", Validators.required]
  }, { validators: passwordMatch });

  loading   = signal(false);
  done      = signal(false);
  showPw    = signal(false);
  showCPw   = signal(false);
  error     = signal("");
  submitted = false;

  ngOnInit(): void {
    this.token = this.route.snapshot.queryParams["token"] ?? "";
    if (!this.token) this.router.navigate(["/forgot-password"]);
  }

  get f() { return this.form.controls; }

  onSubmit(): void {
    this.submitted = true;
    this.error.set("");
    if (this.form.invalid) return;
    this.loading.set(true);
    this.auth.resetPassword(this.token, this.f.password.value).subscribe({
      next: () => { this.loading.set(false); this.done.set(true); },
      error: (err) => {
        this.loading.set(false);
        this.error.set(err?.error?.message ?? "Reset link has expired or is invalid.");
      }
    });
  }
}