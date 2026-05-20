using System.Security.Claims;
using GradPath.Business.DTOs.AdvisorRequest;
using GradPath.Business.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace GradPath.API.Controllers;

[ApiController]
[Route("api/v1/advisor-requests")]
[Authorize]
public class AdvisorRequestController : ControllerBase
{
    private readonly IAdvisorRequestService _advisorRequestService;

    public AdvisorRequestController(IAdvisorRequestService advisorRequestService)
    {
        _advisorRequestService = advisorRequestService;
    }

    [HttpGet("mine")]
    [Authorize(Roles = "Student")]
    public async Task<IActionResult> GetMine()
    {
        if (!TryGetCurrentUserId(out var userId)) return Unauthorized();

        var requests = await _advisorRequestService.GetStudentRequestsAsync(userId);
        return Ok(requests);
    }

    [HttpGet("incoming")]
    [Authorize(Roles = "Advisor")]
    public async Task<IActionResult> GetIncoming()
    {
        if (!TryGetCurrentUserId(out var userId)) return Unauthorized();

        var requests = await _advisorRequestService.GetIncomingRequestsAsync(userId);
        return Ok(requests);
    }

    [HttpPost]
    [Authorize(Roles = "Student")]
    public async Task<IActionResult> Create(AdvisorRequestCreateDto dto)
    {
        if (!TryGetCurrentUserId(out var userId)) return Unauthorized();

        var result = await _advisorRequestService.CreateAsync(userId, dto);
        if (!result.Succeeded) return BadRequest(result.Message);

        return Ok(result.Message);
    }

    [HttpPost("{id}/cancel")]
    [Authorize(Roles = "Student")]
    public async Task<IActionResult> Cancel(Guid id)
    {
        if (!TryGetCurrentUserId(out var userId)) return Unauthorized();

        var result = await _advisorRequestService.CancelAsync(userId, id);
        if (!result.Succeeded) return BadRequest(result.Message);

        return Ok(result.Message);
    }

    [HttpPost("{id}/approve")]
    [Authorize(Roles = "Advisor")]
    public async Task<IActionResult> Approve(Guid id, AdvisorRequestDecisionDto dto)
    {
        if (!TryGetCurrentUserId(out var userId)) return Unauthorized();

        var result = await _advisorRequestService.ApproveAsync(userId, id, dto.Note);
        if (!result.Succeeded) return BadRequest(result.Message);

        return Ok(result.Message);
    }

    [HttpPost("{id}/reject")]
    [Authorize(Roles = "Advisor")]
    public async Task<IActionResult> Reject(Guid id, AdvisorRequestDecisionDto dto)
    {
        if (!TryGetCurrentUserId(out var userId)) return Unauthorized();

        var result = await _advisorRequestService.RejectAsync(userId, id, dto.Note);
        if (!result.Succeeded) return BadRequest(result.Message);

        return Ok(result.Message);
    }

    private bool TryGetCurrentUserId(out Guid userId)
    {
        var userIdString = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        return Guid.TryParse(userIdString, out userId);
    }
}
