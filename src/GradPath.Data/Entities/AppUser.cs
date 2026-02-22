using Microsoft.AspNetCore.Identity;

namespace GradPath.Data.Entities;

public class AppUser : IdentityUser<Guid>
{
    // Temel Bilgiler
    public string FullName { get; set; } = string.Empty;
    public int? DepartmentId { get; set; }

    // Navigation Properties (İlişkiler)
    public Department? Department { get; set; }
    public StudentProfile? StudentProfile { get; set; }
    public ICollection<Recommendation> Recommendations { get; set; } = new List<Recommendation>();
    public ICollection<TeamMatch> InitiatedMatches { get; set; } = new List<TeamMatch>();
    public ICollection<TeamMatch> ReceivedMatches { get; set; } = new List<TeamMatch>();

    // Metadata
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime? UpdatedAt { get; set; }
}