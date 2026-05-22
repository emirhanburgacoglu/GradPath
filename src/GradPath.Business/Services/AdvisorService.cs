using GradPath.Business.DTOs.Advisor;
using GradPath.Data;
using Microsoft.EntityFrameworkCore;

namespace GradPath.Business.Services;

public class AdvisorService : IAdvisorService
{
    private readonly GradPathDbContext _context;

    public AdvisorService(GradPathDbContext context)
    {
        _context = context;
    }

    public async Task<AdvisorProfileResponseDto?> GetProfileByUserIdAsync(Guid userId)
    {
        var advisor = await _context.Users
            .AsNoTracking()
            .Include(user => user.Department)
            .Include(user => user.AdvisorProfile)
            .FirstOrDefaultAsync(user => user.Id == userId && user.AdvisorProfile != null);

        if (advisor == null || advisor.AdvisorProfile == null)
        {
            return null;
        }

        return new AdvisorProfileResponseDto
        {
            UserId = advisor.Id,
            FullName = advisor.FullName,
            Email = advisor.Email ?? string.Empty,
            DepartmentId = advisor.DepartmentId,
            DepartmentName = advisor.Department?.Name,
            DepartmentCode = advisor.Department?.Code,
            FacultyName = advisor.Department?.FacultyName,
            AcademicTitle = advisor.AdvisorProfile.AcademicTitle,
            ExpertiseAreas = advisor.AdvisorProfile.ExpertiseAreas,
            OfficeLocation = advisor.AdvisorProfile.OfficeLocation,
            ProfilePhotoUrl = advisor.AdvisorProfile.ProfilePhotoUrl,
            ShortBio = advisor.AdvisorProfile.ShortBio,
            MaxConcurrentStudents = advisor.AdvisorProfile.MaxConcurrentStudents,
            IsAcceptingRequests = advisor.AdvisorProfile.IsAcceptingRequests,
            SourceUrl = advisor.AdvisorProfile.SourceUrl,
            LastSyncedAt = advisor.AdvisorProfile.LastSyncedAt
        };
    }

    public async Task<AdvisorProfileResponseDto?> UpdateProfileAsync(Guid userId, AdvisorProfileUpdateDto dto)
    {
        var advisor = await _context.Users
            .Include(user => user.Department)
            .Include(user => user.AdvisorProfile)
            .FirstOrDefaultAsync(user => user.Id == userId && user.AdvisorProfile != null);

        if (advisor == null || advisor.AdvisorProfile == null)
        {
            return null;
        }

        advisor.FullName = Clean(dto.FullName);
        advisor.AdvisorProfile.AcademicTitle = Clean(dto.AcademicTitle);
        advisor.AdvisorProfile.ExpertiseAreas = Clean(dto.ExpertiseAreas);
        advisor.AdvisorProfile.OfficeLocation = CleanNullable(dto.OfficeLocation);
        advisor.AdvisorProfile.ProfilePhotoUrl = CleanNullable(dto.ProfilePhotoUrl);
        advisor.AdvisorProfile.ShortBio = CleanNullable(dto.ShortBio);
        advisor.AdvisorProfile.MaxConcurrentStudents = dto.MaxConcurrentStudents;
        advisor.AdvisorProfile.IsAcceptingRequests = dto.IsAcceptingRequests;
        advisor.AdvisorProfile.UpdatedAt = DateTime.UtcNow;

        await _context.SaveChangesAsync();

        return await GetProfileByUserIdAsync(userId);
    }

    public async Task<List<AdvisorLookupDto>> GetAvailableAdvisorsForProjectAsync(Guid studentUserId, int projectId)
    {
        var ownedProjectAdvisorId = await _context.Projects
            .AsNoTracking()
            .Where(project => project.Id == projectId)
            .Select(project => project.AdvisorUserId)
            .FirstOrDefaultAsync();

        var studentDepartmentId = await _context.Users
            .AsNoTracking()
            .Where(user => user.Id == studentUserId)
            .Select(user => user.DepartmentId)
            .FirstOrDefaultAsync();

        var projectDepartmentIds = await _context.ProjectDepartments
            .AsNoTracking()
            .Where(link => link.ProjectId == projectId)
            .Select(link => link.DepartmentId)
            .Distinct()
            .ToListAsync();

        var approvedCounts = await _context.AdvisorRequests
            .AsNoTracking()
            .Where(request => request.Status == "Approved")
            .GroupBy(request => request.AdvisorUserId)
            .Select(group => new
            {
                AdvisorUserId = group.Key,
                Count = group.Count()
            })
            .ToDictionaryAsync(item => item.AdvisorUserId, item => item.Count);

        var advisors = await _context.Users
            .AsNoTracking()
            .Include(user => user.Department)
            .Include(user => user.AdvisorProfile)
            .Where(user => user.AdvisorProfile != null && user.AdvisorProfile.IsAcceptingRequests)
            .OrderBy(user => user.FullName)
            .ToListAsync();

        if (ownedProjectAdvisorId.HasValue)
        {
            advisors = advisors
                .Where(user => user.Id == ownedProjectAdvisorId.Value)
                .ToList();
        }

        var filteredAdvisors = advisors;
        var hasProjectDepartmentMatch = false;
        if (projectDepartmentIds.Count > 0)
        {
            var projectDepartmentAdvisors = advisors
                .Where(user => user.DepartmentId.HasValue && projectDepartmentIds.Contains(user.DepartmentId.Value))
                .ToList();

            if (projectDepartmentAdvisors.Count > 0)
            {
                filteredAdvisors = projectDepartmentAdvisors;
                hasProjectDepartmentMatch = true;
            }
        }

        if (!hasProjectDepartmentMatch && studentDepartmentId.HasValue)
        {
            var studentDepartmentAdvisors = advisors
                .Where(user => user.DepartmentId == studentDepartmentId.Value)
                .ToList();

            if (studentDepartmentAdvisors.Count > 0)
            {
                filteredAdvisors = studentDepartmentAdvisors;
            }
        }

        return filteredAdvisors
            .Select(user =>
            {
                var approvedStudentCount = approvedCounts.TryGetValue(user.Id, out var count) ? count : 0;
                var hasCapacity = approvedStudentCount < (user.AdvisorProfile?.MaxConcurrentStudents ?? 0);

                return new AdvisorLookupDto
                {
                    UserId = user.Id,
                    FullName = user.FullName,
                    AcademicTitle = user.AdvisorProfile?.AcademicTitle ?? string.Empty,
                    ProfilePhotoUrl = user.AdvisorProfile?.ProfilePhotoUrl,
                    DepartmentName = user.Department?.Name,
                    FacultyName = user.Department?.FacultyName,
                    ExpertiseAreas = user.AdvisorProfile?.ExpertiseAreas ?? string.Empty,
                    OfficeLocation = user.AdvisorProfile?.OfficeLocation,
                    MaxConcurrentStudents = user.AdvisorProfile?.MaxConcurrentStudents ?? 0,
                    ApprovedStudentCount = approvedStudentCount,
                    IsAcceptingRequests = user.AdvisorProfile?.IsAcceptingRequests ?? false,
                    HasCapacity = hasCapacity
                };
            })
            .Where(advisor => advisor.HasCapacity)
            .ToList();
    }

    private static string Clean(string? value)
    {
        return value?.Trim() ?? string.Empty;
    }

    private static string? CleanNullable(string? value)
    {
        return string.IsNullOrWhiteSpace(value) ? null : value.Trim();
    }
}
