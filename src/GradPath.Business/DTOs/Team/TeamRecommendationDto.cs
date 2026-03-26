namespace GradPath.Business.DTOs.Team;

public class TeamRecommendationDto
{
    public Guid UserId { get; set; }
    public string FullName { get; set; } = string.Empty;
    public decimal GPA { get; set; }
    
    // Öğrencinin bildiği teknolojiler
    public List<string> KnownTechnologies { get; set; } = new();
    
    // Sizinle olan teknik uyum skoru (0-100)
    public double CompatibilityScore { get; set; }
    
    // Yapay zekanın "Neden bu kişiyle ekip olmalısın?" açıklaması
    public string AIReasoning { get; set; } = string.Empty;
}
