using Microsoft.AspNetCore.Http;

namespace ReportApproval.Api.Models;

public class CreateReportRequest
{
    public string Title { get; set; } = string.Empty;
    public string Content { get; set; } = string.Empty;
    public int CreatedByUserId { get; set; }
    public IFormFile? Attachment { get; set; }
}

public class ResubmitReportRequest
{
    public int StaffUserId { get; set; }
    public string Title { get; set; } = string.Empty;
    public string Content { get; set; } = string.Empty;
    public IFormFile? Attachment { get; set; }
}

public class ApproveReportRequest
{
    public int ApproverUserId { get; set; }
    public string Comment { get; set; } = string.Empty;
}

public class ReturnReportRequest
{
    public int ApproverUserId { get; set; }
    public string Comment { get; set; } = string.Empty;
}

public class ReportDto
{
    public Guid Id { get; set; }
    public string Title { get; set; } = string.Empty;
    public string Content { get; set; } = string.Empty;
    public int CurrentLevel { get; set; }
    public bool IsApproved { get; set; }
    public string Status { get; set; } = string.Empty;
    public string? ReturnedReason { get; set; }
    public string? FileOriginalName { get; set; }
    public bool HasAttachment { get; set; }
    public DateTime CreatedAt { get; set; }
    public int CreatedByUserId { get; set; }
}

public class ReportHistoryItemDto
{
    public Guid Id { get; set; }
    public Guid ReportId { get; set; }
    public int Level { get; set; }
    public string Action { get; set; } = string.Empty;
    public string Comment { get; set; } = string.Empty;
    public int ApproverUserId { get; set; }
    public string ApproverUserName { get; set; } = string.Empty;
    public string ApproverRole { get; set; } = string.Empty;
    public DateTime ApprovedAt { get; set; }
}

public class ReportStatisticsDto
{
    public int TotalReports { get; set; }
    public int PendingManager { get; set; }
    public int PendingDirector { get; set; }
    public int ReturnedReports { get; set; }
    public int ApprovedReports { get; set; }
}
