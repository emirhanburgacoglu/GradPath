using System.Security.Claims;
using GradPath.Business.DTOs.Project;
using GradPath.Business.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace GradPath.API.Controllers;

[ApiController]
[Route("api/v1/advisor-projects")]
[Authorize(Roles = "Advisor")]
public class AdvisorProjectController : ControllerBase
{
    private readonly IProjectService _projectService;

    public AdvisorProjectController(IProjectService projectService)
    {
        _projectService = projectService;
    }

    [HttpGet("mine")]
    public async Task<IActionResult> GetMine()
    {
        if (!TryGetCurrentUserId(out var userId)) return Unauthorized();

        var projects = await _projectService.GetByAdvisorAsync(userId);
        return Ok(projects);
    }

    [HttpPost]
    public async Task<IActionResult> Create(ProjectCreateDto request)
    {
        if (!TryGetCurrentUserId(out var userId)) return Unauthorized();

        if (!request.TechnologyIds.Any())
        {
            return BadRequest("Projenin havuzda eslesebilmesi icin en az bir teknoloji secmelisiniz.");
        }

        var created = await _projectService.CreateForAdvisorAsync(userId, request);
        return CreatedAtAction(nameof(GetMine), new { id = created.Id }, created);
    }

    private bool TryGetCurrentUserId(out Guid userId)
    {
        var userIdString = User.FindFirstValue(ClaimTypes.NameIdentifier);
        return Guid.TryParse(userIdString, out userId);
    }
}
