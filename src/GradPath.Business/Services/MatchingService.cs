using GradPath.Business.DTOs.Recommendation;
using GradPath.Data;
using Microsoft.EntityFrameworkCore;

namespace GradPath.Business.Services;

public class MatchingService : IMatchingService
{
    private readonly GradPathDbContext _context;
    private readonly IGroqApiService _groqApiService;
    public MatchingService(GradPathDbContext context, IGroqApiService groqApiService)
    {
        _context = context;
        _groqApiService = groqApiService;
    }

    public async Task<List<RecommendationResponseDto>> GetProjectRecommendationsAsync(Guid userId)
    {
        var recommendations = new List<RecommendationResponseDto>();

        // 1. Öğrencinin Profilini Çek (Sadece AGNO/CGPA için)
        var studentProfile = await _context.StudentProfiles
            .FirstOrDefaultAsync(sp => sp.UserId == userId);

        // 2. Öğrencinin Bildiği Teknolojileri 'StudentTechnologies' Tablosundan Çek!
        var studentTechs = await _context.StudentTechnologies
            .Include(st => st.Technology) // İsimlerini alabilmek için Technology tablosunu dahil et
            .Where(st => st.UserId == userId)
            .ToListAsync();

        if (studentProfile == null || !studentTechs.Any())
        {
            // Eğer profil yoksa veya hiç teknoloji eklenmemişse (LLM ile veya manuel), boş dön
            return recommendations;
        }

        // Öğrencinin bildiği teknolojilerin "isimlerini" küçük harfe çevirip bir listeye alalım
        var studentTechNames = studentTechs
            .Select(s => s.Technology.Name.ToLower())
            .ToList();

        // 3. Veritabanındaki Tüm Projeleri ve İstedikleri Teknolojileri Çekelim
        var allProjects = await _context.Projects
            .Include(p => p.ProjectTechnologies)
                .ThenInclude(pt => pt.Technology)
            .ToListAsync();

        // 4. Her Bir Proje İçin Eşleştirme (Matching) Yapalım
        foreach (var project in allProjects)
        {
            // Projenin İstediği Teknolojiler
            var projectTechs = project.ProjectTechnologies.Select(pt => pt.Technology.Name).ToList();
            
            // Eğer proje hiç teknoloji istemiyorsa atla
            if (!projectTechs.Any()) continue;

            // Öğrencinin BİLDİĞİ proje teknolojileri (Kesişim Kümesi)
            var matchedTechs = projectTechs
                .Where(pt => studentTechNames.Contains(pt.ToLower()))
                .ToList();

            // Öğrencinin BİLMEDİĞİ proje teknolojileri (Yol Haritası Kümesi)
            var missingTechs = projectTechs
                .Where(pt => !studentTechNames.Contains(pt.ToLower()))
                .ToList();

            // --- SKORLAMA (MATEMATİKSEL MOTOR) ---
            
            // A. Teknoloji Skoru (100 Üzerinden)
            decimal techScore = ((decimal)matchedTechs.Count / projectTechs.Count) * 100m;

            // B. GPA Bonusu (Max 20 Puan - Null kontrolü ile birlikte)
            decimal cgpa = studentProfile.CGPA ?? 0m; // Eğer CGPA henüz girilmemişse (null) sıfır kabul et
            decimal gpaBonus = (cgpa / 4.0m) * 20m;

            // Toplam Skor (İkisi birleşiyor, maksimum 100'e sabitliyoruz)
            decimal totalMatchScore = Math.Min(techScore + gpaBonus, 100m);

            // C. Zorluk Analizi (Difficulty Score)
            int difficultyScore = totalMatchScore >= 70 ? 1 : 
                                 (totalMatchScore >= 40 ? 2 : 3);

            // 5. Sonuçları DTO İçine Koy
            var dto = new RecommendationResponseDto
            {
                ProjectId = project.Id,
                ProjectTitle = project.Title,
                ProjectDescription = project.Description,
                Category = project.Category,
                MatchScore = Math.Round(totalMatchScore, 1),
                DifficultyScore = difficultyScore,
                MatchedTechnologies = matchedTechs,
                MissingTechnologies = missingTechs
            };
                        // Sadece belirli bir skorun üzerindeki projelere AI yorumu ekleyelim (Sistemi yormamak için)
            if (totalMatchScore >= 50)
            {
                var studentSummary = $"Yetenekler: {string.Join(", ", matchedTechs)}, Not Ortalaması: {cgpa}";
                var projectSummary = $"Başlık: {project.Title}, Açıklama: {project.Description}, Arananlar: {string.Join(", ", projectTechs)}";
                
                dto.AIExplanation = await _groqApiService.GetProjectExplanationAsync(studentSummary, projectSummary);
            }


            recommendations.Add(dto);
        }

        // 6. En Yüksek Skoru Alan Projeleri En Üste Gelecek Şekilde Sırala ve Döndür
        return recommendations.OrderByDescending(r => r.MatchScore).ToList();
    }
}
