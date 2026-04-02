import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../../core/auth.service';

interface MenuItem {
  label: string;
  route: string;
  roles?: string[];
}

@Component({
  selector: 'app-main-layout',
  templateUrl: './main-layout.component.html',
  styleUrls: ['./main-layout.component.scss']
})
export class MainLayoutComponent {
  readonly menuItems: MenuItem[] = [
    { label: 'Dashboard', route: '/app/dashboard' },
    { label: 'Báo cáo', route: '/app/reports' },
    { label: 'Phê duyệt', route: '/app/approvals', roles: ['Manager', 'Director'] },
    { label: 'Nhiệm vụ', route: '/app/tasks' },
    { label: 'Admin', route: '/app/admin', roles: ['Admin'] }
  ];

  constructor(
    public readonly authService: AuthService,
    private readonly router: Router
  ) {}

  canShow(item: MenuItem): boolean {
    const role = this.authService.currentUser?.role;
    if (!role) {
      return false;
    }

    return !item.roles || item.roles.includes(role);
  }

  logout(): void {
    this.authService.logout();
    void this.router.navigate(['/login']);
  }
}
