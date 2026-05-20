using GradPath.Business.DTOs.Advisor;

namespace GradPath.Business.Services;

public interface IAvesisAdvisorSyncService
{
    Task<AvesisAdvisorSyncResponseDto> SyncComputerEngineeringAsync();
}
