using System.Text.Json;
using GradPath.Business.DTOs.CV;
using GradPath.Business.DTOs.Recommendation;
using GradPath.Data;
using Microsoft.EntityFrameworkCore;

namespace GradPath.Business.Services;

public class MatchingService : IMatchingService
{
    private const int MaxAiExplanationCount = 3;
    private const decimal MinScoreForAiExplanation = 40m;

    private static readonly HashSet<string> GenericTechnologyNames = new(StringComparer.OrdinalIgnoreCase)
    {
        "git",
        "github",
        "html",
        "css",
        "sql",
        "rest api",
        "postgresql",
        "mysql",
        "mssql",
        "linux"
    };

    private readonly GradPathDbContext _context;
    private readonly IGroqApiService _groqApiService;

    public MatchingService(GradPathDbContext context, IGroqApiService groqApiService)
    {
        _context = context;
        _groqApiService = groqApiService;
    }

    public async Task<List<RecommendationResponseDto>> GetProjectRecommendationsAsync(Guid userId)
    {
        var recommendationCandidates = new List<RecommendationCandidate>();

        var studentProfile = await _context.StudentProfiles
            .FirstOrDefaultAsync(sp => sp.UserId == userId);
        if (studentProfile == null)
        {
            return new List<RecommendationResponseDto>();
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
            return new List<RecommendationResponseDto>();
        }

        var studentTechNames = studentTechs
            .Select(s => s.Technology.Name.ToLowerInvariant())
            .Concat(cvSignals.DeclaredSkills.Select(name => name.ToLowerInvariant()))
            .Concat(cvSignals.ObservedTechnologies.Select(name => name.ToLowerInvariant()))
            .Distinct()
            .ToHashSet();

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
                .Where(pt => pt.Technology != null && !string.IsNullOrWhiteSpace(pt.Technology.Name))
                .GroupBy(pt => NormalizeTechnologyName(pt.Technology.Name), StringComparer.OrdinalIgnoreCase)
                .Select(group =>
                {
                    var representative = group
                        .OrderByDescending(item => item.ImportanceLevel)
                        .ThenBy(item => item.TechnologyId)
                        .First();

                    return new ProjectTechnologyRequirement(
                        representative.Technology.Name.Trim(),
                        Math.Clamp(group.Max(item => item.ImportanceLevel), 1, 3));
                })
                .ToList();

            if (!projectTechs.Any())
            {
                continue;
            }

            var matchedTechs = projectTechs
                .Where(pt => studentTechNames.Contains(NormalizeTechnologyName(pt.Name)))
                .ToList();

            var missingTechs = projectTechs
                .Where(pt => !studentTechNames.Contains(NormalizeTechnologyName(pt.Name)))
                .ToList();

            if (!matchedTechs.Any())
            {
                continue;
            }

            var requiredTechCount = projectTechs.Count(technology => technology.ImportanceLevel >= 3);
            var matchedRequiredTechCount = matchedTechs.Count(technology => technology.ImportanceLevel >= 3);

            if (requiredTechCount > 0 && matchedRequiredTechCount == 0 && matchedTechs.Count < 2)
            {
                continue;
            }

            decimal totalTechWeight = projectTechs.Sum(GetRequirementWeight);
            decimal matchedTechWeight = matchedTechs.Sum(GetRequirementWeight);
            decimal techScore = totalTechWeight == 0
                ? 0m
                : (matchedTechWeight / totalTechWeight) * 100m;

            if (requiredTechCount > 0 && matchedRequiredTechCount == 0)
            {
                techScore *= 0.55m;
            }
            else if (requiredTechCount > 1 && matchedRequiredTechCount == 1)
            {
                techScore *= 0.8m;
            }

            decimal observedTechWeight = projectTechs
                .Where(projectTech => observedTechNames.Contains(NormalizeTechnologyName(projectTech.Name)))
                .Sum(GetRequirementWeight);

            decimal observedTechBonus = totalTechWeight == 0
                ? 0m
                : (observedTechWeight / totalTechWeight) * 8m;

            var projectDomain = DetectProjectDomain(project);
            decimal domainBonus = techScore >= 35m
                                  && !string.IsNullOrWhiteSpace(projectDomain)
                                  && studentDomainSignals.Contains(projectDomain)
                ? 5m
                : 0m;

            decimal cgpa = studentProfile.CGPA ?? 0m;
            decimal gpaBonus = techScore >= 25m
                ? (cgpa / 4.0m) * 7m
                : 0m;

            decimal totalMatchScore = Math.Min(techScore + observedTechBonus + domainBonus + gpaBonus, 100m);

            if (totalMatchScore < 30m)
            {
                continue;
            }

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
                MatchedTechnologies = matchedTechs.Select(technology => technology.Name).ToList(),
                MissingTechnologies = missingTechs.Select(technology => technology.Name).ToList()
            };

