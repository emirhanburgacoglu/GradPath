using GradPath.Business.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;

namespace GradPath.API.Controllers;

[Authorize]
[ApiController]
[Route("api/v1/[controller]")]
public class TeamController : ControllerBase
{
    private readonly ITeamService _teamService;

    public TeamController(ITeamService teamService)
    {
        _teamService = teamService;
    }

    [HttpGet("suggestions")]
    public async Task<IActionResult> GetSuggestions([FromQuery] int projectId)
    {
        // JWT Token'dan giriş yapmış kullanıcının ID'sini çekiyoruz
        var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier);
        if (userIdClaim == null) return Unauthorized();

        var userId = Guid.Parse(userIdClaim.Value);

        // Servisi çağırıp sonuçları döndürüyoruz
        var suggestions = await _teamService.GetTeammateSuggestionsAsync(userId, projectId);
        
        if (suggestions == null || !suggestions.Any())
        {
            return Ok(new { message = "Şu an için bu projedeki eksiklerini kapatabilecek uygun bir aday bulunamadı.", data = suggestions });
        }

        return Ok(new { message = "Sizin için en uygun uzman ekip arkadaşları listelendi.", data = suggestions });
    }
}
