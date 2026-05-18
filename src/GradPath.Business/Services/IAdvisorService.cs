using GradPath.Business.DTOs.Advisor;

namespace GradPath.Business.Services;

public interface IAdvisorService
{
    Task<AdvisorProfileResponseDto?> GetProfileByUserIdAsync(Guid userId);
}