namespace GradPath.Business.DTOs.Project;

public class ProjectResponseDto
{
    public int Id { get; set; }
    public string Title { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public string Category { get; set; } = string.Empty;
    public int DifficultyLevel { get; set; }
    public int EstimatedWeeks { get; set; }
    public Guid? AdvisorUserId { get; set; }
    public string? AdvisorFullName { get; set; }
    public string? AdvisorAcademicTitle { get; set; }
    public bool IsAdvisorOwned => AdvisorUserId.HasValue;
    public DateTime CreatedAt { get; set; }
    public DateTime? UpdatedAt { get; set; }
    public List<string> DepartmentNames { get; set; } = new();
    public List<string> TechnologyNames { get; set; } = new();
}
