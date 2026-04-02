using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using ReportApproval.Api.Data;
using ReportApproval.Api.Models;
using ReportApproval.Api.Services;

namespace ReportApproval.Api.Controllers;

[ApiController]
[Route("api/auth")]
public class AuthController(AppDbContext dbContext, JwtTokenService jwtTokenService) : ControllerBase
{
    [AllowAnonymous]
    [HttpPost("login")]
    public async Task<IActionResult> Login([FromBody] LoginRequest request)
    {
        if (string.IsNullOrWhiteSpace(request.UserName) || string.IsNullOrWhiteSpace(request.Password))
        {
            return BadRequest("UserName và Password là bắt buộc.");
        }

        var user = await dbContext.Users
            .FirstOrDefaultAsync(x => x.UserName == request.UserName.Trim());

        if (user is null || user.Password != request.Password)
        {
            return Unauthorized("Thông tin đăng nhập không hợp lệ.");
        }

        return Ok(jwtTokenService.CreateSession(user));
    }
}
