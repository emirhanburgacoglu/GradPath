namespace GradPath.Business.DTOs.AdvisorRequest;

public class AdvisorRequestResponseDto
{
    public Guid Id { get; set; }
    public int ProjectId { get; set; }
    public string ProjectTitle { get; set; } = string.Empty;
    public string ProjectCategory { get; set; } = string.Empty;

    public Guid StudentUserId { get; set; }
    public string StudentFullName { get; set; } = string.Empty;
    public string? StudentDepartmentName { get; set; }

    public Guid AdvisorUserId { get; set; }
    public string AdvisorFullName { get; set; } = string.Empty;
    public string AdvisorAcademicTitle { get; set; } = string.Empty;
    public string? AdvisorDepartmentName { get; set; }

    public string Status { get; set; } = string.Empty;
    public string? StudentNote { get; set; }
    public string? AdvisorNote { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime? UpdatedAt { get; set; }
    public DateTime? RespondedAt { get; set; }
}
