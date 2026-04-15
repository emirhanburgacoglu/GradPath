namespace GradPath.Business.Services;

public interface IGroqApiService
{
    /// <summary>
    /// Öğrenci verisi ve proje verisini alıp Groq LLM (Llama 3.3) aracılığıyla 
    /// bir 'Mantıksal Uygunluk Açıklaması' üretir.
    /// </summary>
    Task<string> GetProjectExplanationAsync(string studentData, string projectData);
    
    /// <summary>
    /// Verilen metinden JSON formatında yapılandırılmış veri çıkarır.
    /// </summary>
    Task<string> GetJsonExtractionAsync(string systemPrompt, string userPrompt);
}
