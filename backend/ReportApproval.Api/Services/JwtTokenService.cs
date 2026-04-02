using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using Microsoft.IdentityModel.Tokens;
using ReportApproval.Api.Entities;
using ReportApproval.Api.Models;

namespace ReportApproval.Api.Services;

public class JwtTokenService(IConfiguration configuration)
{
    private readonly string issuer = configuration["Jwt:Issuer"] ?? throw new InvalidOperationException("Jwt:Issuer is not configured.");
    private readonly string audience = configuration["Jwt:Audience"] ?? throw new InvalidOperationException("Jwt:Audience is not configured.");
    private readonly string key = configuration["Jwt:Key"] ?? throw new InvalidOperationException("Jwt:Key is not configured.");
    private readonly int expiresMinutes = int.TryParse(configuration["Jwt:ExpiresMinutes"], out var value) ? value : 480;

    public LoginResponse CreateSession(User user)
    {
        var expiresAt = DateTime.UtcNow.AddMinutes(expiresMinutes);
        var claims = new[]
        {
            new Claim(ClaimTypes.NameIdentifier, user.Id.ToString()),
            new Claim(ClaimTypes.Name, user.UserName),
            new Claim(ClaimTypes.Role, user.Role),
            new Claim(JwtRegisteredClaimNames.Jti, Guid.NewGuid().ToString())
        };

        var credentials = new SigningCredentials(
            new SymmetricSecurityKey(Encoding.UTF8.GetBytes(key)),
            SecurityAlgorithms.HmacSha256);

        var token = new JwtSecurityToken(
            issuer: issuer,
            audience: audience,
            claims: claims,
            expires: expiresAt,
            signingCredentials: credentials);

        return new LoginResponse
        {
            AccessToken = new JwtSecurityTokenHandler().WriteToken(token),
            ExpiresAt = expiresAt,
            User = new AuthUserDto
            {
                Id = user.Id,
                UserName = user.UserName,
                Role = user.Role
            }
        };
    }
}
