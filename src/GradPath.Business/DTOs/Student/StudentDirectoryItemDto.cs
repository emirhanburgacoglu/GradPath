namespace GradPath.Business.DTOs.Student;

public class StudentDirectoryItemDto
{
    public Guid UserId { get; set; }
    public string FullName { get; set; } = string.Empty;
    public string DepartmentName { get; set; } = string.Empty;
    public string DepartmentCode { get; set; } = string.Empty;
    public string FacultyName { get; set; } = string.Empty;
    public decimal? CGPA { get; set; }
    public int? TotalECTS { get; set; }
    public bool IsHonorStudent { get; set; }
    public string? CvSummary { get; set; }
    public int SkillCount { get; set; }
    public int ProjectCount { get; set; }
    public int ExperienceCount { get; set; }
    public List<StudentSkillDto> Skills { get; set; } = new();
    public List<string> DomainSignals { get; set; } = new();
}
