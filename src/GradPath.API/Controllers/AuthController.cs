using GradPath.Business.DTOs.Auth;
using GradPath.Business.Services;
using Microsoft.AspNetCore.Mvc;

namespace GradPath.API.Controllers;

[ApiController]
[Route("api/v1/auth")] // Tarayıcı adresi: api/v1/auth
public class AuthController : ControllerBase
{
    private readonly IAuthService _authService;

    // Constructor: "Benim çalışmam için bir AuthService lazım" diyor
    public AuthController(IAuthService authService)
    {
        _authService = authService;
    }

    [HttpPost("register")] // Adres: api/v1/auth/register
    public async Task<IActionResult> Register([FromBody] RegisterRequestDto request)
    {
        // Gelen JSON verisini alıp mutfağa (servise) gönderiyoruz
        var result = await _authService.RegisterAsync(request);
        return Ok(result); // İşlem tamamsa sonucu (token vb.) döndür
    }

    [HttpPost("login")] // Adres: api/v1/auth/login
    public async Task<IActionResult> Login([FromBody] LoginRequestDto request)
    {
        var result = await _authService.LoginAsync(request);
        return Ok(result);
    }
}