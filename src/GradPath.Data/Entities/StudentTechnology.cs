namespace GradPath.Data.Entities;

/// <summary>
/// Öğrenci ile bildiği teknolojiler arasındaki çok-a-çok ilişkiyi temsil eder.
/// </summary>
public class StudentTechnology
{
    // Hangi öğrenci?
    public Guid UserId { get; set; }
    
    // Hangi teknoloji?
    public int TechnologyId { get; set; }

    // Bu teknolojideki yetkinlik seviyesi (1=Başlangıç, 2=Orta, 3=İleri) - İleride AI kullanırken bize lazım olacak!
    public int ProficiencyLevel { get; set; } = 2; 

    // Navigation Properties (Kod içinde nesnelere kolay erişim için)
    public AppUser User { get; set; } = null!;
    public Technology Technology { get; set; } = null!;

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}
