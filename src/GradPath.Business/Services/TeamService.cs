using GradPath.Business.DTOs.Team;
using GradPath.Data;
using Microsoft.EntityFrameworkCore;

namespace GradPath.Business.Services;

public class TeamService : ITeamService
{
    private readonly GradPathDbContext _context;
    private readonly IGroqApiService _groqApiService;

    // Dependency Injection: Veritabanına ve Yapay Zekaya erişim sağlıyoruz
    public TeamService(GradPathDbContext context, IGroqApiService groqApiService)
    {
        _context = context;
        _groqApiService = groqApiService;
    }

    public async Task<List<TeamRecommendationDto>> GetTeammateSuggestionsAsync(Guid userId, int projectId)
    {
        // ADIM 1: Seçilen projenin gereksinimlerini (teknolojilerini) öğrenelim
        var project = await _context.Projects
            .Include(p => p.ProjectTechnologies)
            .ThenInclude(pt => pt.Technology)
            .FirstOrDefaultAsync(p => p.Id == projectId);

        if (project == null) return new List<TeamRecommendationDto>();

        // ADIM 2: Sizin (Arayan Kişi) bildiğiniz teknolojileri alalım
        var myTechIds = await _context.StudentTechnologies
            .Where(st => st.UserId == userId)
            .Select(st => st.TechnologyId)
            .ToListAsync();

        // ADIM 3: "EKSİK ANALİZİ" (Sizin bilmediğiniz ama projenin istediği teknoloji ID'leri)
        var missingTechIdsInProject = project.ProjectTechnologies
            .Where(pt => !myTechIds.Contains(pt.TechnologyId))
            .Select(pt => pt.TechnologyId)
            .ToList();

        // ADIM 4: Veritabanındaki DİĞER öğrencileri ve yeteneklerini çekelim
        var allStudents = await _context.Users
            .Where(u => u.Id != userId) // Kendimi listede görmeyeyim
            .Select(u => new 
            {
                u.Id,
                u.UserName, // Şimdilik isim olarak kullanıcı adını alıyoruz
                Profile = _context.StudentProfiles.FirstOrDefault(p => p.UserId == u.Id),
                Techs = _context.StudentTechnologies
                    .Include(st => st.Technology)
                    .Where(st => st.UserId == u.Id)
                    .ToList()
            })
            .ToListAsync();

        var recommendations = new List<TeamRecommendationDto>();

        foreach (var student in allStudents)
        {
            // Adayın bildiği yetenekler sizin eksiğinizle ne kadar örtüşüyor?
            var matchingMissingTechs = student.Techs
                .Where(st => missingTechIdsInProject.Contains(st.TechnologyId))
                .Select(st => st.Technology.Name)
                .ToList();

            // Eğer aday sizin eksiğiniz olan teknolojilerden hiçbirini bilmiyorsa, onu önermeyelim
            if (!matchingMissingTechs.Any()) continue;

            var dto = new TeamRecommendationDto
            {
                UserId = student.Id,
                FullName = student.UserName ?? "Öğrenci",
                GPA = student.Profile?.CGPA ?? 0m,
                KnownTechnologies = matchingMissingTechs,
                // Uyumluluk Skoru: (Kapatılan Eksik Sayısı / Toplam Eksik Sayısı) * 100
                CompatibilityScore = Math.Round(((double)matchingMissingTechs.Count / missingTechIdsInProject.Count) * 100, 1)
            };

            // ADIM 5: YAPAY ZEKA YORUMU (Skoru %40'ın üzerindeyse AI analiz yapsın)
            if (dto.CompatibilityScore >= 40)
            {
                var promptStudentInfo = $"Ben (Kullanıcı) şu projeyi yapmak istiyorum: {project.Title}. Bu projenin istediği ama bende eksik olan yetenekler: {string.Join(", ", matchingMissingTechs.Take(3))}.";
                var promptCandidateInfo = $"Bulunan Aday: {dto.FullName}. Adayın bu konudaki uzmanlığı ve GPA'sı: {dto.GPA}.";
                
                // Daha önce yazdığımız Groq servisini ekip analizi için kullanıyoruz
                dto.AIReasoning = await _groqApiService.GetProjectExplanationAsync(promptStudentInfo, promptCandidateInfo);
            }

            recommendations.Add(dto);
        }

        // Skorlara göre büyükten küçüğe sıralayıp dönüyoruz
        return recommendations.OrderByDescending(r => r.CompatibilityScore).ToList();
    }
}
