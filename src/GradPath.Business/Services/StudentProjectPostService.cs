using GradPath.Business.DTOs.Student;
using GradPath.Business.DTOs.StudentProjectPost;
using GradPath.Data;
using GradPath.Data.Entities;
using Microsoft.EntityFrameworkCore;

namespace GradPath.Business.Services;

public class StudentProjectPostService : IStudentProjectPostService
{
    private const string DraftStatus = "Draft";
    private const string OpenStatus = "Open";
    private const string ClosedStatus = "Closed";
    private const string FilledStatus = "Filled";

    private const string PendingApplicationStatus = "Pending";
    private const string AcceptedApplicationStatus = "Accepted";
    private const string RejectedApplicationStatus = "Rejected";
    private const string WithdrawnApplicationStatus = "Withdrawn";

    private readonly GradPathDbContext _context;

    public StudentProjectPostService(GradPathDbContext context)
    {
        _context = context;
    }

    public async Task<List<StudentProjectPostResponseDto>> GetMineAsync(Guid ownerUserId)
    {
        var posts = await GetStudentProjectPostsQuery()
            .Where(post => post.OwnerUserId == ownerUserId)
            .OrderByDescending(post => post.CreatedAt)
            .ToListAsync();

        return posts.Select(MapToResponseDto).ToList();
    }

    public async Task<List<StudentProjectPostResponseDto>> GetOpenPostsAsync()
    {
        var posts = await GetStudentProjectPostsQuery()
            .Where(post => post.Status == OpenStatus)
            .OrderByDescending(post => post.CreatedAt)
            .ToListAsync();

        return posts.Select(MapToResponseDto).ToList();
    }

    public async Task<List<StudentProjectPostMyApplicationDto>> GetMyApplicationsAsync(Guid applicantUserId)
    {
        return await _context.StudentProjectPostApplications
            .AsNoTracking()
            .Include(application => application.StudentProjectPost)
            .Where(application => application.ApplicantUserId == applicantUserId)
            .OrderByDescending(application => application.CreatedAt)
            .Select(application => new StudentProjectPostMyApplicationDto
            {
                Id = application.Id,
                StudentProjectPostId = application.StudentProjectPostId,
                OwnerUserId = application.StudentProjectPost.OwnerUserId,
                PostTitle = application.StudentProjectPost.Title,
                PostCategory = application.StudentProjectPost.Category,
                PostProjectType = application.StudentProjectPost.ProjectType,
                PostStatus = application.StudentProjectPost.Status,
                ApplicationDeadline = application.StudentProjectPost.ApplicationDeadline,
                Status = application.Status,
                CreatedAt = application.CreatedAt,
                UpdatedAt = application.UpdatedAt
            })
            .ToListAsync();
    }

    public async Task<StudentProjectPostResponseDto?> GetByIdAsync(Guid id, Guid? viewerUserId)
    {
        var query = GetStudentProjectPostsQuery()
            .Where(post => post.Id == id);

        query = viewerUserId.HasValue
            ? query.Where(post => post.OwnerUserId == viewerUserId.Value || post.Status == OpenStatus)
            : query.Where(post => post.Status == OpenStatus);

        var post = await query.FirstOrDefaultAsync();

        return post == null ? null : MapToResponseDto(post);
    }

    public async Task<List<StudentProjectPostApplicationResponseDto>?> GetApplicationsForPostAsync(Guid ownerUserId, Guid postId)
    {
        var postExists = await _context.StudentProjectPosts
            .AsNoTracking()
            .AnyAsync(post => post.Id == postId && post.OwnerUserId == ownerUserId);

        if (!postExists)
        {
            return null;
        }

        var applications = await _context.StudentProjectPostApplications
            .AsNoTracking()
            .Include(application => application.ApplicantUser)
                .ThenInclude(user => user.Department)
            .Where(application => application.StudentProjectPostId == postId)
            .OrderBy(application => application.Status != PendingApplicationStatus)
            .ThenByDescending(application => application.CreatedAt)
            .ToListAsync();

        return applications.Select(MapToApplicationResponseDto).ToList();
    }

