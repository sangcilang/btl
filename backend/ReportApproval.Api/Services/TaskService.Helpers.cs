namespace ReportApproval.Api.Services;

public partial class TaskService
{
    private static bool IsStaff(string role)
    {
        return string.Equals(role, "Staff", StringComparison.OrdinalIgnoreCase);
    }

    private static DateTime? NormalizeDateTime(DateTime? dateTime)
    {
        if (!dateTime.HasValue)
        {
            return null;
        }

        var value = dateTime.Value;
        return value.Kind switch
        {
            DateTimeKind.Utc => value,
            DateTimeKind.Local => value.ToUniversalTime(),
            _ => DateTime.SpecifyKind(value, DateTimeKind.Utc)
        };
    }
}
