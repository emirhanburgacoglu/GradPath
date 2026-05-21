using GradPath.Business.DTOs.Advisor;

namespace GradPath.Business.Services;

public interface IAdvisorService
{
    Task<AdvisorProfileResponseDto?> GetProfileByUserIdAsync(Guid userId);
    Task<AdvisorProfileResponseDto?> UpdateProfileAsync(Guid userId, AdvisorProfileUpdateDto dto);
    Task<List<AdvisorLookupDto>> GetAvailableAdvisorsForProjectAsync(Guid studentUserId, int projectId);
}
