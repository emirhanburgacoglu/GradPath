using Microsoft.AspNetCore.Identity;

namespace GradPath.Data.Entities;

/// <summary>
/// Sisteme giriş yapacak öğrencileri ve adminleri temsil eder.
/// IdentityUser'dan türeyerek hazır giriş-çıkış altyapısını kullanır.
/// </summary>
public class AppUser : IdentityUser<Guid>
{
    // Temel Bilgiler
    public string FullName { get; set; } = string.Empty;
    public int? DepartmentId { get; set; }
    public bool MustChangePassword { get; set; }
    public bool HasCompletedInitialPasswordSetup { get; set; }

    // Navigation Properties (İlişkiler)
    public Department? Department { get; set; }
    public StudentProfile? StudentProfile { get; set; }
    public AdvisorProfile? AdvisorProfile { get; set; }
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
