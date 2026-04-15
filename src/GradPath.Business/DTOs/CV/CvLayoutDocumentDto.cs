namespace GradPath.Business.DTOs.CV;

public class CvLayoutDocumentDto
{
    public string RawText { get; set; } = string.Empty;
    public List<CvLayoutBlockDto> Blocks { get; set; } = new();
}
