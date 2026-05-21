using System.ComponentModel.DataAnnotations;

namespace GradPath.Business.DTOs.Project;

public class ProjectCreateDto
{
    [Required(ErrorMessage = "Proje basligi zorunludur.")]
    [StringLength(100, ErrorMessage = "Baslik en fazla 100 karakter olabilir.")]
    public string Title { get; set; } = string.Empty;

    [Required(ErrorMessage = "Proje aciklamasi zorunludur.")]
    public string Description { get; set; } = string.Empty;

    [Required(ErrorMessage = "Proje kategorisi zorunludur.")]
    public string Category { get; set; } = string.Empty;

    [Range(1, 3, ErrorMessage = "Zorluk seviyesi 1 ile 3 arasinda olmalidir.")]
    public int DifficultyLevel { get; set; }

    [Range(1, 52, ErrorMessage = "Tahmini sure 1 ile 52 hafta arasinda olmalidir.")]
    public int EstimatedWeeks { get; set; }

    public Guid? AdvisorUserId { get; set; }
    public List<int> DepartmentIds { get; set; } = new();
    public List<int> TechnologyIds { get; set; } = new();
}
