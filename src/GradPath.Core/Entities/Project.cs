namespace GradPath.Core.Entities;

/// <summary>
/// Sistemdeki proje şablonlarını temsil eden ana sınıf.
/// </summary>
public class Project
{
    public int Id { get; set; }

    // Proje Bilgileri
    public string Title { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public string Category { get; set; } = string.Empty;      // "AI/ML", "Web", "IoT", "Embedded"
    public int DifficultyLevel { get; set; }                   // 1=Kolay, 2=Orta, 3=Zor
    public int EstimatedWeeks { get; set; }                    // Tahmini tamamlanma süresi

    // Navigation Properties
    public ICollection<ProjectDepartment> ProjectDepartments { get; set; } = new List<ProjectDepartment>();
    public ICollection<ProjectTechnology> ProjectTechnologies { get; set; } = new List<ProjectTechnology>();
    public ICollection<Recommendation> Recommendations { get; set; } = new List<Recommendation>();
    public ICollection<TeamMatch> TeamMatches { get; set; } = new List<TeamMatch>();

    // Metadata
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime? UpdatedAt { get; set; }
}