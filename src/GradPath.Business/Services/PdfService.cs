using System.Text;
using GradPath.Business.DTOs.CV;
using UglyToad.PdfPig;
using UglyToad.PdfPig.Content;

namespace GradPath.Business.Services;

public class PdfService : IPdfService
{
    private const double LineTolerance = 4.0;
    private const double ParagraphGap = 10.0;

    public async Task<string> ExtractTextFromPdfAsync(Stream pdfStream)
    {
        var document = await ExtractLayoutDocumentFromPdfAsync(pdfStream);
        return document.RawText;
    }

    public async Task<CvLayoutDocumentDto> ExtractLayoutDocumentFromPdfAsync(Stream pdfStream)
    {
        var pdfBytes = await ReadAllBytesAsync(pdfStream);

        return await Task.Run(() =>
        {
            using var memoryStream = new MemoryStream(pdfBytes, writable: false);
            using var document = PdfDocument.Open(memoryStream);

            var blocks = new List<CvLayoutBlockDto>();
            var textBuilder = new StringBuilder();

            foreach (var page in document.GetPages())
            {
                var pageBlocks = BuildPageBlocks(page).ToList();

                foreach (var block in pageBlocks)
                {
                    blocks.Add(block);
                    textBuilder.AppendLine(block.Text);
                }

                if (pageBlocks.Count > 0)
                {
                    textBuilder.AppendLine();
                }
            }

            return new CvLayoutDocumentDto
            {
                RawText = textBuilder.ToString().Trim(),
                Blocks = blocks
            };
        });
    }

    private static async Task<byte[]> ReadAllBytesAsync(Stream stream)
    {
        if (stream.CanSeek)
        {
            stream.Position = 0;
        }

        using var memoryStream = new MemoryStream();
        await stream.CopyToAsync(memoryStream);
        return memoryStream.ToArray();
    }

    private static IEnumerable<CvLayoutBlockDto> BuildPageBlocks(Page page)
    {
        var lines = BuildLines(page.GetWords()).ToList();
        if (lines.Count == 0)
        {
            yield break;
        }

        var pageWidth = ToDouble(page.Width);
        var hasTwoColumns = DetectTwoColumns(lines, pageWidth);
        var columnCount = hasTwoColumns ? 2 : 1;

        for (int columnIndex = 0; columnIndex < columnCount; columnIndex++)
        {
            var linesInColumn = lines
                .Where(line => !hasTwoColumns || GetColumnIndex(line.CenterX, pageWidth) == columnIndex)
                .OrderByDescending(line => line.Top)
                .ThenBy(line => line.Left)
                .ToList();

            if (linesInColumn.Count == 0)
            {
                continue;
            }

            var paragraph = new List<PdfLine>();

            foreach (var line in linesInColumn)
            {
                if (paragraph.Count == 0)
                {
                    paragraph.Add(line);
                    continue;
                }

                var previousLine = paragraph[^1];
                var verticalGap = previousLine.Bottom - line.Top;

                if (verticalGap > ParagraphGap)
                {
                    yield return ToBlock(page.Number, columnIndex, paragraph);
                    paragraph = new List<PdfLine> { line };
                    continue;
                }

                paragraph.Add(line);
            }

            if (paragraph.Count > 0)
            {
                yield return ToBlock(page.Number, columnIndex, paragraph);
            }
        }
    }

    private static IEnumerable<PdfLine> BuildLines(IEnumerable<Word> words)
    {
        var orderedWords = words
            .Select(word => new PdfWord
            {
                Text = word.Text,
                Left = ToDouble(word.BoundingBox.Left),
                Right = ToDouble(word.BoundingBox.Right),
                Bottom = ToDouble(word.BoundingBox.Bottom),
                Top = ToDouble(word.BoundingBox.Top)
            })
            .Where(word => !string.IsNullOrWhiteSpace(word.Text))
            .OrderByDescending(word => word.Top)
            .ThenBy(word => word.Left)
            .ToList();

        var lines = new List<List<PdfWord>>();

        foreach (var word in orderedWords)
        {
            var existingLine = lines.FirstOrDefault(line =>
                Math.Abs(line[0].Bottom - word.Bottom) <= LineTolerance);

            if (existingLine == null)
            {
                lines.Add(new List<PdfWord> { word });
                continue;
            }

            existingLine.Add(word);
        }

        return lines
            .Select(line =>
            {
                var sortedLine = line.OrderBy(word => word.Left).ToList();
                var left = sortedLine.Min(word => word.Left);
                var right = sortedLine.Max(word => word.Right);
                var bottom = sortedLine.Min(word => word.Bottom);
                var top = sortedLine.Max(word => word.Top);

                return new PdfLine
                {
                    Text = string.Join(" ", sortedLine.Select(word => word.Text)).Trim(),
                    Left = left,
                    Right = right,
                    Bottom = bottom,
                    Top = top,
                    CenterX = (left + right) / 2.0
                };
            })
            .Where(line => !string.IsNullOrWhiteSpace(line.Text))
            .ToList();
    }

    private static bool DetectTwoColumns(IEnumerable<PdfLine> lines, double pageWidth)
    {
        var centers = lines.Select(line => line.CenterX).ToList();
        if (centers.Count < 6)
        {
            return false;
        }

        var leftCount = centers.Count(center => center < pageWidth * 0.45);
        var rightCount = centers.Count(center => center > pageWidth * 0.55);

        return leftCount >= 3 && rightCount >= 3;
    }

    private static int GetColumnIndex(double centerX, double pageWidth)
    {
        return centerX < pageWidth / 2.0 ? 0 : 1;
    }

    private static CvLayoutBlockDto ToBlock(int pageNumber, int columnIndex, List<PdfLine> lines)
    {
        var orderedLines = lines
            .OrderByDescending(line => line.Top)
            .ThenBy(line => line.Left)
            .ToList();

        return new CvLayoutBlockDto
        {
            PageNumber = pageNumber,
            ColumnIndex = columnIndex,
            X = orderedLines.Min(line => line.Left),
            Y = orderedLines.Max(line => line.Top),
            Width = orderedLines.Max(line => line.Right) - orderedLines.Min(line => line.Left),
            Height = orderedLines.Max(line => line.Top) - orderedLines.Min(line => line.Bottom),
            Text = string.Join("\n", orderedLines.Select(line => line.Text))
        };
    }

    private static double ToDouble(object value)
    {
        return Convert.ToDouble(value);
    }

    private sealed class PdfWord
    {
        public string Text { get; set; } = string.Empty;
        public double Left { get; set; }
        public double Right { get; set; }
        public double Bottom { get; set; }
        public double Top { get; set; }
    }

    private sealed class PdfLine
    {
        public string Text { get; set; } = string.Empty;
        public double Left { get; set; }
        public double Right { get; set; }
        public double Bottom { get; set; }
        public double Top { get; set; }
        public double CenterX { get; set; }
    }
}
