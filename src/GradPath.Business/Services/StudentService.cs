using System.Text.Json;
using GradPath.Business.DTOs.CV;
using GradPath.Business.DTOs.Student;
using GradPath.Data;
using GradPath.Data.Entities;
using Microsoft.AspNetCore.Hosting;
using Microsoft.EntityFrameworkCore;

namespace GradPath.Business.Services;

public class StudentService : IStudentService
{
    private readonly GradPathDbContext _context;
    private readonly IPdfService _pdfService;
    private readonly IGroqApiService _groqApiService;
    private readonly IWebHostEnvironment _webHostEnvironment;

    public StudentService(
        GradPathDbContext context,
        IPdfService pdfService,
        IGroqApiService groqApiService,
        IWebHostEnvironment webHostEnvironment)
    {
        _context = context;
        _pdfService = pdfService;
        _groqApiService = groqApiService;
        _webHostEnvironment = webHostEnvironment;
    }

    public async Task<bool> ProcessTranscriptAsync(Guid userId, Stream pdfStream)
    {
        var rawText = await _pdfService.ExtractTextFromPdfAsync(pdfStream);
        if (string.IsNullOrWhiteSpace(rawText))
        {
            return false;
        }

        var prompt = $@"Asagidaki transkript metninden su bilgileri cikar ve SADECE JSON formatinda don.
        JSON yapisi tam olarak soyle olmali:
        {{
            ""CGPA"": 3.50,
            ""TotalECTS"": 180,
            ""Technologies"": [""C#"", ""React"", ""SQL""]
        }}

        Eger bir veri bulunamazsa CGPA icin 0, ECTS icin 0, Technologies icin bos liste dondur.

        Transkript Metni:
        {rawText}";

        var aiResponse = await _groqApiService.GetJsonExtractionAsync(
            "Sen bir akademik veri analiz asistanısın. Sadece saf JSON formatında cevap verirsin. JSON dışında açıklama veya not yazma.",
            prompt);

        try
        {
            var cleanJson = aiResponse.Replace("```json", "").Replace("```", "").Trim();

            using var doc = JsonDocument.Parse(cleanJson);
            var root = doc.RootElement;

            var profile = await _context.StudentProfiles.FirstOrDefaultAsync(p => p.UserId == userId);
            if (profile == null)
            {
                return false;
            }

            if (root.TryGetProperty("CGPA", out var cgpaProp))
            {
                profile.CGPA = cgpaProp.GetDecimal();
            }

            if (root.TryGetProperty("TotalECTS", out var ectsProp))
            {
                profile.TotalECTS = ectsProp.GetInt32();
            }

            profile.UpdatedAt = DateTime.UtcNow;
            profile.IsHonorStudent = profile.CGPA >= 3.0m;

            if (root.TryGetProperty("Technologies", out var technologiesProp))
            {
                var canonicalTechnologyMap = await GetCanonicalTechnologyMapAsync();

                foreach (var technologyValue in technologiesProp.EnumerateArray())
                {
                    var technologyName = technologyValue.GetString();
                    if (string.IsNullOrWhiteSpace(technologyName))
                    {
                        continue;
                    }

                    if (!canonicalTechnologyMap.TryGetValue(technologyName.Trim().ToLowerInvariant(), out var technology))
                    {
                        continue;
                    }

                    var exists = await _context.StudentTechnologies
                        .AnyAsync(st => st.UserId == userId && st.TechnologyId == technology.Id);

                    if (!exists)
                    {
                        _context.StudentTechnologies.Add(new StudentTechnology
                        {
                            UserId = userId,
                            TechnologyId = technology.Id,
                            ProficiencyLevel = 2
                        });
                    }
                }
            }

            await _context.SaveChangesAsync();
        }
        catch
        {
            return false;
        }

        return true;
    }

    public async Task<StudentProfileResponseDto?> GetProfileByUserIdAsync(Guid userId)
    {
        var profile = await _context.StudentProfiles
            .Include(p => p.User)
            .FirstOrDefaultAsync(p => p.UserId == userId);

        if (profile == null)
        {
            var user = await _context.Users.FindAsync(userId);
            if (user == null)
            {
                return null;
            }

            profile = new StudentProfile
            {
                UserId = userId,
                CreatedAt = DateTime.UtcNow,
                User = user
            };

            _context.StudentProfiles.Add(profile);
            await _context.SaveChangesAsync();
        }

        await EnsureCvAnalysisIsFreshAsync(profile);

        string? cvSummary = null;
        string? cvAnalysisJson = profile.ParsedCvData;

        if (!string.IsNullOrWhiteSpace(profile.ParsedCvData))
        {
            try
            {
                using var doc = JsonDocument.Parse(profile.ParsedCvData);
                if (doc.RootElement.TryGetProperty("NormalizedSummary", out var summaryProp))
                {
                    cvSummary = summaryProp.GetString();
                }
                else if (doc.RootElement.TryGetProperty("normalizedSummary", out var camelSummaryProp))
                {
                    cvSummary = camelSummaryProp.GetString();
                }
            }
            catch
            {
                cvSummary = null;
            }
        }

        return new StudentProfileResponseDto
        {
            Id = profile.Id,
            FullName = profile.User.FullName,
            Email = profile.User.Email ?? string.Empty,
            CGPA = profile.CGPA,
            TotalECTS = profile.TotalECTS,
            IsHonorStudent = profile.IsHonorStudent,
            CvFileName = profile.CvFileName,
            TranscriptFileName = profile.TranscriptFileName,
            CvSummary = cvSummary,
            CvAnalysisJson = cvAnalysisJson
        };
    }

    public async Task<bool> UpdateProfileAsync(Guid userId, StudentProfileUpdateDto request)
    {
        var profile = await _context.StudentProfiles.FirstOrDefaultAsync(p => p.UserId == userId);
        if (profile == null)
        {
            return false;
        }

        profile.CGPA = request.CGPA;
        profile.TotalECTS = request.TotalECTS;
        profile.UpdatedAt = DateTime.UtcNow;
        profile.IsHonorStudent = profile.CGPA >= 3.0m;

        await _context.SaveChangesAsync();
        return true;
    }

    public async Task<bool> UpdateCvFileNameAsync(Guid userId, string fileName)
    {
        var profile = await _context.StudentProfiles.FirstOrDefaultAsync(p => p.UserId == userId);
        if (profile == null)
        {
            return false;
        }

        profile.CvFileName = fileName;
        profile.UpdatedAt = DateTime.UtcNow;

        await _context.SaveChangesAsync();
        return true;
    }

    public async Task<bool> UpdateTranscriptFileNameAsync(Guid userId, string fileName)
    {
        var profile = await _context.StudentProfiles.FirstOrDefaultAsync(p => p.UserId == userId);
        if (profile == null)
        {
            return false;
        }

        profile.TranscriptFileName = fileName;
        profile.UpdatedAt = DateTime.UtcNow;

        await _context.SaveChangesAsync();
        return true;
    }

    public async Task<List<StudentSkillDto>> GetSkillsAsync(Guid userId)
    {
        var rawSkills = await _context.StudentTechnologies
            .Where(st => st.UserId == userId)
            .Include(st => st.Technology)
            .Select(st => new StudentSkillDto
            {
                TechnologyId = st.TechnologyId,
                TechnologyName = st.Technology.Name,
                ProficiencyLevel = st.ProficiencyLevel
            })
            .ToListAsync();

        return rawSkills
            .GroupBy(
                skill => skill.TechnologyName.Trim().ToLowerInvariant(),
                StringComparer.OrdinalIgnoreCase)
            .Select(group => group
                .OrderBy(skill => skill.TechnologyId)
                .ThenByDescending(skill => skill.ProficiencyLevel)
                .First())
            .OrderBy(skill => skill.TechnologyName)
            .ToList();
    }

    public async Task<bool> AddSkillAsync(Guid userId, StudentSkillDto skillDto)
    {
        var existingSkill = await _context.StudentTechnologies
            .FirstOrDefaultAsync(st => st.UserId == userId && st.TechnologyId == skillDto.TechnologyId);

        if (existingSkill != null)
        {
            existingSkill.ProficiencyLevel = skillDto.ProficiencyLevel;
        }
        else
        {
            _context.StudentTechnologies.Add(new StudentTechnology
            {
                UserId = userId,
                TechnologyId = skillDto.TechnologyId,
                ProficiencyLevel = skillDto.ProficiencyLevel
            });
        }

        await _context.SaveChangesAsync();
        return true;
    }

    public async Task<bool> RemoveSkillAsync(Guid userId, int technologyId)
    {
        var skill = await _context.StudentTechnologies
            .FirstOrDefaultAsync(st => st.UserId == userId && st.TechnologyId == technologyId);

        if (skill == null)
        {
            return false;
        }

        _context.StudentTechnologies.Remove(skill);
        await _context.SaveChangesAsync();
        return true;
    }

    public async Task<bool> ProcessCvAsync(Guid userId, Stream pdfStream)
    {
        var serializedAnalysis = await BuildCvAnalysisJsonAsync(pdfStream);
        if (string.IsNullOrWhiteSpace(serializedAnalysis))
        {
            return false;
        }

        var profile = await _context.StudentProfiles.FirstOrDefaultAsync(p => p.UserId == userId);
        if (profile == null)
        {
            return false;
        }

        profile.ParsedCvData = serializedAnalysis;
        profile.UpdatedAt = DateTime.UtcNow;

        await _context.SaveChangesAsync();
        return true;
    }

    private async Task EnsureCvAnalysisIsFreshAsync(StudentProfile profile)
    {
        if (!NeedsCvReanalysis(profile))
        {
            return;
        }

        var cvPath = GetStoredCvPath(profile.CvFileName);
        if (string.IsNullOrWhiteSpace(cvPath) || !File.Exists(cvPath))
        {
            return;
        }

        await using var stream = File.OpenRead(cvPath);
        var serializedAnalysis = await BuildCvAnalysisJsonAsync(stream);
        if (string.IsNullOrWhiteSpace(serializedAnalysis))
        {
            return;
        }

        profile.ParsedCvData = serializedAnalysis;
        profile.UpdatedAt = DateTime.UtcNow;
        await _context.SaveChangesAsync();
    }

    private bool NeedsCvReanalysis(StudentProfile profile)
    {
        if (string.IsNullOrWhiteSpace(profile.CvFileName))
        {
            return false;
        }

        if (string.IsNullOrWhiteSpace(profile.ParsedCvData) || profile.ParsedCvData == "{}")
        {
            return true;
        }

        try
        {
            var analysis = JsonSerializer.Deserialize<CvAnalysisResultDto>(
                profile.ParsedCvData,
                new JsonSerializerOptions
                {
                    PropertyNameCaseInsensitive = true
                });

            if (analysis == null)
            {
                return true;
            }

            var totalSkillCount = analysis.SkillsByCategory.Sum(category => category.Skills?.Count ?? 0);
            if (totalSkillCount == 0)
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

    private string? GetStoredCvPath(string? cvFileName)
    {
        if (string.IsNullOrWhiteSpace(cvFileName))
        {
            return null;
        }

        return Path.Combine(_webHostEnvironment.ContentRootPath, "wwwroot", "uploads", "cvs", cvFileName);
    }

    private async Task<string?> BuildCvAnalysisJsonAsync(Stream pdfStream)
    {
        var layoutDocument = await _pdfService.ExtractLayoutDocumentFromPdfAsync(pdfStream);
        if (string.IsNullOrWhiteSpace(layoutDocument.RawText))
        {
            return null;
        }

        var normalizedText = CvTextPreprocessor.Normalize(layoutDocument.RawText);
        if (string.IsNullOrWhiteSpace(normalizedText))
        {
            return null;
        }

        var systemPrompt = @"Sen bir insan kaynakları veri çıkarma asistanısın. Görevin, verilen CV metnini analiz edip aşağıdaki JSON şemasına TİTİZLİKLE uygun şekilde veri çıkarmaktır. SADECE JSON formatında cevap ver, fazladan bir şey yazma. Eğer bir alan bulunamazsa boş bırak: string için """", liste için [].
JSON Şeması:
{
  ""RawSummary"": ""Tüm CV'nin kısaca özeti (1-2 paragraf)"",
  ""NormalizedSummary"": ""Kariyer ve profil hakkında temiz, düzgün bir özet"",
  ""SkillsByCategory"": [
    { ""CategoryName"": ""Örn: Programming Languages"", ""Skills"": [""C#"", ""Java""] }
  ],
  ""Projects"": [
    { ""Name"": ""Proje adı"", ""Description"": ""Açıklaması"", ""Technologies"": [""Kullanılan Teknolojiler""], ""Role"": ""Kişinin Rolü"", ""Domain"": ""Alan (Örn: Web, AI)"", ""IsTeamProject"": true/false }
  ],
  ""Experiences"": [
    { ""CompanyName"": ""Şirket"", ""Position"": ""Pozisyon"", ""StartDateText"": ""Başlangıç"", ""EndDateText"": ""Bitiş"", ""Description"": ""Açıklama"", ""Technologies"": [""Teknolojiler""] }
  ],
  ""Education"": [
    { ""SchoolName"": ""Üniversite/Okul"", ""Department"": ""Bölüm"", ""Degree"": ""Derece (Örn: Lisans)"", ""StartDateText"": ""Başlangıç"", ""EndDateText"": ""Bitiş"" }
  ],
  ""DomainSignals"": [""Yazılımcının öne çıktığı 1-2 teknik alan, örn: Backend, Frontend, Cloud""]
}";

        var userPrompt = $"CV Metni:\n{normalizedText}";

        var jsonStr = await _groqApiService.GetJsonExtractionAsync(systemPrompt, userPrompt);
        if (string.IsNullOrWhiteSpace(jsonStr) || jsonStr == "{}")
        {
            // Kullanılamaz bir cevap döndüyse bile en azından boş şema dönelim 
            var emptyAnalysis = new CvAnalysisResultDto();
            return JsonSerializer.Serialize(emptyAnalysis);
        }

        try
        {
            // Validasyon: Doğru JSON yapısında olup olmadığı kontrol edilir
            var testParse = JsonSerializer.Deserialize<CvAnalysisResultDto>(jsonStr, new JsonSerializerOptions { PropertyNameCaseInsensitive = true });
            return jsonStr;
        }
        catch (JsonException)
        {
            // Fallback (kurtarma) durumu: Eski manuel parse edici
            var analysis = CvAnalysisBuilder.Build(normalizedText);
            return JsonSerializer.Serialize(analysis);
        }
    }

    private async Task<Dictionary<string, Technology>> GetCanonicalTechnologyMapAsync()
    {
        var technologies = await _context.Technologies
            .AsNoTracking()
            .ToListAsync();

        return technologies
            .GroupBy(technology => technology.Name.Trim().ToLowerInvariant(), StringComparer.OrdinalIgnoreCase)
            .ToDictionary(
                group => group.Key,
                group => group.OrderBy(technology => technology.Id).First(),
                StringComparer.OrdinalIgnoreCase);
    }
}
