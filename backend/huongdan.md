# 📘 Backend Documentation – ReportApproval.Api

Tài liệu này mô tả chi tiết kiến trúc, cấu trúc thư mục và luồng xử lý chính của backend trong thư mục:


backend/ReportApproval.Api


---

# 1. Tổng quan hệ thống

Backend được xây dựng bằng:

- **ASP.NET Core Web API (.NET 9)**
- **Entity Framework Core**
- **PostgreSQL**

Hệ thống dùng để quản lý:

- Quy trình **tạo và phê duyệt báo cáo**
- Quy trình **giao và quản lý nhiệm vụ (Task)**
- **Quản trị người dùng (Admin)**

---

## Workflow phê duyệt báo cáo


Staff → Manager → Director


---

## Đặc điểm chính

- Sử dụng **CORS mở** cho frontend
- **Swagger** chỉ bật trong môi trường **Development**
- Khi ứng dụng khởi động:
  - Tự động **tạo database nếu chưa tồn tại**
  - **Cập nhật schema bằng SQL**
  - **Seed dữ liệu mẫu**

---

# 2. Cấu trúc thư mục


backend/ReportApproval.Api
│
├── Controllers
├── Data
├── Entities
├── Models
├── Services
├── uploads
│
├── Program.cs
├── appsettings.json
├── appsettings.Development.json
├── ReportApproval.Api.csproj
└── ReportApproval.Api.http


---

# 3. Các file quan trọng

## Program.cs


backend/ReportApproval.Api/Program.cs


Đây là **entrypoint của ứng dụng**.

Chức năng:

- Khởi tạo **Dependency Injection**
- Cấu hình **Middleware**
- Cấu hình **Swagger**
- Cấu hình **CORS**
- Khởi tạo **Database**

---

## appsettings.json

Chứa cấu hình hệ thống.

Ví dụ connection string:

