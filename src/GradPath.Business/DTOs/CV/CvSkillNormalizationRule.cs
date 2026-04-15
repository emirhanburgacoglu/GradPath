namespace GradPath.Business.DTOs.CV;

public class CvSkillNormalizationRule
{
    public string CanonicalName { get; set; } = string.Empty;
    public string CategoryName { get; set; } = CvSkillCategories.Other;
    public List<string> Aliases { get; set; } = new();
}
