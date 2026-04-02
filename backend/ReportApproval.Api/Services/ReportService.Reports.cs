using Microsoft.AspNetCore.Http;
using Microsoft.EntityFrameworkCore;
using ReportApproval.Api.Entities;
using ReportApproval.Api.Models;

namespace ReportApproval.Api.Services;

public partial class ReportService
{
    public async Task<List<ReportDto>> GetReportsAsync(int viewerUserId)
    {
        var viewer = await dbContext.Users.FirstOrDefaultAsync(x => x.Id == viewerUserId);
        if (viewer is null)
        {
            return [];
        }

        var query = dbContext.Reports.AsQueryable();
        if (IsStaff(viewer.Role))
        {
            query = query.Where(x => x.CreatedByUserId == viewer.Id);
        }

        var reports = await query
            .OrderByDescending(x => x.CreatedAt)
            .ToListAsync();

        return reports.Select(MapReport).ToList();
    }

    public async Task<ReportDto?> GetReportByIdAsync(Guid id, int viewerUserId)
    {
        var report = await dbContext.Reports.FirstOrDefaultAsync(x => x.Id == id);
        if (report is null || !await CanAccessReportAsync(report, viewerUserId))
        {
            return null;
        }

        return MapReport(report);
    }

    public async Task<(bool Success, string Message, ReportDto? Report)> CreateReportAsync(
        string title,
        string content,
        int createdByUserId,
        IFormFile? attachment)
    {
        var user = await dbContext.Users.FirstOrDefaultAsync(x => x.Id == createdByUserId);
        if (user is null)
        {
            return (false, "Người tạo báo cáo không tồn tại.", null);
        }

        if (string.Equals(user.Role, "Admin", StringComparison.OrdinalIgnoreCase))
        {
            return (false, "Admin không tạo báo cáo tại đây.", null);
        }

        var (fileOk, fileMessage, fileMeta) = await SaveAttachmentAsync(attachment);
        if (!fileOk)
        {
            return (false, fileMessage, null);
        }

        var (level, status, isApproved) = ResolveInitialWorkflowByRole(user.Role);

        var report = new Report
        {
            Id = Guid.NewGuid(),
            Title = title.Trim(),
            Content = content.Trim(),
            CreatedByUserId = createdByUserId,
            CurrentLevel = level,
            IsApproved = isApproved,
            Status = status,
            ReturnedReason = null,
            FileOriginalName = fileMeta?.OriginalName,
            FileStoredName = fileMeta?.StoredName,
            FileContentType = fileMeta?.ContentType,
            CreatedAt = DateTime.UtcNow
        };

        dbContext.Reports.Add(report);
        dbContext.ReportApprovals.Add(new Entities.ReportApproval
        {
            Id = Guid.NewGuid(),
            ReportId = report.Id,
            ApproverUserId = createdByUserId,
            Level = 0,
            Action = "Submitted",
            Comment = $"{user.Role} gửi báo cáo.",
            ApprovedAt = DateTime.UtcNow
        });

        await dbContext.SaveChangesAsync();
        return (true, "Tạo báo cáo thành công.", MapReport(report));
    }

