using GradPath.Business.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;

namespace GradPath.API.Controllers;

[Route("api/v1/[controller]")]
[ApiController]
[Authorize] // Bu işlemler sadece giriş yapmış kullanıcılar içindir
public class MatchingController : ControllerBase
{
    private readonly IMatchingService _matchingService;

    public MatchingController(IMatchingService matchingService)
    {
        _matchingService = matchingService;
    }

    /// <summary>
    /// Giriş yapmış öğrenci için matematiksel eşleştirme algoritmasını çalıştırır.
    /// Öğrencinin AGNO'su ve bildiği teknolojiler ile proje gereksinimlerini karşılaştırır.
    /// </summary>
    /// <returns>En yüksek skorlu projelerden oluşan öneri listesi</returns>
    [HttpGet("recommendations")]
    public async Task<IActionResult> GetRecommendations()
    {
        try
        {
            // Token (JWT) içinden giriş yapmış kullanıcının ID'sini alıyoruz
            var userIdString = User.FindFirstValue(ClaimTypes.NameIdentifier);
            
            if (string.IsNullOrEmpty(userIdString) || !Guid.TryParse(userIdString, out Guid userId))
            {
                return Unauthorized(new { Message = "Kullanıcı kimliği doğrulanamadı." });
            }

            // Aylar süren emeğimizin meyvesi: Algoritmayı çalıştır!
            var recommendations = await _matchingService.GetProjectRecommendationsAsync(userId);

            if (!recommendations.Any())
            {
                return Ok(new 
                { 
                    Message = "Henüz becerilerinizi veya AGNO bilginizi girmediniz. Lütfen önce profilinizi güncelleyin (CV yükleyerek veya manuel ekleyerek).",
                    Data = recommendations 
                });
            }

            return Ok(new
            {
                Message = "Tebrikler! Matematiksel algoritmamız profilinize en uygun projeleri listeledi.",
                Data = recommendations
            });
        }
        catch (Exception ex)
        {
            // Beklenmedik bir hata olursa
            return StatusCode(500, new { Message = "Eşleştirme sırasında bir hata oluştu.", Details = ex.Message });
        }
    }
}
