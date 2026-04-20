using GradPath.Business.DTOs.Student;

namespace GradPath.Business.DTOs.StudentProjectPost;

public class StudentProjectPostFormOptionsDto
{
    public List<TechnologyOptionDto> Technologies { get; set; } = new();
    public List<DepartmentOptionDto> Departments { get; set; } = new();
}
