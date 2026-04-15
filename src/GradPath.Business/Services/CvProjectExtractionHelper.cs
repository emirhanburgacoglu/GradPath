using GradPath.Business.DTOs.CV;

namespace GradPath.Business.Services;

public static class CvProjectExtractionHelper
{
    public static List<CvProjectDto> ExtractFromRawText(string rawText)
    {
        var sections = CvSectionDetector.DetectSections(rawText);

        var projectLines = sections
            .Where(section => section.SectionType == CvSectionType.Projects)
            .SelectMany(section => section.Lines)
            .ToList();

        var groupedProjects = CvProjectLineGrouper.GroupProjectLines(projectLines);
        var result = new List<CvProjectDto>();

        foreach (var group in groupedProjects)
        {
            if (group.Count == 0)
            {
                continue;
            }
            var description = string.Join(" ", group.Skip(1)).Trim();

            var project = new CvProjectDto
            {
                Name = group[0],
                Description = description,
                Technologies = ExtractTechnologiesFromText(description),
                Role = DetectRole($"{group[0]} {description}"),
                Domain = DetectDomain($"{group[0]} {description}"),
                IsTeamProject = DetectIsTeamProject(description)
            };

            result.Add(project);
        }

        return result;
    }
    private static List<string> ExtractTechnologiesFromText(string text)
    {
        var technologies = new HashSet<string>(StringComparer.OrdinalIgnoreCase);

        if (string.IsNullOrWhiteSpace(text))
        {
            return technologies.ToList();
        }

        var separators = new[] { ' ', ',', '.', ';', ':', '|', '/', '\\', '(', ')', '[', ']', '-', '–' };

        var tokens = text
            .Split(separators, StringSplitOptions.RemoveEmptyEntries)
            .Select(x => x.Trim())
            .Where(x => !string.IsNullOrWhiteSpace(x))
            .ToHashSet(StringComparer.OrdinalIgnoreCase);

        foreach (var rule in CvSkillNormalizationRules.All)
        {
            var allNames = new List<string> { rule.CanonicalName };
            allNames.AddRange(rule.Aliases);

            foreach (var name in allNames)
            {
                if (string.IsNullOrWhiteSpace(name))
                {
                    continue;
                }

                if (name.Contains(' '))
                {
                    if (text.Contains(name, StringComparison.OrdinalIgnoreCase))
                    {
                        technologies.Add(rule.CanonicalName);
                        break;
                    }
                }
                else
                {
                    if (tokens.Contains(name))
                    {
                        technologies.Add(rule.CanonicalName);
                        break;
                    }
                }
            }
        }

        return technologies.OrderBy(x => x).ToList();
    }

    private static string DetectDomain(string text)
    {
        if (string.IsNullOrWhiteSpace(text))
        {
            return string.Empty;
        }

        var normalized = text.ToLowerInvariant();

        if (normalized.Contains("backend") || normalized.Contains("asp.net") || normalized.Contains(".net"))
            return "Backend";

        if (normalized.Contains("web") || normalized.Contains("website") || normalized.Contains("frontend"))
            return "Web";

        if (normalized.Contains("machine learning") || normalized.Contains("deep learning") || normalized.Contains("computer vision") || normalized.Contains("opencv") || normalized.Contains("insightface"))
            return "AI";

        if (normalized.Contains("raspberry pi") || normalized.Contains("embedded") || normalized.Contains("autonomous") || normalized.Contains("real-time"))
            return "Embedded";

        if (normalized.Contains("mobile") || normalized.Contains("flutter"))
            return "Mobile";

        if (normalized.Contains("database") || normalized.Contains("data architecture"))
            return "Data";

        return string.Empty;
    }

    private static bool DetectIsTeamProject(string text)
    {
        if (string.IsNullOrWhiteSpace(text))
        {
            return false;
        }

        var normalized = text.ToLowerInvariant();

        return normalized.Contains("team")
            || normalized.Contains("collaborative")
            || normalized.Contains("multidisciplinary")
            || normalized.Contains("software team");
    }

    private static string DetectRole(string text)
    {
        if (string.IsNullOrWhiteSpace(text))
        {
            return string.Empty;
        }

        var normalized = text.ToLowerInvariant();

        if (normalized.Contains("backend"))
            return "Backend Developer";

        if (normalized.Contains("frontend"))
            return "Frontend Developer";

        if (normalized.Contains("full-stack"))
            return "Full Stack Developer";

        if (normalized.Contains("machine learning") || normalized.Contains("deep learning"))
            return "AI Developer";

        if (normalized.Contains("computer vision"))
            return "Computer Vision Developer";

        if (normalized.Contains("guidance") || normalized.Contains("control"))
            return "Control Systems Developer";

        return string.Empty;
    }

}
