namespace GradPath.Data.Entities;

/// <summary>
/// Sistemdeki proje sablonlarini temsil eden ana sinif.
/// </summary>
public class Project
{
    public int Id { get; set; }

    // Proje Bilgileri
    public string Title { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public string Category { get; set; } = string.Empty;
    public int DifficultyLevel { get; set; }
    public int EstimatedWeeks { get; set; }
    public Guid? AdvisorUserId { get; set; }

    // Navigation Properties
    public AppUser? AdvisorUser { get; set; }
    public ICollection<ProjectDepartment> ProjectDepartments { get; set; } = new List<ProjectDepartment>();
    public ICollection<ProjectTechnology> ProjectTechnologies { get; set; } = new List<ProjectTechnology>();
    public ICollection<Recommendation> Recommendations { get; set; } = new List<Recommendation>();
    public ICollection<AdvisorRequest> AdvisorRequests { get; set; } = new List<AdvisorRequest>();
    public ICollection<TeamMatch> TeamMatches { get; set; } = new List<TeamMatch>();

    // Metadata
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime? UpdatedAt { get; set; }
}
