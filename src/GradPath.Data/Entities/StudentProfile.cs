namespace GradPath.Data.Entities;

public class StudentProfile
{
    public Guid Id { get; set; }
    public Guid UserId { get; set; }

    // Parse Edilmiş Veriler (JSON olarak saklanacak)
    public string ParsedCvData { get; set; } = "{}";           // CV'den çıkan JSON
    public string ParsedTranscriptData { get; set; } = "{}";   // Transkriptten çıkan JSON

    // Özet Bilgiler (Hızlı erişim için ayrıca tutuyoruz)
    public decimal? CGPA { get; set; }                         // 3.26 gibi
    public int? TotalECTS { get; set; }                        // 189 AKTS
    public bool IsHonorStudent { get; set; }                   // Onur öğrencisi mi?

    // Dosya Bilgileri
    public string? CvFileName { get; set; }
    public string? TranscriptFileName { get; set; }
    public DateTime? CvUploadedAt { get; set; }
    public DateTime? TranscriptUploadedAt { get; set; }

    // Navigation Properties
    public AppUser User { get; set; } = null!;

    // Metadata
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime? UpdatedAt { get; set; }
}