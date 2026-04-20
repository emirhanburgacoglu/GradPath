using System.ComponentModel.DataAnnotations;

namespace GradPath.Business.DTOs.StudentProjectPost;

public class StudentProjectPostUpsertDto
{
    [Required(ErrorMessage = "Proje basligi zorunludur.")]
    [StringLength(120, ErrorMessage = "Baslik en fazla 120 karakter olabilir.")]
    public string Title { get; set; } = string.Empty;

    [Required(ErrorMessage = "Proje aciklamasi zorunludur.")]
    public string Description { get; set; } = string.Empty;

    [Required(ErrorMessage = "Kategori zorunludur.")]
    public string Category { get; set; } = string.Empty;

    [Required(ErrorMessage = "Proje tipi zorunludur.")]
    public string ProjectType { get; set; } = string.Empty; // Competition, Hackathon, Startup, CourseProject

    [Required(ErrorMessage = "Durum zorunludur.")]
    public string Status { get; set; } = "Open"; // Draft, Open, Closed, Filled

    [Range(1, 20, ErrorMessage = "Takim boyutu 1 ile 20 arasinda olmali.")]
    public int TeamSize { get; set; }

    [Range(0, 20, ErrorMessage = "Ihtiyac duyulan uye sayisi 0 ile 20 arasinda olmali.")]
    public int NeededMemberCount { get; set; }

    public DateTime? ApplicationDeadline { get; set; }

    public List<int> TechnologyIds { get; set; } = new();
    public List<int> DepartmentIds { get; set; } = new();
}
