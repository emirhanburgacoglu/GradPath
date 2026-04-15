using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Text.Json;
using GradPath.Business.DTOs.CV;
using GradPath.Business.Services;
using Npgsql;

var repoRoot = Directory.GetCurrentDirectory();
var appSettingsPath = Path.Combine(repoRoot, "src", "GradPath.API", "appsettings.json");

if (!File.Exists(appSettingsPath))
{
    Console.WriteLine($"appsettings.json not found: {appSettingsPath}");
    return;
}

using var appSettingsDoc = JsonDocument.Parse(await File.ReadAllTextAsync(appSettingsPath));
var connectionString = appSettingsDoc.RootElement
    .GetProperty("ConnectionStrings")
    .GetProperty("DefaultConnection")
    .GetString();

if (string.IsNullOrWhiteSpace(connectionString))
{
    Console.WriteLine("Connection string not found.");
    return;
}

var uploadsRoot = Path.Combine(repoRoot, "src", "GradPath.API", "wwwroot", "uploads", "cvs");
var pdfService = new PdfService();

var scanned = 0;
var refreshed = 0;
var skipped = 0;

await using var connection = new NpgsqlConnection(connectionString);
await connection.OpenAsync();

var selectSql = @"
select ""Id"", ""CvFileName"", coalesce(""ParsedCvData"", '')
from ""StudentProfiles""
where ""CvFileName"" is not null
order by ""UpdatedAt"" desc nulls last;";

await using var selectCommand = new NpgsqlCommand(selectSql, connection);
await using var reader = await selectCommand.ExecuteReaderAsync();

var rows = new List<(Guid Id, string CvFileName, string ParsedCvData)>();
while (await reader.ReadAsync())
{
    rows.Add((
        reader.GetGuid(0),
        reader.GetString(1),
        reader.GetString(2)));
}

await reader.CloseAsync();

foreach (var row in rows)
{
    scanned++;

    if (!NeedsRefresh(row.ParsedCvData))
    {
        skipped++;
        continue;
    }

    var cvPath = Path.Combine(uploadsRoot, row.CvFileName);
    if (!File.Exists(cvPath))
    {
        Console.WriteLine($"Missing file: {row.CvFileName}");
        skipped++;
        continue;
    }

    await using var stream = File.OpenRead(cvPath);
    var layoutDocument = await pdfService.ExtractLayoutDocumentFromPdfAsync(stream);
    if (string.IsNullOrWhiteSpace(layoutDocument.RawText))
    {
        Console.WriteLine($"Empty extract: {row.CvFileName}");
        skipped++;
        continue;
    }

    var normalizedText = CvTextPreprocessor.Normalize(layoutDocument.RawText);
    if (string.IsNullOrWhiteSpace(normalizedText))
    {
        Console.WriteLine($"Empty normalized text: {row.CvFileName}");
        skipped++;
        continue;
    }

    var analysis = CvAnalysisBuilder.Build(normalizedText);
    var serializedAnalysis = JsonSerializer.Serialize(analysis);

    var updateSql = @"
update ""StudentProfiles""
set ""ParsedCvData"" = @parsedCvData,
    ""UpdatedAt"" = now()
where ""Id"" = @id;";

    await using var updateCommand = new NpgsqlCommand(updateSql, connection);
    updateCommand.Parameters.AddWithValue("parsedCvData", serializedAnalysis);
    updateCommand.Parameters.AddWithValue("id", row.Id);
    await updateCommand.ExecuteNonQueryAsync();

    refreshed++;
    Console.WriteLine($"Reprocessed: {row.CvFileName}");
}

Console.WriteLine($"Scanned: {scanned}");
Console.WriteLine($"Refreshed: {refreshed}");
Console.WriteLine($"Skipped: {skipped}");

static bool NeedsRefresh(string parsedCvData)
{
    if (string.IsNullOrWhiteSpace(parsedCvData) || parsedCvData == "{}")
    {
        return true;
    }

    try
    {
        var analysis = JsonSerializer.Deserialize<CvAnalysisResultDto>(
            parsedCvData,
            new JsonSerializerOptions
            {
                PropertyNameCaseInsensitive = true
            });

        if (analysis == null)
        {
            return true;
        }

        var skillCount = analysis.SkillsByCategory.Sum(category => category.Skills?.Count ?? 0);
        if (skillCount == 0)
        {
            return true;
        }

        return analysis.RawSummary.Contains("\nPROJECTS\nI developed", StringComparison.OrdinalIgnoreCase)
            || analysis.RawSummary.Contains("\nLANGUAGES\n:", StringComparison.OrdinalIgnoreCase);
    }
    catch
    {
        return true;
    }
}
