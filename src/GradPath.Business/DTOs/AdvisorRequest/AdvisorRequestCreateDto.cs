namespace GradPath.Business.DTOs.AdvisorRequest;

public class AdvisorRequestCreateDto
{
    public int ProjectId { get; set; }
    public Guid AdvisorUserId { get; set; }
    public string? StudentNote { get; set; }
}
