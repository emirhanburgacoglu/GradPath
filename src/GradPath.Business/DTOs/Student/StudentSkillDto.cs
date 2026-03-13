namespace GradPath.Business.DTOs.Student;

/// <summary>
/// Öğrencinin bir yeteneği eklerken veya listelerken kullanacağı veri yapısı.
/// </summary>
public class StudentSkillDto
{
    // Hangi teknoloji? (ID'sini göndereceğiz)
    public int TechnologyId { get; set; }

    // Opsiyonel: Teknolojinin ismini sadece görüntüleme (Listleme) amaçlı kullanacağız.
    public string? TechnologyName { get; set; }

    // Yetkinlik seviyesi (1=Başlangıç, 2=Orta, 3=İleri)
    public int ProficiencyLevel { get; set; } = 2;
}
