namespace GradPath.Data.Entities;

/// <summary>
/// AI tarafından öğrenciye yapılan proje önerilerini saklar.
/// </summary>
public class Recommendation
{
    public Guid Id { get; set; }
    public Guid UserId { get; set; }
    public int ProjectId { get; set; }

    // AI Çıktıları
    public string AIExplanation { get; set; } = string.Empty;  // "Bu projeyi neden öneriyorum..."
    public string TechnologyRoadmap { get; set; } = "{}";      // JSON: hangi teknolojileri öğrenmeli
    public string DifficultyAnalysis { get; set; } = "{}";     // JSON: zorluk analizi

    // Skorlar
    public decimal MatchScore { get; set; }                    // 0-100 arası uyum skoru
    public int DifficultyScore { get; set; }                   // 1=Uygun, 2=Zorlayıcı, 3=Zor

    // Durum
    public bool IsAccepted { get; set; }                       // Öğrenci bu öneriyi kabul etti mi?
    public bool IsFlagged { get; set; }                        // Admin tarafından "yanlış öneri" olarak işaretlendi mi?
    public string? FlagReason { get; set; }                    // Neden yanlış?

    // Navigation Properties
    public AppUser User { get; set; } = null!;
    public Project Project { get; set; } = null!;

    // Metadata
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}