import { Component } from '@angular/core';
import { FormBuilder, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { finalize } from 'rxjs';
import { AuthService } from '../../core/auth.service';

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss']
})
export class LoginComponent {
  isSubmitting = false;
  errorMessage = '';

  readonly form = this.formBuilder.group({
    userName: ['', [Validators.required]],
    password: ['', [Validators.required]]
  });

  constructor(
    private readonly formBuilder: FormBuilder,
    private readonly authService: AuthService,
    private readonly router: Router
  ) {
    if (this.authService.isLoggedIn) {
      void this.router.navigate(['/app/dashboard']);
    }
  }

  submit(): void {
    if (this.form.invalid || this.isSubmitting) {
      this.form.markAllAsTouched();
      return;
    }

    const userName = this.form.controls['userName'].value ?? '';
    const password = this.form.controls['password'].value ?? '';

    this.errorMessage = '';
    this.isSubmitting = true;

    this.authService.login(userName, password)
      .pipe(finalize(() => { this.isSubmitting = false; }))
      .subscribe({
        next: () => { void this.router.navigate(['/app/dashboard']); },
        error: (error) => {
          this.errorMessage = this.resolveError(error);
        }
      });
  }

  private resolveError(error: unknown): string {
    const httpError = error as { error?: unknown; message?: string };
    if (typeof httpError.error === 'string') {
      return httpError.error;
    }
    if (httpError.message) {
      return httpError.message;
    }
    return 'Đăng nhập thất bại.';
  }
}
