using System.Text.RegularExpressions;
using GradPath.Business.DTOs.CV;

namespace GradPath.Business.Services;

public static class CvSkillExtractionHelper
{
    private static readonly string[] PreferredCategoryOrder =
    {
        CvSkillCategories.Programming,
        CvSkillCategories.Frameworks,
        CvSkillCategories.Web,
        CvSkillCategories.Databases,
        CvSkillCategories.Mobile,
        CvSkillCategories.AiData,
        CvSkillCategories.Embedded,
        CvSkillCategories.DevOps,
        CvSkillCategories.Tools,
        CvSkillCategories.Other
    };

    private static readonly string[] AllowedFallbackCategoryLabels =
    {
        "programming",
        "programming languages",
        "languages",
        "frameworks",
        "frameworks libraries",
        "frameworks technologies",
        "technologies",
        "technical skills",
        "technical competencies",
        "tools",
        "tools platforms",
        "tools databases",
        "databases",
        "libraries",
        "web technologies",
        "mobile technologies",
        "backend",
        "frontend",
        "ai data",
        "machine learning",
        "data science",
        "tech stack"
    };

    private static readonly string[] CustomSkillNoiseTerms =
    {
        "development",
        "integration",
        "management",
        "analysis",
        "architecture",
        "localization",
        "extraction",
        "recommendation",
        "engineering",
        "preprocessing",
        "feature engineering",
        "decision support",
        "compatibility",
        "optimization techniques"
    };

    public static List<CvSkillCategoryDto> ExtractFromRawText(string rawText)
    {
        var sections = CvSectionDetector.DetectSections(rawText);

        var skillLines = sections
            .Where(section =>
                section.SectionType == CvSectionType.Skills ||
                section.SectionType == CvSectionType.AdditionalInformation)
            .SelectMany(section => section.Lines)
            .ToList();

        var primarySkills = ExtractFromLinesInternal(skillLines, preserveCustomSkills: true);
        var fallbackSkillLines = ExtractFallbackSkillLines(rawText);
        var fallbackSkills = ExtractFromLinesInternal(fallbackSkillLines, preserveCustomSkills: false);
        var mergedSkills = MergeSkillCategories(primarySkills, fallbackSkills);
        var totalSkillCount = mergedSkills.Sum(category => category.Skills.Count);

        if (totalSkillCount >= 6)
        {
            return mergedSkills;
        }

        var observedSkills = ExtractObservedSkillsFromSections(sections);
        return MergeSkillCategories(mergedSkills, observedSkills);
    }

    public static List<CvSkillCategoryDto> ExtractFromLines(IEnumerable<string> lines)
    {
        return ExtractFromLinesInternal(lines, preserveCustomSkills: true);
    }

    private static List<CvSkillCategoryDto> ExtractFromLinesInternal(
        IEnumerable<string> lines,
        bool preserveCustomSkills)
    {
        var lineList = lines.ToList();
        var categoryMap = new Dictionary<string, HashSet<string>>(StringComparer.OrdinalIgnoreCase);

        for (int i = 0; i < lineList.Count; i++)
        {
            var line = lineList[i].Trim();

            if (string.IsNullOrWhiteSpace(line))
            {
                continue;
            }

            if (CvSkillLineParser.TrySplitCategoryAndContent(line, out var rawCategory, out var contentText))
            {
                AddSkillsToCategoryMap(categoryMap, rawCategory, contentText, preserveCustomSkills);
                continue;
            }

            var nextIndexForColonSplit = GetNextNonEmptyLineIndex(lineList, i + 1);
            if (nextIndexForColonSplit != -1)
            {
                var nextLineForColonSplit = lineList[nextIndexForColonSplit].Trim();

                if (CvSkillLineParser.TrySplitCategoryAndNextLineContent(
                    line,
                    nextLineForColonSplit,
                    out var splitCategory,
                    out var splitContent))
                {
                    AddSkillsToCategoryMap(categoryMap, splitCategory, splitContent, preserveCustomSkills);
                    i = nextIndexForColonSplit;
                    continue;
                }

                var combinedTitleForColonSplit = $"{line} {nextLineForColonSplit}".Trim();
                var contentIndexAfterCombinedTitle = GetNextNonEmptyLineIndex(lineList, nextIndexForColonSplit + 1);

                if (contentIndexAfterCombinedTitle != -1)
                {
                    var contentLineAfterCombinedTitle = lineList[contentIndexAfterCombinedTitle].Trim();

                    if (CvSkillLineParser.TrySplitCategoryAndNextLineContent(
                        combinedTitleForColonSplit,
                        contentLineAfterCombinedTitle,
                        out var combinedSplitCategory,
                        out var combinedSplitContent))
                    {
                        AddSkillsToCategoryMap(categoryMap, combinedSplitCategory, combinedSplitContent, preserveCustomSkills);
                        i = contentIndexAfterCombinedTitle;
                        continue;
                    }
                }
            }

            var nextIndex = GetNextNonEmptyLineIndex(lineList, i + 1);
            if (nextIndex == -1)
            {
                continue;
            }

            var nextLine = lineList[nextIndex].Trim();
            var mappedCategory = CvSkillCategoryMapper.MapCategory(line);

            if (!string.Equals(mappedCategory, CvSkillCategories.Other, StringComparison.OrdinalIgnoreCase)
                && !nextLine.Contains(':')
                && LooksLikeSkillContent(nextLine))
            {
                AddSkillsToCategoryMap(categoryMap, line, nextLine, preserveCustomSkills);
                i = nextIndex;
                continue;
            }

            var combinedTitle = $"{line} {nextLine}".Trim();
            var combinedMappedCategory = CvSkillCategoryMapper.MapCategory(combinedTitle);

            if (!string.Equals(combinedMappedCategory, CvSkillCategories.Other, StringComparison.OrdinalIgnoreCase))
            {
                var contentIndex = GetNextNonEmptyLineIndex(lineList, nextIndex + 1);
                if (contentIndex != -1)
                {
                    var contentLine = lineList[contentIndex].Trim();

                    if (!contentLine.Contains(':') && LooksLikeSkillContent(contentLine))
                    {
                        AddSkillsToCategoryMap(categoryMap, combinedTitle, contentLine, preserveCustomSkills);
                        i = contentIndex;
                    }
                }
            }
        }

        return categoryMap
            .Where(kvp => kvp.Value.Count > 0)
            .Select(kvp => new CvSkillCategoryDto
            {
                CategoryName = kvp.Key,
                Skills = kvp.Value.OrderBy(skill => skill).ToList()
            })
            .OrderBy(GetCategoryOrder)
            .ThenBy(item => item.CategoryName)
            .ToList();
    }

