using System.Text.RegularExpressions;
using GradPath.Business.DTOs.CV;

namespace GradPath.Business.Services;

public static class CvSkillNormalizer
{
    private static readonly Lazy<Dictionary<string, CvSkillNormalizationRule>> ExactMatchMap = new(BuildExactMatchMap);

    public static CvSkillNormalizationRule? FindMatch(string rawSkill)
    {
        if (string.IsNullOrWhiteSpace(rawSkill))
        {
            return null;
        }

        var normalizedInput = NormalizeExact(rawSkill);
        return ExactMatchMap.Value.TryGetValue(normalizedInput, out var match)
            ? match
            : null;
    }

    public static List<CvSkillNormalizationRule> FindMatchesInText(string text)
    {
        var result = new List<CvSkillNormalizationRule>();

        if (string.IsNullOrWhiteSpace(text))
        {
            return result;
        }

        var normalizedText = NormalizeSearchText(text);
        foreach (var rule in CvSkillNormalizationRules.All)
        {
            var allNames = new List<string> { rule.CanonicalName };
            allNames.AddRange(rule.Aliases);

            foreach (var name in allNames)
            {
                var normalizedName = NormalizeExact(name);
                if (string.IsNullOrWhiteSpace(normalizedName))
                {
                    continue;
                }

                if (normalizedText.Contains($" {normalizedName} ", StringComparison.Ordinal))
                {
                    result.Add(rule);
                    break;
                }
            }
        }

        return result
            .DistinctBy(rule => rule.CanonicalName)
            .ToList();
    }

    public static string NormalizeText(string value)
    {
        return NormalizeExact(value);
    }

    public static bool TryNormalizeSkill(
        string rawSkill,
        out string normalizedSkill,
        out string categoryName)
    {
        normalizedSkill = string.Empty;
        categoryName = CvSkillCategories.Other;

        var match = FindMatch(rawSkill);
        if (match == null)
        {
            return false;
        }

        normalizedSkill = match.CanonicalName;
        categoryName = match.CategoryName;
        return true;
    }

    private static Dictionary<string, CvSkillNormalizationRule> BuildExactMatchMap()
    {
        var map = new Dictionary<string, CvSkillNormalizationRule>(StringComparer.Ordinal);

        foreach (var rule in CvSkillNormalizationRules.All)
        {
            var allNames = new List<string> { rule.CanonicalName };
            allNames.AddRange(rule.Aliases);

            foreach (var name in allNames)
            {
                var normalized = NormalizeExact(name);
                if (!string.IsNullOrWhiteSpace(normalized))
                {
                    map[normalized] = rule;
                }
            }
        }

        return map;
    }

    private static string NormalizeExact(string value)
    {
        return NormalizeSearchText(value).Trim();
    }

    private static string NormalizeSearchText(string value)
    {
        if (string.IsNullOrWhiteSpace(value))
        {
            return " ";
        }

        var normalized = value
            .ToLowerInvariant()
            .Replace("â€“", "-")
            .Replace("â€”", "-")
            .Replace("–", "-")
            .Replace("—", "-");

        normalized = Regex.Replace(normalized, @"[^\p{L}\p{Nd}\+#\./-]+", " ");
        normalized = Regex.Replace(normalized, @"\s+", " ").Trim();

        return $" {normalized} ";
    }
}
