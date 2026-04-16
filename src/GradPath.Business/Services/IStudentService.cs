using GradPath.Business.DTOs.Student;

namespace GradPath.Business.Services;

/// <summary>
/// Öğrenci profil işlemleri için gerekli metodları tanımlayan sözleşme (Interface).
/// </summary>
public interface IStudentService
{
    // Kullanıcı ID'sine göre öğrenci profilini ve temel kullanıcı bilgilerini getirir.
    Task<StudentProfileResponseDto?> GetProfileByUserIdAsync(Guid userId);

    // Transkript PDF'ini işler ve verileri otomatik çıkarır (AI tabanlı).
    Task<bool> ProcessTranscriptAsync(Guid userId, Stream pdfStream);

    // CV PDF'ini işler ve verileri otomatik çıkarır (AI tabanlı).
    Task<bool> ProcessCvAsync(Guid userId, Stream pdfStream);

    // Öğrencinin not ortalaması ve AKTS bilgisini günceller.
    Task<bool> UpdateProfileAsync(Guid userId, StudentProfileUpdateDto request);

    // Yüklenen CV dosya adını veritabanına kaydeder.
    Task<bool> UpdateCvFileNameAsync(Guid userId, string fileName);

    // Yüklenen Transkript dosya adını veritabanına kaydeder.
    Task<bool> UpdateTranscriptFileNameAsync(Guid userId, string fileName);


    // Yetenek Yönetimi (Skills)
    Task<List<StudentSkillDto>> GetSkillsAsync(Guid userId);
    Task<bool> AddSkillAsync(Guid userId, StudentSkillDto skillDto);
    Task<bool> RemoveSkillAsync(Guid userId, int technologyId);

    Task<List<StudentSkillDto>> GetDraftSkillsFromCvAsync(Guid userId);
    Task<bool> ReplaceSkillsAsync(Guid userId, List<StudentSkillDto> skills);
    // Education CRUD
    Task<List<StudentEducationCrudDto>> GetEducationsAsync(Guid userId);
    Task<bool> AddEducationAsync(Guid userId, StudentEducationCrudDto dto);
    Task<bool> UpdateEducationAsync(Guid userId, Guid educationId, StudentEducationCrudDto dto);
    Task<bool> RemoveEducationAsync(Guid userId, Guid educationId);

    // Experience CRUD
    Task<List<StudentExperienceCrudDto>> GetExperiencesAsync(Guid userId);
    Task<bool> AddExperienceAsync(Guid userId, StudentExperienceCrudDto dto);
    Task<bool> UpdateExperienceAsync(Guid userId, Guid experienceId, StudentExperienceCrudDto dto);
    Task<bool> RemoveExperienceAsync(Guid userId, Guid experienceId);

    // CV Project CRUD
    Task<List<StudentCvProjectCrudDto>> GetCvProjectsAsync(Guid userId);
    Task<bool> AddCvProjectAsync(Guid userId, StudentCvProjectCrudDto dto);
    Task<bool> UpdateCvProjectAsync(Guid userId, Guid projectId, StudentCvProjectCrudDto dto);
    Task<bool> RemoveCvProjectAsync(Guid userId, Guid projectId);

    // Domain Signal CRUD
    Task<List<StudentDomainSignalCrudDto>> GetDomainSignalsAsync(Guid userId);
    Task<bool> AddDomainSignalAsync(Guid userId, StudentDomainSignalCrudDto dto);
    Task<bool> UpdateDomainSignalAsync(Guid userId, Guid domainSignalId, StudentDomainSignalCrudDto dto);
    Task<bool> RemoveDomainSignalAsync(Guid userId, Guid domainSignalId);

}
