namespace GradPath.Data.Entities;

/// <summary>
/// Proje ile bölüm arasındaki çok-a-çok ilişkiyi temsil eder.
/// </summary>
public class ProjectDepartment
{
    public int ProjectId { get; set; }
    public int DepartmentId { get; set; }

    // Bu proje bu bölüm için zorunlu mu yoksa opsiyonel mi?
    public bool IsRequired { get; set; } = true;

    // Navigation Properties
    public Project Project { get; set; } = null!;
    public Department Department { get; set; } = null!;

    // Metadata
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}