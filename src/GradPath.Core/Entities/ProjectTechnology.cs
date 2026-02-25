namespace GradPath.Core.Entities;

/// <summary>
/// Proje ile teknoloji arasındaki çok-a-çok ilişkiyi temsil eder.
/// </summary>
public class ProjectTechnology
{
    public int ProjectId { get; set; }
    public int TechnologyId { get; set; }

    // Bu teknoloji ne kadar önemli? (1=Opsiyonel, 2=Önerilen, 3=Zorunlu)
    public int ImportanceLevel { get; set; } = 2;

    // Navigation Properties
    public Project Project { get; set; } = null!;
    public Technology Technology { get; set; } = null!;

    // Metadata
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}