namespace GradPath.Business.Services;

public static class CvSectionReader
{
    public static List<string> ExtractSectionLines(string rawText, params string[] sectionTitles)
    {
        if (string.IsNullOrWhiteSpace(rawText) || sectionTitles.Length == 0)
        {
            return new List<string>();
        }

        var lines = rawText
    .Split('\n')
    .Select(line => line.Replace("\r", string.Empty).Trim())
    .ToList();


        var result = new List<string>();
        var isInsideSection = false;

        foreach (var line in lines)
        {
            if (IsMatchingSectionTitle(line, sectionTitles))
            {
                isInsideSection = true;
                continue;
            }

            if (isInsideSection && LooksLikeNewSectionTitle(line))
            {
                break;
            }

            if (isInsideSection)
            {
                result.Add(line);
            }
        }

        return result;
    }

    private static bool IsMatchingSectionTitle(string line, params string[] sectionTitles)
    {
        var normalizedLine = Normalize(line);

        foreach (var title in sectionTitles)
        {
            if (normalizedLine == Normalize(title))
            {
                return true;
            }
        }

        return false;
    }

    private static bool LooksLikeNewSectionTitle(string line)
    {
        if (string.IsNullOrWhiteSpace(line))
        {
            return false;
        }

        var trimmed = line.Trim();

        if (trimmed.Length > 50)
        {
            return false;
        }

        return trimmed.ToUpperInvariant() == trimmed;
    }

    private static string Normalize(string value)
    {
        return value.Trim().ToUpperInvariant().Replace(":", string.Empty);
    }
}
