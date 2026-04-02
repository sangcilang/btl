using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using ReportApproval.Api.Extensions;
using ReportApproval.Api.Models;
using ReportApproval.Api.Services;

namespace ReportApproval.Api.Controllers;

[ApiController]
[Authorize]
[Route("api/reports")]
public class ReportsController(ReportService reportService) : ControllerBase
{
    [HttpGet]
    public async Task<IActionResult> GetAll()
    {
        var reports = await reportService.GetReportsAsync(User.GetUserId());
        return Ok(reports);
    }

    [HttpGet("{id:guid}")]
    public async Task<IActionResult> GetById(Guid id)
    {
        var report = await reportService.GetReportByIdAsync(id, User.GetUserId());
        return report is null ? NotFound() : Ok(report);
    }

    [HttpPost]
    [Consumes("multipart/form-data")]
    public async Task<IActionResult> Create([FromForm] CreateReportRequest request)
    {
        if (string.IsNullOrWhiteSpace(request.Title) || string.IsNullOrWhiteSpace(request.Content))
        {
            return BadRequest("Tiêu đề và nội dung là bắt buộc.");
        }

        var result = await reportService.CreateReportAsync(
            request.Title,
            request.Content,
            User.GetUserId(),
            request.Attachment);

        if (!result.Success || result.Report is null)
        {
            return BadRequest(result.Message);
        }

        return CreatedAtAction(nameof(GetById), new { id = result.Report.Id }, result.Report);
    }

    [HttpPost("{id:guid}/resubmit")]
    [Consumes("multipart/form-data")]
    public async Task<IActionResult> Resubmit(Guid id, [FromForm] ResubmitReportRequest request)
    {
        if (string.IsNullOrWhiteSpace(request.Title) || string.IsNullOrWhiteSpace(request.Content))
        {
            return BadRequest("Tiêu đề và nội dung là bắt buộc.");
        }

        var result = await reportService.ResubmitAsync(
            id,
            User.GetUserId(),
            request.Title,
            request.Content,
            request.Attachment);

        if (!result.Success || result.Report is null)
        {
            return BadRequest(result.Message);
        }

        return Ok(new { result.Message, Report = result.Report });
    }

    [HttpGet("{id:guid}/history")]
    public async Task<IActionResult> GetHistory(Guid id)
    {
        var history = await reportService.GetHistoryAsync(id, User.GetUserId());
        return history is null ? Forbid() : Ok(history);
    }

    [HttpGet("{id:guid}/attachment")]
    public async Task<IActionResult> DownloadAttachment(Guid id)
    {
        var fileResult = await reportService.GetAttachmentAsync(id, User.GetUserId());
        if (!fileResult.Success || fileResult.File is null)
        {
            return fileResult.Message == "FORBIDDEN" ? Forbid() : NotFound(fileResult.Message);
        }

        return File(fileResult.File.Value.Data, fileResult.File.Value.ContentType, fileResult.File.Value.DownloadName);
    }

    [HttpDelete("{id:guid}")]
    public async Task<IActionResult> Delete(Guid id)
    {
        var result = await reportService.DeleteReportAsync(id, User.GetUserId());
        if (!result.Success)
        {
            return BadRequest(result.Message);
        }

        return Ok(result.Message);
    }
}
