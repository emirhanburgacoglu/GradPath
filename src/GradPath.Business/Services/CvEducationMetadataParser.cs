using System.Text.RegularExpressions;

namespace GradPath.Business.Services;

public static class CvEducationMetadataParser
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

    private static readonly string[] DegreeTokens =
    {
        "B.Sc.",
        "BSc",
        "Bachelor",
        "M.Sc.",
        "MSc",
        "Master",
        "Associate",
        "PhD",
        "Doctorate",
        "BEng",
        "MEng"
    };

    public static void Parse(
        List<string> group,
        out string schoolName,
        out string department,
        out string degree,
        out string startDateText,
        out string endDateText)
    {
        schoolName = string.Empty;
        department = string.Empty;
        degree = string.Empty;
        startDateText = string.Empty;
        endDateText = string.Empty;

        if (group == null || group.Count == 0)
        {
            return;
        }

        var combined = string.Join(" | ", group.Where(line => !string.IsNullOrWhiteSpace(line)).Select(line => line.Trim()));
        combined = RemoveGpaSegment(combined);

        if (CvDateRangeParser.TryExtractTrailingRange(combined, out var contentWithoutDates, out var startDate, out var endDate))
        {
            combined = contentWithoutDates;
            startDateText = startDate;
            endDateText = endDate;
        }
        else
        {
            foreach (var line in group)
            {
                if (CvDateRangeParser.TryParseStandaloneRange(line, out startDate, out endDate))
                {
                    startDateText = startDate;
                    endDateText = endDate;
                    break;
                }
            }
        }

        var parts = SplitContentParts(combined);

        foreach (var part in parts)
        {
            if (string.IsNullOrWhiteSpace(part))
            {
                continue;
            }

            if (string.IsNullOrWhiteSpace(schoolName) && LooksLikeSchoolName(part))
            {
                schoolName = part;
                continue;
            }

            ParseAcademicPart(part, ref department, ref degree);
        }

        if (string.IsNullOrWhiteSpace(schoolName) && parts.Count > 0)
        {
            schoolName = parts[0];
        }

        if (string.IsNullOrWhiteSpace(department) && parts.Count > 1)
        {
            var detectedSchoolName = schoolName;
            department = parts.FirstOrDefault(part => !string.Equals(part, detectedSchoolName, StringComparison.OrdinalIgnoreCase))
                ?? department;
        }
    }

    private static List<string> SplitContentParts(string text)
    {
        return text
            .Split(new[] { '|', ',' }, StringSplitOptions.RemoveEmptyEntries)
            .Select(part => NormalizeWhitespace(part))
            .Where(part => !string.IsNullOrWhiteSpace(part))
            .ToList();
    }

    private static void ParseAcademicPart(string part, ref string department, ref string degree)
    {
        if (LooksLikeSchoolName(part))
        {
            return;
        }

        foreach (var token in DegreeTokens)
        {
            if (!part.Contains(token, StringComparison.OrdinalIgnoreCase))
            {
                continue;
            }

            degree = token;
            var remaining = NormalizeWhitespace(part.Replace(token, string.Empty, StringComparison.OrdinalIgnoreCase));
            if (!string.IsNullOrWhiteSpace(remaining))
            {
                department = remaining.Trim('-', ' ');
            }

            return;
        }

        if (string.IsNullOrWhiteSpace(department))
        {
            department = part;
        }
    }

    private static bool LooksLikeSchoolName(string part)
    {
        var normalized = part.ToLowerInvariant();
        return SchoolKeywords.Any(normalized.Contains);
    }

    private static string RemoveGpaSegment(string text)
    {
        return Regex.Replace(text, @"GPA\s*:?\s*[\d.,]+\s*/\s*[\d.,]+", string.Empty, RegexOptions.IgnoreCase).Trim();
    }

    private static string NormalizeWhitespace(string text)
    {
        return Regex.Replace(text, @"\s+", " ").Trim();
    }
}
