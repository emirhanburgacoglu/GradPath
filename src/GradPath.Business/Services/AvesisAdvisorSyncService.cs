using System.Net;
using System.Globalization;
using System.Text;
using System.Text.RegularExpressions;
using GradPath.Business.DTOs.Advisor;
using GradPath.Data;
using GradPath.Data.Entities;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Options;

namespace GradPath.Business.Services;

public class AvesisAdvisorSyncService : IAvesisAdvisorSyncService
{
    private static readonly CultureInfo TurkishCulture = new("tr-TR");
    private static readonly Regex H1Regex = new(
        @"<h1[^>]*>\s*(?<value>.*?)\s*</h1>",
        RegexOptions.IgnoreCase | RegexOptions.Singleline | RegexOptions.Compiled);
    private static readonly Regex MailtoRegex = new(
        @"href\s*=\s*[""']mailto:(?<value>[^""'>\s]+)[""']",
        RegexOptions.IgnoreCase | RegexOptions.Singleline | RegexOptions.Compiled);
    private static readonly string[] KnownAcademicTitles =
    {
        "Prof. Dr.",
        "Doç. Dr.",
        "Dr. Öğr. Üyesi",
        "Öğr. Üyesi",
        "Öğr. Gör. Dr.",
        "Öğr. Gör.",
        "Arş. Gör. Dr.",
        "Arş. Gör.",
        "Dr.",
        "Assoc. Prof.",
        "Asst. Prof.",
        "Res. Asst.",
        "Lect.",
        "Instr."
    };

    private readonly HttpClient _httpClient;
    private readonly GradPathDbContext _context;
    private readonly UserManager<AppUser> _userManager;
    private readonly AvesisAdvisorSyncSettings _settings;

    public AvesisAdvisorSyncService(
        HttpClient httpClient,
        GradPathDbContext context,
        UserManager<AppUser> userManager,
        IOptions<AvesisAdvisorSyncSettings> settings)
    {
        _httpClient = httpClient;
        _context = context;
        _userManager = userManager;
        _settings = settings.Value;
    }

    public async Task<AvesisAdvisorSyncResponseDto> SyncComputerEngineeringAsync()
    {
        var response = new AvesisAdvisorSyncResponseDto();
        var department = (await _context.Departments
                .AsNoTracking()
                .ToListAsync())
            .FirstOrDefault(item =>
                NormalizeText(item.Name) == "bilgisayar muhendisligi" ||
                NormalizeText(item.Code) == "bm");

        if (department == null)
        {
            response.Items.Add(new AvesisAdvisorSyncItemResultDto
            {
                SourceUrl = "Bilgisayar Muhendisligi",
                Succeeded = false,
                Message = "Bilgisayar Muhendisligi bolumu veritabaninda bulunamadi."
            });
            response.Total = 1;
            response.FailedCount = 1;
            return response;
        }

        foreach (var url in _settings.ComputerEngineeringProfileUrls
                     .Where(url => !string.IsNullOrWhiteSpace(url))
                     .Distinct(StringComparer.OrdinalIgnoreCase))
        {
            var itemResult = await SyncSingleAdvisorAsync(url.Trim(), department.Id);
            response.Items.Add(itemResult);
        }

        response.Total = response.Items.Count;
        response.SucceededCount = response.Items.Count(item => item.Succeeded);
        response.FailedCount = response.Total - response.SucceededCount;
        return response;
    }

