using GradPath.Business.DTOs.Auth;

namespace GradPath.Business.Services;

// Kimlik doğrulama işlemlerini tanımlayan sözleşme (interface).
// Kayıt, giriş ve token üretimi için metodlar içerir.

public interface IAuthService
{
    // <summary>
    // Yeni kullanıcı kaydı oluşturur.

    // <param name="request">Kayıt bilgileri (Ad, Email, Şifre, Bölüm)</param>
    // <returns>JWT token ve kullanıcı bilgisi</returns>
    Task<AuthResponseDto> RegisterAsync(RegisterRequestDto request);


    // Mevcut kullanıcının giriş yapmasını sağlar.
    // 
    // <param name="request">Giriş bilgileri (Email, Şifre)</param>
    // <returns>JWT token ve kullanıcı bilgisi</returns>
    Task<AuthResponseDto> LoginAsync(LoginRequestDto request);
}