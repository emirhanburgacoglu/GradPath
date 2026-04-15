using GradPath.Business.DTOs.CV;

namespace GradPath.Business.Services;

public static class CvEducationExtractionHelper
{
    public static List<CvEducationDto> ExtractFromRawText(string rawText)
    {
        var sections = CvSectionDetector.DetectSections(rawText);

        var educationLines = sections
            .Where(section => section.SectionType == CvSectionType.Education)
            .SelectMany(section => section.Lines)
            .ToList();

        var groupedEducation = CvEducationLineGrouper.GroupEducationLines(educationLines);
        var result = new List<CvEducationDto>();

        foreach (var group in groupedEducation)
        {
            if (group.Count == 0)
            {
                continue;
            }

            CvEducationMetadataParser.Parse(
    group,
    out var schoolName,
    out var department,
    out var degree,
    out var startDateText,
    out var endDateText);

            var education = new CvEducationDto
            {
                SchoolName = schoolName,
                Department = department,
                Degree = degree,
                StartDateText = startDateText,
                EndDateText = endDateText
            };


            result.Add(education);
        }

        return result;
    }
}