    private static void AddSkillsToCategoryMap(
        Dictionary<string, HashSet<string>> categoryMap,
        string rawCategory,
        string contentText,
        bool preserveCustomSkills)
    {
        var mappedCategory = CvSkillCategoryMapper.MapCategory(rawCategory);

        foreach (var rule in CvSkillNormalizer.FindMatchesInText(contentText))
        {
            AddSkill(categoryMap, rule.CategoryName, rule.CanonicalName);
        }

        var rawSkills = CvSkillLineParser.SplitSkills(contentText);
        foreach (var rawSkill in rawSkills)
        {
            if (CvSkillNormalizer.TryNormalizeSkill(rawSkill, out var normalizedSkill, out var normalizedCategory))
            {
                var finalCategory = string.Equals(normalizedCategory, CvSkillCategories.Other, StringComparison.OrdinalIgnoreCase)
                    ? mappedCategory
                    : normalizedCategory;

                AddSkill(categoryMap, finalCategory, normalizedSkill);
                continue;
            }

            foreach (var matchedRule in CvSkillNormalizer.FindMatchesInText(rawSkill))
            {
                AddSkill(categoryMap, matchedRule.CategoryName, matchedRule.CanonicalName);
            }

            if (preserveCustomSkills
                && !string.Equals(mappedCategory, CvSkillCategories.Other, StringComparison.OrdinalIgnoreCase)
                && TryNormalizeCustomSkill(rawSkill, out var customSkill))
            {
                AddSkill(categoryMap, mappedCategory, customSkill);
            }
        }
    }

    private static List<CvSkillCategoryDto> ExtractObservedSkillsFromSections(IEnumerable<CvSectionBlockDto> sections)
    {
        var categoryMap = new Dictionary<string, HashSet<string>>(StringComparer.OrdinalIgnoreCase);

        var observableLines = sections
            .Where(section =>
                section.SectionType == CvSectionType.Summary ||
                section.SectionType == CvSectionType.Experience ||
                section.SectionType == CvSectionType.Projects)
            .SelectMany(section => section.Lines)
            .Where(line => !string.IsNullOrWhiteSpace(line))
            .ToList();

        foreach (var line in observableLines)
        {
            foreach (var rule in CvSkillNormalizer.FindMatchesInText(line))
            {
                AddSkill(categoryMap, rule.CategoryName, rule.CanonicalName);
            }
        }

        return categoryMap
            .Where(kvp => kvp.Value.Count > 0)
            .Select(kvp => new CvSkillCategoryDto
            {
                CategoryName = kvp.Key,
                Skills = kvp.Value.OrderBy(skill => skill).ToList()
            })
            .OrderBy(GetCategoryOrder)
            .ThenBy(item => item.CategoryName)
            .ToList();
    }

    private static void AddSkill(
        Dictionary<string, HashSet<string>> categoryMap,
        string categoryName,
        string skillName)
    {
        if (string.IsNullOrWhiteSpace(categoryName) || string.IsNullOrWhiteSpace(skillName))
        {
            return;
        }

        if (!categoryMap.TryGetValue(categoryName, out var skills))
        {
            skills = new HashSet<string>(StringComparer.OrdinalIgnoreCase);
            categoryMap[categoryName] = skills;
        }

        skills.Add(skillName);
    }

