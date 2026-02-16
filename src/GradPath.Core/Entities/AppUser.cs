using Microsoft.AspNetCore.Identity;

namespace GradPath.Core.Entities;

/// Sisteme giriş yapacak öğrencileri ve adminleri temsil eder.
/// IdentityUser'dan türeyerek hazır giriş-çıkış altyapısını kullanır.

public class AppUser : IdentityUser<Guid>
{
    // Kullanıcının tam adı ve soyadı 
    public string FullName { get; set; } = null!;

    // Öğrencinin bağlı olduğu bölüm (Admin için null olabilir) 
    public int? DepartmentId { get; set; }
    public Department? Department { get; set; }
    // Kullanıcının sistemdeki rolü (Admin veya Ogrenci) [cite: 34]
    public string Role { get; set; } = "Ogrenci";

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}