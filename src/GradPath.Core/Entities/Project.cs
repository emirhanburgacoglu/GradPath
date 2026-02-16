namespace GradPath.Core.Entities;

public class Project : BaseEntity
{
    // Sistemdeki proje şablonlarını temsil eden ana sınıf


    // Proje başlığı 
    public string Title { get; set; } = null!;

    // Prjenin detaylı açıklaması ve kapsamı 
    public string Description { get; set; } = null!;

    // Projenin zorluk seviesi 
    public string DifficultyLevel { get; set; } = null!; // Uygun, Zorlayıcı, Zor [cite: 8, 54]

    // Projenin kategorisi 
    public int CategoryId { get; set; } // Kategori ID 

    // Bu projenin hangi bölümlerle ilişkili olduğunu gösteren koleksiyon
    public ICollection<ProjectDepartment> ProjectDepartments { get; set; } = new List<ProjectDepartment>();

    // Bu projenin hangi teknolojilerle ilişkili olduğunu gösteren koleksiyon
    public ICollection<ProjectTechnology> ProjectTechnologies { get; set; } = new List<ProjectTechnology>();
}