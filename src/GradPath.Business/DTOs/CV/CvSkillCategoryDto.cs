namespace GradPath.Business.DTOs.CV;

public class CvSkillCategoryDto
{
    public string CategoryName { get; set; } = string.Empty;
    public List<string> Skills { get; set; } = new();
}
