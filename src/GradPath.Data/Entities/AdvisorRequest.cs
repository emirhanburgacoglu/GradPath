namespace GradPath.Data.Entities;

/// <summary>
/// Ogrencinin secili bir proje icin danisman hocaya gonderdigi talebi temsil eder.
/// </summary>
public class AdvisorRequest
{
    public Guid Id { get; set; }
    public Guid StudentUserId { get; set; }
    public Guid AdvisorUserId { get; set; }
    public int ProjectId { get; set; }

    public string Status { get; set; } = "Pending";
    public string? StudentNote { get; set; }
    public string? AdvisorNote { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime? UpdatedAt { get; set; }
    public DateTime? RespondedAt { get; set; }

    public AppUser StudentUser { get; set; } = null!;
    public AppUser AdvisorUser { get; set; } = null!;
    public Project Project { get; set; } = null!;
}