```json
{
  "ConnectionStrings": {
    "DefaultConnection": "Host=localhost;Database=report_approval_db;Username=postgres;Password=123"
  }
}
appsettings.Development.json

Cấu hình logging cho môi trường Development.

{
  "Logging": {
    "LogLevel": {
      "Default": "Information",
      "Microsoft.AspNetCore": "Warning"
    }
  }
}
launchSettings.json

Cấu hình khi chạy local.

HTTP  : http://localhost:5255
HTTPS : https://localhost:7199

Environment:

ASPNETCORE_ENVIRONMENT=Development
ReportApproval.Api.csproj

Khai báo project.

Target Framework
net9.0
Packages
Microsoft.EntityFrameworkCore
Microsoft.EntityFrameworkCore.Design
Microsoft.EntityFrameworkCore.Tools
Npgsql.EntityFrameworkCore.PostgreSQL
Swashbuckle.AspNetCore
4. Luồng khởi động hệ thống

Trong Program.cs, khi ứng dụng start sẽ thực hiện:

1. Đăng ký Controllers

Cấu hình JSON:

ReferenceHandler.IgnoreCycles

Tránh lỗi vòng lặp serialize dữ liệu EF.

2. Đăng ký Services
ReportService
TaskService
3. Cấu hình Swagger
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();

Swagger chỉ bật trong Development.

4. Cấu hình DbContext
AppDbContext

Sử dụng PostgreSQL qua Npgsql.

5. Cấu hình CORS

Policy:

Frontend

Cho phép:

AllowAnyOrigin
AllowAnyHeader
AllowAnyMethod
6. Khởi tạo Database

Khi ứng dụng start:

1️⃣ Tạo database nếu chưa tồn tại

EnsureCreated()

2️⃣ Cập nhật schema

DbSchemaUpdater.EnsureLatestSchema()

3️⃣ Seed dữ liệu mẫu

DbSeeder.Seed()
5. Data Layer

Thư mục:

Data

Bao gồm:

AppDbContext
DbSchemaUpdater
DbSeeder
AppDbContext

File:

Data/AppDbContext.cs
DbSet
Users
Reports
ReportApprovals
Tasks
TaskHistories
Quan hệ dữ liệu
User
UserName → unique index
Report

Quan hệ:

User (1) → (n) Reports

Delete:

Restrict
ReportApproval

Quan hệ:

Report (1) → (n) Approvals

Delete:

Cascade
TaskItem

Quan hệ:

AssignedToUser
AssignedByUser
CompletedByUser

Delete:

Restrict
TaskHistory

Quan hệ:

Task (1) → (n) Histories

Delete:

Cascade
6. Entity (EF)

Thư mục:

Entities
User

File:

Entities/User.cs

Thuộc tính:

Id
UserName
Password
Role

Navigation:

CreatedReports
Approvals
Report

Thuộc tính chính:

Id
Title
Content
Workflow
PendingManager
PendingDirector
Returned
Approved
Cấp duyệt
CurrentLevel
1 = Manager
2 = Director
File đính kèm
FileOriginalName
FileStoredName
FileContentType
ReportApproval

Lưu lịch sử phê duyệt.

Action
Comment
ApprovedAt
Level
TaskItem

Thông tin nhiệm vụ:

Title
Description
DueDate
Status
TaskHistory

Lịch sử thay đổi nhiệm vụ:

Action
Status
Note
ChangedAt
ChangedByUserId
7. Models (DTO)

Thư mục:

Models
Request
LoginRequest
CreateReportRequest
ResubmitReportRequest
ApproveReportRequest
ReturnReportRequest
CreateTaskRequest
UpdateTaskStatusRequest
AdminCreateUserRequest
AdminUpdateUserRoleRequest
Response
ReportDto
ReportHistoryItemDto
ReportStatisticsDto
TaskDto
TaskAssigneeDto
TaskHistoryDto
AdminOverviewDto
AdminUserDto
8. Service Layer

Thư mục:

Services

Bao gồm:

ReportService
TaskService
ReportService

Quy định:

MaxApprovalLevel = 2

File đính kèm cho phép:

.xls
.xlsx
.doc
.docx
Tạo báo cáo
CreateReportAsync

Workflow:

Staff → PendingManager
Manager → PendingDirector
Director → Approved
Duyệt báo cáo
ApproveAsync

Nếu duyệt cấp cuối:

Status = Approved
IsApproved = true
Trả báo cáo
ReturnToStaffAsync

Manager trả:

Returned

Director trả:

PendingManager
Xóa báo cáo
DeleteReportAsync

Quyền:

Admin
hoặc
Staff là chủ báo cáo
Thống kê
GetStatisticsAsync

Chỉ:

Manager
Director
Admin
TaskService
Tạo nhiệm vụ
CreateTaskAsync

Điều kiện:

Người giao: Manager / Director
Người nhận: Staff
Cập nhật trạng thái
Todo
InProgress
Done

Nếu:

Done

Thì:

CompletedAt
CompletedByUserId
9. Controllers (API)

Thư mục:

Controllers
AuthController
POST /api/auth/login

Body:

LoginRequest

Response:

Id
UserName
Role
ReportsController
GET    /api/reports
GET    /api/reports/{id}
POST   /api/reports
POST   /api/reports/{id}/resubmit
GET    /api/reports/{id}/history
GET    /api/reports/{id}/attachment
DELETE /api/reports/{id}
ReportApprovalController
GET  /api/report-approvals/pending/{level}

GET  /api/report-approvals/history

POST /api/report-approvals/{id}/approve

POST /api/report-approvals/{id}/return
DashboardController
GET /api/dashboard/stats
TasksController
GET   /api/tasks/staff
GET   /api/tasks
GET   /api/tasks/history
POST  /api/tasks
PATCH /api/tasks/{id}/status
AdminController

Tất cả API yêu cầu quyền Admin.

GET    /api/admin/overview
GET    /api/admin/users
POST   /api/admin/users
PATCH  /api/admin/users/{id}/role
DELETE /api/admin/users/{id}

GET    /api/admin/reports
GET    /api/admin/tasks

DELETE /api/admin/reports/{id}
DELETE /api/admin/tasks/{id}
10. Lưu file đính kèm

Thư mục:

uploads

Cách lưu:

Đổi tên file thành GUID

Lưu tên gốc trong:

FileOriginalName

File cho phép:

.doc
.docx
.xls
.xlsx

Nếu resubmit có file mới:

xóa file cũ
11. Quy tắc nghiệp vụ
Vai trò người dùng
Staff

Tạo báo cáo

Nhận task

Cập nhật trạng thái task

Manager

Duyệt báo cáo cấp 1

Tạo task

Xem thống kê

Director

Duyệt báo cáo cấp 2

Tạo task

Xem thống kê

Admin

Quản lý user

Quản lý báo cáo

Quản lý task

⚠️ Admin không tạo báo cáo.

12. Workflow báo cáo
Staff tạo
PendingManager
→ Manager duyệt
→ PendingDirector
→ Director duyệt
→ Approved
Manager tạo
PendingDirector
Director tạo
Approved ngay
Trả báo cáo

Manager trả:

Returned

Director trả:

PendingManager
13. Hướng dẫn cập nhật tài liệu

Khi thay đổi hệ thống:

Thêm API

Cập nhật mục:

Controllers
Thêm Entity / DTO

Cập nhật mục:

Entities
Models
Thay đổi workflow

Cập nhật mục:

Service Layer
Quy tắc nghiệp vụ
