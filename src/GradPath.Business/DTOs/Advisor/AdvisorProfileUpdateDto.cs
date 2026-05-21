using System.ComponentModel.DataAnnotations;

namespace GradPath.Business.DTOs.Advisor;

public class AdvisorProfileUpdateDto
{
    [Required(ErrorMessage = "Ad soyad zorunludur.")]
    [StringLength(120, ErrorMessage = "Ad soyad en fazla 120 karakter olabilir.")]
    public string FullName { get; set; } = string.Empty;

    [StringLength(80, ErrorMessage = "Unvan en fazla 80 karakter olabilir.")]
    public string AcademicTitle { get; set; } = string.Empty;

    [StringLength(500, ErrorMessage = "Uzmanlik alanlari en fazla 500 karakter olabilir.")]
    public string ExpertiseAreas { get; set; } = string.Empty;

    [StringLength(160, ErrorMessage = "Ofis bilgisi en fazla 160 karakter olabilir.")]
    public string? OfficeLocation { get; set; }

    [StringLength(500, ErrorMessage = "Profil fotografi adresi en fazla 500 karakter olabilir.")]
    public string? ProfilePhotoUrl { get; set; }

    [StringLength(1000, ErrorMessage = "Kisa biyografi en fazla 1000 karakter olabilir.")]
    public string? ShortBio { get; set; }

    [Range(1, 20, ErrorMessage = "Kontenjan 1 ile 20 arasinda olmalidir.")]
    public int MaxConcurrentStudents { get; set; }

    public bool IsAcceptingRequests { get; set; }
}
