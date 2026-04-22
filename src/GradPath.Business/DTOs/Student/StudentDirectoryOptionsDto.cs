namespace GradPath.Business.DTOs.Student;

public class StudentDirectoryOptionsDto
{
    public List<DepartmentOptionDto> Departments { get; set; } = new();
    public List<TechnologyOptionDto> Technologies { get; set; } = new();
}
