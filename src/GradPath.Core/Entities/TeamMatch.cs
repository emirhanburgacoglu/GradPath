namespace GradPath.Core.Entities;

/// <summary>
/// Öğrenciler arasındaki proje takımı kurma isteklerini ve eşleşmeleri saklar.
/// </summary>
public class TeamMatch
{
    public int Id { get; set; }

    // Eşleşme istenen projenin ID'si.
    public int ProjectId { get; set; }
    public Project Project { get; set; } = null!;

    // İsteği başlatan öğrencinin ID'si.
    public Guid InitiatorId { get; set; }
    public AppUser Initiator { get; set; } = null!;

    // İsteğe katılan partner öğrencinin ID'si.
    public Guid? PartnerId { get; set; }
    public AppUser? Partner { get; set; }

    // Eşleşme durumu (Örn: Beklemede, Onaylandı, Reddedildi).
    public string Status { get; set; } = "Pending";

    // Metadata
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime? UpdatedAt { get; set; }
}