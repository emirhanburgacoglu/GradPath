namespace GradPath.Business.DTOs.CV;

public class CvLayoutBlockDto
{
    public int PageNumber { get; set; }
    public int ColumnIndex { get; set; }
    public double X { get; set; }
    public double Y { get; set; }
    public double Width { get; set; }
    public double Height { get; set; }
    public string Text { get; set; } = string.Empty;
}
