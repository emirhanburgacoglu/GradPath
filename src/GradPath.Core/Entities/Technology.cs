namespace GradPath.Core.Entities;

/// <summary>
/// Sistemdeki teknolojileri temsil eder (Python, React, PostgreSQL vs.)
/// </summary>
public class Technology
{
    public int Id { get; set; }

    // Teknoloji Bilgileri
    public string Name { get; set; } = string.Empty;           // "Python", "React", "PostgreSQL"
    public string Category { get; set; } = string.Empty;       // "Language", "Framework", "Database", "Tool"
    public string? Description { get; set; }                   // Opsiyonel açıklama

    // Navigation Properties
    public ICollection<ProjectTechnology> ProjectTechnologies { get; set; } = new List<ProjectTechnology>();

    // Metadata
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}