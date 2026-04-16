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

}
