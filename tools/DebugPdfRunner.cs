using System;
using System.IO;
using System.Text.Json;
using GradPath.Business.Services;

if (args.Length == 0)
{
    Console.WriteLine("Usage: DebugPdfRunner <pdf-path> [<pdf-path>...]");
    return;
}

var pdfService = new PdfService();

foreach (var pdfPath in args)
{
    Console.WriteLine(new string('=', 100));
    Console.WriteLine($"FILE: {pdfPath}");

    if (!File.Exists(pdfPath))
    {
        Console.WriteLine("STATUS: File not found.");
        continue;
    }

    await using var stream = File.OpenRead(pdfPath);
    var layoutDocument = await pdfService.ExtractLayoutDocumentFromPdfAsync(stream);
    var normalizedText = CvTextPreprocessor.Normalize(layoutDocument.RawText);
    var sections = CvSectionDetector.DetectSections(normalizedText);
    var analysis = CvAnalysisBuilder.Build(normalizedText);

    Console.WriteLine($"RAW_TEXT_LENGTH: {layoutDocument.RawText.Length}");
    Console.WriteLine($"NORMALIZED_TEXT_LENGTH: {normalizedText.Length}");
    Console.WriteLine($"BLOCK_COUNT: {layoutDocument.Blocks.Count}");
    Console.WriteLine($"SECTION_COUNT: {sections.Count}");
    Console.WriteLine();

    Console.WriteLine("SECTIONS:");
    foreach (var section in sections)
    {
        Console.WriteLine($"- {section.SectionType}: {section.Title} ({section.Lines.Count} lines)");
    }

    Console.WriteLine();
    Console.WriteLine("ANALYSIS:");
    Console.WriteLine(JsonSerializer.Serialize(analysis, new JsonSerializerOptions
    {
        WriteIndented = true
    }));

    Console.WriteLine();
    Console.WriteLine("RAW_TEXT_PREVIEW:");
    Console.WriteLine(TrimForPreview(layoutDocument.RawText));

    Console.WriteLine();
    Console.WriteLine("NORMALIZED_TEXT_PREVIEW:");
    Console.WriteLine(TrimForPreview(normalizedText));
    Console.WriteLine();
}

static string TrimForPreview(string text)
{
    if (string.IsNullOrWhiteSpace(text))
    {
        return "<empty>";
    }

    const int maxLength = 4000;
    var normalized = text.Replace("\r", "");

    if (normalized.Length <= maxLength)
    {
        return normalized;
    }

    return normalized[..maxLength] + "\n...[truncated]...";
}
