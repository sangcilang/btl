import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { AuthGuard } from './core/auth.guard';
import { RoleGuard } from './core/role.guard';
import { AdminComponent } from './pages/admin/admin.component';
import { ApprovalsComponent } from './pages/approvals/approvals.component';
import { HomeComponent } from './pages/home/home.component';
import { LoginComponent } from './pages/login/login.component';
import { MainLayoutComponent } from './pages/main-layout/main-layout.component';
import { ReportsComponent } from './pages/reports/reports.component';
import { TasksComponent } from './pages/tasks/tasks.component';

const routes: Routes = [
  { path: '', pathMatch: 'full', redirectTo: 'login' },
  { path: 'login', component: LoginComponent },
  {
    path: 'app',
    component: MainLayoutComponent,
    canActivate: [AuthGuard],
    children: [
      { path: '', pathMatch: 'full', redirectTo: 'dashboard' },
      { path: 'dashboard', component: HomeComponent },
      { path: 'reports', component: ReportsComponent },
      { path: 'tasks', component: TasksComponent },
      { path: 'approvals', component: ApprovalsComponent, canActivate: [RoleGuard], data: { roles: ['Manager', 'Director'] } },
      { path: 'admin', component: AdminComponent, canActivate: [RoleGuard], data: { roles: ['Admin'] } }
    ]
  },
  { path: '**', redirectTo: 'login' }
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
