using System.Net;
using System.Globalization;
using System.Text.Json;
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
        var department = await FindComputerEngineeringDepartmentAsync();

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

        var advisorSources = await GetComputerEngineeringAdvisorSourcesAsync();

        if (advisorSources.Count == 0)
        {
            response.Items.Add(new AvesisAdvisorSyncItemResultDto
            {
                SourceUrl = _settings.ComputerEngineeringDirectoryUrl,
                Succeeded = false,
                Message = "Bilgisayar Muhendisligi icin Avesis profil linkleri bulunamadi."
            });
            response.Total = 1;
            response.FailedCount = 1;
            return response;
        }

        foreach (var advisorSource in advisorSources)
        {
            var itemResult = await SyncSingleAdvisorAsync(
                advisorSource.ProfileUrl.Trim(),
                department.Id,
                advisorSource.ProfilePhotoUrl);
            response.Items.Add(itemResult);
        }

        response.Total = response.Items.Count;
        response.SucceededCount = response.Items.Count(item => item.Succeeded);
        response.FailedCount = response.Total - response.SucceededCount;
        return response;
    }

    public async Task<AvesisAdvisorResyncResponseDto> ResyncComputerEngineeringAsync()
    {
        var reset = await ResetComputerEngineeringAdvisorsAsync();
        var sync = await SyncComputerEngineeringAsync();

        return new AvesisAdvisorResyncResponseDto
        {
            Reset = reset,
            Sync = sync
        };
    }

    public async Task<AdvisorResetResponseDto> ResetComputerEngineeringAdvisorsAsync()
    {
        var response = new AdvisorResetResponseDto();
        var department = await FindComputerEngineeringDepartmentAsync();

        if (department == null)
        {
            return response;
        }

        var advisorUsersInRole = await _userManager.GetUsersInRoleAsync("Advisor");
        var advisorRoleUserIds = advisorUsersInRole
            .Select(user => user.Id)
            .ToHashSet();

        var advisors = await _context.Users
            .Include(user => user.AdvisorProfile)
            .Where(user =>
                advisorRoleUserIds.Contains(user.Id) &&
                user.DepartmentId == department.Id &&
                user.AdvisorProfile != null)
            .ToListAsync();

        if (advisors.Count == 0)
        {
            return response;
        }

        var advisorIds = advisors
            .Select(user => user.Id)
            .ToHashSet();

        var advisorRequests = await _context.AdvisorRequests
            .Where(request => advisorIds.Contains(request.AdvisorUserId))
            .ToListAsync();

        var advisorProjects = await _context.Projects
            .Where(project => project.AdvisorUserId.HasValue && advisorIds.Contains(project.AdvisorUserId.Value))
            .ToListAsync();

        foreach (var project in advisorProjects)
        {
            project.AdvisorUserId = null;
            project.UpdatedAt = DateTime.UtcNow;
        }

        _context.AdvisorRequests.RemoveRange(advisorRequests);
        await _context.SaveChangesAsync();

        foreach (var advisor in advisors)
        {
            var email = advisor.Email ?? advisor.UserName ?? advisor.Id.ToString();
            var deleteResult = await _userManager.DeleteAsync(advisor);

            if (!deleteResult.Succeeded)
            {
                continue;
            }

            response.DeletedEmails.Add(email);
        }

        response.DeletedAdvisorCount = response.DeletedEmails.Count;
        response.DeletedRequestCount = advisorRequests.Count;
        response.DetachedProjectCount = advisorProjects.Count;
        return response;
    }

    private async Task<AvesisAdvisorSyncItemResultDto> SyncSingleAdvisorAsync(
        string sourceUrl,
        int departmentId,
        string? profilePhotoUrl)
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
            existingUser.AdvisorProfile.ProfilePhotoUrl = profilePhotoUrl;
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

    private async Task<Department?> FindComputerEngineeringDepartmentAsync()
    {
        return (await _context.Departments
                .AsNoTracking()
                .ToListAsync())
            .FirstOrDefault(item =>
                NormalizeText(item.Name) == "bilgisayar muhendisligi" ||
                NormalizeText(item.Code) == "bm");
    }

    private async Task<List<AdvisorSource>> GetComputerEngineeringAdvisorSourcesAsync()
    {
        var sourcesFromDirectoryPage = await GetAdvisorSourcesFromDirectoryPageAsync();
        if (sourcesFromDirectoryPage.Count > 0)
        {
            return sourcesFromDirectoryPage;
        }

        var sourcesFromUnitResearcherList = await GetAdvisorSourcesFromUnitResearcherListAsync();
        if (sourcesFromUnitResearcherList.Count > 0)
        {
            return sourcesFromUnitResearcherList;
        }

        return _settings.ComputerEngineeringProfileUrls
            .Where(url => !string.IsNullOrWhiteSpace(url))
            .Select(url => new AdvisorSource
            {
                ProfileUrl = url.Trim().TrimEnd('/')
            })
            .GroupBy(item => item.ProfileUrl, StringComparer.OrdinalIgnoreCase)
            .Select(group => group.First())
            .ToList();
    }

    private async Task<List<AdvisorSource>> GetAdvisorSourcesFromDirectoryPageAsync()
    {
        if (string.IsNullOrWhiteSpace(_settings.ComputerEngineeringDirectoryUrl))
        {
            return new List<AdvisorSource>();
        }

        try
        {
            var html = await _httpClient.GetStringAsync(_settings.ComputerEngineeringDirectoryUrl);
            var matches = Regex.Matches(
                html,
                @"<article[^>]*class\s*=\s*[""'][^""']*academic-card[^""']*[""'][^>]*>.*?<div[^>]*class\s*=\s*[""'][^""']*academic-photo[^""']*[""'][^>]*>.*?<img[^>]*src\s*=\s*[""'](?<image>[^""']+)[""'][^>]*>.*?<a[^>]*href\s*=\s*[""'](?<url>https://avesis\.mcbu\.edu\.tr/[^""'#?\s<>]+)[""']",
                RegexOptions.IgnoreCase | RegexOptions.Singleline | RegexOptions.Compiled);

            return matches
                .Select(match => new AdvisorSource
                {
                    ProfileUrl = match.Groups["url"].Value.Trim().TrimEnd('/'),
                    ProfilePhotoUrl = BuildAbsoluteUrl(_settings.ComputerEngineeringDirectoryUrl, match.Groups["image"].Value)
                })
                .Where(item => !string.IsNullOrWhiteSpace(item.ProfileUrl))
                .GroupBy(item => item.ProfileUrl, StringComparer.OrdinalIgnoreCase)
                .Select(group => group.First())
                .ToList();
        }
        catch
        {
            return new List<AdvisorSource>();
        }
    }

    private async Task<List<AdvisorSource>> GetAdvisorSourcesFromUnitResearcherListAsync()
    {
        if (string.IsNullOrWhiteSpace(_settings.BaseUrl) || _settings.ComputerEngineeringUnitId <= 0)
        {
            return new List<AdvisorSource>();
        }

        var baseUrl = _settings.BaseUrl.Trim().TrimEnd('/');
        var requestUrl =
            $"{baseUrl}/unitreport/getunitresearcherlist?unitId={_settings.ComputerEngineeringUnitId}&unitType=Department";

        using var request = new HttpRequestMessage(HttpMethod.Get, requestUrl);
        request.Headers.Add("X-Requested-With", "XMLHttpRequest");
        request.Headers.Referrer = new Uri($"{baseUrl}/unitreport/reports?unitId={_settings.ComputerEngineeringUnitId}");

        try
        {
            using var response = await _httpClient.SendAsync(request);
            response.EnsureSuccessStatusCode();

            var json = await response.Content.ReadAsStringAsync();
            var researchers = JsonSerializer.Deserialize<List<AvesisUnitResearcherDto>>(
                json,
                new JsonSerializerOptions
                {
                    PropertyNameCaseInsensitive = true
                });

            if (researchers == null)
            {
                return new List<AdvisorSource>();
            }

            return researchers
                .Where(item => !string.IsNullOrWhiteSpace(item.ProfilePageAlias))
                .Select(item => new AdvisorSource
                {
                    ProfileUrl = $"{baseUrl}/{item.ProfilePageAlias.Trim().TrimStart('/').TrimEnd('/')}",
                    ProfilePhotoUrl = item.Id > 0 ? $"{baseUrl}/user/image?id={item.Id}" : null
                })
                .GroupBy(item => item.ProfileUrl, StringComparer.OrdinalIgnoreCase)
                .Select(group => group.First())
                .ToList();
        }
        catch
        {
            return new List<AdvisorSource>();
        }
    }

    private static string? BuildAbsoluteUrl(string pageUrl, string? rawUrl)
    {
        if (string.IsNullOrWhiteSpace(rawUrl))
        {
            return null;
        }

        if (Uri.TryCreate(rawUrl, UriKind.Absolute, out var absoluteUri))
        {
            return absoluteUri.ToString();
        }

        if (!Uri.TryCreate(pageUrl, UriKind.Absolute, out var pageUri))
        {
            return rawUrl;
        }

        return new Uri(pageUri, rawUrl).ToString();
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

    private sealed class AvesisUnitResearcherDto
    {
        public int Id { get; set; }
        public string ProfilePageAlias { get; set; } = string.Empty;
    }

    private sealed class AdvisorSource
    {
        public string ProfileUrl { get; set; } = string.Empty;
        public string? ProfilePhotoUrl { get; set; }
    }
}
