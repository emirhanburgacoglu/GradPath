using GradPath.Business.DTOs.Team;

namespace GradPath.Business.Services;

public interface ITeamService
{
    // projectId: Hangi proje için ortak arıyoruz?
    // userId: Aramayı yapan (siz) kim?
    Task<List<TeamRecommendationDto>> GetTeammateSuggestionsAsync(Guid userId, int projectId);
}
