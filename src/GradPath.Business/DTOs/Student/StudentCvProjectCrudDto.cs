namespace GradPath.Business.DTOs.Student;

public class StudentCvProjectCrudDto
{
    public Guid? Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public string Role { get; set; } = string.Empty;
    public string Domain { get; set; } = string.Empty;
    public bool IsTeamProject { get; set; }
    public List<int> TechnologyIds { get; set; } = new();
    public List<string> TechnologyNames { get; set; } = new();
}
