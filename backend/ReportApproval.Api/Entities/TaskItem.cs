using System.Text.Json.Serialization;

namespace ReportApproval.Api.Entities;

public class TaskItem
{
    public Guid Id { get; set; }
    public string Title { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public int AssignedToUserId { get; set; }
    [JsonIgnore]
    public User? AssignedToUser { get; set; }
    public int AssignedByUserId { get; set; }
    [JsonIgnore]
    public User? AssignedByUser { get; set; }
    public DateTime? DueDate { get; set; }
    public string Status { get; set; } = "Todo";
    public DateTime? CompletedAt { get; set; }
    public int? CompletedByUserId { get; set; }
    [JsonIgnore]
    public User? CompletedByUser { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    [JsonIgnore]
    public ICollection<TaskHistory> Histories { get; set; } = new List<TaskHistory>();
}
