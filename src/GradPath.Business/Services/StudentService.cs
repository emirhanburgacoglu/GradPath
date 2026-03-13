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

    public async Task<bool> UpdateCvFileNameAsync(Guid userId, string fileName)
    {
        var profile = await _context.StudentProfiles.FirstOrDefaultAsync(p => p.UserId == userId);
        if (profile == null) return false;

        profile.CvFileName = fileName;
        profile.UpdatedAt = DateTime.UtcNow;

        await _context.SaveChangesAsync();
        return true;
    }

    public async Task<bool> UpdateTranscriptFileNameAsync(Guid userId, string fileName)
    {
        var profile = await _context.StudentProfiles.FirstOrDefaultAsync(p => p.UserId == userId);
        if (profile == null) return false;

        profile.TranscriptFileName = fileName;
        profile.UpdatedAt = DateTime.UtcNow;

        await _context.SaveChangesAsync();
        return true;
    }

    // YETENEK LİSTELEME: Öğrencinin bildiği tüm teknolojileri getirir.
    public async Task<List<StudentSkillDto>> GetSkillsAsync(Guid userId)
    {
        return await _context.StudentTechnologies
            .Where(st => st.UserId == userId)
            .Include(st => st.Technology) // Teknoloji ismini almak için Join yapıyoruz.
            .Select(st => new StudentSkillDto
            {
                TechnologyId = st.TechnologyId,
                TechnologyName = st.Technology.Name,
                ProficiencyLevel = st.ProficiencyLevel
            })
            .ToListAsync();
    }

    // YETENEK EKLEME: Yeni bir yetenek ekler veya varsa seviyesini günceller (Upsert).
    public async Task<bool> AddSkillAsync(Guid userId, StudentSkillDto skillDto)
    {
        // Önce bu yetenek zaten ekli mi diye bakalım.
        var existingSkill = await _context.StudentTechnologies
            .FirstOrDefaultAsync(st => st.UserId == userId && st.TechnologyId == skillDto.TechnologyId);

        if (existingSkill != null)
        {
            // Varsa sadece seviyesini güncelle.
            existingSkill.ProficiencyLevel = skillDto.ProficiencyLevel;
        }
        else
        {
            // Yoksa yeni kayıt ekle.
            var newSkill = new StudentTechnology
            {
                UserId = userId,
                TechnologyId = skillDto.TechnologyId,
                ProficiencyLevel = skillDto.ProficiencyLevel
            };
            _context.StudentTechnologies.Add(newSkill);
        }

        await _context.SaveChangesAsync();
        return true;
    }

    // YETENEK SİLME: Öğrencinin bir yeteneğini listeden kaldırır.
    public async Task<bool> RemoveSkillAsync(Guid userId, int technologyId)
    {
        var skill = await _context.StudentTechnologies
            .FirstOrDefaultAsync(st => st.UserId == userId && st.TechnologyId == technologyId);

        if (skill == null) return false;

        _context.StudentTechnologies.Remove(skill);
        await _context.SaveChangesAsync();
        return true;
    }
}
