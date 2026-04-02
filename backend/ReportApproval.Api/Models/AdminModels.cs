namespace ReportApproval.Api.Models;

public class AdminOverviewDto
{
    public int TotalUsers { get; set; }
    public int TotalReports { get; set; }
    public int TotalTasks { get; set; }
    public int PendingReports { get; set; }
}

public class AdminUserDto
{
    public int Id { get; set; }
    public string UserName { get; set; } = string.Empty;
    public string Role { get; set; } = string.Empty;
}

public class AdminCreateUserRequest
{
    public int AdminUserId { get; set; }
    public string UserName { get; set; } = string.Empty;
    public string Password { get; set; } = string.Empty;
    public string Role { get; set; } = string.Empty;
}

public class AdminUpdateUserRoleRequest
{
    public int AdminUserId { get; set; }
    public string Role { get; set; } = string.Empty;
}
