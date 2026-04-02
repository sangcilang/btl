using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using ReportApproval.Api.Data;
using ReportApproval.Api.Entities;
using ReportApproval.Api.Extensions;
using ReportApproval.Api.Models;
using ReportApproval.Api.Services;

namespace ReportApproval.Api.Controllers;

[ApiController]
[Authorize(Roles = "Admin")]
[Route("api/admin")]
public class AdminController(AppDbContext dbContext, ReportService reportService) : ControllerBase
{
    [HttpGet("overview")]
    public async Task<IActionResult> GetOverview()
    {
        var overview = new AdminOverviewDto
        {
            TotalUsers = await dbContext.Users.CountAsync(),
            TotalReports = await dbContext.Reports.CountAsync(),
            TotalTasks = await dbContext.Tasks.CountAsync(),
            PendingReports = await dbContext.Reports.CountAsync(x => !x.IsApproved)
        };

        return Ok(overview);
    }

    [HttpGet("users")]
    public async Task<IActionResult> GetUsers()
    {
        var users = await dbContext.Users
            .OrderBy(x => x.Id)
            .Select(x => new AdminUserDto
            {
                Id = x.Id,
                UserName = x.UserName,
                Role = x.Role
            })
            .ToListAsync();

        return Ok(users);
    }

    [HttpPost("users")]
    public async Task<IActionResult> CreateUser([FromBody] AdminCreateUserRequest request)
    {
        if (string.IsNullOrWhiteSpace(request.UserName) ||
            string.IsNullOrWhiteSpace(request.Password) ||
            string.IsNullOrWhiteSpace(request.Role))
        {
            return BadRequest("UserName, Password, Role là bắt buộc.");
        }

        var normalizedRole = request.Role.Trim();
        var validRoles = new[] { "Staff", "Manager", "Director", "Admin" };
        if (!validRoles.Contains(normalizedRole))
        {
            return BadRequest("Role không hợp lệ.");
        }

        var exists = await dbContext.Users.AnyAsync(x => x.UserName == request.UserName.Trim());
        if (exists)
        {
            return BadRequest("Username đã tồn tại.");
        }

        var user = new User
        {
            UserName = request.UserName.Trim(),
            Password = request.Password.Trim(),
            Role = normalizedRole
        };

        dbContext.Users.Add(user);
        await dbContext.SaveChangesAsync();

        return Ok(new AdminUserDto
        {
            Id = user.Id,
            UserName = user.UserName,
            Role = user.Role
        });
    }

    [HttpPatch("users/{id:int}/role")]
    public async Task<IActionResult> UpdateUserRole(int id, [FromBody] AdminUpdateUserRoleRequest request)
    {
        if (id <= 0 || string.IsNullOrWhiteSpace(request.Role))
        {
            return BadRequest("Dữ liệu không hợp lệ.");
        }

        if (id == User.GetUserId())
        {
            return BadRequest("Không được tự đổi role của chính mình.");
        }

        var normalizedRole = request.Role.Trim();
        var validRoles = new[] { "Staff", "Manager", "Director", "Admin" };
        if (!validRoles.Contains(normalizedRole))
        {
            return BadRequest("Role không hợp lệ.");
        }

        var user = await dbContext.Users.FirstOrDefaultAsync(x => x.Id == id);
        if (user is null)
        {
            return NotFound("Không tìm thấy user.");
        }

        user.Role = normalizedRole;
        await dbContext.SaveChangesAsync();
        return Ok(new AdminUserDto
        {
            Id = user.Id,
            UserName = user.UserName,
            Role = user.Role
        });
    }

    [HttpDelete("users/{id:int}")]
    public async Task<IActionResult> DeleteUser(int id)
    {
        if (id <= 0)
        {
            return BadRequest("Id không hợp lệ.");
        }

        if (id == User.GetUserId())
        {
            return BadRequest("Không được tự xóa chính mình.");
        }

        var user = await dbContext.Users.FirstOrDefaultAsync(x => x.Id == id);
        if (user is null)
        {
            return NotFound("Không tìm thấy user.");
        }

        if (user.Role == "Admin")
        {
            var adminCount = await dbContext.Users.CountAsync(x => x.Role == "Admin");
            if (adminCount <= 1)
            {
                return BadRequest("Không thể xóa admin cuối cùng.");
            }
        }

        var hasRelatedData =
            await dbContext.Reports.AnyAsync(x => x.CreatedByUserId == id) ||
            await dbContext.ReportApprovals.AnyAsync(x => x.ApproverUserId == id) ||
            await dbContext.Tasks.AnyAsync(x => x.AssignedByUserId == id || x.AssignedToUserId == id || x.CompletedByUserId == id) ||
            await dbContext.TaskHistories.AnyAsync(x => x.ChangedByUserId == id);

        if (hasRelatedData)
        {
            return BadRequest("User đang có dữ liệu liên quan, không thể xóa.");
        }

        dbContext.Users.Remove(user);
        await dbContext.SaveChangesAsync();
        return Ok("Xóa user thành công.");
    }

    [HttpGet("reports")]
    public async Task<IActionResult> GetReports()
    {
        var reports = await dbContext.Reports
            .OrderByDescending(x => x.CreatedAt)
            .Select(x => new ReportDto
            {
                Id = x.Id,
                Title = x.Title,
                Content = x.Content,
                CurrentLevel = x.CurrentLevel,
                IsApproved = x.IsApproved,
                Status = x.Status,
                ReturnedReason = x.ReturnedReason,
                FileOriginalName = x.FileOriginalName,
                HasAttachment = x.FileStoredName != null && x.FileStoredName != "",
                CreatedAt = x.CreatedAt,
                CreatedByUserId = x.CreatedByUserId
            })
            .ToListAsync();

        return Ok(reports);
    }

    [HttpGet("tasks")]
    public async Task<IActionResult> GetTasks()
    {
        var tasks = await dbContext.Tasks
            .Join(
                dbContext.Users,
                task => task.AssignedToUserId,
                user => user.Id,
                (task, assignedTo) => new { task, assignedTo })
            .Join(
                dbContext.Users,
                row => row.task.AssignedByUserId,
                user => user.Id,
                (row, assignedBy) => new TaskDto
                {
                    Id = row.task.Id,
                    Title = row.task.Title,
                    Description = row.task.Description,
                    AssignedToUserId = row.task.AssignedToUserId,
                    AssignedToUserName = row.assignedTo.UserName,
                    AssignedByUserId = row.task.AssignedByUserId,
                    AssignedByUserName = assignedBy.UserName,
                    DueDate = row.task.DueDate,
                    Status = row.task.Status,
                    CreatedAt = row.task.CreatedAt
                })
            .OrderByDescending(x => x.CreatedAt)
            .ToListAsync();

        return Ok(tasks);
    }

    [HttpDelete("reports/{id:guid}")]
    public async Task<IActionResult> DeleteReport(Guid id)
    {
        var result = await reportService.DeleteReportAsync(id, User.GetUserId());
        if (!result.Success)
        {
            return BadRequest(result.Message);
        }

        return Ok(result.Message);
    }

    [HttpDelete("tasks/{id:guid}")]
    public async Task<IActionResult> DeleteTask(Guid id)
    {
        var task = await dbContext.Tasks.FirstOrDefaultAsync(x => x.Id == id);
        if (task is null)
        {
            return NotFound("Không tìm thấy nhiệm vụ.");
        }

        dbContext.Tasks.Remove(task);
        await dbContext.SaveChangesAsync();
        return Ok("Xóa nhiệm vụ thành công.");
    }
}
