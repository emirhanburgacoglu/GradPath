namespace GradPath.Business.DTOs.Advisor;

public class AdvisorProfileResponseDto
{
    public Guid UserId { get; set; }
    public string FullName { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;

    public int? DepartmentId { get; set; }
    public string? DepartmentName { get; set; }
    public string? DepartmentCode { get; set; }
    public string? FacultyName { get; set; }

    public string AcademicTitle { get; set; } = string.Empty;
    public string ExpertiseAreas { get; set; } = string.Empty;
    public string? OfficeLocation { get; set; }
    public string? ProfilePhotoUrl { get; set; }
    public string? ShortBio { get; set; }

    public int MaxConcurrentStudents { get; set; }
    public bool IsAcceptingRequests { get; set; }

    public string? SourceUrl { get; set; }
    public DateTime? LastSyncedAt { get; set; }
}