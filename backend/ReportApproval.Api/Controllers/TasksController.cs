using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using ReportApproval.Api.Extensions;
using ReportApproval.Api.Models;
using ReportApproval.Api.Services;

namespace ReportApproval.Api.Controllers;

[ApiController]
[Authorize]
[Route("api/tasks")]
public class TasksController(TaskService taskService) : ControllerBase
{
    [HttpGet("staff")]
    public async Task<IActionResult> GetAssignableStaff()
    {
        var users = await taskService.GetAssignableStaffAsync(User.GetUserId());
        return Ok(users);
    }

    [HttpGet]
    public async Task<IActionResult> GetByUser()
    {
        var tasks = await taskService.GetTasksAsync(User.GetUserId());
        return Ok(tasks);
    }

    [HttpGet("history")]
    public async Task<IActionResult> GetHistory()
    {
        var history = await taskService.GetTaskHistoryAsync(User.GetUserId());
        return Ok(history);
    }

    [HttpPost]
    public async Task<IActionResult> Create([FromBody] CreateTaskRequest request)
    {
        if (string.IsNullOrWhiteSpace(request.Title))
        {
            return BadRequest("Tiêu đề là bắt buộc.");
        }

        request.AssignedByUserId = User.GetUserId();
        var result = await taskService.CreateTaskAsync(request);
        if (!result.Success || result.Task is null)
        {
            return BadRequest(result.Message);
        }

        return Ok(new { result.Message, Task = result.Task });
    }

    [HttpPatch("{id:guid}/status")]
    public async Task<IActionResult> UpdateStatus(Guid id, [FromBody] UpdateTaskStatusRequest request)
    {
        request.UserId = User.GetUserId();
        var result = await taskService.UpdateStatusAsync(id, request);
        if (!result.Success)
        {
            return BadRequest(result.Message);
        }

        return Ok(result.Message);
    }
}
