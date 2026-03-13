using GradPath.Business.DTOs.Student;
using GradPath.Data;
using GradPath.Data.Entities;
using Microsoft.EntityFrameworkCore;

namespace GradPath.Business.Services;

/// <summary>
/// Öğrenci profili ile ilgili iş mantığını yürüten servis.
/// </summary>
public class StudentService : IStudentService
{
    private readonly GradPathDbContext _context;

    // Veritabanı bağlantısını sisteme enjekte ediyoruz (Dependency Injection).
    public StudentService(GradPathDbContext context)
    {
        _context = context;
    }

    // PROFIL GETIRME: Öğrencinin profilini ve Kullanıcı tablosundaki Ad-Soyad, Email gibi bilgilerini birleştirip getirir.
    public async Task<StudentProfileResponseDto?> GetProfileByUserIdAsync(Guid userId)
    {
        // Öğrenci profilini bulurken yanına Kullanıcı (User) bilgilerini de getir diyoruz (Include).
        var profile = await _context.StudentProfiles
            .Include(p => p.User)
            .FirstOrDefaultAsync(p => p.UserId == userId);

        // Eğer profil yoksa (eskiden kalan bir kullanıcı ise), otomatik oluştur.
        if (profile == null) 
        {
            var user = await _context.Users.FindAsync(userId);
            if (user == null) return null;

            profile = new StudentProfile
            {
                UserId = userId,
                CreatedAt = DateTime.UtcNow,
                User = user
            };
            _context.StudentProfiles.Add(profile);
            await _context.SaveChangesAsync();
        }

        // Veritabanı verisini (Entity), Web paketine (DTO) dönüştürerek gönderiyoruz.
        return new StudentProfileResponseDto
        {
            Id = profile.Id,
            FullName = profile.User.FullName,
            Email = profile.User.Email ?? string.Empty,
            CGPA = profile.CGPA,
            TotalECTS = profile.TotalECTS,
            IsHonorStudent = profile.IsHonorStudent,
            CvFileName = profile.CvFileName,
            TranscriptFileName = profile.TranscriptFileName
        };
    }

    // GÜNCELLEME: Öğrencinin notlarını ve kredisini günceller.
    public async Task<bool> UpdateProfileAsync(Guid userId, StudentProfileUpdateDto request)
    {
        // Önce kullanıcının profilini bulalım.
        var profile = await _context.StudentProfiles.FirstOrDefaultAsync(p => p.UserId == userId);
        
        if (profile == null) return false;

        // Bilgileri güncelliyoruz.
        profile.CGPA = request.CGPA;
        profile.TotalECTS = request.TotalECTS;
        profile.UpdatedAt = DateTime.UtcNow;

        // KÜÇÜK İŞ MANTIĞI: 
        // Ortalaması 3.0 ve üstü ise sistemi otomatik olarak "Onur Öğrencisi" etiketi verdiriyoruz.
        if (profile.CGPA >= 3.0m)
        {
            profile.IsHonorStudent = true;
        }
        else
        {
            profile.IsHonorStudent = false;
        }

        // Değişiklikleri veritabanına kalıcı olarak kaydet.
        await _context.SaveChangesAsync();
        return true;
    }
}
