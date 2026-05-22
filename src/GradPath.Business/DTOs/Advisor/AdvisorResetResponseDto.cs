namespace GradPath.Business.DTOs.Advisor;

public class AdvisorResetResponseDto
{
    public int DeletedAdvisorCount { get; set; }
    public int DeletedRequestCount { get; set; }
    public int DetachedProjectCount { get; set; }
    public List<string> DeletedEmails { get; set; } = new();
}
