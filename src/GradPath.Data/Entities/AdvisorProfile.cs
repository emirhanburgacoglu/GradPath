namespace GradPath.Data.Entities;

/// <summary>
/// Danisman hocalara ozel profil alanlarini tutar.
/// Ortak kullanici bilgileri AppUser uzerinde kalir.
/// </summary>
public class AdvisorProfile
{
    public Guid UserId { get; set; }

    public string AcademicTitle { get; set; } = string.Empty;
    public string ExpertiseAreas { get; set; } = string.Empty;
    public string? OfficeLocation { get; set; }
    public string? ProfilePhotoUrl { get; set; }
    public string? ShortBio { get; set; }
    public int MaxConcurrentStudents { get; set; } = 5;
    public bool IsAcceptingRequests { get; set; } = true;
    public string? SourceUrl { get; set; }
    public DateTime? LastSyncedAt { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime? UpdatedAt { get; set; }

    public AppUser User { get; set; } = null!;
}
