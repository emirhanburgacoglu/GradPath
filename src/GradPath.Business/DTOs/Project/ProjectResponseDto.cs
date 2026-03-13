namespace GradPath.Business.DTOs.Project;

public class ProjectResponseDto
{
    public int Id { get; set; }
    public string Title { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public string Category { get; set; } = string.Empty;
    public int DifficultyLevel { get; set; }
    public int EstimatedWeeks { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime? UpdatedAt { get; set; }

    // İlişkili isimleri dönmek web tarafı için daha kullanışlıdır
    public List<string> DepartmentNames { get; set; } = new List<string>();
    public List<string> TechnologyNames { get; set; } = new List<string>();
}
