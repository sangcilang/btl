using Microsoft.EntityFrameworkCore;
using ReportApproval.Api.Entities;
using ReportApproval.Api.Models;

namespace ReportApproval.Api.Services;

public partial class TaskService
{
    public async Task<List<TaskAssigneeDto>> GetAssignableStaffAsync(int requesterUserId)
    {
        var requester = await dbContext.Users.FirstOrDefaultAsync(x => x.Id == requesterUserId);
        if (requester is null || IsStaff(requester.Role))
        {
            return [];
        }

        return await dbContext.Users
            .Where(x => x.Role == "Staff")
            .OrderBy(x => x.UserName)
            .Select(x => new TaskAssigneeDto
            {
                Id = x.Id,
                UserName = x.UserName
            })
            .ToListAsync();
    }

    public async Task<(bool Success, string Message, TaskDto? Task)> CreateTaskAsync(CreateTaskRequest request)
    {
        var assigner = await dbContext.Users.FirstOrDefaultAsync(x => x.Id == request.AssignedByUserId);
        if (assigner is null || IsStaff(assigner.Role))
        {
            return (false, "Chỉ trưởng phòng/giám đốc mới được tạo nhiệm vụ.", null);
        }

        var assignee = await dbContext.Users.FirstOrDefaultAsync(x => x.Id == request.AssignedToUserId);
        if (assignee is null || !IsStaff(assignee.Role))
        {
            return (false, "Chỉ được giao nhiệm vụ cho nhân viên.", null);
        }

        var task = new TaskItem
        {
            Id = Guid.NewGuid(),
            Title = request.Title.Trim(),
            Description = request.Description.Trim(),
            AssignedByUserId = request.AssignedByUserId,
            AssignedToUserId = request.AssignedToUserId,
            DueDate = NormalizeDateTime(request.DueDate),
            Status = "Todo",
            CreatedAt = DateTime.UtcNow
        };

        dbContext.Tasks.Add(task);
        dbContext.TaskHistories.Add(new TaskHistory
        {
            Id = Guid.NewGuid(),
            TaskId = task.Id,
            Action = "Assigned",
            Status = "Todo",
            Note = "Tạo và giao nhiệm vụ.",
            ChangedByUserId = assigner.Id,
            ChangedAt = DateTime.UtcNow
        });
        await dbContext.SaveChangesAsync();

        return (true, "Tạo nhiệm vụ thành công.", new TaskDto
        {
            Id = task.Id,
            Title = task.Title,
            Description = task.Description,
            AssignedToUserId = assignee.Id,
            AssignedToUserName = assignee.UserName,
            AssignedByUserId = assigner.Id,
            AssignedByUserName = assigner.UserName,
            DueDate = task.DueDate,
            Status = task.Status,
            CreatedAt = task.CreatedAt
        });
    }

    public async Task<List<TaskDto>> GetTasksAsync(int userId)
    {
        var user = await dbContext.Users.FirstOrDefaultAsync(x => x.Id == userId);
        if (user is null)
        {
            return [];
        }

        var query = dbContext.Tasks.AsQueryable();
        if (IsStaff(user.Role))
        {
            query = query.Where(x => x.AssignedToUserId == userId);
        }
        else
        {
            query = query.Where(x => x.AssignedByUserId == userId || x.AssignedToUserId == userId);
        }

        var tasks = await query
            .Join(dbContext.Users,
                task => task.AssignedToUserId,
                userRow => userRow.Id,
                (task, assignedTo) => new { task, assignedTo })
            .Join(dbContext.Users,
                row => row.task.AssignedByUserId,
                userRow => userRow.Id,
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

        return tasks;
    }

    public async Task<(bool Success, string Message)> UpdateStatusAsync(Guid taskId, UpdateTaskStatusRequest request)
    {
        var task = await dbContext.Tasks.FirstOrDefaultAsync(x => x.Id == taskId);
        if (task is null)
        {
            return (false, "Không tìm thấy nhiệm vụ.");
        }

        if (task.AssignedToUserId != request.UserId)
        {
            return (false, "Bạn không có quyền cập nhật nhiệm vụ này.");
        }

        var status = request.Status.Trim();
        var valid = status is "Todo" or "InProgress" or "Done";
        if (!valid)
        {
            return (false, "Status không hợp lệ.");
        }

        task.Status = status;
        if (status == "Done")
        {
            task.CompletedAt = DateTime.UtcNow;
            task.CompletedByUserId = request.UserId;
        }
        else
        {
            task.CompletedAt = null;
            task.CompletedByUserId = null;
        }

        dbContext.TaskHistories.Add(new TaskHistory
        {
            Id = Guid.NewGuid(),
            TaskId = task.Id,
            Action = status == "Done" ? "Completed" : "StatusUpdated",
            Status = status,
            Note = status == "Done" ? "Nhân viên hoàn thành nhiệm vụ." : $"Cập nhật trạng thái sang {status}.",
            ChangedByUserId = request.UserId,
            ChangedAt = DateTime.UtcNow
        });

        await dbContext.SaveChangesAsync();
        return (true, "Cập nhật trạng thái thành công.");
    }
}
