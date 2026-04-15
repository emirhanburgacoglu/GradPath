namespace GradPath.Business.Services;

public static class CvProjectLineGrouper
{
    public static List<List<string>> GroupProjectLines(IEnumerable<string> lines)
    {
        var cleanedLines = lines
            .Select(line => line.Trim())
            .Where(line => !string.IsNullOrWhiteSpace(line))
            .ToList();

        var result = new List<List<string>>();
        var currentGroup = new List<string>();

        foreach (var line in cleanedLines)
        {
            if (currentGroup.Count > 0 && LooksLikeProjectTitle(line))
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

    private static bool LooksLikeProjectTitle(string line)
    {
        if (string.IsNullOrWhiteSpace(line))
        {
            return false;
        }

        if (line.Length > 80)
        {
            return false;
        }

        if (line.EndsWith("."))
        {
            return false;
        }

        var normalized = line.ToLowerInvariant();

        if (normalized.StartsWith("developed ")
            || normalized.StartsWith("designing ")
            || normalized.StartsWith("implemented ")
            || normalized.StartsWith("led ")
            || normalized.StartsWith("participating ")
            || normalized.StartsWith("contributing ")
            || normalized.StartsWith("delivered ")
            || normalized.StartsWith("provides ")
            || normalized.StartsWith("the system ")
            || normalized.StartsWith("operations"))
        {
            return false;
        }

        if (normalized.Contains("award") || normalized.Contains("activities"))
        {
            return false;
        }

        var wordCount = line
            .Split(' ', StringSplitOptions.RemoveEmptyEntries)
            .Length;

        if (wordCount > 10)
        {
            return false;
        }

        return true;
    }
}
