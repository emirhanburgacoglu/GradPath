using GradPath.Business.DTOs.CV;

namespace GradPath.Business.Services;

public static class CvExperienceExtractionHelper
{
    private static readonly string[] DescriptionStarters =
    {
        "developed ",
        "implemented ",
        "participating ",
        "contributing ",
        "designed ",
        "led ",
        "delivered ",
        "managed ",
        "performed "
    };

    private static readonly string[] RoleKeywords =
    {
        "intern",
        "developer",
        "engineer",
        "lead",
        "specialist",
        "manager",
        "team leader",
        "analyst",
        "assistant",
        "researcher",
        "consultant",
        "trainer",
        "coordinator"
    };

    public static List<CvExperienceDto> ExtractFromRawText(string rawText)
    {
        var sections = CvSectionDetector.DetectSections(rawText);

        var experienceLines = sections
            .Where(section => section.SectionType == CvSectionType.Experience)
            .SelectMany(section => section.Lines)
            .Select(line => line.Trim())
            .Where(line => !string.IsNullOrWhiteSpace(line))
            .ToList();

        var groupedExperiences = GroupExperienceEntries(experienceLines);
        var result = new List<CvExperienceDto>();

        foreach (var group in groupedExperiences)
        {
            var dto = BuildExperience(group);
            if (dto != null)
            {
                result.Add(dto);
            }
        }

        return result;
    }

    private static List<List<string>> GroupExperienceEntries(List<string> lines)
    {
        var result = new List<List<string>>();
        List<string>? currentGroup = null;
        string? pendingDateLine = null;

        foreach (var line in lines)
        {
            if (LooksLikeExperienceHeader(line))
            {
                if (currentGroup != null && currentGroup.Count > 0)
                {
                    result.Add(currentGroup);
                }

                currentGroup = new List<string> { line };

                if (!string.IsNullOrWhiteSpace(pendingDateLine)
                    && !CvDateRangeParser.ContainsDateRange(line))
                {
                    currentGroup.Add(pendingDateLine!);
                    pendingDateLine = null;
                }

                continue;
            }

            if (IsLikelyStandaloneDateLine(line))
            {
                pendingDateLine = line;
                continue;
            }

            if (currentGroup == null)
            {
                continue;
            }

            currentGroup.Add(line);
        }

        if (currentGroup != null && currentGroup.Count > 0)
        {
            result.Add(currentGroup);
        }

        return result;
    }

    private static CvExperienceDto? BuildExperience(List<string> group)
    {
        if (group.Count == 0)
        {
            return null;
        }

        ParseHeader(
            group[0],
            out var position,
            out var companyName,
            out var startDateText,
            out var endDateText);

        if (string.IsNullOrWhiteSpace(position) && string.IsNullOrWhiteSpace(companyName))
        {
            return null;
        }

        var descriptionStartIndex = 1;

        if (group.Count > 1
            && IsLikelyStandaloneDateLine(group[1])
            && string.IsNullOrWhiteSpace(startDateText))
        {
            ParseDateRange(group[1], out startDateText, out endDateText);
            descriptionStartIndex = 2;
        }

        var description = string.Join(" ", group.Skip(descriptionStartIndex)).Trim();

        return new CvExperienceDto
        {
            CompanyName = companyName,
            Position = position,
            StartDateText = startDateText,
            EndDateText = endDateText,
            Description = description,
            Technologies = ExtractTechnologiesFromText(description)
        };
    }

    private static void ParseHeader(
        string header,
        out string position,
        out string companyName,
        out string startDateText,
        out string endDateText)
    {
        position = string.Empty;
        companyName = string.Empty;
        startDateText = string.Empty;
        endDateText = string.Empty;

        if (string.IsNullOrWhiteSpace(header))
        {
            return;
        }

        var normalizedHeader = header.Trim();

        if (CvDateRangeParser.TryExtractTrailingRange(
            normalizedHeader,
            out var headerWithoutDates,
            out var parsedStartDate,
            out var parsedEndDate))
        {
            normalizedHeader = headerWithoutDates;
            startDateText = parsedStartDate;
            endDateText = parsedEndDate;
        }

        if (TryParsePipeSeparatedHeader(normalizedHeader, out position, out companyName))
        {
            return;
        }

        if (TryParseCommaSeparatedHeader(normalizedHeader, out position, out companyName))
        {
            return;
        }

        if (TryParseHyphenSeparatedHeader(normalizedHeader, out position, out companyName))
        {
            return;
        }

        position = normalizedHeader;
    }

