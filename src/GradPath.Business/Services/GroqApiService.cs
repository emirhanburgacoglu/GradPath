using GradPath.Business.DTOs.AI;
using Microsoft.Extensions.Options;
using System.Text;
using System.Text.Json;

namespace GradPath.Business.Services;

public class GroqApiService : IGroqApiService
{
    private readonly HttpClient _httpClient;
    private readonly GroqApiSettings _settings;

    // Ayarlarımızı ve internete çıkış (HttpClient) aracımızı alıyoruz
    public GroqApiService(HttpClient httpClient, IOptions<GroqApiSettings> settings)
    {
        _httpClient = httpClient;
        _settings = settings.Value;
    }

    public async Task<string> GetProjectExplanationAsync(string studentData, string projectData)
    {
        try
        {
            // Yapay zekaya nasıl davranması gerektiğini söylüyoruz (Sistem Mesajı)
            var requestBody = new
            {
                model = _settings.ModelId,
                messages = new[]
                {
                    new { role = "system", content = "Sen profesyonel bir kariyer danışmanısın. Bir öğrencinin teknik becerilerine ve bir projenin gereksinimlerine bakarak, o projenin neden bu öğrenciye uygun olduğunu (veya olmadığını) 2-3 cümlelik, motive edici ve mantıklı bir dille açıkla. Cevabı sadece Türkçe ver." },
                    new { role = "user", content = $"Öğrenci Verileri: {studentData}\n\nProje Verileri: {projectData}" }
                },
                temperature = 0.7 // Cevabın hem yaratıcı hem de mantıklı olması için ideal denge
            };

            // İsteği Groq standartlarına uygun hazırlıyoruz
            var request = new HttpRequestMessage(HttpMethod.Post, _settings.BaseUrl + "chat/completions");
            request.Headers.Add("Authorization", $"Bearer {_settings.ApiKey}");
            request.Content = new StringContent(JsonSerializer.Serialize(requestBody), Encoding.UTF8, "application/json");

            // Groq'tan cevabı bekliyoruz
            var response = await _httpClient.SendAsync(request);
            response.EnsureSuccessStatusCode();

            var jsonResponse = await response.Content.ReadAsStringAsync();
            using var doc = JsonDocument.Parse(jsonResponse);

            // Gelen JSON paketinin içinden sadece yapay zekanın cümlesini cımbızla çekiyoruz
            return doc.RootElement
                .GetProperty("choices")[0]
                .GetProperty("message")
                .GetProperty("content")
                .GetString() ?? "Açıklama oluşturulamadı.";
        }
        catch (Exception ex)
        {
            return $"AI Analizi şu an yapılamıyor: {ex.Message}";
        }
    }
}
