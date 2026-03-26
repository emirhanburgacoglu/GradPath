using UglyToad.PdfPig;
using System.Text;

namespace GradPath.Business.Services;

public class PdfService : IPdfService
{
    public async Task<string> ExtractTextFromPdfAsync(Stream pdfStream)
    {
        return await Task.Run(() =>
        {
            var textBuilder = new StringBuilder();
            
            // PDF dosyasını açıyoruz
            using (var document = PdfDocument.Open(pdfStream))
            {
                foreach (var page in document.GetPages())
                {
                    // Sayfadaki kelimeleri birleştirip metne dönüştürüyoruz
                    textBuilder.AppendLine(page.Text);
                }
            }
            
            return textBuilder.ToString();
        });
    }
}
