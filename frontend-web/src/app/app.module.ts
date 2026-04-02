import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { HTTP_INTERCEPTORS, HttpClientModule } from '@angular/common/http';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { AdminComponent } from './pages/admin/admin.component';
import { ApprovalsComponent } from './pages/approvals/approvals.component';
import { HomeComponent } from './pages/home/home.component';
import { LoginComponent } from './pages/login/login.component';
import { MainLayoutComponent } from './pages/main-layout/main-layout.component';
import { ReportsComponent } from './pages/reports/reports.component';
import { AttendanceReportEditorComponent } from './pages/reports/templates/attendance/editor.component';
import { AttendanceReportPreviewComponent } from './pages/reports/templates/attendance/preview.component';
import { ElectricityRevenueReportEditorComponent } from './pages/reports/templates/electricity-revenue/editor.component';
import { ElectricityRevenueReportPreviewComponent } from './pages/reports/templates/electricity-revenue/preview.component';
import { TasksComponent } from './pages/tasks/tasks.component';
import { AuthInterceptor } from './core/auth.interceptor';

@NgModule({
  declarations: [
    AppComponent,
    LoginComponent,
    MainLayoutComponent,
    HomeComponent,
    ReportsComponent,
    AttendanceReportEditorComponent,
    AttendanceReportPreviewComponent,
    ElectricityRevenueReportEditorComponent,
    ElectricityRevenueReportPreviewComponent,
    ApprovalsComponent,
    TasksComponent,
    AdminComponent
  ],
  imports: [
    BrowserModule,
    AppRoutingModule,
    HttpClientModule,
    ReactiveFormsModule,
    FormsModule
  ],
  providers: [
    {
      provide: HTTP_INTERCEPTORS,
      useClass: AuthInterceptor,
      multi: true
    }
  ],
  bootstrap: [AppComponent]
})
export class AppModule { }
