namespace GradPath.Business.Services;

public interface IPdfService
{
    /// <summary>
    /// PDF dosyasından ham metni çıkarır.
    /// </summary>
    Task<string> ExtractTextFromPdfAsync(Stream pdfStream);
}
