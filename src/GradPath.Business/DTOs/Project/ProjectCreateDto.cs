using System.ComponentModel.DataAnnotations;

namespace GradPath.Business.DTOs.Project;

public class ProjectCreateDto
{
    [Required(ErrorMessage = "Proje başlığı zorunludur.")]
    [StringLength(100, ErrorMessage = "Başlık en fazla 100 karakter olabilir.")]
    public string Title { get; set; } = string.Empty;

    [Required(ErrorMessage = "Proje açıklaması zorunludur.")]
    public string Description { get; set; } = string.Empty;

    [Required(ErrorMessage = "Proje kategorisi zorunludur.")]
    public string Category { get; set; } = string.Empty;

    [Range(1, 3, ErrorMessage = "Zorluk seviyesi 1 (Kolay) ile 3 (Zor) arasında olmalıdır.")]
    public int DifficultyLevel { get; set; }

    [Range(1, 52, ErrorMessage = "Tahmini süre 1 ile 52 hafta arasında olmalıdır.")]
    public int EstimatedWeeks { get; set; }

    // İlişkili departman ve teknoloji ID'leri
    public List<int> DepartmentIds { get; set; } = new List<int>();
    public List<int> TechnologyIds { get; set; } = new List<int>();
}
