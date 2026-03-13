using GradPath.Business.DTOs.Student;

namespace GradPath.Business.Services;

/// <summary>
/// Öğrenci profil işlemleri için gerekli metodları tanımlayan sözleşme (Interface).
/// </summary>
public interface IStudentService
{
    // Kullanıcı ID'sine göre öğrenci profilini ve temel kullanıcı bilgilerini getirir.
    Task<StudentProfileResponseDto?> GetProfileByUserIdAsync(Guid userId);

    // Öğrencinin not ortalaması ve AKTS bilgisini günceller.
    Task<bool> UpdateProfileAsync(Guid userId, StudentProfileUpdateDto request);
}
