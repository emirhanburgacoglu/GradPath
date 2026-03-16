using GradPath.Business.DTOs.Recommendation;

namespace GradPath.Business.Services;

public interface IMatchingService
{
    /// <summary>
    /// Belirtilen kullanıcı (öğrenci) için veritabanındaki projelere kural tabanlı 
    /// matematiksel filtreleme yapar ve en uygun projeleri skorlayarak döndürür.
    /// </summary>
    /// <param name="userId">Öğrencinin ID'si</param>
    /// <returns>Öneri listesi (En yüksek skordan en düşüğe sıralı)</returns>
    Task<List<RecommendationResponseDto>> GetProjectRecommendationsAsync(Guid userId);
}
