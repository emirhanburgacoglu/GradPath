namespace GradPath.Business.DTOs.CV;

public class CvSectionBlockDto
{
    public CvSectionType SectionType { get; set; } = CvSectionType.Unknown;
    public string Title { get; set; } = string.Empty;
    public List<string> Lines { get; set; } = new();
}
