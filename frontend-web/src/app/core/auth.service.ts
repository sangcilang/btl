import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, map, tap } from 'rxjs';
import { ApiService } from './api.service';
import { AuthSession, AuthUser } from './models';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly storageKey = 'report-approval-session';
  private readonly legacyStorageKey = 'report-approval-user';
  private readonly sessionSubject = new BehaviorSubject<AuthSession | null>(this.loadSession());

  readonly user$ = this.sessionSubject.asObservable().pipe(map((session) => session?.user ?? null));

  constructor(private readonly apiService: ApiService) {}

  get currentUser(): AuthUser | null {
    return this.sessionSubject.value?.user ?? null;
  }

  get accessToken(): string | null {
    return this.sessionSubject.value?.accessToken ?? null;
  }

  get isLoggedIn(): boolean {
    return !!this.accessToken;
  }

  login(userName: string, password: string): Observable<AuthUser> {
    return this.apiService.login(userName, password).pipe(
      tap((session) => {
        this.setSession(session);
      }),
      map((session) => session.user)
    );
  }

  logout(): void {
    localStorage.removeItem(this.storageKey);
    localStorage.removeItem(this.legacyStorageKey);
    this.sessionSubject.next(null);
  }

  private setSession(session: AuthSession): void {
    localStorage.setItem(this.storageKey, JSON.stringify(session));
    localStorage.removeItem(this.legacyStorageKey);
    this.sessionSubject.next(session);
  }

  private loadSession(): AuthSession | null {
    const raw = localStorage.getItem(this.storageKey);
    if (!raw) {
      localStorage.removeItem(this.legacyStorageKey);
      return null;
    }

    try {
      const parsed = JSON.parse(raw) as AuthSession;
      if (!parsed?.accessToken || !parsed?.expiresAt || !parsed?.user) {
        this.logout();
        return null;
      }

      if (new Date(parsed.expiresAt).getTime() <= Date.now()) {
        this.logout();
        return null;
      }

      return parsed;
    } catch {
      this.logout();
      return null;
    }
  }
}
