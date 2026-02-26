using Microsoft.AspNetCore.Identity;

namespace GradPath.Data.Entities;

/// <summary>
/// Kullanıcı rollerini temsil eder. IdentityRole'dan türeyerek hazır rol altyapısını kullanır.
/// </summary>
public class AppRole : IdentityRole<Guid>
{
    // Şimdilik boş kalabilir, ileride özel özellikler ekleyebiliriz
}