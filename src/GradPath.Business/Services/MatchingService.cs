using System.Text.Json;
using GradPath.Business.DTOs.CV;
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

        var studentProfile = await _context.StudentProfiles
            .FirstOrDefaultAsync(sp => sp.UserId == userId);
        if (studentProfile == null)
        {
            return recommendations;
        }

        var cvSignals = ExtractCvSignals(studentProfile.ParsedCvData);

        var studentTechs = await _context.StudentTechnologies
            .Include(st => st.Technology)
            .Where(st => st.UserId == userId)
            .ToListAsync();

        if (!studentTechs.Any()
            && !cvSignals.DeclaredSkills.Any()
            && !cvSignals.ObservedTechnologies.Any())
        {
            return recommendations;
        }

        var studentTechNames = studentTechs
            .Select(s => s.Technology.Name.ToLowerInvariant())
            .Concat(cvSignals.DeclaredSkills.Select(name => name.ToLowerInvariant()))
            .Concat(cvSignals.ObservedTechnologies.Select(name => name.ToLowerInvariant()))
            .Distinct()
            .ToList();

        var observedTechNames = cvSignals.ObservedTechnologies
            .Select(name => name.ToLowerInvariant())
            .ToHashSet();

        var studentDomainSignals = cvSignals.DomainSignals
            .ToHashSet(StringComparer.OrdinalIgnoreCase);

        var allProjects = await _context.Projects
            .Include(p => p.ProjectTechnologies)
                .ThenInclude(pt => pt.Technology)
            .ToListAsync();

        foreach (var project in allProjects)
        {
            var projectTechs = project.ProjectTechnologies
                .Select(pt => pt.Technology.Name)
                .ToList();

            if (!projectTechs.Any())
            {
                continue;
            }

            var matchedTechs = projectTechs
                .Where(pt => studentTechNames.Contains(pt.ToLowerInvariant()))
                .ToList();

            var missingTechs = projectTechs
                .Where(pt => !studentTechNames.Contains(pt.ToLowerInvariant()))
                .ToList();

            decimal techScore = ((decimal)matchedTechs.Count / projectTechs.Count) * 100m;

            var observedTechOverlapCount = projectTechs.Count(projectTech =>
                observedTechNames.Contains(projectTech.ToLowerInvariant()));

            decimal observedTechBonus = projectTechs.Count == 0
                ? 0m
                : ((decimal)observedTechOverlapCount / projectTechs.Count) * 15m;

            var projectDomain = DetectProjectDomain(project);
            decimal domainBonus = !string.IsNullOrWhiteSpace(projectDomain)
                                  && studentDomainSignals.Contains(projectDomain)
                ? 10m
                : 0m;

            decimal cgpa = studentProfile.CGPA ?? 0m;
            decimal gpaBonus = (cgpa / 4.0m) * 20m;

            decimal totalMatchScore = Math.Min(techScore + observedTechBonus + domainBonus + gpaBonus, 100m);

            int difficultyScore = totalMatchScore >= 70 ? 1 :
                                  (totalMatchScore >= 40 ? 2 : 3);

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

            if (totalMatchScore >= 50)
            {
                var studentSummary =
                    $"Yetenekler: {string.Join(", ", matchedTechs)}, Alanlar: {string.Join(", ", studentDomainSignals)}, Not Ortalamasi: {cgpa}";
                var projectSummary =
                    $"Baslik: {project.Title}, Aciklama: {project.Description}, Arananlar: {string.Join(", ", projectTechs)}, Alan: {projectDomain}";

                dto.AIExplanation = await _groqApiService.GetProjectExplanationAsync(studentSummary, projectSummary);
            }

            recommendations.Add(dto);
        }

        return recommendations.OrderByDescending(r => r.MatchScore).ToList();
    }

    private static string DetectProjectDomain(GradPath.Data.Entities.Project project)
    {
        var combined = $"{project.Title} {project.Description} {project.Category}".ToLowerInvariant();

        if (combined.Contains("ai") || combined.Contains("machine learning") || combined.Contains("deep learning") || combined.Contains("nlp"))
            return "AI";

        if (combined.Contains("backend") || combined.Contains(".net") || combined.Contains("api"))
            return "Backend";

        if (combined.Contains("web") || combined.Contains("frontend") || combined.Contains("website"))
            return "Web";

        if (combined.Contains("mobile") || combined.Contains("flutter"))
            return "Mobile";

        if (combined.Contains("embedded") || combined.Contains("iot") || combined.Contains("raspberry"))
            return "Embedded";

        if (combined.Contains("data") || combined.Contains("database"))
            return "Data";

        return string.Empty;
    }

    private static CvMatchingSignals ExtractCvSignals(string? parsedCvData)
    {
        if (string.IsNullOrWhiteSpace(parsedCvData))
        {
            return new CvMatchingSignals();
        }

        try
        {
            var analysis = JsonSerializer.Deserialize<CvAnalysisResultDto>(parsedCvData);
            if (analysis == null)
            {
                return new CvMatchingSignals();
            }

            var declaredSkills = analysis.SkillsByCategory
                .SelectMany(category => category.Skills)
                .Where(name => !string.IsNullOrWhiteSpace(name))
                .Distinct(StringComparer.OrdinalIgnoreCase)
                .ToList();

            var observedTechnologies = analysis.Projects
                .SelectMany(project => project.Technologies)
                .Concat(analysis.Experiences.SelectMany(experience => experience.Technologies))
                .Where(name => !string.IsNullOrWhiteSpace(name))
                .Distinct(StringComparer.OrdinalIgnoreCase)
                .ToList();

            return new CvMatchingSignals
            {
                DeclaredSkills = declaredSkills,
                DomainSignals = analysis.DomainSignals
                    .Where(signal => !string.IsNullOrWhiteSpace(signal))
                    .Distinct(StringComparer.OrdinalIgnoreCase)
                    .ToList(),
                ObservedTechnologies = observedTechnologies
            };
        }
        catch
        {
            return new CvMatchingSignals();
        }
    }

    private sealed class CvMatchingSignals
    {
        public List<string> DeclaredSkills { get; set; } = new();
        public List<string> DomainSignals { get; set; } = new();
        public List<string> ObservedTechnologies { get; set; } = new();
    }
}
