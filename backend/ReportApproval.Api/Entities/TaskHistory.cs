using System.Text.Json.Serialization;

namespace ReportApproval.Api.Entities;

public class TaskHistory
{
    public Guid Id { get; set; }
    public Guid TaskId { get; set; }
    [JsonIgnore]
    public TaskItem? Task { get; set; }
    public string Action { get; set; } = string.Empty;
    public string Status { get; set; } = string.Empty;
    public string Note { get; set; } = string.Empty;
    public int ChangedByUserId { get; set; }
    [JsonIgnore]
    public User? ChangedByUser { get; set; }
    public DateTime ChangedAt { get; set; } = DateTime.UtcNow;
}
