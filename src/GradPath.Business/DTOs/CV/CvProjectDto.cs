namespace GradPath.Business.DTOs.CV;

public class CvProjectDto
{
    public string Name { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public List<string> Technologies { get; set; } = new();
    public string Role { get; set; } = string.Empty;
    public string Domain { get; set; } = string.Empty;
    public bool IsTeamProject { get; set; }
}
