using GradPath.Business.DTOs.AdvisorRequest;
using GradPath.Data;
using GradPath.Data.Entities;
using Microsoft.EntityFrameworkCore;

namespace GradPath.Business.Services;

public class AdvisorRequestService : IAdvisorRequestService
{
    private const string PendingStatus = "Pending";
    private const string ApprovedStatus = "Approved";
    private const string RejectedStatus = "Rejected";

    private readonly GradPathDbContext _context;

    public AdvisorRequestService(GradPathDbContext context)
    {
        _context = context;
    }

    public async Task<List<AdvisorRequestResponseDto>> GetStudentRequestsAsync(Guid studentUserId)
    {
        var requests = await GetAdvisorRequestQuery()
            .Where(request => request.StudentUserId == studentUserId)
            .OrderByDescending(request => request.CreatedAt)
            .ToListAsync();

        return requests.Select(MapToDto).ToList();
    }

    public async Task<List<AdvisorRequestResponseDto>> GetIncomingRequestsAsync(Guid advisorUserId)
    {
        var requests = await GetAdvisorRequestQuery()
            .Where(request => request.AdvisorUserId == advisorUserId)
            .OrderBy(request => request.Status != PendingStatus)
            .ThenByDescending(request => request.CreatedAt)
            .ToListAsync();

        return requests.Select(MapToDto).ToList();
    }

    public async Task<AdvisorRequestActionResultDto> CreateAsync(Guid studentUserId, AdvisorRequestCreateDto dto)
    {
        var project = await _context.Projects
            .AsNoTracking()
            .FirstOrDefaultAsync(item => item.Id == dto.ProjectId);

        if (project == null)
        {
            return Failure("Secilen proje bulunamadi.");
        }

        var advisor = await _context.Users
            .Include(user => user.AdvisorProfile)
            .FirstOrDefaultAsync(user => user.Id == dto.AdvisorUserId && user.AdvisorProfile != null);

        if (advisor?.AdvisorProfile == null)
        {
            return Failure("Secilen danisman bulunamadi.");
        }

        if (!advisor.AdvisorProfile.IsAcceptingRequests)
        {
            return Failure("Bu danisman su anda yeni talep kabul etmiyor.");
        }

        var approvedCount = await _context.AdvisorRequests
            .CountAsync(request => request.AdvisorUserId == dto.AdvisorUserId && request.Status == ApprovedStatus);

        if (approvedCount >= advisor.AdvisorProfile.MaxConcurrentStudents)
        {
            return Failure("Bu danismanin kontenjani dolu.");
        }

        var existingApprovedRequest = await _context.AdvisorRequests
            .AsNoTracking()
            .Where(request => request.StudentUserId == studentUserId && request.Status == ApprovedStatus)
            .Select(request => request.Project.Title)
            .FirstOrDefaultAsync();

        if (!string.IsNullOrWhiteSpace(existingApprovedRequest))
        {
            return Failure("Onaylanmis bir danisman secimin zaten var.");
        }

        var existingPendingForProject = await _context.AdvisorRequests
            .Include(request => request.AdvisorUser)
            .FirstOrDefaultAsync(request =>
                request.StudentUserId == studentUserId &&
                request.ProjectId == dto.ProjectId &&
                request.Status == PendingStatus);

        if (existingPendingForProject != null && existingPendingForProject.AdvisorUserId != dto.AdvisorUserId)
        {
            return Failure($"Bu proje icin zaten {existingPendingForProject.AdvisorUser.FullName} hocaya bekleyen bir talep gonderdin.");
        }

        var existingRequest = await _context.AdvisorRequests
            .FirstOrDefaultAsync(request =>
                request.StudentUserId == studentUserId &&
                request.ProjectId == dto.ProjectId &&
                request.AdvisorUserId == dto.AdvisorUserId);

        if (existingRequest != null)
        {
            if (existingRequest.Status == PendingStatus)
            {
                return Failure("Bu danismana zaten bekleyen bir talep gonderdin.");
            }

            if (existingRequest.Status == ApprovedStatus)
            {
                return Failure("Bu danisman secimi zaten onaylanmis.");
            }

            existingRequest.Status = PendingStatus;
            existingRequest.StudentNote = NormalizeNote(dto.StudentNote);
            existingRequest.AdvisorNote = null;
            existingRequest.RespondedAt = null;
            existingRequest.UpdatedAt = DateTime.UtcNow;

            await _context.SaveChangesAsync();
            return Success("Danismanlik talebi tekrar gonderildi.");
        }

        _context.AdvisorRequests.Add(new AdvisorRequest
        {
            Id = Guid.NewGuid(),
            StudentUserId = studentUserId,
            AdvisorUserId = dto.AdvisorUserId,
            ProjectId = dto.ProjectId,
            Status = PendingStatus,
            StudentNote = NormalizeNote(dto.StudentNote),
            CreatedAt = DateTime.UtcNow
        });

        await _context.SaveChangesAsync();
        return Success("Danismanlik talebi basariyla gonderildi.");
    }

