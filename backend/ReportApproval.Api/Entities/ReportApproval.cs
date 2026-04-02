using System.Text.Json.Serialization;

namespace ReportApproval.Api.Entities;

public class ReportApproval
{
    public Guid Id { get; set; }
    public Guid ReportId { get; set; }
    [JsonIgnore]
    public Report? Report { get; set; }

    public int ApproverUserId { get; set; }
    [JsonIgnore]
    public User? ApproverUser { get; set; }

    public int Level { get; set; }
    public string Action { get; set; } = "Approved";
    public string Comment { get; set; } = string.Empty;
    public DateTime ApprovedAt { get; set; } = DateTime.UtcNow;
}
