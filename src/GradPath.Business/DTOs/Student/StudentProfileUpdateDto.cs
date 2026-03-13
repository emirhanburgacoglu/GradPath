using System.ComponentModel.DataAnnotations;

namespace GradPath.Business.DTOs.Student;

/// <summary>
/// Müşteri (Öğrenci) profilini güncellemek istediğinde bize göndereceği paket.
/// Bu paketin içinde sadece öğrencinin kendi değiştirebileceği bilgiler var.
/// </summary>
public class StudentProfileUpdateDto
{
    // CGPA: Cumulative Grade Point Average (Genel Not Ortalaması)
    // 0.0 ile 4.0 arasında olmalı.
    [Range(0.0, 4.0, ErrorMessage = "GNO (GPA) 0 ile 4 arasında olmalıdır.")]
    public decimal? CGPA { get; set; }

    // TotalECTS: Toplam AKTS (Avrupa Kredi Transfer Sistemi)
    // Türkiye'de mezuniyet için genelde 240 AKTS istenir, burada üst sınırı 300 yaptık.
    [Range(0, 300, ErrorMessage = "Toplam AKTS 0 ile 300 arasında olmalıdır.")]
    public int? TotalECTS { get; set; }
}
