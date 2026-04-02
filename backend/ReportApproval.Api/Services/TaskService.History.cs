using Microsoft.EntityFrameworkCore;
using ReportApproval.Api.Models;

namespace ReportApproval.Api.Services;

public partial class TaskService
{
    public async Task<List<TaskHistoryDto>> GetTaskHistoryAsync(int userId)
    {
        var user = await dbContext.Users.FirstOrDefaultAsync(x => x.Id == userId);
        if (user is null)
        {
            return [];
        }

        var taskQuery = dbContext.Tasks.AsQueryable();
        if (IsStaff(user.Role))
        {
            taskQuery = taskQuery.Where(x => x.AssignedToUserId == userId);
        }
        else
        {
            taskQuery = taskQuery.Where(x => x.AssignedByUserId == userId || x.AssignedToUserId == userId);
        }

        var history = await dbContext.TaskHistories
            .Join(
                taskQuery,
                history => history.TaskId,
                task => task.Id,
                (history, task) => new { history, task })
            .Join(
                dbContext.Users,
                row => row.task.AssignedByUserId,
                userRow => userRow.Id,
                (row, assignedBy) => new { row.history, row.task, assignedBy })
            .GroupJoin(
                dbContext.Users,
                row => row.task.CompletedByUserId,
                userRow => (int?)userRow.Id,
                (row, completedUsers) => new { row.history, row.task, row.assignedBy, completedUsers })
            .SelectMany(
                row => row.completedUsers.DefaultIfEmpty(),
                (row, completedBy) => new TaskHistoryDto
                {
                    Id = row.history.Id,
                    TaskId = row.task.Id,
                    TaskTitle = row.task.Title,
                    Action = row.history.Action,
                    Status = row.history.Status,
                    Note = row.history.Note,
                    AssignedByUserId = row.assignedBy.Id,
                    AssignedByUserName = row.assignedBy.UserName,
                    CompletedByUserId = row.task.CompletedByUserId,
                    CompletedByUserName = completedBy != null ? completedBy.UserName : null,
                    CompletedAt = row.task.CompletedAt,
                    ChangedAt = row.history.ChangedAt
                })
            .OrderByDescending(x => x.ChangedAt)
            .ToListAsync();

        return history;
    }
}
