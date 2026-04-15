namespace GradPath.Business.DTOs.CV;

public class CvAnalysisResultDto
{
    public string RawSummary { get; set; } = string.Empty;
    public string NormalizedSummary { get; set; } = string.Empty;
    public List<CvSkillCategoryDto> SkillsByCategory { get; set; } = new();
    public List<CvProjectDto> Projects { get; set; } = new();
    public List<CvExperienceDto> Experiences { get; set; } = new();
    public List<CvEducationDto> Education { get; set; } = new();
    public List<string> DomainSignals { get; set; } = new();
}
