namespace GradPath.Business.DTOs.Advisor;

public class AvesisAdvisorSyncResponseDto
{
    public int Total { get; set; }
    public int SucceededCount { get; set; }
    public int FailedCount { get; set; }
    public List<AvesisAdvisorSyncItemResultDto> Items { get; set; } = new();
}
