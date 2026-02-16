namespace GradPath.Core.Entities;

// Projeler ile teknolojiler arasındaki Çok-a-Çok ilişkiyi kuran ara tablo.

public class ProjectTechnology
{

    //İlgili projenin ID'si.

    public int ProjectId { get; set; }
    public Project Project { get; set; } = null!;

    // İlgili teknolojinin ID'si.

    public int TechnologyId { get; set; }
    public Technology Technology { get; set; } = null!;


    // Bu teknolojinin proje için önem derecesi (Örn: 1-5 arası puan).
    //Hibrit öneri motoru bu puanı kullanarak eşleştirme yapar.

    public int ImportanceLevel { get; set; }
}