import { Component, OnInit } from '@angular/core';
import { FormBuilder, Validators } from '@angular/forms';
import { ApiService } from '../../core/api.service';
import { AuthService } from '../../core/auth.service';
import { AdminOverview, AdminUser, ReportItem } from '../../core/models';

@Component({
  selector: 'app-admin',
  templateUrl: './admin.component.html',
  styleUrls: ['./admin.component.scss']
})
export class AdminComponent implements OnInit {
  overview: AdminOverview | null = null;
  users: AdminUser[] = [];
  reports: ReportItem[] = [];
  message = '';
  errorMessage = '';

  readonly createUserForm = this.formBuilder.group({
    userName: ['', [Validators.required]],
    password: ['', [Validators.required]],
    role: ['Staff', [Validators.required]]
  });

  constructor(
    private readonly formBuilder: FormBuilder,
    private readonly apiService: ApiService,
    private readonly authService: AuthService
  ) {}

  ngOnInit(): void {
    this.loadData();
  }

  loadData(): void {
    const admin = this.authService.currentUser;
    if (!admin) {
      return;
    }

    this.apiService.getAdminOverview().subscribe({
      next: (value) => { this.overview = value; },
      error: (error) => { this.errorMessage = this.resolveError(error); }
    });

    this.apiService.getAdminUsers().subscribe({
      next: (value) => { this.users = value; },
      error: (error) => { this.errorMessage = this.resolveError(error); }
    });

    this.apiService.getAdminReports().subscribe({
      next: (value) => { this.reports = value.slice(0, 20); },
      error: (error) => { this.errorMessage = this.resolveError(error); }
    });
  }

  createUser(): void {
    const admin = this.authService.currentUser;
    if (!admin || this.createUserForm.invalid) {
      this.createUserForm.markAllAsTouched();
      return;
    }

    this.apiService.createAdminUser({
      userName: this.createUserForm.controls['userName'].value ?? '',
      password: this.createUserForm.controls['password'].value ?? '',
      role: this.createUserForm.controls['role'].value ?? 'Staff'
    }).subscribe({
      next: () => {
        this.message = 'Tạo user thành công.';
        this.createUserForm.reset({ userName: '', password: '', role: 'Staff' });
        this.loadData();
      },
      error: (error) => { this.errorMessage = this.resolveError(error); }
    });
  }

  updateRole(user: AdminUser, role: string): void {
    const admin = this.authService.currentUser;
    if (!admin) {
      return;
    }

    this.apiService.updateAdminUserRole(user.id, { role }).subscribe({
      next: () => {
        this.message = 'Cập nhật role thành công.';
        this.loadData();
      },
      error: (error) => { this.errorMessage = this.resolveError(error); }
    });
  }

  deleteUser(user: AdminUser): void {
    const admin = this.authService.currentUser;
    if (!admin) {
      return;
    }
    if (!window.confirm(`Xóa user ${user.userName}?`)) {
      return;
    }

    this.apiService.deleteAdminUser(user.id).subscribe({
      next: (message) => {
        this.message = message || 'Xóa user thành công.';
        this.loadData();
      },
      error: (error) => { this.errorMessage = this.resolveError(error); }
    });
  }

  deleteReport(report: ReportItem): void {
    const admin = this.authService.currentUser;
    if (!admin) {
      return;
    }

    this.apiService.deleteReport(report.id, true).subscribe({
      next: (message) => {
        this.message = message || 'Xóa báo cáo thành công.';
        this.loadData();
      },
      error: (error) => { this.errorMessage = this.resolveError(error); }
    });
  }

  private resolveError(error: unknown): string {
    const httpError = error as { error?: unknown; message?: string };
    if (typeof httpError.error === 'string') {
      return httpError.error;
    }
    return httpError.message || 'Đã xảy ra lỗi.';
  }
}
