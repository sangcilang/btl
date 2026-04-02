using System.Text.Json.Serialization;

namespace ReportApproval.Api.Entities;

public class User
{
    public int Id { get; set; }
    public string UserName { get; set; } = string.Empty;
    public string Password { get; set; } = string.Empty;
    public string Role { get; set; } = string.Empty;

    [JsonIgnore]
    public ICollection<Report> CreatedReports { get; set; } = new List<Report>();
    [JsonIgnore]
    public ICollection<ReportApproval> Approvals { get; set; } = new List<ReportApproval>();
}