    public async Task<(bool Success, string Message, ReportDto? Report)> ResubmitAsync(
        Guid reportId,
        int staffUserId,
        string title,
        string content,
        IFormFile? attachment)
    {
        var report = await dbContext.Reports.FirstOrDefaultAsync(x => x.Id == reportId);
        if (report is null)
        {
            return (false, "Không tìm thấy báo cáo.", null);
        }

        if (report.CreatedByUserId != staffUserId)
        {
            return (false, "Bạn không có quyền nộp lại báo cáo này.", null);
        }

        if (!string.Equals(report.Status, "Returned", StringComparison.OrdinalIgnoreCase))
        {
            return (false, "Chỉ báo cáo bị trả về mới được nộp lại.", null);
        }

        var (fileOk, fileMessage, fileMeta) = await SaveAttachmentAsync(attachment, report.FileStoredName);
        if (!fileOk)
        {
            return (false, fileMessage, null);
        }

        report.Title = title.Trim();
        report.Content = content.Trim();
        report.Status = "PendingManager";
        report.CurrentLevel = 1;
        report.IsApproved = false;
        report.ReturnedReason = null;

        if (fileMeta is not null)
        {
            report.FileOriginalName = fileMeta.Value.OriginalName;
            report.FileStoredName = fileMeta.Value.StoredName;
            report.FileContentType = fileMeta.Value.ContentType;
        }

        dbContext.ReportApprovals.Add(new Entities.ReportApproval
        {
            Id = Guid.NewGuid(),
            ReportId = report.Id,
            ApproverUserId = staffUserId,
            Level = 0,
            Action = "Resubmitted",
            Comment = "Nhân viên nộp lại báo cáo sau khi bị trả về.",
            ApprovedAt = DateTime.UtcNow
        });

        await dbContext.SaveChangesAsync();
        return (true, "Nộp lại báo cáo thành công.", MapReport(report));
    }

    public async Task<List<ReportDto>> GetPendingByLevelAsync(int level)
    {
        var reports = await dbContext.Reports
            .Where(x => !x.IsApproved && x.CurrentLevel == level && x.Status != "Returned")
            .OrderBy(x => x.CreatedAt)
            .ToListAsync();

        return reports.Select(MapReport).ToList();
    }

    public async Task<List<ReportDto>> GetPendingForApproverAsync(int approverUserId)
    {
        var approver = await dbContext.Users.FirstOrDefaultAsync(x => x.Id == approverUserId);
        if (approver is null)
        {
            return [];
        }

        var approverLevel = MapApproverLevel(approver.Role);
        if (approverLevel <= 0)
        {
            return [];
        }

        return await GetPendingByLevelAsync(approverLevel);
    }

    public async Task<(bool Success, string Message, ReportDto? Report)> ApproveAsync(
        Guid reportId,
        int approverUserId,
        string comment)
    {
        var report = await dbContext.Reports.FirstOrDefaultAsync(x => x.Id == reportId);
        if (report is null)
        {
            return (false, "Không tìm thấy báo cáo.", null);
        }

        if (report.IsApproved)
        {
            return (false, "Báo cáo đã được duyệt xong.", null);
        }

        if (string.Equals(report.Status, "Returned", StringComparison.OrdinalIgnoreCase))
        {
            return (false, "Báo cáo đang ở trạng thái trả về, cần nộp lại.", null);
        }

        var approver = await dbContext.Users.FirstOrDefaultAsync(x => x.Id == approverUserId);
        if (approver is null)
        {
            return (false, "Người duyệt không tồn tại.", null);
        }

        var approverLevel = MapApproverLevel(approver.Role);
        if (approverLevel != report.CurrentLevel)
        {
            return (false, $"Vai trò {approver.Role} không được duyệt cấp {report.CurrentLevel}.", null);
        }

        dbContext.ReportApprovals.Add(new Entities.ReportApproval
        {
            Id = Guid.NewGuid(),
            ReportId = report.Id,
            ApproverUserId = approverUserId,
            Level = report.CurrentLevel,
            Action = "Approved",
            Comment = comment.Trim(),
            ApprovedAt = DateTime.UtcNow
        });

        if (report.CurrentLevel >= MaxApprovalLevel)
        {
            report.IsApproved = true;
            report.CurrentLevel = MaxApprovalLevel + 1;
            report.Status = "Approved";
        }
        else
        {
            report.CurrentLevel += 1;
            report.Status = "PendingDirector";
        }

        await dbContext.SaveChangesAsync();
        return (true, "Duyệt báo cáo thành công.", MapReport(report));
    }

