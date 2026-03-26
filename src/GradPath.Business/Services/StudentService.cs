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
    private readonly IPdfService _pdfService;
    private readonly IGroqApiService _groqApiService;

    public StudentService(GradPathDbContext context, IPdfService pdfService, IGroqApiService groqApiService)
    {
        _context = context;
        _pdfService = pdfService;
        _groqApiService = groqApiService;
    }

    public async Task<bool> ProcessTranscriptAsync(Guid userId, Stream pdfStream)
    {
        // 1. PDF'den ham metni çıkar
        var rawText = await _pdfService.ExtractTextFromPdfAsync(pdfStream);
        if (string.IsNullOrWhiteSpace(rawText)) return false;

        // 2. Yapay Zekadan (Groq) veriyi ayıklamasını iste
        var prompt = $@"Aşağıdaki transkript metninden şu bilgileri çıkar ve SADECE JSON formatında dön. 
        JSON yapısı tam olarak şöyle olmalı:
        {{
            ""CGPA"": 3.50,
            ""TotalECTS"": 180,
            ""Technologies"": [""C#"", ""React"", ""SQL""]
        }}

        Eğer bir veri bulunamazsa CGPA için 0, ECTS için 0, Technologies için boş liste döndür.

        Transkript Metni:
        {rawText}";

        var aiResponse = await _groqApiService.GetProjectExplanationAsync("Sen bir akademik veri analiz asistanısın. Sadece saf JSON formatında cevap verirsin.", prompt);

        try 
        {
            // AI cevabındaki JSON kısmını temizle (Markdown ```json ... ``` bloklarını kaldır)
            var cleanJson = aiResponse.Replace("```json", "").Replace("```", "").Trim();
            
            using var doc = System.Text.Json.JsonDocument.Parse(cleanJson);
            var root = doc.RootElement;

            var profile = await _context.StudentProfiles.FirstOrDefaultAsync(p => p.UserId == userId);
            if (profile != null)
            {
                if (root.TryGetProperty("CGPA", out var cgpaProp))
                    profile.CGPA = cgpaProp.GetDecimal();
                
                if (root.TryGetProperty("TotalECTS", out var ectsProp))
                    profile.TotalECTS = ectsProp.GetInt32();

                profile.UpdatedAt = DateTime.UtcNow;
                
                // Onur öğrencisi kontrolü (Kendi iş mantığımızı işletiyoruz)
                profile.IsHonorStudent = profile.CGPA >= 3.0m;

                // Teknolojileri/Yetenekleri ekle
                if (root.TryGetProperty("Technologies", out var techsProp))
                {
                    foreach (var techName in techsProp.EnumerateArray())
                    {
                        var name = techName.GetString();
                        if (string.IsNullOrEmpty(name)) continue;

                        // Veritabanında bu isimde bir teknoloji var mı?
                        var tech = await _context.Technologies
                            .FirstOrDefaultAsync(t => t.Name.ToLower() == name.ToLower());
                        
                        if (tech != null)
                        {
                            // Öğrenciye bu yeteneği ekleyelim (varsa güncellemeye gerek yok)
                            var existing = await _context.StudentTechnologies
                                .AnyAsync(st => st.UserId == userId && st.TechnologyId == tech.Id);
                            
                            if (!existing)
                            {
                                _context.StudentTechnologies.Add(new StudentTechnology
                                {
                                    UserId = userId,
                                    TechnologyId = tech.Id,
                                    ProficiencyLevel = 2 // Mid-level varsayalım
                                });
                            }
                        }
                    }
                }

                await _context.SaveChangesAsync();
            }
        }
        catch (Exception ex)
        {
            // JSON Parse hatası veya başka bir hata durumunda loglanabilir
            return false;
        }

        return true;
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
    TranscriptFileName = profile.TranscriptFileName,
    CvSummary = profile.ParsedCvData // Bu satırı ekleyin!
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
  public async Task<bool> ProcessCvAsync(Guid userId, Stream pdfStream)
{
    // 1. PDF'den metni çıkar
    var rawText = await _pdfService.ExtractTextFromPdfAsync(pdfStream);
    if (string.IsNullOrWhiteSpace(rawText)) return false;

    // 2. Yapay Zekadan (AI) CV analizi iste
var prompt = $@"Görevin: Aşağıdaki CV metnindeki TÜM teknik becerileri, programlama dillerini, kütüphaneleri, frameworkleri ve veritabanı yönetim sistemlerini eksiksiz bir liste olarak çıkar. 
Özellikle 'Technical Skills', 'Experience' ve 'Projects' kısımlarına odaklan. 

SADECE şu JSON formatında cevap ver:
{{ 
    ""Skills"": [""C#"", ""Python"", "".NET Core"", ""SQL"", ""PostgreSQL"", ""MySQL"", ""Git"", ""GitHub"", ""OpenCV"", ""Raspberry Pi""], 
    ""Summary"": ""Öğrencinin kısa özeti"" 
}}

NOT: Veritabanımızdaki isimlerle eşleşmesi için 'C-Sharp' yerine 'C#', 'Postgre' yerine 'PostgreSQL' gibi tam isimleri kullan.

CV Metni:
{rawText}";


    var aiResponse = await _groqApiService.GetProjectExplanationAsync("Sen saf JSON dönen bir İK asistanısın.", prompt);

    try 
    {
        // JSON'u temizleyip parse edelim
        var cleanJson = aiResponse.Replace("```json", "").Replace("```", "").Trim();
        using var doc = System.Text.Json.JsonDocument.Parse(cleanJson);
        var root = doc.RootElement;

        var profile = await _context.StudentProfiles.FirstOrDefaultAsync(p => p.UserId == userId);
        if (profile != null)
        {
            // Özet bilgiyi profile kaydedelim
            if (root.TryGetProperty("Summary", out var summaryProp))
                profile.ParsedCvData = summaryProp.GetString(); // Summary'yi buraya yazıyoruz

            // Yetenekleri (Skills) tek tek veritabanına eşleşenlerle ekleyelim
            if (root.TryGetProperty("Skills", out var skillsProp))
            {
                foreach (var s in skillsProp.EnumerateArray())
                {
                    var skillName = s.GetString();
                    var tech = await _context.Technologies.FirstOrDefaultAsync(t => t.Name.ToLower() == skillName.ToLower());
                    if (tech != null)
                    {
                        var exists = await _context.StudentTechnologies.AnyAsync(st => st.UserId == userId && st.TechnologyId == tech.Id);
                        if (!exists)
                        {
                            _context.StudentTechnologies.Add(new StudentTechnology { UserId = userId, TechnologyId = tech.Id, ProficiencyLevel = 2 });
                        }
                    }
                }
            }
            await _context.SaveChangesAsync();
        }
    }
    catch { return false; }

    return true;
}


}
