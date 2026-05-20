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
}
