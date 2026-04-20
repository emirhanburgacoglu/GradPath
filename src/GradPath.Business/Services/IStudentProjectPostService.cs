using GradPath.Business.DTOs.Student;
using GradPath.Business.DTOs.StudentProjectPost;

namespace GradPath.Business.Services;

public interface IStudentProjectPostService
{
    Task<List<StudentProjectPostResponseDto>> GetMineAsync(Guid ownerUserId);
    Task<List<StudentProjectPostResponseDto>> GetOpenPostsAsync();
    Task<List<StudentProjectPostMyApplicationDto>> GetMyApplicationsAsync(Guid applicantUserId);
    Task<StudentProjectPostResponseDto?> GetByIdAsync(Guid id, Guid? viewerUserId);
    Task<List<StudentProjectPostApplicationResponseDto>?> GetApplicationsForPostAsync(Guid ownerUserId, Guid postId);
    Task<StudentProjectPostFormOptionsDto> GetFormOptionsAsync();
    Task<StudentProjectPostResponseDto> CreateAsync(Guid ownerUserId, StudentProjectPostUpsertDto dto);
    Task<bool> UpdateAsync(Guid ownerUserId, Guid postId, StudentProjectPostUpsertDto dto);
    Task<bool> DeleteAsync(Guid ownerUserId, Guid postId);
    Task<StudentProjectPostActionResultDto> ApplyAsync(Guid applicantUserId, Guid postId);
    Task<StudentProjectPostActionResultDto> WithdrawApplicationAsync(Guid applicantUserId, Guid postId);
    Task<StudentProjectPostActionResultDto> AcceptApplicationAsync(Guid ownerUserId, Guid postId, Guid applicationId);
    Task<StudentProjectPostActionResultDto> RejectApplicationAsync(Guid ownerUserId, Guid postId, Guid applicationId);
}
