namespace GradPath.Business.Services;

public static class CvSkillLineParser
{
    public static bool TrySplitCategoryAndContent(
        string line,
        out string categoryText,
        out string contentText)
    {
        categoryText = string.Empty;
        contentText = string.Empty;

        if (string.IsNullOrWhiteSpace(line))
        {
            return false;
        }

        var colonIndex = line.IndexOf(':');
        if (colonIndex <= 0 || colonIndex == line.Length - 1)
        {
            return false;
        }

        categoryText = line[..colonIndex].Trim();
        contentText = line[(colonIndex + 1)..].Trim();

        return !string.IsNullOrWhiteSpace(categoryText)
            && !string.IsNullOrWhiteSpace(contentText);
    }

    public static bool TrySplitCategoryAndNextLineContent(
        string categoryLine,
        string nextLine,
        out string categoryText,
        out string contentText)
    {
        categoryText = string.Empty;
        contentText = string.Empty;

        if (string.IsNullOrWhiteSpace(categoryLine) || string.IsNullOrWhiteSpace(nextLine))
        {
            return false;
        }

        var trimmedNextLine = nextLine.Trim();
        if (!trimmedNextLine.StartsWith(":"))
        {
            return false;
        }

        categoryText = categoryLine.Trim();
        contentText = trimmedNextLine.TrimStart(':').Trim();

        return !string.IsNullOrWhiteSpace(categoryText)
            && !string.IsNullOrWhiteSpace(contentText);
    }

    public static List<string> SplitSkills(string contentText)
    {
        if (string.IsNullOrWhiteSpace(contentText))
        {
            return new List<string>();
        }

        var result = new HashSet<string>(StringComparer.OrdinalIgnoreCase);

        var rawParts = contentText
            .Split(new[] { ',', ';', '•', '|' }, StringSplitOptions.RemoveEmptyEntries)
            .Select(skill => skill.Trim())
            .Where(skill => !string.IsNullOrWhiteSpace(skill))
            .ToList();

        foreach (var part in rawParts)
        {
            var cleanedPart = part.Trim().Trim('.', '-', ' ');
            if (string.IsNullOrWhiteSpace(cleanedPart))
            {
                continue;
            }

            var openParenIndex = cleanedPart.IndexOf('(');
            var closeParenIndex = cleanedPart.IndexOf(')');

            if (openParenIndex > 0 && closeParenIndex > openParenIndex)
            {
                var mainPart = cleanedPart[..openParenIndex].Trim().Trim('.', '-', ' ');
                var innerPart = cleanedPart[(openParenIndex + 1)..closeParenIndex].Trim().Trim('.', '-', ' ');

                if (!string.IsNullOrWhiteSpace(mainPart))
                {
                    result.Add(mainPart);
                }

                if (!string.IsNullOrWhiteSpace(innerPart))
                {
                    result.Add(innerPart);
                }

                continue;
            }

            result.Add(cleanedPart);
        }

        return result.ToList();
    }
}
