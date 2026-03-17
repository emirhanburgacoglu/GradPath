namespace GradPath.Business.DTOs.Recommendation;

public class RecommendationResponseDto
{
    public int ProjectId { get; set; }
    public string ProjectTitle { get; set; } = string.Empty;
    public string ProjectDescription { get; set; } = string.Empty;
    public string Category { get; set; } = string.Empty;
    
    // Algoritmanın hesaplayacağı skor
    public decimal MatchScore { get; set; } 
    
    public int DifficultyScore { get; set; } // 1=Kolay/Uygun, 2=Zorlayıcı, 3=Zor
    
    // Projenin gerektirdiği ve Öğrencinin BİLDİĞİ teknolojiler
    public List<string> MatchedTechnologies { get; set; } = new();
    
    // Projenin gerektirdiği ama öğrencinin BİLMEDİĞİ teknolojiler
    public List<string> MissingTechnologies { get; set; } = new();

    // C# tarafında yapay zekanın "Neden bu projeyi seçmelisin?" açıklamasını buraya koyacağız
    public string AIExplanation { get; set; } = string.Empty;
}

