using GradPath.Business.DTOs.CV;

namespace GradPath.Business.Services;

public static class CvAnalysisBuilder
{
    public static CvAnalysisResultDto Build(CvLayoutDocumentDto document)
    {
        return Build(document.RawText);
    }

    public static CvAnalysisResultDto Build(string rawText)
    {
        var analysis = new CvAnalysisResultDto
        {
            RawSummary = rawText,
            NormalizedSummary = string.Empty,
            SkillsByCategory = CvSkillExtractionHelper.ExtractFromRawText(rawText),
            Projects = CvProjectExtractionHelper.ExtractFromRawText(rawText),
            Experiences = CvExperienceExtractionHelper.ExtractFromRawText(rawText),
            Education = CvEducationExtractionHelper.ExtractFromRawText(rawText),
            DomainSignals = new List<string>()
        };

        analysis.DomainSignals = CvDomainSignalBuilder.Build(analysis);
        analysis.NormalizedSummary = CvSummaryBuilder.Build(analysis);

        return analysis;
    }
}