    private static int GetNextNonEmptyLineIndex(List<string> lines, int startIndex)
    {
        for (int i = startIndex; i < lines.Count; i++)
        {
            if (!string.IsNullOrWhiteSpace(lines[i]))
            {
                return i;
            }
        }

        return -1;
    }

    private static bool LooksLikeSkillContent(string line)
    {
        if (string.IsNullOrWhiteSpace(line))
        {
            return false;
        }

        return line.Contains(',')
            || line.Contains(';')
            || line.Contains('|')
            || CvSkillNormalizer.FindMatchesInText(line).Any();
    }

    private static List<string> ExtractFallbackSkillLines(string rawText)
    {
        if (string.IsNullOrWhiteSpace(rawText))
        {
            return new List<string>();
        }

        return rawText
            .Split('\n')
            .Select(line => line.Replace("\r", string.Empty).Trim())
            .Where(IsFallbackSkillLine)
            .Distinct(StringComparer.OrdinalIgnoreCase)
            .ToList();
    }

    private static bool IsFallbackSkillLine(string line)
    {
        if (string.IsNullOrWhiteSpace(line))
        {
            return false;
        }

        var colonIndex = line.IndexOf(':');
        if (colonIndex <= 0 || colonIndex == line.Length - 1)
        {
            return false;
        }

        var categoryPart = NormalizeCategoryLabel(line[..colonIndex]);
        if (string.IsNullOrWhiteSpace(categoryPart))
        {
            return false;
        }

        return AllowedFallbackCategoryLabels.Contains(categoryPart, StringComparer.OrdinalIgnoreCase);
    }

    private static bool TryNormalizeCustomSkill(string rawSkill, out string customSkill)
    {
        customSkill = string.Empty;

        if (string.IsNullOrWhiteSpace(rawSkill))
        {
            return false;
        }

        var cleaned = Regex.Replace(rawSkill.Trim(), @"\s+", " ");
        cleaned = cleaned.Trim().Trim('.', '-', ';', ':', ',');

        if (string.IsNullOrWhiteSpace(cleaned))
        {
            return false;
        }

        if (cleaned.Length < 2 || cleaned.Length > 30)
        {
            return false;
        }

        var wordCount = cleaned.Split(' ', StringSplitOptions.RemoveEmptyEntries).Length;
        if (wordCount > 4)
        {
            return false;
        }

        var lower = cleaned.ToLowerInvariant();
        if (CustomSkillNoiseTerms.Any(lower.Contains))
        {
            return false;
        }

        if (!Regex.IsMatch(cleaned, @"^[\p{L}\p{Nd}][\p{L}\p{Nd}\+#\./\- ]*$"))
        {
            return false;
        }

        customSkill = cleaned;
        return true;
    }

    private static string NormalizeCategoryLabel(string value)
    {
        if (string.IsNullOrWhiteSpace(value))
        {
            return string.Empty;
        }

        var normalized = value.ToLowerInvariant()
            .Replace("&", " ")
            .Replace("/", " ")
            .Replace("-", " ");

        normalized = Regex.Replace(normalized, @"[^\p{L}\p{Nd} ]+", " ");
        normalized = Regex.Replace(normalized, @"\s+", " ").Trim();
        return normalized;
    }

    private static List<CvSkillCategoryDto> MergeSkillCategories(params IEnumerable<CvSkillCategoryDto>[] sources)
    {
        var categoryMap = new Dictionary<string, HashSet<string>>(StringComparer.OrdinalIgnoreCase);

        foreach (var source in sources)
        {
            foreach (var category in source)
            {
                if (string.IsNullOrWhiteSpace(category.CategoryName))
                {
                    continue;
                }

                if (!categoryMap.TryGetValue(category.CategoryName, out var skills))
                {
                    skills = new HashSet<string>(StringComparer.OrdinalIgnoreCase);
                    categoryMap[category.CategoryName] = skills;
                }

                foreach (var skill in category.Skills)
                {
                    if (!string.IsNullOrWhiteSpace(skill))
                    {
                        skills.Add(skill);
                    }
                }
            }
        }

        return categoryMap
            .Where(kvp => kvp.Value.Count > 0)
            .Select(kvp => new CvSkillCategoryDto
            {
                CategoryName = kvp.Key,
                Skills = kvp.Value.OrderBy(skill => skill).ToList()
            })
            .OrderBy(GetCategoryOrder)
            .ThenBy(item => item.CategoryName)
            .ToList();
    }

    private static int GetCategoryOrder(CvSkillCategoryDto category)
    {
        return GetCategoryOrder(category.CategoryName);
    }

    private static int GetCategoryOrder(string categoryName)
    {
        var index = Array.FindIndex(
            PreferredCategoryOrder,
            category => string.Equals(category, categoryName, StringComparison.OrdinalIgnoreCase));

        return index >= 0 ? index : int.MaxValue;
    }
}
