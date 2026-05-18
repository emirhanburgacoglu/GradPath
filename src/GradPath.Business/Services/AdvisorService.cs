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
}