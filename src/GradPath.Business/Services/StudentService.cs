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
                .ThenInclude(user => user.Department)
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

        var cvAnalysisJson = profile.ParsedCvData;
        var cvSummary = ExtractCvSummary(profile.ParsedCvData);

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

    public async Task<StudentPublicProfileDto?> GetPublicProfileByUserIdAsync(Guid userId)
    {
        var user = await _context.Users
            .AsNoTracking()
            .Include(item => item.Department)
            .FirstOrDefaultAsync(item => item.Id == userId);

        if (user == null)
        {
            return null;
        }

        var profile = await _context.StudentProfiles
            .AsNoTracking()
            .FirstOrDefaultAsync(item => item.UserId == userId);

        return new StudentPublicProfileDto
        {
            UserId = user.Id,
            FullName = user.FullName,
            DepartmentName = user.Department?.Name ?? string.Empty,
            DepartmentCode = user.Department?.Code ?? string.Empty,
            FacultyName = user.Department?.FacultyName ?? string.Empty,
            CGPA = profile?.CGPA,
            TotalECTS = profile?.TotalECTS,
            IsHonorStudent = profile?.IsHonorStudent ?? false,
            CvSummary = ExtractCvSummary(profile?.ParsedCvData),
            Skills = await GetSkillsAsync(userId),
            Educations = await GetEducationsAsync(userId),
            Experiences = await GetExperiencesAsync(userId),
            CvProjects = await GetCvProjectsAsync(userId),
            DomainSignals = await GetDomainSignalsAsync(userId)
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

    public async Task<List<TechnologyOptionDto>> GetAvailableTechnologiesAsync()
    {
        var technologies = await _context.Technologies
            .AsNoTracking()
            .ToListAsync();

        return technologies
            .Where(technology => !string.IsNullOrWhiteSpace(technology.Name))
            .GroupBy(technology => new
            {
                Name = NormalizeKey(technology.Name),
                Category = NormalizeKey(technology.Category)
            })
            .Select(group => group
                .OrderBy(technology => technology.Id)
                .First())
            .OrderBy(technology => technology.Category)
            .ThenBy(technology => technology.Name)
            .Select(technology => new TechnologyOptionDto
            {
                Id = technology.Id,
                Name = technology.Name.Trim(),
                Category = technology.Category.Trim()
            })
            .ToList();
    }

    public async Task<bool> AddSkillAsync(Guid userId, StudentSkillDto skillDto)
    {
        var resolvedTechnologyId = await ResolveTechnologyIdAsync(skillDto.TechnologyId, skillDto.TechnologyName);
        if (resolvedTechnologyId <= 0)
        {
            return false;
        }

        var proficiencyLevel = Math.Clamp(skillDto.ProficiencyLevel, 1, 3);

        var existingSkill = await _context.StudentTechnologies
            .FirstOrDefaultAsync(st => st.UserId == userId && st.TechnologyId == resolvedTechnologyId);

        if (existingSkill != null)
        {
            existingSkill.ProficiencyLevel = proficiencyLevel;
        }
        else
        {
            _context.StudentTechnologies.Add(new StudentTechnology
            {
                UserId = userId,
                TechnologyId = resolvedTechnologyId,
                ProficiencyLevel = proficiencyLevel
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
        var canonicalTechnologyMap = await GetCanonicalTechnologyMapAsync();

        var normalizedSkills = (skills ?? new List<StudentSkillDto>())
            .Select(skill =>
            {
                var resolvedTechnologyId = skill.TechnologyId;

                if (resolvedTechnologyId <= 0 && !string.IsNullOrWhiteSpace(skill.TechnologyName))
                {
                    var normalizedName = CvSkillNormalizer.FindMatch(skill.TechnologyName)?.CanonicalName
                        ?? skill.TechnologyName;

                    resolvedTechnologyId = canonicalTechnologyMap.TryGetValue(
                        normalizedName.Trim().ToLowerInvariant(),
                        out var technology)
                        ? technology.Id
                        : 0;
                }

                return new StudentSkillDto
                {
                    TechnologyId = resolvedTechnologyId,
                    TechnologyName = skill.TechnologyName,
                    ProficiencyLevel = Math.Clamp(skill.ProficiencyLevel, 1, 3)
                };
            })
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

    public async Task<List<StudentEducationCrudDto>> GetEducationsAsync(Guid userId)
    {
        return await _context.StudentEducations
            .Where(education => education.UserId == userId)
            .OrderByDescending(education => education.CreatedAt)
            .Select(education => new StudentEducationCrudDto
            {
                Id = education.Id,
                SchoolName = education.SchoolName,
                Department = education.Department,
                Degree = education.Degree,
                StartDateText = education.StartDateText,
                EndDateText = education.EndDateText
            })
            .ToListAsync();
    }

    public async Task<bool> AddEducationAsync(Guid userId, StudentEducationCrudDto dto)
    {
        if (string.IsNullOrWhiteSpace(CleanText(dto.SchoolName))
            && string.IsNullOrWhiteSpace(CleanText(dto.Department))
            && string.IsNullOrWhiteSpace(CleanText(dto.Degree)))
        {
            return false;
        }

        _context.StudentEducations.Add(new StudentEducation
        {
            UserId = userId,
            SchoolName = CleanText(dto.SchoolName),
            Department = CleanText(dto.Department),
            Degree = CleanText(dto.Degree),
            StartDateText = CleanText(dto.StartDateText),
            EndDateText = CleanText(dto.EndDateText)
        });

        await _context.SaveChangesAsync();
        return true;
    }

    public async Task<bool> UpdateEducationAsync(Guid userId, Guid educationId, StudentEducationCrudDto dto)
    {
        var education = await _context.StudentEducations
            .FirstOrDefaultAsync(item => item.UserId == userId && item.Id == educationId);

        if (education == null)
        {
            return false;
        }

        if (string.IsNullOrWhiteSpace(CleanText(dto.SchoolName))
            && string.IsNullOrWhiteSpace(CleanText(dto.Department))
            && string.IsNullOrWhiteSpace(CleanText(dto.Degree)))
        {
            return false;
        }

        education.SchoolName = CleanText(dto.SchoolName);
        education.Department = CleanText(dto.Department);
        education.Degree = CleanText(dto.Degree);
        education.StartDateText = CleanText(dto.StartDateText);
        education.EndDateText = CleanText(dto.EndDateText);
        education.UpdatedAt = DateTime.UtcNow;

        await _context.SaveChangesAsync();
        return true;
    }

    public async Task<bool> RemoveEducationAsync(Guid userId, Guid educationId)
    {
        var education = await _context.StudentEducations
            .FirstOrDefaultAsync(item => item.UserId == userId && item.Id == educationId);

        if (education == null)
        {
            return false;
        }

        _context.StudentEducations.Remove(education);
        await _context.SaveChangesAsync();
        return true;
    }

    public async Task<List<StudentExperienceCrudDto>> GetExperiencesAsync(Guid userId)
    {
        var experiences = await _context.StudentExperiences
            .Where(experience => experience.UserId == userId)
            .Include(experience => experience.Technologies)
                .ThenInclude(experienceTechnology => experienceTechnology.Technology)
            .OrderByDescending(experience => experience.CreatedAt)
            .ToListAsync();

        return experiences
            .Select(experience => new StudentExperienceCrudDto
            {
                Id = experience.Id,
                CompanyName = experience.CompanyName,
                Position = experience.Position,
                StartDateText = experience.StartDateText,
                EndDateText = experience.EndDateText,
                Description = experience.Description,
                TechnologyIds = experience.Technologies
                    .OrderBy(item => item.Technology.Name)
                    .Select(item => item.TechnologyId)
                    .ToList(),
                TechnologyNames = experience.Technologies
                    .OrderBy(item => item.Technology.Name)
                    .Select(item => item.Technology.Name)
                    .ToList()
            })
            .ToList();
    }

    public async Task<bool> AddExperienceAsync(Guid userId, StudentExperienceCrudDto dto)
    {
        if (string.IsNullOrWhiteSpace(CleanText(dto.CompanyName))
            && string.IsNullOrWhiteSpace(CleanText(dto.Position))
            && string.IsNullOrWhiteSpace(CleanText(dto.Description)))
        {
            return false;
        }

        var technologyIds = await GetResolvedTechnologyIdsAsync(dto.TechnologyIds, dto.TechnologyNames);

        var experience = new StudentExperience
        {
            UserId = userId,
            CompanyName = CleanText(dto.CompanyName),
            Position = CleanText(dto.Position),
            StartDateText = CleanText(dto.StartDateText),
            EndDateText = CleanText(dto.EndDateText),
            Description = CleanText(dto.Description)
        };

        foreach (var technologyId in technologyIds)
        {
            experience.Technologies.Add(new StudentExperienceTechnology
            {
                UserId = userId,
                TechnologyId = technologyId,
                StudentExperience = experience
            });
        }

        _context.StudentExperiences.Add(experience);
        await _context.SaveChangesAsync();
        return true;
    }

    public async Task<bool> UpdateExperienceAsync(Guid userId, Guid experienceId, StudentExperienceCrudDto dto)
    {
        var experience = await _context.StudentExperiences
            .Include(item => item.Technologies)
            .FirstOrDefaultAsync(item => item.UserId == userId && item.Id == experienceId);

        if (experience == null)
        {
            return false;
        }

        if (string.IsNullOrWhiteSpace(CleanText(dto.CompanyName))
            && string.IsNullOrWhiteSpace(CleanText(dto.Position))
            && string.IsNullOrWhiteSpace(CleanText(dto.Description)))
        {
            return false;
        }

        experience.CompanyName = CleanText(dto.CompanyName);
        experience.Position = CleanText(dto.Position);
        experience.StartDateText = CleanText(dto.StartDateText);
        experience.EndDateText = CleanText(dto.EndDateText);
        experience.Description = CleanText(dto.Description);
        experience.UpdatedAt = DateTime.UtcNow;

        var existingTechnologies = experience.Technologies.ToList();
        if (existingTechnologies.Count > 0)
        {
            _context.StudentExperienceTechnologies.RemoveRange(existingTechnologies);
            experience.Technologies.Clear();
        }

        var technologyIds = await GetResolvedTechnologyIdsAsync(dto.TechnologyIds, dto.TechnologyNames);
        foreach (var technologyId in technologyIds)
        {
            experience.Technologies.Add(new StudentExperienceTechnology
            {
                UserId = userId,
                TechnologyId = technologyId,
                StudentExperienceId = experience.Id
            });
        }

        await _context.SaveChangesAsync();
        return true;
    }

    public async Task<bool> RemoveExperienceAsync(Guid userId, Guid experienceId)
    {
        var experience = await _context.StudentExperiences
            .FirstOrDefaultAsync(item => item.UserId == userId && item.Id == experienceId);

        if (experience == null)
        {
            return false;
        }

        _context.StudentExperiences.Remove(experience);
        await _context.SaveChangesAsync();
        return true;
    }

    public async Task<List<StudentCvProjectCrudDto>> GetCvProjectsAsync(Guid userId)
    {
        var projects = await _context.StudentCvProjects
            .Where(project => project.UserId == userId)
            .Include(project => project.Technologies)
                .ThenInclude(projectTechnology => projectTechnology.Technology)
            .OrderByDescending(project => project.CreatedAt)
            .ToListAsync();

        return projects
            .Select(project => new StudentCvProjectCrudDto
            {
                Id = project.Id,
                Name = project.Name,
                Description = project.Description,
                Role = project.Role,
                Domain = project.Domain,
                IsTeamProject = project.IsTeamProject,
                TechnologyIds = project.Technologies
                    .OrderBy(item => item.Technology.Name)
                    .Select(item => item.TechnologyId)
                    .ToList(),
                TechnologyNames = project.Technologies
                    .OrderBy(item => item.Technology.Name)
                    .Select(item => item.Technology.Name)
                    .ToList()
            })
            .ToList();
    }

    public async Task<bool> AddCvProjectAsync(Guid userId, StudentCvProjectCrudDto dto)
    {
        if (string.IsNullOrWhiteSpace(CleanText(dto.Name))
            && string.IsNullOrWhiteSpace(CleanText(dto.Description)))
        {
            return false;
        }

        var technologyIds = await GetResolvedTechnologyIdsAsync(dto.TechnologyIds, dto.TechnologyNames);

        var project = new StudentCvProject
        {
            UserId = userId,
            Name = CleanText(dto.Name),
            Description = CleanText(dto.Description),
            Role = CleanText(dto.Role),
            Domain = CleanText(dto.Domain),
            IsTeamProject = dto.IsTeamProject
        };

        foreach (var technologyId in technologyIds)
        {
            project.Technologies.Add(new StudentCvProjectTechnology
            {
                UserId = userId,
                TechnologyId = technologyId,
                StudentCvProject = project
            });
        }

        _context.StudentCvProjects.Add(project);
        await _context.SaveChangesAsync();
        return true;
    }

    public async Task<bool> UpdateCvProjectAsync(Guid userId, Guid projectId, StudentCvProjectCrudDto dto)
    {
        var project = await _context.StudentCvProjects
            .Include(item => item.Technologies)
            .FirstOrDefaultAsync(item => item.UserId == userId && item.Id == projectId);

        if (project == null)
        {
            return false;
        }

        if (string.IsNullOrWhiteSpace(CleanText(dto.Name))
            && string.IsNullOrWhiteSpace(CleanText(dto.Description)))
        {
            return false;
        }

        project.Name = CleanText(dto.Name);
        project.Description = CleanText(dto.Description);
        project.Role = CleanText(dto.Role);
        project.Domain = CleanText(dto.Domain);
        project.IsTeamProject = dto.IsTeamProject;
        project.UpdatedAt = DateTime.UtcNow;

        var existingTechnologies = project.Technologies.ToList();
        if (existingTechnologies.Count > 0)
        {
            _context.StudentCvProjectTechnologies.RemoveRange(existingTechnologies);
            project.Technologies.Clear();
        }

        var technologyIds = await GetResolvedTechnologyIdsAsync(dto.TechnologyIds, dto.TechnologyNames);
        foreach (var technologyId in technologyIds)
        {
            project.Technologies.Add(new StudentCvProjectTechnology
            {
                UserId = userId,
                TechnologyId = technologyId,
                StudentCvProjectId = project.Id
            });
        }

        await _context.SaveChangesAsync();
        return true;
    }

    public async Task<bool> RemoveCvProjectAsync(Guid userId, Guid projectId)
    {
        var project = await _context.StudentCvProjects
            .FirstOrDefaultAsync(item => item.UserId == userId && item.Id == projectId);

        if (project == null)
        {
            return false;
        }

        _context.StudentCvProjects.Remove(project);
        await _context.SaveChangesAsync();
        return true;
    }

    public async Task<List<StudentDomainSignalCrudDto>> GetDomainSignalsAsync(Guid userId)
    {
        return await _context.StudentDomainSignals
            .Where(signal => signal.UserId == userId)
            .OrderBy(signal => signal.Name)
            .Select(signal => new StudentDomainSignalCrudDto
            {
                Id = signal.Id,
                Name = signal.Name
            })
            .ToListAsync();
    }

    public async Task<bool> AddDomainSignalAsync(Guid userId, StudentDomainSignalCrudDto dto)
    {
        var cleanedName = CleanText(dto.Name);
        if (string.IsNullOrWhiteSpace(cleanedName))
        {
            return false;
        }

        var exists = await _context.StudentDomainSignals
            .AnyAsync(signal => signal.UserId == userId && signal.Name.ToLower() == cleanedName.ToLower());

        if (exists)
        {
            return false;
        }

        _context.StudentDomainSignals.Add(new StudentDomainSignal
        {
            UserId = userId,
            Name = cleanedName
        });

        await _context.SaveChangesAsync();
        return true;
    }

    public async Task<bool> UpdateDomainSignalAsync(Guid userId, Guid domainSignalId, StudentDomainSignalCrudDto dto)
    {
        var cleanedName = CleanText(dto.Name);
        if (string.IsNullOrWhiteSpace(cleanedName))
        {
            return false;
        }

        var signal = await _context.StudentDomainSignals
            .FirstOrDefaultAsync(item => item.UserId == userId && item.Id == domainSignalId);

        if (signal == null)
        {
            return false;
        }

        var exists = await _context.StudentDomainSignals
            .AnyAsync(item =>
                item.UserId == userId
                && item.Id != domainSignalId
                && item.Name.ToLower() == cleanedName.ToLower());

        if (exists)
        {
            return false;
        }

        signal.Name = cleanedName;
        signal.UpdatedAt = DateTime.UtcNow;

        await _context.SaveChangesAsync();
        return true;
    }

    public async Task<bool> RemoveDomainSignalAsync(Guid userId, Guid domainSignalId)
    {
        var signal = await _context.StudentDomainSignals
            .FirstOrDefaultAsync(item => item.UserId == userId && item.Id == domainSignalId);

        if (signal == null)
        {
            return false;
        }

        _context.StudentDomainSignals.Remove(signal);
        await _context.SaveChangesAsync();
        return true;
    }

    private async Task<List<int>> GetValidTechnologyIdsAsync(IEnumerable<int>? technologyIds)
    {
        var normalizedIds = (technologyIds ?? Enumerable.Empty<int>())
            .Where(id => id > 0)
            .Distinct()
            .ToList();

        if (normalizedIds.Count == 0)
        {
            return new List<int>();
        }

        return await _context.Technologies
            .Where(technology => normalizedIds.Contains(technology.Id))
            .Select(technology => technology.Id)
            .ToListAsync();
    }

    private async Task<List<int>> GetResolvedTechnologyIdsAsync(
        IEnumerable<int>? technologyIds,
        IEnumerable<string>? technologyNames)
    {
        var validIds = await GetValidTechnologyIdsAsync(technologyIds);

        var normalizedTechnologyNames = (technologyNames ?? Enumerable.Empty<string>())
            .Where(name => !string.IsNullOrWhiteSpace(name))
            .Select(name => name.Trim())
            .Distinct(StringComparer.OrdinalIgnoreCase)
            .ToList();

        if (normalizedTechnologyNames.Count == 0)
        {
            return validIds;
        }

        var canonicalTechnologyMap = await GetCanonicalTechnologyMapAsync();
        var resolvedIds = normalizedTechnologyNames
            .Select(name =>
            {
                var normalizedName = CvSkillNormalizer.FindMatch(name)?.CanonicalName ?? name;

                return canonicalTechnologyMap.TryGetValue(
                    normalizedName.Trim().ToLowerInvariant(),
                    out var technology)
                    ? technology.Id
                    : 0;
            })
            .Where(id => id > 0);

        return validIds
            .Concat(resolvedIds)
            .Distinct()
            .ToList();
    }

    private async Task<int> ResolveTechnologyIdAsync(int technologyId, string? technologyName)
    {
        if (technologyId > 0)
        {
            var validIds = await GetValidTechnologyIdsAsync(new[] { technologyId });
            if (validIds.Count > 0)
            {
                return validIds[0];
            }
        }

        if (string.IsNullOrWhiteSpace(technologyName))
        {
            return 0;
        }

        var canonicalTechnologyMap = await GetCanonicalTechnologyMapAsync();
        var normalizedName = CvSkillNormalizer.FindMatch(technologyName)?.CanonicalName ?? technologyName;

        return canonicalTechnologyMap.TryGetValue(
            normalizedName.Trim().ToLowerInvariant(),
            out var technology)
            ? technology.Id
            : 0;
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

    private static string? ExtractCvSummary(string? parsedCvData)
    {
        if (string.IsNullOrWhiteSpace(parsedCvData))
        {
            return null;
        }

        try
        {
            using var doc = JsonDocument.Parse(parsedCvData);
            if (doc.RootElement.TryGetProperty("NormalizedSummary", out var summaryProp))
            {
                return summaryProp.GetString();
            }

            if (doc.RootElement.TryGetProperty("normalizedSummary", out var camelSummaryProp))
            {
                return camelSummaryProp.GetString();
            }
        }
        catch
        {
            return null;
        }

        return null;
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
