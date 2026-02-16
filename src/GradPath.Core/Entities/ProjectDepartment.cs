namespace GradPath.Core.Entities;

public class ProjectDepartment
{
    public int ProjectId { get; set; }
    public Project Project { get; set; } = null!;

    public int DepartmentId { get; set; }
    public Department Department { get; set; } = null!;

    // Raporunda belirttiğin: Bu proje bu bölüm için zorunlu/temel mi?
    public bool IsRequired { get; set; }
}