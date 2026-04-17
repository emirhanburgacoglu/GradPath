namespace GradPath.Data.Entities;

public class StudentProjectPostDepartment
{
    public Guid StudentProjectPostId { get; set; }
    public int DepartmentId { get; set; }

    public StudentProjectPost StudentProjectPost { get; set; } = null!;
    public Department Department { get; set; } = null!;
}
