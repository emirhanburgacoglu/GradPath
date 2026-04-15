using GradPath.Business.DTOs.CV;

namespace GradPath.Business.Services;

public interface IPdfService
{
    Task<string> ExtractTextFromPdfAsync(Stream pdfStream);

    Task<CvLayoutDocumentDto> ExtractLayoutDocumentFromPdfAsync(Stream pdfStream);
}