    private async Task<AvesisAdvisorSyncItemResultDto> SyncSingleAdvisorAsync(string sourceUrl, int departmentId)
    {
        try
        {
            var html = await _httpClient.GetStringAsync(sourceUrl);
            var profile = ParseProfile(html, sourceUrl);

            if (string.IsNullOrWhiteSpace(profile.FullName))
            {
                return Fail(sourceUrl, "Profil adi okunamadi.");
            }

            if (string.IsNullOrWhiteSpace(profile.Email))
            {
                return Fail(sourceUrl, "Profil e-posta bilgisi bulunamadi.");
            }

            if (!NormalizeText(profile.InstitutionalInformation).Contains("bilgisayar muhendisligi", StringComparison.Ordinal))
            {
                return Fail(sourceUrl, "Profil Bilgisayar Muhendisligi birimine ait gorunmuyor.");
            }

            var existingUser = await _userManager.Users
                .Include(user => user.AdvisorProfile)
                .FirstOrDefaultAsync(user => user.Email == profile.Email);

            var createdUser = false;

            if (existingUser == null)
            {
                existingUser = new AppUser
                {
                    UserName = profile.Email,
                    Email = profile.Email,
                    EmailConfirmed = true,
                    FullName = profile.FullName,
                    DepartmentId = departmentId,
                    MustChangePassword = true,
                    HasCompletedInitialPasswordSetup = false
                };

                var createResult = await _userManager.CreateAsync(existingUser, _settings.InitialAdvisorPassword);
                if (!createResult.Succeeded)
                {
                    return Fail(sourceUrl, string.Join(" | ", createResult.Errors.Select(error => error.Description)));
                }

                await _userManager.AddToRoleAsync(existingUser, "Advisor");
                createdUser = true;
            }
            else
            {
                existingUser.FullName = profile.FullName;
                existingUser.DepartmentId = departmentId;
                existingUser.Email ??= profile.Email;
                existingUser.UserName ??= profile.Email;

                if (!existingUser.HasCompletedInitialPasswordSetup)
                {
                    existingUser.MustChangePassword = true;
                }
            }

            if (existingUser.AdvisorProfile == null)
            {
                existingUser.AdvisorProfile = new AdvisorProfile
                {
                    UserId = existingUser.Id,
                    CreatedAt = DateTime.UtcNow
                };
            }

            existingUser.AdvisorProfile.AcademicTitle = profile.AcademicTitle;
            existingUser.AdvisorProfile.ExpertiseAreas = profile.ExpertiseAreas;
            existingUser.AdvisorProfile.OfficeLocation = profile.OfficeLocation;
            existingUser.AdvisorProfile.ShortBio = BuildShortBio(profile);
            existingUser.AdvisorProfile.MaxConcurrentStudents = _settings.DefaultMaxConcurrentStudents;
            existingUser.AdvisorProfile.IsAcceptingRequests = true;
            existingUser.AdvisorProfile.SourceUrl = sourceUrl;
            existingUser.AdvisorProfile.LastSyncedAt = DateTime.UtcNow;
            existingUser.AdvisorProfile.UpdatedAt = DateTime.UtcNow;
            existingUser.UpdatedAt = DateTime.UtcNow;

            await _context.SaveChangesAsync();

            return new AvesisAdvisorSyncItemResultDto
            {
                SourceUrl = sourceUrl,
                Succeeded = true,
                Message = createdUser ? "Yeni danisman hesabi olusturuldu." : "Danisman profili guncellendi.",
                FullName = existingUser.FullName,
                Email = existingUser.Email,
                CreatedUser = createdUser,
                UpdatedProfile = true
            };
        }
        catch (Exception ex)
        {
            return Fail(sourceUrl, $"Senkronizasyon sirasinda hata olustu: {ex.Message}");
        }
    }

    private static ParsedAvesisProfile ParseProfile(string html, string sourceUrl)
    {
        var titleLine = CleanHtml(ExtractGroupValue(H1Regex, html));
        var textLines = ExtractTextLines(html);
        var institutionalInfo =
            GetValueAfterLabel(textLines, "Kurum Bilgileri:") ??
            GetValueAfterLabel(textLines, "Institutional Information:") ??
            string.Empty;

        var researchAreas =
            GetValueAfterLabel(textLines, "Avesis Araştırma Alanları:") ??
            GetValueAfterLabel(textLines, "Avesis Arastirma Alanlari:") ??
            GetValueAfterLabel(textLines, "Avesis Research Areas:") ??
            string.Empty;

        var email = CleanHtml(ExtractGroupValue(MailtoRegex, html));
        if (string.IsNullOrWhiteSpace(email))
        {
            email =
                GetValueAfterLabel(textLines, "E-posta") ??
                GetValueAfterLabel(textLines, "Email") ??
                string.Empty;
        }
        var office = GetValueAfterLabel(textLines, "Office");
        var phone =
            GetValueAfterLabel(textLines, "Office Phone") ??
            GetValueAfterLabel(textLines, "Is Telefonu") ??
            GetValueAfterLabel(textLines, "Work Phone");

        var (academicTitle, fullName) = SplitAcademicTitleAndName(titleLine);
        var officeLocation = string.Join(" | ", new[] { office, phone }.Where(item => !string.IsNullOrWhiteSpace(item)));

        return new ParsedAvesisProfile
        {
            FullName = ToTitleCasePreservingTurkish(fullName),
            AcademicTitle = MapAcademicTitle(academicTitle),
            InstitutionalInformation = institutionalInfo,
            ExpertiseAreas = researchAreas,
            Email = email,
            OfficeLocation = string.IsNullOrWhiteSpace(officeLocation) ? null : officeLocation,
            SourceUrl = sourceUrl
        };
    }

