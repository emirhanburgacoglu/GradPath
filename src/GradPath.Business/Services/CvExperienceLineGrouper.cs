namespace GradPath.Business.Services;

public static class CvExperienceLineGrouper
{
    public static List<List<string>> GroupExperienceLines(IEnumerable<string> lines)
    {
        var cleanedLines = lines.ToList();
        var result = new List<List<string>>();
        var currentGroup = new List<string>();

        for (int i = 0; i < cleanedLines.Count; i++)
        {
            var line = cleanedLines[i].Trim();

            if (string.IsNullOrWhiteSpace(line))
            {
                continue;
            }

            if (LooksLikeExperienceTitle(line) && currentGroup.Count > 0)
            {
                result.Add(currentGroup);
                currentGroup = new List<string>();
            }

            currentGroup.Add(line);
        }

        if (currentGroup.Count > 0)
        {
            result.Add(currentGroup);
        }

        return result
            .Where(group => group.Count > 0)
            .ToList();
    }

    private static bool LooksLikeExperienceTitle(string line)
    {
        if (string.IsNullOrWhiteSpace(line))
        {
            return false;
        }

        if (line.Length > 80)
        {
            return false;
        }

        var normalized = line.ToLowerInvariant();

        if (normalized.StartsWith("developed ") ||
            normalized.StartsWith("implemented ") ||
            normalized.StartsWith("participating ") ||
            normalized.StartsWith("contributing ") ||
            normalized.StartsWith("designed ") ||
            normalized.StartsWith("led "))
        {
            return false;
        }

        return normalized.Contains("intern")
            || normalized.Contains("developer")
            || normalized.Contains("engineer")
            || normalized.Contains("lead")
            || normalized.Contains("specialist")
            || normalized.Contains("manager");
    }

}
