using GradPath.Business.DTOs.CV;

namespace GradPath.Business.Services;

public static class CvSummaryBuilder
{
    public static string Build(CvAnalysisResultDto analysis)
    {
        var topDomains = analysis.DomainSignals.Take(3).ToList();
        var topSkills = analysis.SkillsByCategory
            .Where(category => category.Skills.Any())
            .SelectMany(category => category.Skills.Take(2))
            .Take(5)
            .ToList();

        var parts = new List<string>();

        if (topDomains.Any())
        {
            parts.Add($"Odak alanlari: {string.Join(", ", topDomains)}");
        }

        if (topSkills.Any())
        {
            parts.Add($"One cikan yetkinlikler: {string.Join(", ", topSkills)}");
        }

        if (analysis.Projects.Any())
        {
            parts.Add($"Tespit edilen proje sayisi: {analysis.Projects.Count}");
        }

        if (analysis.Experiences.Any())
        {
            parts.Add($"Tespit edilen deneyim sayisi: {analysis.Experiences.Count}");
        }

        return string.Join(". ", parts).Trim();
    }
}
