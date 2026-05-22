namespace GradPath.Business.DTOs.Advisor;

public class AdvisorLookupDto
{
    public Guid UserId { get; set; }
    public string FullName { get; set; } = string.Empty;
    public string AcademicTitle { get; set; } = string.Empty;
    public string? ProfilePhotoUrl { get; set; }
    public string? DepartmentName { get; set; }
    public string? FacultyName { get; set; }
    public string ExpertiseAreas { get; set; } = string.Empty;
    public string? OfficeLocation { get; set; }
    public int MaxConcurrentStudents { get; set; }
    public int ApprovedStudentCount { get; set; }
    public bool IsAcceptingRequests { get; set; }
    public bool HasCapacity { get; set; }
}
