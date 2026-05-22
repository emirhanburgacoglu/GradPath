using GradPath.Business.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace GradPath.API.Controllers;

[ApiController]
[Route("api/v1/advisor-sync")]
[Authorize(Roles = "Admin")]
public class AdvisorSyncController : ControllerBase
{
    private readonly IAvesisAdvisorSyncService _avesisAdvisorSyncService;

    public AdvisorSyncController(IAvesisAdvisorSyncService avesisAdvisorSyncService)
    {
        _avesisAdvisorSyncService = avesisAdvisorSyncService;
    }

    [HttpPost("avesis/computer-engineering")]
    public async Task<IActionResult> SyncComputerEngineering()
    {
        var result = await _avesisAdvisorSyncService.SyncComputerEngineeringAsync();
        return Ok(result);
    }

    [HttpPost("avesis/computer-engineering/resync")]
    public async Task<IActionResult> ResyncComputerEngineering()
    {
        var result = await _avesisAdvisorSyncService.ResyncComputerEngineeringAsync();
        return Ok(result);
    }

    [HttpDelete("avesis/computer-engineering")]
    public async Task<IActionResult> ResetComputerEngineeringAdvisors()
    {
        var result = await _avesisAdvisorSyncService.ResetComputerEngineeringAdvisorsAsync();
        return Ok(result);
    }
}
