import { Component, OnInit } from '@angular/core';
import { forkJoin, of } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { ApiService } from '../../core/api.service';
import { AuthService } from '../../core/auth.service';
import { ReportItem, ReportStats, TaskItem } from '../../core/models';

@Component({
  selector: 'app-home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.scss']
})
export class HomeComponent implements OnInit {
  stats: ReportStats | null = null;
  reports: ReportItem[] = [];
  tasks: TaskItem[] = [];
  errorMessage = '';

  constructor(
    private readonly apiService: ApiService,
    public readonly authService: AuthService
  ) {}

  ngOnInit(): void {
    const user = this.authService.currentUser;
    if (!user) {
      return;
    }

    const stats$ = ['Manager', 'Director', 'Admin'].includes(user.role)
      ? this.apiService.getStats()
      : of(null);

    const reports$ = user.role === 'Admin'
      ? this.apiService.getAdminReports()
      : this.apiService.getReports();

    forkJoin({
      stats: stats$,
      reports: reports$,
      tasks: this.apiService.getTasks()
    }).pipe(
      catchError((error) => {
        this.errorMessage = this.resolveError(error);
        return of({ stats: null, reports: [], tasks: [] });
      })
    ).subscribe((result) => {
      this.stats = result.stats;
      this.reports = result.reports.slice(0, 5);
      this.tasks = result.tasks.slice(0, 5);
    });
  }

  private resolveError(error: unknown): string {
    const httpError = error as { error?: unknown; message?: string };
    if (typeof httpError.error === 'string') {
      return httpError.error;
    }

    return httpError.message || 'Không thể tải dữ liệu.';
  }
}
