namespace GradPath.Core.Entities;


// Öğrenciler arasındaki proje takımı kurma isteklerini ve eşleşmeleri saklar.

public class TeamMatch : BaseEntity
{

    //Eşleşme istenen projenin ID'si.

    public int ProjectId { get; set; }
    public Project Project { get; set; } = null!;


    // İsteği başlatan öğrencinin ID'si.

    public Guid InitiatorId { get; set; }


    // İsteğe katılan partner öğrencinin ID'si.

    public Guid? PartnerId { get; set; }


    // Eşleşme durumu (Örn: Beklemede, Onaylandı, Reddedildi).

    public string Status { get; set; } = "Pending";
}