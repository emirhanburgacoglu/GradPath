namespace GradPath.Business.DTOs.Student;

public class StudentEducationCrudDto
{
    public Guid? Id { get; set; }
    public string SchoolName { get; set; } = string.Empty;
    public string Department { get; set; } = string.Empty;
    public string Degree { get; set; } = string.Empty;
    public string StartDateText { get; set; } = string.Empty;
    public string EndDateText { get; set; } = string.Empty;
}
