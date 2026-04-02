using ReportApproval.Api.Entities;
using ReportApproval.Api.Models;

namespace ReportApproval.Api.Services;

public partial class ReportService
{
    private static int MapApproverLevel(string role)
    {
        return role.Trim().ToLowerInvariant() switch
        {
            "manager" => 1,
            "director" => 2,
            _ => -1
        };
    }

    private static bool IsStaff(string role)
    {
        return string.Equals(role, "Staff", StringComparison.OrdinalIgnoreCase);
    }

    private static (int Level, string Status, bool IsApproved) ResolveInitialWorkflowByRole(string role)
    {
        if (string.Equals(role, "Manager", StringComparison.OrdinalIgnoreCase))
        {
            return (2, "PendingDirector", false);
        }

        if (string.Equals(role, "Director", StringComparison.OrdinalIgnoreCase))
        {
            return (MaxApprovalLevel + 1, "Approved", true);
        }

        return (1, "PendingManager", false);
    }

    private static ReportDto MapReport(Report report)
    {
        return new ReportDto
        {
            Id = report.Id,
            Title = report.Title,
            Content = report.Content,
            CurrentLevel = report.CurrentLevel,
            IsApproved = report.IsApproved,
            Status = report.Status,
            ReturnedReason = report.ReturnedReason,
            FileOriginalName = report.FileOriginalName,
            HasAttachment = !string.IsNullOrWhiteSpace(report.FileStoredName),
            CreatedAt = report.CreatedAt,
            CreatedByUserId = report.CreatedByUserId
        };
    }
}
