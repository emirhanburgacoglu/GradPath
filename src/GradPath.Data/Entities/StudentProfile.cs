namespace GradPath.Data.Entities;

/// <summary>
/// Öğrencilerin CV ve profil verilerini saklar.
/// </summary>
public class StudentProfile
{
    public Guid Id { get; set; }
    public Guid UserId { get; set; }

    // Parse Edilmiş Veriler (JSON olarak saklanacak)
    public string ParsedCvData { get; set; } = "{}";           // CV'den çıkan JSON

    // Özet Bilgiler (Hızlı erişim için ayrıca tutuyoruz)
    public decimal? CGPA { get; set; }                         // 3.26 gibi
    public int? TotalECTS { get; set; }                        // 189 AKTS
    public bool IsHonorStudent { get; set; }                   // Onur öğrencisi mi?

    // Dosya Bilgileri
    public string? CvFileName { get; set; }
    public DateTime? CvUploadedAt { get; set; }
    public string? ProfilePhotoUrl { get; set; }

    // Navigation Properties
    public AppUser User { get; set; } = null!;

    // Metadata
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime? UpdatedAt { get; set; }
}

