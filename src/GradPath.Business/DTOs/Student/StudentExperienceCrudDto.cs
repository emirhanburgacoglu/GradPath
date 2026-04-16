namespace GradPath.Business.DTOs.Student;

public class StudentExperienceCrudDto
{
    public Guid? Id { get; set; }
    public string CompanyName { get; set; } = string.Empty;
    public string Position { get; set; } = string.Empty;
    public string StartDateText { get; set; } = string.Empty;
    public string EndDateText { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public List<int> TechnologyIds { get; set; } = new();
    public List<string> TechnologyNames { get; set; } = new();
}
