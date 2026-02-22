namespace GradPath.Data.Entities;

public class Department
{
    public int Id { get; set; }

    // Bölüm Bilgileri
    public string Name { get; set; } = string.Empty;          // "Bilgisayar Mühendisliği"
    public string Code { get; set; } = string.Empty;          // "CS", "EE", "ME"
    public string FacultyName { get; set; } = string.Empty;   // "Mühendislik Fakültesi"

    // Navigation Properties
    public ICollection<AppUser> Students { get; set; } = new List<AppUser>();
    public ICollection<ProjectDepartment> ProjectDepartments { get; set; } = new List<ProjectDepartment>();

    // Metadata
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}