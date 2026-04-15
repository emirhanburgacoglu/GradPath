using System.Text.RegularExpressions;

namespace GradPath.Business.Services;

public static class CvDateRangeParser
{
    private const string MonthPattern =
        @"(?:Jan(?:uary)?|Feb(?:ruary)?|Mar(?:ch)?|Apr(?:il)?|May|Jun(?:e)?|Jul(?:y)?|Aug(?:ust)?|Sep(?:t(?:ember)?)?|Oct(?:ober)?|Nov(?:ember)?|Dec(?:ember)?)";

    private const string DateValuePattern =
        @"(?:" +
        @"\d{1,2}/\d{4}" +
        @"|" +
        MonthPattern + @"\s+\d{4}" +
        @"|" +
        @"(?:Present|Current)" +
        @"|" +
        @"\d{4}" +
        @")";

    private static readonly Regex DateRangeRegex = new(
        $@"(?<start>{DateValuePattern})\s*(?:-|–|—|to)\s*(?<end>{DateValuePattern})?",
        RegexOptions.IgnoreCase | RegexOptions.Compiled);

    public static bool TryExtractTrailingRange(
        string text,
        out string remainingText,
        out string startDateText,
        out string endDateText)
    {
        remainingText = text?.Trim() ?? string.Empty;
        startDateText = string.Empty;
        endDateText = string.Empty;

        if (string.IsNullOrWhiteSpace(text))
        {
            return false;
        }

        var match = DateRangeRegex.Matches(NormalizeDashes(text))
            .Cast<Match>()
            .LastOrDefault();

        if (match == null || !match.Success)
        {
            return false;
        }

        remainingText = NormalizeWhitespace(text[..match.Index]).Trim().TrimEnd(',', '|', '-');
        startDateText = NormalizeWhitespace(match.Groups["start"].Value);
        endDateText = NormalizeWhitespace(match.Groups["end"].Value);
        return true;
    }

    public static bool TryParseStandaloneRange(
        string text,
        out string startDateText,
        out string endDateText)
    {
        startDateText = string.Empty;
        endDateText = string.Empty;

        if (string.IsNullOrWhiteSpace(text))
        {
            return false;
        }

        var normalized = NormalizeWhitespace(NormalizeDashes(text));
        var match = DateRangeRegex.Match(normalized);
        if (!match.Success || match.Index != 0 || match.Length != normalized.Length)
        {
            return false;
        }

        startDateText = NormalizeWhitespace(match.Groups["start"].Value);
        endDateText = NormalizeWhitespace(match.Groups["end"].Value);
        return true;
    }

    public static bool ContainsDateRange(string text)
    {
        if (string.IsNullOrWhiteSpace(text))
        {
            return false;
        }

        return DateRangeRegex.IsMatch(NormalizeDashes(text));
    }

    private static string NormalizeDashes(string text)
    {
        return text
            .Replace("â€“", "-")
            .Replace("â€”", "-")
            .Replace("–", "-")
            .Replace("—", "-");
    }

    private static string NormalizeWhitespace(string text)
    {
        return Regex.Replace(text, @"\s+", " ").Trim();
    }
}
