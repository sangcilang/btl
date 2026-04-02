import { Injectable } from '@angular/core';
import { ActivatedRouteSnapshot, CanActivate, Router, UrlTree } from '@angular/router';
import { AuthService } from './auth.service';

@Injectable({ providedIn: 'root' })
export class RoleGuard implements CanActivate {
  constructor(
    private readonly authService: AuthService,
    private readonly router: Router
  ) {}

  canActivate(route: ActivatedRouteSnapshot): boolean | UrlTree {
    const user = this.authService.currentUser;
    if (!user) {
      return this.router.parseUrl('/login');
    }

    const allowedRoles = (route.data['roles'] as string[] | undefined) ?? [];
    if (allowedRoles.length === 0) {
      return true;
    }

    return allowedRoles.includes(user.role) ? true : this.router.parseUrl('/app/dashboard');
  }
}
