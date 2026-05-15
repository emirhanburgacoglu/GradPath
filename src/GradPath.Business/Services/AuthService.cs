using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using GradPath.Business.DTOs.Auth;
using GradPath.Business.Exceptions;
using GradPath.Data;
using GradPath.Data.Entities;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Identity;
using Microsoft.Extensions.Configuration;
using Microsoft.IdentityModel.Tokens;

namespace GradPath.Business.Services;

public class AuthService : IAuthService
{
    private readonly UserManager<AppUser> _userManager;
    private readonly IConfiguration _configuration;
    private readonly GradPathDbContext _context;

    public AuthService(
        UserManager<AppUser> userManager,
        IConfiguration configuration,
        GradPathDbContext context)
    {
        _userManager = userManager;
        _configuration = configuration;
        _context = context;
    }

    public async Task<AuthResponseDto> RegisterAsync(RegisterRequestDto request)
    {
        var existingUser = await _userManager.FindByEmailAsync(request.Email);
        if (existingUser != null)
        {
            throw new AuthFlowException("Bu email adresi zaten kayıtlı.", StatusCodes.Status409Conflict);
        }

        var user = new AppUser
        {
            UserName = request.Email,
            Email = request.Email,
            FullName = request.FullName,
            DepartmentId = request.DepartmentId,
            CreatedAt = DateTime.UtcNow
        };

        var result = await _userManager.CreateAsync(user, request.Password);
        if (!result.Succeeded)
        {
            var errors = string.Join(", ", result.Errors.Select((e) => e.Description));
            throw new AuthFlowException($"Kayıt başarısız: {errors}", StatusCodes.Status400BadRequest);
        }

        await _userManager.AddToRoleAsync(user, "Student");

        var profile = new StudentProfile
        {
            UserId = user.Id,
            CreatedAt = DateTime.UtcNow
        };
        _context.StudentProfiles.Add(profile);
        await _context.SaveChangesAsync();

        return await GenerateJwtToken(user);
    }

    public async Task<AuthResponseDto> LoginAsync(LoginRequestDto request)
    {
        var user = await _userManager.FindByEmailAsync(request.Email);
        if (user == null)
        {
            throw new AuthFlowException("Email veya şifre hatalı.", StatusCodes.Status401Unauthorized);
        }

        var isPasswordValid = await _userManager.CheckPasswordAsync(user, request.Password);
        if (!isPasswordValid)
        {
            throw new AuthFlowException("Email veya şifre hatalı.", StatusCodes.Status401Unauthorized);
        }

        return await GenerateJwtToken(user);
    }

    private async Task<AuthResponseDto> GenerateJwtToken(AppUser user)
    {
        var jwtSettings = _configuration.GetSection("JwtSettings");
        var secretKey = jwtSettings["SecretKey"];
        var issuer = jwtSettings["Issuer"];
        var audience = jwtSettings["Audience"];
        var expirationMinutes = int.Parse(jwtSettings["ExpirationMinutes"]!);

        var userRoles = await _userManager.GetRolesAsync(user);

        var claims = new List<Claim>
        {
            new(ClaimTypes.NameIdentifier, user.Id.ToString()),
            new(ClaimTypes.Email, user.Email!),
            new(ClaimTypes.Name, user.FullName),
            new(JwtRegisteredClaimNames.Jti, Guid.NewGuid().ToString())
        };

        foreach (var role in userRoles)
        {
            claims.Add(new Claim(ClaimTypes.Role, role));
        }

        var key = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(secretKey!));
        var credentials = new SigningCredentials(key, SecurityAlgorithms.HmacSha256);
        var expiration = DateTime.UtcNow.AddMinutes(expirationMinutes);

        var token = new JwtSecurityToken(
            issuer: issuer,
            audience: audience,
            claims: claims,
            expires: expiration,
            signingCredentials: credentials
        );

        var tokenString = new JwtSecurityTokenHandler().WriteToken(token);

        return new AuthResponseDto
        {
            Token = tokenString,
            ExpiresAt = expiration,
            UserId = user.Id.ToString(),
            Email = user.Email!,
            Roles = userRoles.ToList()
        };
    }
}
