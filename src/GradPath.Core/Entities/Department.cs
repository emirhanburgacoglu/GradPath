namespace GradPath.Core.Entities;

public class Department : BaseEntity
{
    public string Name { get; set; } = null!; // Örn: Bilgisayar Mühendisliği 
    public string Code { get; set; } = null!; // Örn: CS, EE 
    public string FacultyName { get; set; } = "Mühendislik Fakültesi";

    // İlişki: Bir bölümün birçok proje eşleşmesi olabilir 
    public ICollection<ProjectDepartment> ProjectDepartments { get; set; } = new List<ProjectDepartment>();
}