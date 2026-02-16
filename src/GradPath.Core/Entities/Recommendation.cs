namespace GradPath.Core.Entities;

// Öğrencilere sunulan proje önerilerinin kayıtlarını tutan sınıf.

public class Recommendation : BaseEntity
{

    // Önerinin sunulduğu kullanıcının Guid kimliği.

    public Guid UserId { get; set; }

    //Önerilen projenin ID'si.

    public int ProjectId { get; set; }
    public Project Project { get; set; } = null!;


    // Groq API tarafından üretilen, projenin neden önerildiğini açıklayan metin.

    public string AIExplanation { get; set; } = null!;


    // Öğrenci profili ile proje arasındaki uyum yüzdesi (0-100).
    public int Score { get; set; }
}