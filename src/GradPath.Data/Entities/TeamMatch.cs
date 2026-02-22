namespace GradPath.Data.Entities;

public class TeamMatch
{
    public Guid Id { get; set; }
    public int ProjectId { get; set; }
    public Guid InitiatorId { get; set; }                      // İsteği gönderen
    public Guid? PartnerId { get; set; }                       // Eşleşen kişi (henüz yoksa null)

    // Durum
    public string Status { get; set; } = "Pending";            // "Pending", "Matched", "Rejected"
    public string? Message { get; set; }                       // İsteğe eklenen mesaj

    // Navigation Properties
    public Project Project { get; set; } = null!;
    public AppUser Initiator { get; set; } = null!;
    public AppUser? Partner { get; set; }

    // Metadata
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime? MatchedAt { get; set; }
}