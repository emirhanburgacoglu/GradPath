namespace GradPath.Business.DTOs.CV;

public class CvExperienceDto
{
    public string CompanyName { get; set; } = string.Empty;
    public string Position { get; set; } = string.Empty;
    public string StartDateText { get; set; } = string.Empty;
    public string EndDateText { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public List<string> Technologies { get; set; } = new();
}
