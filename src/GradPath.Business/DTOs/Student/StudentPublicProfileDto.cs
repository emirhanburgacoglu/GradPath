namespace GradPath.Business.DTOs.Student;

public class StudentPublicProfileDto
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
    public List<StudentSkillDto> Skills { get; set; } = new();
    public List<StudentEducationCrudDto> Educations { get; set; } = new();
    public List<StudentExperienceCrudDto> Experiences { get; set; } = new();
    public List<StudentCvProjectCrudDto> CvProjects { get; set; } = new();
    public List<StudentDomainSignalCrudDto> DomainSignals { get; set; } = new();
}
