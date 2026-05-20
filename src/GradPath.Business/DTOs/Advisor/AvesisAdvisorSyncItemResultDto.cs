namespace GradPath.Business.DTOs.Advisor;

public class AvesisAdvisorSyncItemResultDto
{
    public string SourceUrl { get; set; } = string.Empty;
    public bool Succeeded { get; set; }
    public string Message { get; set; } = string.Empty;
    public string? FullName { get; set; }
    public string? Email { get; set; }
    public bool CreatedUser { get; set; }
    public bool UpdatedProfile { get; set; }
}
