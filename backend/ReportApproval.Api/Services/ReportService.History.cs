using Microsoft.EntityFrameworkCore;
using ReportApproval.Api.Models;

namespace ReportApproval.Api.Services;

public partial class ReportService
{
    public async Task<List<ReportHistoryItemDto>?> GetHistoryAsync(Guid reportId, int viewerUserId)
    {
        var report = await dbContext.Reports.FirstOrDefaultAsync(x => x.Id == reportId);
        if (report is null || !await CanAccessReportAsync(report, viewerUserId))
        {
            return null;
        }

        var history = await dbContext.ReportApprovals
            .Where(x => x.ReportId == reportId)
            .Join(
                dbContext.Users,
                approval => approval.ApproverUserId,
                user => user.Id,
                (approval, user) => new ReportHistoryItemDto
                {
                    Id = approval.Id,
                    ReportId = approval.ReportId,
                    Level = approval.Level,
                    Action = approval.Action,
                    Comment = approval.Comment,
                    ApproverUserId = approval.ApproverUserId,
                    ApproverUserName = user.UserName,
                    ApproverRole = user.Role,
                    ApprovedAt = approval.ApprovedAt
                })
            .OrderBy(x => x.ApprovedAt)
            .ToListAsync();

        return history;
    }

    public async Task<List<ReportHistoryItemDto>> GetHistoryByApproverAsync(int approverUserId)
    {
        var history = await dbContext.ReportApprovals
            .Where(x => x.ApproverUserId == approverUserId)
            .Join(
                dbContext.Users,
                approval => approval.ApproverUserId,
                user => user.Id,
                (approval, user) => new ReportHistoryItemDto
                {
                    Id = approval.Id,
                    ReportId = approval.ReportId,
                    Level = approval.Level,
                    Action = approval.Action,
                    Comment = approval.Comment,
                    ApproverUserId = approval.ApproverUserId,
                    ApproverUserName = user.UserName,
                    ApproverRole = user.Role,
                    ApprovedAt = approval.ApprovedAt
                })
            .OrderByDescending(x => x.ApprovedAt)
            .ToListAsync();

        return history;
    }

    public async Task<ReportStatisticsDto> GetStatisticsAsync(int userId)
    {
        var user = await dbContext.Users.FirstOrDefaultAsync(x => x.Id == userId);
        if (user is null || IsStaff(user.Role))
        {
            return new ReportStatisticsDto();
        }

        var reports = dbContext.Reports.AsQueryable();
        return new ReportStatisticsDto
        {
            TotalReports = await reports.CountAsync(),
            PendingManager = await reports.CountAsync(x => x.Status == "PendingManager"),
            PendingDirector = await reports.CountAsync(x => x.Status == "PendingDirector"),
            ReturnedReports = await reports.CountAsync(x => x.Status == "Returned"),
            ApprovedReports = await reports.CountAsync(x => x.Status == "Approved")
        };
    }
}
