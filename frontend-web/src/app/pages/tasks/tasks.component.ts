import { Component, OnInit } from '@angular/core';
import { FormBuilder, Validators } from '@angular/forms';
import { ApiService } from '../../core/api.service';
import { AuthService } from '../../core/auth.service';
import { TaskAssignee, TaskHistoryItem, TaskItem } from '../../core/models';

@Component({
  selector: 'app-tasks',
  templateUrl: './tasks.component.html',
  styleUrls: ['./tasks.component.scss']
})
export class TasksComponent implements OnInit {
  tasks: TaskItem[] = [];
  history: TaskHistoryItem[] = [];
  assignees: TaskAssignee[] = [];
  message = '';
  errorMessage = '';

  readonly form = this.formBuilder.group({
    assignedToUserId: [0, [Validators.required, Validators.min(1)]],
    title: ['', [Validators.required]],
    description: [''],
    dueDate: ['']
  });

  constructor(
    private readonly formBuilder: FormBuilder,
    private readonly apiService: ApiService,
    public readonly authService: AuthService
  ) {}

  ngOnInit(): void {
    this.loadData();
  }

  get canAssignTask(): boolean {
    const role = this.authService.currentUser?.role;
    return role === 'Manager' || role === 'Director' || role === 'Admin';
  }

  get isStaff(): boolean {
    return this.authService.currentUser?.role === 'Staff';
  }

  loadData(): void {
    const user = this.authService.currentUser;
    if (!user) {
      return;
    }

    this.apiService.getTasks().subscribe({
      next: (rows) => { this.tasks = rows; },
      error: (error) => { this.errorMessage = this.resolveError(error); }
    });

    this.apiService.getTaskHistory().subscribe({
      next: (rows) => { this.history = rows; },
      error: (error) => { this.errorMessage = this.resolveError(error); }
    });

    if (this.canAssignTask) {
      this.apiService.getAssignableStaff().subscribe({
        next: (rows) => { this.assignees = rows; },
        error: (error) => { this.errorMessage = this.resolveError(error); }
      });
    }
  }

  createTask(): void {
    const user = this.authService.currentUser;
    if (!user || this.form.invalid || !this.canAssignTask) {
      this.form.markAllAsTouched();
      return;
    }

    this.apiService.createTask({
      assignedToUserId: this.form.controls['assignedToUserId'].value ?? 0,
      title: this.form.controls['title'].value ?? '',
      description: this.form.controls['description'].value ?? '',
      dueDate: this.form.controls['dueDate'].value || null
    }).subscribe({
      next: (res) => {
        this.message = res.message;
        this.form.reset({ assignedToUserId: 0, title: '', description: '', dueDate: '' });
        this.loadData();
      },
      error: (error) => { this.errorMessage = this.resolveError(error); }
    });
  }

  updateStatus(task: TaskItem, status: string): void {
    const user = this.authService.currentUser;
    if (!user) {
      return;
    }

    this.apiService.updateTaskStatus(task.id, status).subscribe({
      next: (message) => {
        this.message = message;
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
