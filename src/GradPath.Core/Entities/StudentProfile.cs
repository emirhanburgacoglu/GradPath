namespace GradPath.Core.Entities;

//Öğrencinin parse edilmiş profil verilerini ve akademik durumunu saklayan sınıf.
public class StudentProfile : BaseEntity
{
    // Profilin hangi kullanıcıya ait olduğunun kinliği 
    public Guid UserId { get; set; }

    // Groq API'den gelen parse edilmiş CV verileri 
    public string ParsedCV { get; set; } = null!;

    //Transkript verilerinin parse edilmiş hali (dersler, notlar, krediler vb.)
    public string ParsedTranscript { get; set; } = null!;

    // Öğrencinin güncel akademik durumunu göstermek için eklenen CGPA alanı
    public double CGPA { get; set; }
}