            var studentSummary =
                $"Yetenekler: {string.Join(", ", dto.MatchedTechnologies)}, Alanlar: {string.Join(", ", studentDomainSignals)}, Not Ortalamasi: {cgpa}";
            var projectSummary =
                $"Baslik: {project.Title}, Aciklama: {project.Description}, Arananlar: {string.Join(", ", projectTechs.Select(item => item.Name))}, Alan: {projectDomain}";

            recommendationCandidates.Add(new RecommendationCandidate(dto, studentSummary, projectSummary));
        }

        var rankedCandidates = recommendationCandidates
            .OrderByDescending(candidate => candidate.Dto.MatchScore)
            .ToList();

        foreach (var candidate in rankedCandidates
                     .Where(candidate => candidate.Dto.MatchScore >= MinScoreForAiExplanation)
                     .Take(MaxAiExplanationCount))
        {
            candidate.Dto.AIExplanation = await _groqApiService.GetProjectExplanationAsync(
                candidate.StudentSummary,
                candidate.ProjectSummary);
        }

        foreach (var candidate in rankedCandidates.Where(candidate => string.IsNullOrWhiteSpace(candidate.Dto.AIExplanation)))
        {
            candidate.Dto.AIExplanation = BuildFallbackExplanation(candidate.Dto);
        }

        return rankedCandidates
            .Select(candidate => candidate.Dto)
            .ToList();
    }

    private static string NormalizeTechnologyName(string name)
    {
        return name.Trim().ToLowerInvariant();
    }

    private static decimal GetRequirementWeight(ProjectTechnologyRequirement requirement)
    {
        var importanceWeight = requirement.ImportanceLevel switch
        {
            3 => 3.5m,
            2 => 2.0m,
            _ => 1.0m
        };

        var specificityMultiplier = GenericTechnologyNames.Contains(requirement.Name)
            ? 0.6m
            : 1.0m;

        return importanceWeight * specificityMultiplier;
    }

    private static string BuildFallbackExplanation(RecommendationResponseDto recommendation)
    {
        var matched = recommendation.MatchedTechnologies.Take(3).ToList();
        var missing = recommendation.MissingTechnologies.Take(2).ToList();

        if (matched.Count == 0)
        {
            return "Bu proje temel filtreleri gectigi icin listede yer aliyor, ancak teknik eslesme sinirli oldugundan once eksik yetkinlikleri guclendirmek daha dogru olur.";
        }

        var matchedText = string.Join(", ", matched);
        var scoreText = $"Bu projede ozellikle {matchedText} tarafinda guclu bir uyum goruluyor ve mevcut uyum skoru %{Math.Round(recommendation.MatchScore)} seviyesinde.";

        if (missing.Count == 0)
        {
            return $"{scoreText} Teknik beklentilerin buyuk kismi karsilandigi icin proje iyi bir aday olarak one cikiyor.";
        }

        var missingText = string.Join(", ", missing);
        return $"{scoreText} Projeye daha rahat uyum saglamak icin {missingText} alanlarini da gelistirmek faydali olur.";
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

    private sealed record RecommendationCandidate(
        RecommendationResponseDto Dto,
        string StudentSummary,
        string ProjectSummary);

    private sealed record ProjectTechnologyRequirement(string Name, int ImportanceLevel);
}