    private static string BuildShortBio(ParsedAvesisProfile profile)
    {
        var parts = new List<string>();

        if (!string.IsNullOrWhiteSpace(profile.InstitutionalInformation))
        {
            parts.Add(profile.InstitutionalInformation);
        }

        if (!string.IsNullOrWhiteSpace(profile.ExpertiseAreas))
        {
            parts.Add($"Arastirma alanlari: {profile.ExpertiseAreas}");
        }

        return string.Join(". ", parts);
    }

    private static string ExtractGroupValue(Regex regex, string input)
    {
        var match = regex.Match(input);
        return match.Success ? match.Groups["value"].Value : string.Empty;
    }

    private static string CleanHtml(string value)
    {
        if (string.IsNullOrWhiteSpace(value))
        {
            return string.Empty;
        }

        var withoutTags = Regex.Replace(value, "<.*?>", " ");
        var decoded = WebUtility.HtmlDecode(withoutTags);
        var normalized = Regex.Replace(decoded, @"\s+", " ").Trim();
        return normalized;
    }

    private static List<string> ExtractTextLines(string html)
    {
        if (string.IsNullOrWhiteSpace(html))
        {
            return new List<string>();
        }

        var withBreaks = html
            .Replace("<br>", "\n", StringComparison.OrdinalIgnoreCase)
            .Replace("<br/>", "\n", StringComparison.OrdinalIgnoreCase)
            .Replace("<br />", "\n", StringComparison.OrdinalIgnoreCase)
            .Replace("</p>", "\n", StringComparison.OrdinalIgnoreCase)
            .Replace("</div>", "\n", StringComparison.OrdinalIgnoreCase)
            .Replace("</li>", "\n", StringComparison.OrdinalIgnoreCase)
            .Replace("</h1>", "\n", StringComparison.OrdinalIgnoreCase)
            .Replace("</h2>", "\n", StringComparison.OrdinalIgnoreCase)
            .Replace("</h3>", "\n", StringComparison.OrdinalIgnoreCase)
            .Replace("</h4>", "\n", StringComparison.OrdinalIgnoreCase);

        var plainText = CleanHtmlPreservingLines(withBreaks);

        return plainText
            .Split('\n', StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries)
            .Where(line => !string.IsNullOrWhiteSpace(line))
            .ToList();
    }

    private static string CleanHtmlPreservingLines(string value)
    {
        var withoutTags = Regex.Replace(value, "<.*?>", string.Empty);
        var decoded = WebUtility.HtmlDecode(withoutTags);
        var normalized = Regex.Replace(decoded, @"[ \t]+", " ");
        normalized = Regex.Replace(normalized, @"\r\n|\r", "\n");
        normalized = Regex.Replace(normalized, @"\n{2,}", "\n");
        return normalized.Trim();
    }

    private static string? GetValueAfterLabel(IReadOnlyList<string> lines, string label)
    {
        for (var index = 0; index < lines.Count; index++)
        {
            var currentLine = lines[index];

            if (!currentLine.StartsWith(label, StringComparison.OrdinalIgnoreCase))
            {
                continue;
            }

            var sameLineValue = currentLine[label.Length..].Trim(' ', ':');
            if (!string.IsNullOrWhiteSpace(sameLineValue))
            {
                return sameLineValue;
            }

            if (index + 1 < lines.Count)
            {
                var nextLine = lines[index + 1].Trim();
                return string.IsNullOrWhiteSpace(nextLine) ? null : nextLine;
            }
        }

        return null;
    }

