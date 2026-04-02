using Microsoft.AspNetCore.Hosting;
using ReportApproval.Api.Data;

namespace ReportApproval.Api.Services;

public partial class ReportService(AppDbContext dbContext, IWebHostEnvironment environment)
{
    private const int MaxApprovalLevel = 2;
    private static readonly HashSet<string> AllowedExtensions =
    [
        ".xls", ".xlsx", ".doc", ".docx"
    ];
}