    public async Task<StudentProjectPostFormOptionsDto> GetFormOptionsAsync()
    {
        var technologies = await _context.Technologies
            .AsNoTracking()
            .ToListAsync();

        var technologyOptions = technologies
            .Where(technology => !string.IsNullOrWhiteSpace(technology.Name))
            .GroupBy(technology => new
            {
                Name = NormalizeLookupKey(technology.Name),
                Category = NormalizeLookupKey(technology.Category)
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

        var departments = await _context.Departments
            .AsNoTracking()
            .OrderBy(department => department.FacultyName)
            .ThenBy(department => department.Name)
            .Select(department => new DepartmentOptionDto
            {
                Id = department.Id,
                Name = department.Name,
                Code = department.Code,
                FacultyName = department.FacultyName
            })
            .ToListAsync();

        return new StudentProjectPostFormOptionsDto
        {
            Technologies = technologyOptions,
            Departments = departments
        };
    }

    public async Task<StudentProjectPostResponseDto> CreateAsync(Guid ownerUserId, StudentProjectPostUpsertDto dto)
    {
        var post = new StudentProjectPost
        {
            Id = Guid.NewGuid(),
            OwnerUserId = ownerUserId,
            CreatedAt = DateTime.UtcNow
        };

        await ApplyUpsertAsync(post, dto);

        _context.StudentProjectPosts.Add(post);
        await _context.SaveChangesAsync();

        return await GetByIdAsync(post.Id, ownerUserId) ?? MapToResponseDto(post);
    }

    public async Task<bool> UpdateAsync(Guid ownerUserId, Guid postId, StudentProjectPostUpsertDto dto)
    {
        var post = await _context.StudentProjectPosts
            .Include(item => item.Technologies)
            .Include(item => item.Departments)
            .Include(item => item.Applications)
            .FirstOrDefaultAsync(item => item.Id == postId && item.OwnerUserId == ownerUserId);

        if (post == null)
        {
            return false;
        }

        await ApplyUpsertAsync(post, dto);
        AlignPostStatusWithAcceptedApplications(post);
        post.UpdatedAt = DateTime.UtcNow;

        await _context.SaveChangesAsync();
        return true;
    }

    public async Task<bool> DeleteAsync(Guid ownerUserId, Guid postId)
    {
        var post = await _context.StudentProjectPosts
            .FirstOrDefaultAsync(item => item.Id == postId && item.OwnerUserId == ownerUserId);

        if (post == null)
        {
            return false;
        }

        _context.StudentProjectPosts.Remove(post);
        await _context.SaveChangesAsync();
        return true;
    }

    public async Task<StudentProjectPostActionResultDto> ApplyAsync(Guid applicantUserId, Guid postId)
    {
        var post = await _context.StudentProjectPosts
            .Include(item => item.Applications)
            .FirstOrDefaultAsync(item => item.Id == postId);

        if (post == null)
        {
            return Failure("Ilan bulunamadi.");
        }

        if (post.OwnerUserId == applicantUserId)
        {
            return Failure("Kendi ilanina basvuru gonderemezsin.");
        }

        if (post.Status != OpenStatus)
        {
            return Failure("Sadece acik ilanlara basvuru yapabilirsin.");
        }

        if (post.ApplicationDeadline.HasValue && post.ApplicationDeadline.Value <= DateTime.UtcNow)
        {
            return Failure("Bu ilanin basvuru suresi sona ermis.");
        }

        if (post.NeededMemberCount <= 0)
        {
            return Failure("Bu ilan yeni uye aramiyor.");
        }

        if (GetAcceptedApplicationCount(post) >= post.NeededMemberCount)
        {
            post.Status = FilledStatus;
            post.UpdatedAt = DateTime.UtcNow;
            await _context.SaveChangesAsync();
            return Failure("Bu ilandaki kontenjan dolmus.");
        }

        var existingApplication = post.Applications
            .FirstOrDefault(application => application.ApplicantUserId == applicantUserId);

        if (existingApplication != null)
        {
            if (existingApplication.Status == PendingApplicationStatus)
            {
                return Failure("Bu ilana zaten basvurdun.");
            }

            if (existingApplication.Status == AcceptedApplicationStatus)
            {
                return Failure("Basvurun zaten kabul edilmis.");
            }

            existingApplication.Status = PendingApplicationStatus;
            existingApplication.UpdatedAt = DateTime.UtcNow;
            post.UpdatedAt = DateTime.UtcNow;

            await _context.SaveChangesAsync();
            return Success("Basvurun tekrar gonderildi.");
        }

        _context.StudentProjectPostApplications.Add(new StudentProjectPostApplication
        {
            Id = Guid.NewGuid(),
            StudentProjectPostId = post.Id,
            ApplicantUserId = applicantUserId,
            Status = PendingApplicationStatus,
            CreatedAt = DateTime.UtcNow
        });

        post.UpdatedAt = DateTime.UtcNow;
        await _context.SaveChangesAsync();

        return Success("Basvurun basariyla gonderildi.");
    }

    public async Task<StudentProjectPostActionResultDto> WithdrawApplicationAsync(Guid applicantUserId, Guid postId)
    {
        var application = await _context.StudentProjectPostApplications
            .Include(item => item.StudentProjectPost)
            .FirstOrDefaultAsync(item =>
                item.StudentProjectPostId == postId &&
                item.ApplicantUserId == applicantUserId);

        if (application == null)
        {
            return Failure("Geri cekilecek bir basvuru bulunamadi.");
        }

        if (application.Status == AcceptedApplicationStatus)
        {
            return Failure("Kabul edilen basvuru geri cekilemez.");
        }

        if (application.Status == WithdrawnApplicationStatus)
        {
            return Failure("Basvurun zaten geri cekilmis.");
        }

        application.Status = WithdrawnApplicationStatus;
        application.UpdatedAt = DateTime.UtcNow;
        application.StudentProjectPost.UpdatedAt = DateTime.UtcNow;

        await _context.SaveChangesAsync();

        return Success("Basvurun geri cekildi.");
    }

    public async Task<StudentProjectPostActionResultDto> AcceptApplicationAsync(Guid ownerUserId, Guid postId, Guid applicationId)
    {
        return await UpdateApplicationDecisionAsync(
            ownerUserId,
            postId,
            applicationId,
            AcceptedApplicationStatus,
            "Basvuru kabul edildi.");
    }

    public async Task<StudentProjectPostActionResultDto> RejectApplicationAsync(Guid ownerUserId, Guid postId, Guid applicationId)
    {
        return await UpdateApplicationDecisionAsync(
            ownerUserId,
            postId,
            applicationId,
            RejectedApplicationStatus,
            "Basvuru reddedildi.");
    }

    private IQueryable<StudentProjectPost> GetStudentProjectPostsQuery()
    {
        return _context.StudentProjectPosts
            .Include(post => post.Technologies)
                .ThenInclude(link => link.Technology)
            .Include(post => post.Departments)
                .ThenInclude(link => link.Department)
            .Include(post => post.Applications)
            .AsSplitQuery()
            .AsNoTracking();
    }

    private async Task<StudentProjectPostActionResultDto> UpdateApplicationDecisionAsync(
        Guid ownerUserId,
        Guid postId,
        Guid applicationId,
        string targetStatus,
        string successMessage)
    {
        var post = await _context.StudentProjectPosts
            .Include(item => item.Applications)
            .FirstOrDefaultAsync(item => item.Id == postId && item.OwnerUserId == ownerUserId);

        if (post == null)
        {
            return Failure("Ilan bulunamadi veya bu ilana erisim iznin yok.");
        }

        if (post.Status == DraftStatus || post.Status == ClosedStatus)
        {
            return Failure("Taslak veya kapali ilanlarda basvuru yonetimi yapilamaz.");
        }

        var application = post.Applications
            .FirstOrDefault(item => item.Id == applicationId);

        if (application == null)
        {
            return Failure("Basvuru bulunamadi.");
        }

        if (application.Status == WithdrawnApplicationStatus)
        {
            return Failure("Geri cekilen basvuru isleme alinamaz.");
        }

        if (targetStatus == AcceptedApplicationStatus)
        {
            if (GetAcceptedApplicationCount(post) >= post.NeededMemberCount
                && application.Status != AcceptedApplicationStatus)
            {
                AlignPostStatusWithAcceptedApplications(post);
                post.UpdatedAt = DateTime.UtcNow;
                await _context.SaveChangesAsync();
                return Failure("Bu ilanda bos kontenjan kalmadi.");
            }
        }

        application.Status = targetStatus;
        application.UpdatedAt = DateTime.UtcNow;

        AlignPostStatusWithAcceptedApplications(post);
        post.UpdatedAt = DateTime.UtcNow;

        await _context.SaveChangesAsync();
        return Success(successMessage);
    }

    private async Task ApplyUpsertAsync(StudentProjectPost post, StudentProjectPostUpsertDto dto)
    {
        post.Title = CleanText(dto.Title);
        post.Description = CleanText(dto.Description);
        post.Category = CleanText(dto.Category);
        post.ProjectType = CleanText(dto.ProjectType);
        post.Status = NormalizeStatus(dto.Status);
        post.TeamSize = dto.TeamSize;
        post.NeededMemberCount = dto.NeededMemberCount;
        post.ApplicationDeadline = dto.ApplicationDeadline;

        if (post.Technologies.Count > 0)
        {
            _context.StudentProjectPostTechnologies.RemoveRange(post.Technologies);
            post.Technologies.Clear();
        }

        if (post.Departments.Count > 0)
        {
            _context.StudentProjectPostDepartments.RemoveRange(post.Departments);
            post.Departments.Clear();
        }

        var technologyIds = (dto.TechnologyIds ?? new List<int>())
            .Distinct()
            .ToList();

        if (technologyIds.Count > 0)
        {
            var validTechnologyIds = await _context.Technologies
                .Where(technology => technologyIds.Contains(technology.Id))
                .Select(technology => technology.Id)
                .ToListAsync();

            foreach (var technologyId in validTechnologyIds)
            {
                post.Technologies.Add(new StudentProjectPostTechnology
                {
                    StudentProjectPostId = post.Id,
                    TechnologyId = technologyId
                });
            }
        }

        var departmentIds = (dto.DepartmentIds ?? new List<int>())
            .Distinct()
            .ToList();

        if (departmentIds.Count > 0)
        {
            var validDepartmentIds = await _context.Departments
                .Where(department => departmentIds.Contains(department.Id))
                .Select(department => department.Id)
                .ToListAsync();

            foreach (var departmentId in validDepartmentIds)
            {
                post.Departments.Add(new StudentProjectPostDepartment
                {
                    StudentProjectPostId = post.Id,
                    DepartmentId = departmentId
                });
            }
        }
    }

    private static StudentProjectPostResponseDto MapToResponseDto(StudentProjectPost post)
    {
        var pendingApplicationCount = post.Applications.Count(application => application.Status == PendingApplicationStatus);
        var acceptedApplicationCount = GetAcceptedApplicationCount(post);
        var rejectedApplicationCount = post.Applications.Count(application => application.Status == RejectedApplicationStatus);

        return new StudentProjectPostResponseDto
        {
            Id = post.Id,
            OwnerUserId = post.OwnerUserId,
            Title = post.Title,
            Description = post.Description,
            Category = post.Category,
            ProjectType = post.ProjectType,
            Status = post.Status,
            TeamSize = post.TeamSize,
            NeededMemberCount = post.NeededMemberCount,
            ApplicationDeadline = post.ApplicationDeadline,
            CreatedAt = post.CreatedAt,
            UpdatedAt = post.UpdatedAt,
            TechnologyIds = post.Technologies
                .Select(link => link.TechnologyId)
                .Distinct()
                .ToList(),
            TechnologyNames = post.Technologies
                .Where(link => link.Technology != null)
                .Select(link => link.Technology.Name)
                .Distinct()
                .OrderBy(name => name)
                .ToList(),
            DepartmentIds = post.Departments
                .Select(link => link.DepartmentId)
                .Distinct()
                .ToList(),
            DepartmentNames = post.Departments
                .Where(link => link.Department != null)
                .Select(link => link.Department.Name)
                .Distinct()
                .OrderBy(name => name)
                .ToList(),
            PendingApplicationCount = pendingApplicationCount,
            AcceptedApplicationCount = acceptedApplicationCount,
            RejectedApplicationCount = rejectedApplicationCount,
            AvailableMemberSlotCount = Math.Max(post.NeededMemberCount - acceptedApplicationCount, 0)
        };
    }

    private static StudentProjectPostApplicationResponseDto MapToApplicationResponseDto(StudentProjectPostApplication application)
    {
        return new StudentProjectPostApplicationResponseDto
        {
            Id = application.Id,
            StudentProjectPostId = application.StudentProjectPostId,
            ApplicantUserId = application.ApplicantUserId,
            ApplicantFullName = application.ApplicantUser.FullName,
            ApplicantEmail = application.ApplicantUser.Email ?? string.Empty,
            ApplicantDepartmentName = application.ApplicantUser.Department?.Name ?? string.Empty,
            Status = application.Status,
            CreatedAt = application.CreatedAt,
            UpdatedAt = application.UpdatedAt
        };
    }

    private static int GetAcceptedApplicationCount(StudentProjectPost post)
    {
        return post.Applications.Count(application => application.Status == AcceptedApplicationStatus);
    }

    private static void AlignPostStatusWithAcceptedApplications(StudentProjectPost post)
    {
        if (post.NeededMemberCount <= 0)
        {
            return;
        }

        var acceptedApplicationCount = GetAcceptedApplicationCount(post);

        if (acceptedApplicationCount >= post.NeededMemberCount)
        {
            post.Status = FilledStatus;
            return;
        }

        if (post.Status == FilledStatus)
        {
            post.Status = OpenStatus;
        }
    }

    private static StudentProjectPostActionResultDto Success(string message)
    {
        return new StudentProjectPostActionResultDto
        {
            Succeeded = true,
            Message = message
        };
    }

    private static StudentProjectPostActionResultDto Failure(string message)
    {
        return new StudentProjectPostActionResultDto
        {
            Succeeded = false,
            Message = message
        };
    }

    private static string CleanText(string? value)
    {
        return string.IsNullOrWhiteSpace(value)
            ? string.Empty
            : value.Trim();
    }

    private static string NormalizeStatus(string? value)
    {
        if (string.IsNullOrWhiteSpace(value))
        {
            return OpenStatus;
        }

        var trimmed = value.Trim();

        if (trimmed.Equals(DraftStatus, StringComparison.OrdinalIgnoreCase))
        {
            return DraftStatus;
        }

        if (trimmed.Equals(OpenStatus, StringComparison.OrdinalIgnoreCase))
        {
            return OpenStatus;
        }

        if (trimmed.Equals(ClosedStatus, StringComparison.OrdinalIgnoreCase))
        {
            return ClosedStatus;
        }

        if (trimmed.Equals(FilledStatus, StringComparison.OrdinalIgnoreCase))
        {
            return FilledStatus;
        }

        return OpenStatus;
    }

    private static string NormalizeLookupKey(string? value)
    {
        return string.IsNullOrWhiteSpace(value)
            ? string.Empty
            : value.Trim().ToLowerInvariant();
    }
}
