using GradPath.Business.DTOs.AdvisorRequest;

namespace GradPath.Business.Services;

public interface IAdvisorRequestService
{
    Task<List<AdvisorRequestResponseDto>> GetStudentRequestsAsync(Guid studentUserId);
    Task<List<AdvisorRequestResponseDto>> GetIncomingRequestsAsync(Guid advisorUserId);
    Task<AdvisorRequestActionResultDto> CreateAsync(Guid studentUserId, AdvisorRequestCreateDto dto);
    Task<AdvisorRequestActionResultDto> CancelAsync(Guid studentUserId, Guid requestId);
    Task<AdvisorRequestActionResultDto> ApproveAsync(Guid advisorUserId, Guid requestId, string? advisorNote);
    Task<AdvisorRequestActionResultDto> RejectAsync(Guid advisorUserId, Guid requestId, string? advisorNote);
}