    private static bool TryParsePipeSeparatedHeader(
        string header,
        out string position,
        out string companyName)
    {
        position = string.Empty;
        companyName = string.Empty;

        var parts = header
            .Split('|', StringSplitOptions.RemoveEmptyEntries)
            .Select(part => part.Trim())
            .Where(part => !string.IsNullOrWhiteSpace(part))
            .ToList();

        if (parts.Count < 2)
        {
            return false;
        }

        var roleIndex = parts.FindIndex(LooksLikeRoleSegment);
        if (roleIndex == 1)
        {
            companyName = parts[0];
            position = parts[1];
            return true;
        }

        if (roleIndex == 0 && parts.Count >= 2)
        {
            position = parts[0];
            companyName = parts[1];
            return true;
        }

        companyName = parts[0];
        position = parts.Count > 1 ? parts[1] : string.Empty;
        return !string.IsNullOrWhiteSpace(position) || !string.IsNullOrWhiteSpace(companyName);
    }

    private static bool TryParseCommaSeparatedHeader(
        string header,
        out string position,
        out string companyName)
    {
        position = string.Empty;
        companyName = string.Empty;

        var parts = header
            .Split(',', StringSplitOptions.RemoveEmptyEntries)
            .Select(part => part.Trim())
            .Where(part => !string.IsNullOrWhiteSpace(part))
            .ToList();

        if (parts.Count < 2)
        {
            return false;
        }

        if (LooksLikeRoleSegment(parts[0]))
        {
            position = parts[0];
            companyName = string.Join(", ", parts.Skip(1));
            return true;
        }

        if (parts.Count >= 2 && LooksLikeRoleSegment(parts[1]))
        {
            companyName = parts[0];
            position = parts[1];
            return true;
        }

        return false;
    }

    private static bool TryParseHyphenSeparatedHeader(
        string header,
        out string position,
        out string companyName)
    {
        position = string.Empty;
        companyName = string.Empty;

        var separatorIndex = header.IndexOf(" - ", StringComparison.Ordinal);
        if (separatorIndex <= 0 || separatorIndex >= header.Length - 3)
        {
            return false;
        }

        position = header[..separatorIndex].Trim();
        companyName = header[(separatorIndex + 3)..].Trim();
        return true;
    }

    private static bool LooksLikeExperienceHeader(string line)
    {
        if (string.IsNullOrWhiteSpace(line))
        {
            return false;
        }

        if (line.Length > 160)
        {
            return false;
        }

        var normalized = line.ToLowerInvariant();
        if (DescriptionStarters.Any(starter => normalized.StartsWith(starter, StringComparison.Ordinal)))
        {
            return false;
        }

        if (RoleKeywords.Any(normalized.Contains))
        {
            return true;
        }

        return CvDateRangeParser.ContainsDateRange(line)
            && (line.Contains(',') || line.Contains('|') || line.Contains(" - "));
    }

    private static bool LooksLikeRoleSegment(string segment)
    {
        if (string.IsNullOrWhiteSpace(segment))
        {
            return false;
        }

        var normalized = segment.ToLowerInvariant();
        return RoleKeywords.Any(normalized.Contains);
    }

    private static bool IsLikelyStandaloneDateLine(string line)
    {
        if (string.IsNullOrWhiteSpace(line))
        {
            return false;
        }

        if (LooksLikeExperienceHeader(line))
        {
            return false;
        }

        return CvDateRangeParser.TryParseStandaloneRange(line, out _, out _);
    }

    private static void ParseDateRange(string line, out string startDateText, out string endDateText)
    {
        startDateText = string.Empty;
        endDateText = string.Empty;

        if (CvDateRangeParser.TryParseStandaloneRange(line, out var startDate, out var endDate))
        {
            startDateText = startDate;
            endDateText = endDate;
        }
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
                else if (tokens.Contains(name))
                {
                    technologies.Add(rule.CanonicalName);
                    break;
                }
            }
        }

        return technologies.OrderBy(x => x).ToList();
    }
}
