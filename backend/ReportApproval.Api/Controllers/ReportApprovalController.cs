using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using ReportApproval.Api.Extensions;
using ReportApproval.Api.Models;
using ReportApproval.Api.Services;

namespace ReportApproval.Api.Controllers;

[ApiController]
[Authorize(Roles = "Manager,Director")]
[Route("api/report-approvals")]
public class ReportApprovalController(ReportService reportService) : ControllerBase
{
    [HttpGet("pending/{level:int}")]
    public async Task<IActionResult> GetPending(int level)
    {
        var expectedLevel = User.IsInRole("Manager") ? 1 : 2;
        if (level != expectedLevel)
        {
            return Forbid();
        }

        var reports = await reportService.GetPendingForApproverAsync(User.GetUserId());
        return Ok(reports);
    }

    [HttpGet("history")]
    public async Task<IActionResult> GetHistoryByApprover()
    {
        var history = await reportService.GetHistoryByApproverAsync(User.GetUserId());
        return Ok(history);
    }

    [HttpPost("{id:guid}/approve")]
    public async Task<IActionResult> Approve(Guid id, [FromBody] ApproveReportRequest request)
    {
        var result = await reportService.ApproveAsync(id, User.GetUserId(), request.Comment);
        if (!result.Success)
        {
            return BadRequest(result.Message);
        }

        return Ok(new
        {
            result.Message,
            Report = result.Report
        });
    }

    [HttpPost("{id:guid}/return")]
    public async Task<IActionResult> Return(Guid id, [FromBody] ReturnReportRequest request)
    {
        var result = await reportService.ReturnToStaffAsync(id, User.GetUserId(), request.Comment);
        if (!result.Success)
        {
            return BadRequest(result.Message);
        }

        return Ok(new
        {
            result.Message,
            Report = result.Report
        });
    }
}