    private static (string AcademicTitle, string FullName) SplitAcademicTitleAndName(string titleLine)
    {
        if (string.IsNullOrWhiteSpace(titleLine))
        {
            return (string.Empty, string.Empty);
        }

        var normalizedTitleLine = Regex.Replace(titleLine, @"\s+", " ").Trim();

        foreach (var prefix in KnownAcademicTitles.OrderByDescending(item => item.Length))
        {
            if (normalizedTitleLine.StartsWith(prefix, StringComparison.OrdinalIgnoreCase))
            {
                return (prefix, normalizedTitleLine[prefix.Length..].Trim());
            }
        }

        return (string.Empty, normalizedTitleLine);
    }

    private static string MapAcademicTitle(string title)
    {
        return title.Trim() switch
        {
            "Prof. Dr." => "Prof. Dr.",
            "Doç. Dr." => "Doç. Dr.",
            "Dr. Öğr. Üyesi" => "Dr. Öğr. Üyesi",
            "Öğr. Üyesi" => "Dr. Öğr. Üyesi",
            "Öğr. Gör. Dr." => "Öğr. Gör. Dr.",
            "Öğr. Gör." => "Öğr. Gör.",
            "Arş. Gör. Dr." => "Arş. Gör. Dr.",
            "Arş. Gör." => "Arş. Gör.",
            "Assoc. Prof." => "Doc. Dr.",
            "Asst. Prof." => "Dr. Ogr. Uyesi",
            "Res. Asst." => "Ars. Gor.",
            "Lect." => "Ogr. Gor.",
            "Instr." => "Ogr. Gor.",
            "Dr." => "Dr.",
            _ => string.IsNullOrWhiteSpace(title) ? "Akademisyen" : title
        };
    }

    private static string NormalizeText(string? value)
    {
        if (string.IsNullOrWhiteSpace(value))
        {
            return string.Empty;
        }

        var replacements = new Dictionary<char, char>
        {
            ['ç'] = 'c', ['Ç'] = 'c',
            ['ğ'] = 'g', ['Ğ'] = 'g',
            ['ı'] = 'i', ['İ'] = 'i',
            ['ö'] = 'o', ['Ö'] = 'o',
            ['ş'] = 's', ['Ş'] = 's',
            ['ü'] = 'u', ['Ü'] = 'u'
        };

        var builder = new StringBuilder(value.Length);

        foreach (var character in value)
        {
            if (replacements.TryGetValue(character, out var replacement))
            {
                builder.Append(replacement);
            }
            else
            {
                builder.Append(char.ToLowerInvariant(character));
            }
        }

        return Regex.Replace(builder.ToString(), @"\s+", " ").Trim();
    }

    private static string ToTitleCasePreservingTurkish(string value)
    {
        if (string.IsNullOrWhiteSpace(value))
        {
            return string.Empty;
        }

        var normalized = Regex.Replace(value.Trim(), @"\s+", " ");
        var lower = TurkishCulture.TextInfo.ToLower(normalized);
        return TurkishCulture.TextInfo.ToTitleCase(lower);
    }

    private static AvesisAdvisorSyncItemResultDto Fail(string sourceUrl, string message)
    {
        return new AvesisAdvisorSyncItemResultDto
        {
            SourceUrl = sourceUrl,
            Succeeded = false,
            Message = message
        };
    }

    private sealed class ParsedAvesisProfile
    {
        public string FullName { get; set; } = string.Empty;
        public string AcademicTitle { get; set; } = string.Empty;
        public string InstitutionalInformation { get; set; } = string.Empty;
        public string ExpertiseAreas { get; set; } = string.Empty;
        public string Email { get; set; } = string.Empty;
        public string? OfficeLocation { get; set; }
        public string SourceUrl { get; set; } = string.Empty;
    }
}
