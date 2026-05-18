using GradPath.Business.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;

namespace GradPath.API.Controllers;

[ApiController]
[Route("api/v1/advisors")]
[Authorize]
public class AdvisorController : ControllerBase
{
    private readonly IAdvisorService _advisorService;

    public AdvisorController(IAdvisorService advisorService)
    {
        _advisorService = advisorService;
    }

    [HttpGet("me")]
    [Authorize(Roles = "Advisor")]
    public async Task<IActionResult> GetMyProfile()
    {
        var userIdString = User.FindFirstValue(ClaimTypes.NameIdentifier);

        if (string.IsNullOrWhiteSpace(userIdString) || !Guid.TryParse(userIdString, out var userId))
        {
            return Unauthorized(new { message = "Kullanici kimligi dogrulanamadi." });
        }

        var profile = await _advisorService.GetProfileByUserIdAsync(userId);

        if (profile == null)
        {
            return NotFound(new { message = "Danisman profili bulunamadi." });
        }

        return Ok(profile);
    }

    [HttpGet("available")]
    [Authorize(Roles = "Student")]
    public async Task<IActionResult> GetAvailableAdvisors([FromQuery] int projectId)
    {
        var userIdString = User.FindFirstValue(ClaimTypes.NameIdentifier);

        if (string.IsNullOrWhiteSpace(userIdString) || !Guid.TryParse(userIdString, out var userId))
        {
            return Unauthorized(new { message = "Kullanici kimligi dogrulanamadi." });
        }

        var advisors = await _advisorService.GetAvailableAdvisorsForProjectAsync(userId, projectId);
        return Ok(advisors);
    }
}
