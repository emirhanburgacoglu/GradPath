namespace GradPath.Business.DTOs.Student;

/// <summary>
/// Web sitesine öğrenci bilgilerini gönderirken kullandığımız zenginleştirilmiş paket.
/// Burada sadece öğrenci tablosundan değil, kullanıcı tablosundan gelen bilgiler de var.
/// </summary>
public class StudentProfileResponseDto
{
    // Profilin benzersiz kimliği (Veritabanındaki Guid tipi)
    public Guid Id { get; set; }

    // Kullanıcının tam adı (User tablosuyla birleştirerek getireceğiz)
    public string FullName { get; set; } = string.Empty;

    // Kullanıcının e-posta adresi
    public string Email { get; set; } = string.Empty;

    // Not ortalaması
    public decimal? CGPA { get; set; }

    // Toplam kazandığı kredi (AKTS)
    public int? TotalECTS { get; set; }

    // Sistem tarafından hesaplanan Onur Öğrencisi durumu (GPA > 3.0 gibi)
    public bool IsHonorStudent { get; set; }

    // Yüklediği CV dosyasının sistemdeki adı
    public string? CvFileName { get; set; }

    // Yüklediği Transkript dosyasının sistemdeki adı
    public string? TranscriptFileName { get; set; }

    // Yapay zeka tarafından hazırlanan CV özeti
    public string? CvSummary { get; set; }

    public string? CvAnalysisJson { get; set; }

}
