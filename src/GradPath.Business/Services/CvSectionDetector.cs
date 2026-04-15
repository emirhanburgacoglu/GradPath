using System.Text.RegularExpressions;
using GradPath.Business.DTOs.CV;

namespace GradPath.Business.Services;

public static class CvSectionDetector
{
    public static List<CvSectionBlockDto> DetectSections(string rawText)
    {
        if (string.IsNullOrWhiteSpace(rawText))
        {
            return new List<CvSectionBlockDto>();
        }

        var lines = rawText
            .Split('\n')
            .Select(line => line.Replace("\r", string.Empty).Trim())
            .ToList();

        var sections = new List<CvSectionBlockDto>();
        CvSectionBlockDto? currentSection = null;

        for (int i = 0; i < lines.Count; i++)
        {
            var line = lines[i];

            if (string.IsNullOrWhiteSpace(line))
            {
                if (currentSection != null)
                {
                    currentSection.Lines.Add(string.Empty);
                }

                continue;
            }

            if (TryDetectSection(lines, i, out var sectionType, out var consumedLineCount, out var title))
            {
                currentSection = new CvSectionBlockDto
                {
                    SectionType = sectionType,
                    Title = title
                };

                sections.Add(currentSection);
                i += consumedLineCount - 1;
                continue;
            }

            if (currentSection != null)
            {
                currentSection.Lines.Add(line);
            }
        }

        return sections;
    }

    public static CvSectionBlockDto? GetFirstSection(string rawText, CvSectionType sectionType)
    {
        return DetectSections(rawText)
            .FirstOrDefault(section => section.SectionType == sectionType);
    }

    private static bool TryDetectSection(
        List<string> lines,
        int startIndex,
        out CvSectionType sectionType,
        out int consumedLineCount,
        out string title)
    {
        sectionType = CvSectionType.Unknown;
        consumedLineCount = 0;
        title = string.Empty;

        var candidates = GetHeadingCandidates(lines, startIndex);

        foreach (var candidate in candidates)
        {
            var detectedSectionType = DetectSectionType(candidate.Text);
            if (detectedSectionType == CvSectionType.Unknown)
            {
                continue;
            }

            sectionType = detectedSectionType;
            consumedLineCount = candidate.LineCount;
            title = candidate.Text;
            return true;
        }

        return false;
    }

    private static List<(string Text, int LineCount)> GetHeadingCandidates(List<string> lines, int startIndex)
    {
        var result = new List<(string Text, int LineCount)>();
        var parts = new List<string>();
        var index = startIndex;

        while (index < lines.Count && parts.Count < 3)
        {
            var line = lines[index].Trim();
            if (string.IsNullOrWhiteSpace(line))
            {
                break;
            }

            if (!LooksLikeHeadingFragment(line))
            {
                break;
            }

            parts.Add(line);
            result.Insert(0, (string.Join(" ", parts), parts.Count));
            index++;
        }

        return result;
    }

    private static CvSectionType DetectSectionType(string line)
    {
        var normalizedLine = Normalize(line);

        foreach (var pair in CvSectionAliases.All)
        {
            foreach (var alias in pair.Value)
            {
                if (normalizedLine == Normalize(alias))
                {
                    return pair.Key;
                }
            }
        }

        return CvSectionType.Unknown;
    }

    private static bool LooksLikeHeadingFragment(string line)
    {
        if (string.IsNullOrWhiteSpace(line))
        {
            return false;
        }

        var trimmed = line.Trim();
        if (trimmed.Length > 40)
        {
            return false;
        }

        var lower = trimmed.ToLowerInvariant();
        var wordCount = trimmed
            .Split(' ', StringSplitOptions.RemoveEmptyEntries)
            .Length;

        if (wordCount > 5)
        {
            return false;
        }

        return !lower.StartsWith("developed ")
            && !lower.StartsWith("designed ")
            && !lower.StartsWith("implemented ")
            && !lower.StartsWith("participating ")
            && !lower.StartsWith("contributing ");
    }

    private static string Normalize(string value)
    {
        var upper = value.Trim().ToUpperInvariant();
        upper = Regex.Replace(upper, @"[^\p{L}\p{Nd}]+", " ");

        return string.Join(" ", upper
            .Split((char[])null!, StringSplitOptions.RemoveEmptyEntries));
    }
}
