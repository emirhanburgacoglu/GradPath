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

    public async Task<List<StudentSkillDto>> GetDraftSkillsFromCvAsync(Guid userId)
    {
        var profile = await _context.StudentProfiles
            .FirstOrDefaultAsync(p => p.UserId == userId);

        if (profile == null)
        {
            return new List<StudentSkillDto>();
        }

        await EnsureCvAnalysisIsFreshAsync(profile);

        if (!TryDeserializeCvAnalysis(profile.ParsedCvData, out var analysis))
        {
            return new List<StudentSkillDto>();
        }

        var canonicalTechnologyMap = await GetCanonicalTechnologyMapAsync();

        return analysis.SkillsByCategory
            .Where(category => category.Skills != null)
            .SelectMany(category => category.Skills)
            .Where(skill => !string.IsNullOrWhiteSpace(skill))
            .Select(skill => skill.Trim())
            .Select(skill =>
            {
                var normalizedSkill = CvSkillNormalizer.FindMatch(skill)?.CanonicalName ?? skill;
                return canonicalTechnologyMap.TryGetValue(normalizedSkill.Trim().ToLowerInvariant(), out var technology)
                    ? new StudentSkillDto
                    {
                        TechnologyId = technology.Id,
                        TechnologyName = technology.Name,
                        ProficiencyLevel = 2
                    }
                    : null;
            })
            .Where(skill => skill != null)
            .GroupBy(skill => skill!.TechnologyId)
            .Select(group => group.First()!)
            .OrderBy(skill => skill.TechnologyName)
            .ToList();
    }

    public async Task<bool> ReplaceSkillsAsync(Guid userId, List<StudentSkillDto> skills)
    {
        var normalizedSkills = (skills ?? new List<StudentSkillDto>())
            .Where(skill => skill.TechnologyId > 0)
            .GroupBy(skill => skill.TechnologyId)
            .Select(group =>
            {
                var preferred = group
                    .OrderByDescending(skill => skill.ProficiencyLevel)
                    .First();

                return new StudentSkillDto
                {
                    TechnologyId = preferred.TechnologyId,
                    TechnologyName = preferred.TechnologyName,
                    ProficiencyLevel = Math.Clamp(preferred.ProficiencyLevel, 1, 3)
                };
            })
            .ToList();

        var validTechnologyIds = await _context.Technologies
            .Where(technology => normalizedSkills.Select(skill => skill.TechnologyId).Contains(technology.Id))
            .Select(technology => technology.Id)
            .ToListAsync();

        var validTechnologyIdSet = validTechnologyIds.ToHashSet();
        normalizedSkills = normalizedSkills
            .Where(skill => validTechnologyIdSet.Contains(skill.TechnologyId))
            .ToList();

        var existingSkills = await _context.StudentTechnologies
            .Where(st => st.UserId == userId)
            .ToListAsync();

        var requestedTechnologyIds = normalizedSkills
            .Select(skill => skill.TechnologyId)
            .ToHashSet();

        var skillsToRemove = existingSkills
            .Where(existingSkill => !requestedTechnologyIds.Contains(existingSkill.TechnologyId))
            .ToList();

        if (skillsToRemove.Count > 0)
        {
            _context.StudentTechnologies.RemoveRange(skillsToRemove);
        }

        foreach (var skillDto in normalizedSkills)
        {
            var existingSkill = existingSkills
                .FirstOrDefault(st => st.TechnologyId == skillDto.TechnologyId);

            if (existingSkill != null)
            {
                existingSkill.ProficiencyLevel = skillDto.ProficiencyLevel;
                continue;
            }

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
    public async Task<bool> ProcessCvAsync(Guid userId, Stream pdfStream)
    {
        var serializedAnalysis = await BuildCvAnalysisJsonAsync(pdfStream);
        if (string.IsNullOrWhiteSpace(serializedAnalysis))
        {
            return false;
        }

        if (!TryDeserializeCvAnalysis(serializedAnalysis, out var analysis))
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

        await SyncCvAnalysisToDatabaseAsync(userId, analysis);

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

        if (!TryDeserializeCvAnalysis(serializedAnalysis, out var analysis))
        {
            return;
        }

        profile.ParsedCvData = serializedAnalysis;
        profile.UpdatedAt = DateTime.UtcNow;

        await SyncCvAnalysisToDatabaseAsync(profile.UserId, analysis);

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
    private async Task SyncCvAnalysisToDatabaseAsync(Guid userId, CvAnalysisResultDto analysis)
    {
        var canonicalTechnologyMap = await GetCanonicalTechnologyMapAsync();

        await ReplaceStudentSkillsFromCvAsync(userId, analysis, canonicalTechnologyMap);
        await ReplaceStudentEducationsFromCvAsync(userId, analysis);
        await ReplaceStudentExperiencesFromCvAsync(userId, analysis, canonicalTechnologyMap);
        await ReplaceStudentProjectsFromCvAsync(userId, analysis, canonicalTechnologyMap);
        await ReplaceStudentDomainSignalsFromCvAsync(userId, analysis);
    }

    private async Task ReplaceStudentSkillsFromCvAsync(
        Guid userId,
        CvAnalysisResultDto analysis,
        Dictionary<string, Technology> canonicalTechnologyMap)
    {
        var existingSkills = await _context.StudentTechnologies
            .Where(st => st.UserId == userId)
            .ToListAsync();

        if (existingSkills.Count > 0)
        {
            _context.StudentTechnologies.RemoveRange(existingSkills);
        }

        var normalizedTechnologies = (analysis.SkillsByCategory ?? new List<CvSkillCategoryDto>())
            .Where(category => category != null && category.Skills != null)
            .SelectMany(category => category.Skills)
            .Where(skill => !string.IsNullOrWhiteSpace(skill))
            .Select(skill => skill.Trim())
            .Select(skill =>
            {
                var normalizedSkill = CvSkillNormalizer.FindMatch(skill)?.CanonicalName ?? skill;

                return canonicalTechnologyMap.TryGetValue(
                    normalizedSkill.Trim().ToLowerInvariant(),
                    out var technology)
                    ? technology
                    : null;
            })
            .Where(technology => technology != null)
            .GroupBy(technology => technology!.Id)
            .Select(group => group.First()!)
            .ToList();

        foreach (var technology in normalizedTechnologies)
        {
            _context.StudentTechnologies.Add(new StudentTechnology
            {
                UserId = userId,
                TechnologyId = technology.Id,
                ProficiencyLevel = 2
            });
        }
    }

    private async Task ReplaceStudentEducationsFromCvAsync(Guid userId, CvAnalysisResultDto analysis)
    {
        var existingEducations = await _context.StudentEducations
            .Where(se => se.UserId == userId)
            .ToListAsync();

        if (existingEducations.Count > 0)
        {
            _context.StudentEducations.RemoveRange(existingEducations);
        }

        var educationItems = (analysis.Education ?? new List<CvEducationDto>())
            .Where(item =>
                !string.IsNullOrWhiteSpace(item.SchoolName) ||
                !string.IsNullOrWhiteSpace(item.Department) ||
                !string.IsNullOrWhiteSpace(item.Degree))
            .GroupBy(item => new
            {
                SchoolName = NormalizeKey(item.SchoolName),
                Department = NormalizeKey(item.Department),
                Degree = NormalizeKey(item.Degree),
                StartDateText = NormalizeKey(item.StartDateText),
                EndDateText = NormalizeKey(item.EndDateText)
            })
            .Select(group => group.First())
            .ToList();

        foreach (var item in educationItems)
        {
            _context.StudentEducations.Add(new StudentEducation
            {
                UserId = userId,
                SchoolName = CleanText(item.SchoolName),
                Department = CleanText(item.Department),
                Degree = CleanText(item.Degree),
                StartDateText = CleanText(item.StartDateText),
                EndDateText = CleanText(item.EndDateText)
            });
        }
    }

    private async Task ReplaceStudentExperiencesFromCvAsync(
        Guid userId,
        CvAnalysisResultDto analysis,
        Dictionary<string, Technology> canonicalTechnologyMap)
    {
        var existingExperienceIds = await _context.StudentExperiences
            .Where(se => se.UserId == userId)
            .Select(se => se.Id)
            .ToListAsync();

        if (existingExperienceIds.Count > 0)
        {
            var existingExperienceTechnologies = await _context.StudentExperienceTechnologies
                .Where(set => existingExperienceIds.Contains(set.StudentExperienceId))
                .ToListAsync();

            if (existingExperienceTechnologies.Count > 0)
            {
                _context.StudentExperienceTechnologies.RemoveRange(existingExperienceTechnologies);
            }

            var existingExperiences = await _context.StudentExperiences
                .Where(se => se.UserId == userId)
                .ToListAsync();

            _context.StudentExperiences.RemoveRange(existingExperiences);
        }

        var experienceItems = (analysis.Experiences ?? new List<CvExperienceDto>())
            .Where(item =>
                !string.IsNullOrWhiteSpace(item.CompanyName) ||
                !string.IsNullOrWhiteSpace(item.Position) ||
                !string.IsNullOrWhiteSpace(item.Description))
            .GroupBy(item => new
            {
                CompanyName = NormalizeKey(item.CompanyName),
                Position = NormalizeKey(item.Position),
                StartDateText = NormalizeKey(item.StartDateText),
                EndDateText = NormalizeKey(item.EndDateText),
                Description = NormalizeKey(item.Description)
            })
            .Select(group => group.First())
            .ToList();

        foreach (var item in experienceItems)
        {
            var experience = new StudentExperience
            {
                UserId = userId,
                CompanyName = CleanText(item.CompanyName),
                Position = CleanText(item.Position),
                StartDateText = CleanText(item.StartDateText),
                EndDateText = CleanText(item.EndDateText),
                Description = CleanText(item.Description)
            };

            var technologies = ResolveTechnologies(item.Technologies, canonicalTechnologyMap);
            foreach (var technology in technologies)
            {
                experience.Technologies.Add(new StudentExperienceTechnology
                {
                    UserId = userId,
                    TechnologyId = technology.Id,
                    StudentExperience = experience
                });
            }

            _context.StudentExperiences.Add(experience);
        }
    }

    private async Task ReplaceStudentProjectsFromCvAsync(
        Guid userId,
        CvAnalysisResultDto analysis,
        Dictionary<string, Technology> canonicalTechnologyMap)
    {
        var existingProjectIds = await _context.StudentCvProjects
            .Where(sp => sp.UserId == userId)
            .Select(sp => sp.Id)
            .ToListAsync();

        if (existingProjectIds.Count > 0)
        {
            var existingProjectTechnologies = await _context.StudentCvProjectTechnologies
                .Where(set => existingProjectIds.Contains(set.StudentCvProjectId))
                .ToListAsync();

            if (existingProjectTechnologies.Count > 0)
            {
                _context.StudentCvProjectTechnologies.RemoveRange(existingProjectTechnologies);
            }

            var existingProjects = await _context.StudentCvProjects
                .Where(sp => sp.UserId == userId)
                .ToListAsync();

            _context.StudentCvProjects.RemoveRange(existingProjects);
        }

        var projectItems = (analysis.Projects ?? new List<CvProjectDto>())
            .Where(item =>
                !string.IsNullOrWhiteSpace(item.Name) ||
                !string.IsNullOrWhiteSpace(item.Description))
            .GroupBy(item => new
            {
                Name = NormalizeKey(item.Name),
                Description = NormalizeKey(item.Description),
                Role = NormalizeKey(item.Role),
                Domain = NormalizeKey(item.Domain)
            })
            .Select(group => group.First())
            .ToList();

        foreach (var item in projectItems)
        {
            var project = new StudentCvProject
            {
                UserId = userId,
                Name = CleanText(item.Name),
                Description = CleanText(item.Description),
                Role = CleanText(item.Role),
                Domain = CleanText(item.Domain),
                IsTeamProject = item.IsTeamProject
            };

            var technologies = ResolveTechnologies(item.Technologies, canonicalTechnologyMap);
            foreach (var technology in technologies)
            {
                project.Technologies.Add(new StudentCvProjectTechnology
                {
                    UserId = userId,
                    TechnologyId = technology.Id,
                    StudentCvProject = project
                });
            }

            _context.StudentCvProjects.Add(project);
        }
    }

    private async Task ReplaceStudentDomainSignalsFromCvAsync(Guid userId, CvAnalysisResultDto analysis)
    {
        var existingSignals = await _context.StudentDomainSignals
            .Where(ds => ds.UserId == userId)
            .ToListAsync();

        if (existingSignals.Count > 0)
        {
            _context.StudentDomainSignals.RemoveRange(existingSignals);
        }

        var signals = (analysis.DomainSignals ?? new List<string>())
            .Where(signal => !string.IsNullOrWhiteSpace(signal))
            .Select(signal => signal.Trim())
            .Distinct(StringComparer.OrdinalIgnoreCase)
            .ToList();

        foreach (var signal in signals)
        {
            _context.StudentDomainSignals.Add(new StudentDomainSignal
            {
                UserId = userId,
                Name = signal
            });
        }
    }

    private static List<Technology> ResolveTechnologies(
        IEnumerable<string>? rawTechnologyNames,
        Dictionary<string, Technology> canonicalTechnologyMap)
    {
        return (rawTechnologyNames ?? Enumerable.Empty<string>())
            .Where(name => !string.IsNullOrWhiteSpace(name))
            .Select(name => name.Trim())
            .Select(name =>
            {
                var normalizedName = CvSkillNormalizer.FindMatch(name)?.CanonicalName ?? name;

                return canonicalTechnologyMap.TryGetValue(
                    normalizedName.Trim().ToLowerInvariant(),
                    out var technology)
                    ? technology
                    : null;
            })
            .Where(technology => technology != null)
            .GroupBy(technology => technology!.Id)
            .Select(group => group.First()!)
            .ToList();
    }

    private static string CleanText(string? value)
    {
        return string.IsNullOrWhiteSpace(value)
            ? string.Empty
            : value.Trim();
    }

    private static string NormalizeKey(string? value)
    {
        return string.IsNullOrWhiteSpace(value)
            ? string.Empty
            : value.Trim().ToLowerInvariant();
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

    private static bool TryDeserializeCvAnalysis(string? serializedAnalysis, out CvAnalysisResultDto analysis)
    {
        analysis = new CvAnalysisResultDto();

        if (string.IsNullOrWhiteSpace(serializedAnalysis) || serializedAnalysis == "{}")
        {
            return false;
        }

        try
        {
            var parsed = JsonSerializer.Deserialize<CvAnalysisResultDto>(
                serializedAnalysis,
                new JsonSerializerOptions
                {
                    PropertyNameCaseInsensitive = true
                });

            if (parsed == null)
            {
                return false;
            }

            analysis = parsed;
            return true;
        }
        catch (JsonException)
        {
            return false;
        }
    }
}