    public async Task<(bool Success, string Message, ReportDto? Report)> ReturnToStaffAsync(
        Guid reportId,
        int approverUserId,
        string comment)
    {
        var report = await dbContext.Reports.FirstOrDefaultAsync(x => x.Id == reportId);
        if (report is null)
        {
            return (false, "Không tìm thấy báo cáo.", null);
        }

        if (report.IsApproved)
        {
            return (false, "Báo cáo đã được duyệt xong, không thể trả về.", null);
        }

        var approver = await dbContext.Users.FirstOrDefaultAsync(x => x.Id == approverUserId);
        if (approver is null)
        {
            return (false, "Người trả về không tồn tại.", null);
        }

        if (!string.Equals(approver.Role, "Manager", StringComparison.OrdinalIgnoreCase) &&
            !string.Equals(approver.Role, "Director", StringComparison.OrdinalIgnoreCase))
        {
            return (false, "Chỉ trưởng phòng/giám đốc mới được trả báo cáo.", null);
        }

        var isManager = string.Equals(approver.Role, "Manager", StringComparison.OrdinalIgnoreCase);
        var isDirector = string.Equals(approver.Role, "Director", StringComparison.OrdinalIgnoreCase);

        if (isManager && report.CurrentLevel != 1)
        {
            return (false, "Chỉ báo cáo đang chờ trưởng phòng duyệt mới được trả về.", null);
        }

        if (isDirector && report.CurrentLevel != 2)
        {
            return (false, "Chỉ báo cáo đang chờ giám đốc duyệt mới được trả về.", null);
        }

        var reason = string.IsNullOrWhiteSpace(comment) ? "Cần bổ sung nội dung." : comment.Trim();

        dbContext.ReportApprovals.Add(new Entities.ReportApproval
        {
            Id = Guid.NewGuid(),
            ReportId = report.Id,
            ApproverUserId = approverUserId,
            Level = report.CurrentLevel,
            Action = isDirector ? "ReturnedByDirector" : "ReturnedByManager",
            Comment = reason,
            ApprovedAt = DateTime.UtcNow
        });

        report.Status = isDirector ? "PendingManager" : "Returned";
        report.CurrentLevel = isDirector ? 1 : 0;
        report.ReturnedReason = reason;
        report.IsApproved = false;

        await dbContext.SaveChangesAsync();
        return (true, isDirector ? "Đã trả báo cáo về trưởng phòng." : "Đã trả báo cáo về cho nhân viên.", MapReport(report));
    }

    public async Task<(bool Success, string Message)> DeleteReportAsync(Guid reportId, int actorUserId)
    {
        var report = await dbContext.Reports.FirstOrDefaultAsync(x => x.Id == reportId);
        if (report is null)
        {
            return (false, "Không tìm thấy báo cáo.");
        }

        var user = await dbContext.Users.FirstOrDefaultAsync(x => x.Id == actorUserId);
        if (user is null)
        {
            return (false, "Người thực hiện không tồn tại.");
        }

        var isAdmin = string.Equals(user.Role, "Admin", StringComparison.OrdinalIgnoreCase);
        var isStaffOwner = report.CreatedByUserId == actorUserId && IsStaff(user.Role);

        if (!isAdmin && !isStaffOwner)
        {
            return (false, "Bạn không có quyền xóa báo cáo này.");
        }

        if (report.IsApproved && !isAdmin)
        {
            return (false, "Báo cáo đã được duyệt, không thể xóa.");
        }

        if (!string.IsNullOrWhiteSpace(report.FileStoredName))
        {
            var filePath = Path.Combine(GetUploadRoot(), report.FileStoredName);
            if (File.Exists(filePath))
            {
                File.Delete(filePath);
            }
        }

        dbContext.Reports.Remove(report);
        await dbContext.SaveChangesAsync();
        return (true, "Xóa báo cáo thành công.");
    }

    private async Task<bool> CanAccessReportAsync(Report report, int userId)
    {
        var user = await dbContext.Users.FirstOrDefaultAsync(x => x.Id == userId);
        if (user is null)
        {
            return false;
        }

        if (IsStaff(user.Role))
        {
            return report.CreatedByUserId == userId;
        }

        return true;
    }
}
