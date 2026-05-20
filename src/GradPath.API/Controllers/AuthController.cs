using GradPath.Business.DTOs.Auth;
using GradPath.Business.DTOs.Student;
using GradPath.Business.Exceptions;
using GradPath.Business.Services;
using GradPath.Data;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Security.Claims;

namespace GradPath.API.Controllers;

[ApiController]
[Route("api/v1/auth")]
public class AuthController : ControllerBase
{
    private readonly IAuthService _authService;
    private readonly GradPathDbContext _context;

    public AuthController(IAuthService authService, GradPathDbContext context)
    {
        _authService = authService;
        _context = context;
    }

    [HttpPost("register")]
    public async Task<IActionResult> Register([FromBody] RegisterRequestDto request)
    {
        try
        {
            var result = await _authService.RegisterAsync(request);
            return Ok(result);
        }
        catch (AuthFlowException ex)
        {
            return StatusCode(ex.StatusCode, new { message = ex.Message });
        }
    }

    [HttpPost("login")]
    public async Task<IActionResult> Login([FromBody] LoginRequestDto request)
    {
        try
        {
            var result = await _authService.LoginAsync(request);
            return Ok(result);
        }
        catch (AuthFlowException ex)
        {
            return StatusCode(ex.StatusCode, new { message = ex.Message });
        }
    }

    [Authorize]
    [HttpPost("change-password")]
    public async Task<IActionResult> ChangePassword([FromBody] ChangePasswordRequestDto request)
    {
        var userIdString = User.FindFirstValue(ClaimTypes.NameIdentifier);
        if (string.IsNullOrWhiteSpace(userIdString) || !Guid.TryParse(userIdString, out var userId))
        {
            return Unauthorized(new { message = "Kullanici kimligi dogrulanamadi." });
        }

        try
        {
            await _authService.ChangePasswordAsync(userId, request);
            return Ok(new { message = "Sifre basariyla guncellendi." });
        }
        catch (AuthFlowException ex)
        {
            return StatusCode(ex.StatusCode, new { message = ex.Message });
        }
    }

    [HttpGet("departments")]
    public async Task<IActionResult> GetDepartments()
    {
        var departments = await _context.Departments
            .AsNoTracking()
            .OrderBy((department) => department.FacultyName)
            .ThenBy((department) => department.Name)
            .Select((department) => new DepartmentOptionDto
            {
                Id = department.Id,
                Name = department.Name,
                Code = department.Code,
                FacultyName = department.FacultyName
            })
            .ToListAsync();

        return Ok(new { departments });
    }
}
