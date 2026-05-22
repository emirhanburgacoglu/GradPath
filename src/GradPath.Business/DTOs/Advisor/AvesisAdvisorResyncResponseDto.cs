namespace GradPath.Business.DTOs.Advisor;

public class AvesisAdvisorResyncResponseDto
{
    public AdvisorResetResponseDto Reset { get; set; } = new();
    public AvesisAdvisorSyncResponseDto Sync { get; set; } = new();
}
