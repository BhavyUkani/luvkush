import { Component, OnInit, inject, signal, ChangeDetectionStrategy } from "@angular/core";
import { FormBuilder, Validators, AbstractControl, ReactiveFormsModule } from "@angular/forms";
import { Router, RouterLink } from "@angular/router";
import { CommonModule } from "@angular/common";
import { AuthService } from "../../../core/services/auth.service";

function passwordMatch(control: AbstractControl) {
  const pw = control.get("password");
  const confirm = control.get("confirmPassword");
  if (!pw || !confirm) return null;
  return pw.value !== confirm.value ? { mismatch: true } : null;
}

@Component({
  selector: "lk-register",
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  templateUrl: "./register.component.html",
  styleUrls: ["./register.component.scss"]
})
export class RegisterComponent implements OnInit {
  private readonly fb     = inject(FormBuilder);
  private readonly auth   = inject(AuthService);
  private readonly router = inject(Router);

  form = this.fb.nonNullable.group({
    firstName:       ["", [Validators.required, Validators.minLength(2)]],
    lastName:        ["", [Validators.required, Validators.minLength(2)]],
    email:           ["", [Validators.required, Validators.email]],
    phone:           ["", [Validators.pattern(/^[6-9]\d{9}$/)]],
    password:        ["", [Validators.required, Validators.minLength(8)]],
    confirmPassword: ["", Validators.required]
  }, { validators: passwordMatch });

  loading   = signal(false);
  showPw    = signal(false);
  showCPw   = signal(false);
  error     = signal("");
  submitted = false;

  ngOnInit(): void {
    if (this.auth.isLoggedIn()) this.router.navigate(["/"]);
  }

  get f() { return this.form.controls; }

  onSubmit(): void {
    this.submitted = true;
    this.error.set("");
    if (this.form.invalid) return;
    this.loading.set(true);
    this.auth.register({
      first_name: this.f.firstName.value,
      last_name:  this.f.lastName.value,
      email:      this.f.email.value,
      phone:      this.f.phone.value || undefined,
      password:   this.f.password.value
    }).subscribe({
      next: () => { this.loading.set(false); this.router.navigate(["/"]);  },
      error: (err) => {
        this.loading.set(false);
        this.error.set(err?.error?.message ?? "Registration failed. Please try again.");
      }
    });
  }
}