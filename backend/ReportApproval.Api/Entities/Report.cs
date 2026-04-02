using System.Text.Json.Serialization;

namespace ReportApproval.Api.Entities;

public class Report
{
    public Guid Id { get; set; }
    public string Title { get; set; } = string.Empty;
    public string Content { get; set; } = string.Empty;
    public string Status { get; set; } = "PendingManager";
    public string? ReturnedReason { get; set; }
    public string? FileOriginalName { get; set; }
    public string? FileStoredName { get; set; }
    public string? FileContentType { get; set; }

    public int CurrentLevel { get; set; } = 1;
    public bool IsApproved { get; set; } = false;

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public int CreatedByUserId { get; set; }
    [JsonIgnore]
    public User? CreatedByUser { get; set; }

    [JsonIgnore]
    public ICollection<ReportApproval> Approvals { get; set; } = new List<ReportApproval>();
}
