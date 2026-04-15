namespace GradPath.Business.Services;

public static class CvExperienceMetadataParser
{
    public static void ParseCompanyAndDates(
        string line,
        out string companyName,
        out string startDateText,
        out string endDateText)
    {
        companyName = string.Empty;
        startDateText = string.Empty;
        endDateText = string.Empty;

        if (string.IsNullOrWhiteSpace(line))
        {
            return;
        }

        var normalizedLine = line
            .Replace("–", " - ")
            .Replace("—", " - ")
            .Trim();

        var separatorIndex = normalizedLine.IndexOf(" - ", StringComparison.Ordinal);
        if (separatorIndex < 0)
        {
            companyName = normalizedLine;
            return;
        }

        companyName = normalizedLine[..separatorIndex].Trim();
        var datePart = normalizedLine[(separatorIndex + 3)..].Trim();

        if (string.IsNullOrWhiteSpace(datePart))
        {
            return;
        }

        var toIndex = datePart.IndexOf(" to ", StringComparison.OrdinalIgnoreCase);
        if (toIndex > 0)
        {
            startDateText = datePart[..toIndex].Trim();
            endDateText = datePart[(toIndex + 4)..].Trim();
            return;
        }

        startDateText = datePart;
    }
}
