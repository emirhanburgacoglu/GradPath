namespace GradPath.Core.Entities;

// Tüm veritabanı tabloları için ortak özellikleri barındıran temel sınıf.

public abstract class BaseEntity
{

    // Kaydın benzersiz kimlik numarası (Primary Key).
    // PostgreSQL'de otomatik artan (Serial) sayı olarak tutulacaktır.

    public int Id { get; set; }


    //Kaydın oluşturulma tarihi ve saati. 
    //Varsayılan olarak işlem anındaki UTC zamanını alır.

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}