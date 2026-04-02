using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using ReportApproval.Api.Extensions;
using ReportApproval.Api.Services;

namespace ReportApproval.Api.Controllers;

[ApiController]
[Authorize]
[Route("api/dashboard")]
public class DashboardController(ReportService reportService) : ControllerBase
{
    [HttpGet("stats")]
    public async Task<IActionResult> GetStats()
    {
        var stats = await reportService.GetStatisticsAsync(User.GetUserId());
        return Ok(stats);
    }
}
