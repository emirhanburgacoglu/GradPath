using Microsoft.AspNetCore.Identity;

namespace GradPath.Data.Entities;

/// <summary>
/// Sisteme giris yapacak kullanicilari temsil eder.
/// </summary>
public class AppUser : IdentityUser<Guid>
{
    // Temel Bilgiler
    public string FullName { get; set; } = string.Empty;
    public int? DepartmentId { get; set; }
    public bool MustChangePassword { get; set; }
    public bool HasCompletedInitialPasswordSetup { get; set; }

    // Navigation Properties
    public Department? Department { get; set; }
    public StudentProfile? StudentProfile { get; set; }
    public AdvisorProfile? AdvisorProfile { get; set; }
    public ICollection<Project> OwnedProjects { get; set; } = new List<Project>();
    public ICollection<Recommendation> Recommendations { get; set; } = new List<Recommendation>();
    public ICollection<TeamMatch> InitiatedMatches { get; set; } = new List<TeamMatch>();
    public ICollection<TeamMatch> ReceivedMatches { get; set; } = new List<TeamMatch>();
    public ICollection<StudentProjectPostApplication> StudentProjectPostApplications { get; set; } = new List<StudentProjectPostApplication>();
    public ICollection<AdvisorRequest> StudentAdvisorRequests { get; set; } = new List<AdvisorRequest>();
    public ICollection<AdvisorRequest> AdvisorIncomingRequests { get; set; } = new List<AdvisorRequest>();

    // Metadata
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime? UpdatedAt { get; set; }
}