    public async Task<AdvisorRequestActionResultDto> ApproveAsync(Guid advisorUserId, Guid requestId, string? advisorNote)
    {
        var request = await _context.AdvisorRequests
            .Include(item => item.AdvisorUser)
                .ThenInclude(user => user.AdvisorProfile)
            .FirstOrDefaultAsync(item => item.Id == requestId && item.AdvisorUserId == advisorUserId);

        if (request == null)
        {
            return Failure("Onaylanacak talep bulunamadi.");
        }

        if (request.Status == ApprovedStatus)
        {
            return Failure("Bu talep zaten onaylanmis.");
        }

        var maxConcurrentStudents = request.AdvisorUser.AdvisorProfile?.MaxConcurrentStudents ?? 0;
        var approvedCount = await _context.AdvisorRequests
            .CountAsync(item =>
                item.AdvisorUserId == advisorUserId &&
                item.Status == ApprovedStatus &&
                item.Id != requestId);

        if (approvedCount >= maxConcurrentStudents)
        {
            return Failure("Kontenjan dolu oldugu icin talep onaylanamiyor.");
        }

        var studentAlreadyApproved = await _context.AdvisorRequests
            .AnyAsync(item =>
                item.StudentUserId == request.StudentUserId &&
                item.Status == ApprovedStatus &&
                item.Id != requestId);

        if (studentAlreadyApproved)
        {
            return Failure("Ogrencinin baska bir onayli danisman secimi bulunuyor.");
        }

        request.Status = ApprovedStatus;
        request.AdvisorNote = NormalizeNote(advisorNote);
        request.RespondedAt = DateTime.UtcNow;
        request.UpdatedAt = DateTime.UtcNow;

        var competingRequests = await _context.AdvisorRequests
            .Where(item =>
                item.StudentUserId == request.StudentUserId &&
                item.Status == PendingStatus &&
                item.Id != requestId)
            .ToListAsync();

        foreach (var competingRequest in competingRequests)
        {
            competingRequest.Status = RejectedStatus;
            competingRequest.AdvisorNote = "Ogrenci baska bir danisman ile eslestirildi.";
            competingRequest.RespondedAt = DateTime.UtcNow;
            competingRequest.UpdatedAt = DateTime.UtcNow;
        }

        await _context.SaveChangesAsync();
        return Success("Danismanlik talebi onaylandi.");
    }

    public async Task<AdvisorRequestActionResultDto> RejectAsync(Guid advisorUserId, Guid requestId, string? advisorNote)
    {
        var request = await _context.AdvisorRequests
            .FirstOrDefaultAsync(item => item.Id == requestId && item.AdvisorUserId == advisorUserId);

        if (request == null)
        {
            return Failure("Reddedilecek talep bulunamadi.");
        }

        if (request.Status == RejectedStatus)
        {
            return Failure("Bu talep zaten reddedilmis.");
        }

        request.Status = RejectedStatus;
        request.AdvisorNote = NormalizeNote(advisorNote);
        request.RespondedAt = DateTime.UtcNow;
        request.UpdatedAt = DateTime.UtcNow;

        await _context.SaveChangesAsync();
        return Success("Danismanlik talebi reddedildi.");
    }

    private IQueryable<AdvisorRequest> GetAdvisorRequestQuery()
    {
        return _context.AdvisorRequests
            .AsNoTracking()
            .Include(request => request.Project)
            .Include(request => request.StudentUser)
                .ThenInclude(user => user.Department)
            .Include(request => request.AdvisorUser)
                .ThenInclude(user => user.Department)
            .Include(request => request.AdvisorUser)
                .ThenInclude(user => user.AdvisorProfile);
    }

    private static AdvisorRequestResponseDto MapToDto(AdvisorRequest request)
    {
        return new AdvisorRequestResponseDto
        {
            Id = request.Id,
            ProjectId = request.ProjectId,
            ProjectTitle = request.Project.Title,
            ProjectCategory = request.Project.Category,
            StudentUserId = request.StudentUserId,
            StudentFullName = request.StudentUser.FullName,
            StudentDepartmentName = request.StudentUser.Department?.Name,
            AdvisorUserId = request.AdvisorUserId,
            AdvisorFullName = request.AdvisorUser.FullName,
            AdvisorAcademicTitle = request.AdvisorUser.AdvisorProfile?.AcademicTitle ?? string.Empty,
            AdvisorDepartmentName = request.AdvisorUser.Department?.Name,
            Status = request.Status,
            StudentNote = request.StudentNote,
            AdvisorNote = request.AdvisorNote,
            CreatedAt = request.CreatedAt,
            UpdatedAt = request.UpdatedAt,
            RespondedAt = request.RespondedAt
        };
    }

    private static string? NormalizeNote(string? note)
    {
        return string.IsNullOrWhiteSpace(note) ? null : note.Trim();
    }

    private static AdvisorRequestActionResultDto Success(string message)
    {
        return new AdvisorRequestActionResultDto
        {
            Succeeded = true,
            Message = message
        };
    }

    private static AdvisorRequestActionResultDto Failure(string message)
    {
        return new AdvisorRequestActionResultDto
        {
            Succeeded = false,
            Message = message
        };
    }
}
