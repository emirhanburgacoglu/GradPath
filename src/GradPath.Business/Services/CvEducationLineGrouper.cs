namespace GradPath.Business.Services;

public static class CvEducationLineGrouper
{
    private static readonly string[] SchoolKeywords =
    {
        "university",
        "college",
        "institute",
        "faculty",
        "school",
        "academy",
        "high school",
        "universitesi",
        "üniversitesi",
        "lisesi"
    };

    public static List<List<string>> GroupEducationLines(IEnumerable<string> lines)
    {
        var result = new List<List<string>>();
        var currentGroup = new List<string>();

        foreach (var rawLine in lines)
        {
            var line = rawLine.Trim();

            if (string.IsNullOrWhiteSpace(line))
            {
                if (currentGroup.Count > 0)
                {
                    result.Add(currentGroup);
                    currentGroup = new List<string>();
                }

                continue;
            }

            if (currentGroup.Count > 0 && LooksLikeNewEducationEntry(line))
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

    private static bool LooksLikeNewEducationEntry(string line)
    {
        var normalized = line.ToLowerInvariant();
        return SchoolKeywords.Any(normalized.Contains)
            || (CvDateRangeParser.ContainsDateRange(line) && line.Contains('|'));
    }
}
