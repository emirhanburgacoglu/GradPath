using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using GradPath.Business.DTOs.Auth;
using GradPath.Data;
using GradPath.Core.Entities;
using Microsoft.AspNetCore.Identity;
using Microsoft.Extensions.Configuration;
using Microsoft.IdentityModel.Tokens;

namespace GradPath.Business.Services;

public class AuthService : IAuthService
{
    private readonly UserManager<AppUser> _userManager;
    private readonly IConfiguration _configuration;
    private readonly GradPathDbContext _context;

    public AuthService(
        UserManager<AppUser> userManager,
        IConfiguration configuration,
        GradPathDbContext context)
    {
        _userManager = userManager;
        _configuration = configuration;
        _context = context;
    }

    public async Task<AuthResponseDto> RegisterAsync(RegisterRequestDto request)
    {
        // 1. Email zaten kayıtlı mı kontrol et
        var existingUser = await _userManager.FindByEmailAsync(request.Email);
        if (existingUser != null)
        {
            throw new Exception("Bu email adresi zaten kayıtlı.");
        }

        // 2. Yeni kullanıcı oluştur
        var user = new AppUser
        {
            UserName = request.Email,
            Email = request.Email,
            FullName = request.FullName,
            DepartmentId = request.DepartmentId,
            CreatedAt = DateTime.UtcNow
        };

        // 3. Şifreyi hash'leyerek kaydet (Identity otomatik hash'ler)
        var result = await _userManager.CreateAsync(user, request.Password);

        if (!result.Succeeded)
        {
            var errors = string.Join(", ", result.Errors.Select(e => e.Description));
            throw new Exception($"Kayıt başarısız: {errors}");
        }

        // 4. Varsayılan rol ata (Student)
        await _userManager.AddToRoleAsync(user, "Student");

        // 5. JWT token üret
        var token = await GenerateJwtToken(user);

        return token;
    }

    public async Task<AuthResponseDto> LoginAsync(LoginRequestDto request)
    {
        // 1. Email ile kullanıcıyı bul
        var user = await _userManager.FindByEmailAsync(request.Email);
        if (user == null)
        {
            throw new Exception("Email veya şifre hatalı.");
        }

        // 2. Şifreyi kontrol et
        var isPasswordValid = await _userManager.CheckPasswordAsync(user, request.Password);
        if (!isPasswordValid)
        {
            throw new Exception("Email veya şifre hatalı.");
        }

        // 3. JWT token üret
        var token = await GenerateJwtToken(user);

        return token;
    }

    private async Task<AuthResponseDto> GenerateJwtToken(AppUser user)
    {
        // 1. JWT ayarlarını appsettings.json'dan oku
        var jwtSettings = _configuration.GetSection("JwtSettings");
        var secretKey = jwtSettings["SecretKey"];
        var issuer = jwtSettings["Issuer"];
        var audience = jwtSettings["Audience"];
        var expirationMinutes = int.Parse(jwtSettings["ExpirationMinutes"]!);

        // 2. Claims (kullanıcı bilgileri) hazırla
        var userRoles = await _userManager.GetRolesAsync(user);

        var claims = new List<Claim>
        {
            new Claim(ClaimTypes.NameIdentifier, user.Id.ToString()),
            new Claim(ClaimTypes.Email, user.Email!),
            new Claim(ClaimTypes.Name, user.FullName),
            new Claim(JwtRegisteredClaimNames.Jti, Guid.NewGuid().ToString())
        };

        // Rolleri ekle
        foreach (var role in userRoles)
        {
            claims.Add(new Claim(ClaimTypes.Role, role));
        }

        // 3. Signing key oluştur (gizli anahtarla imzala)
        var key = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(secretKey!));
        var credentials = new SigningCredentials(key, SecurityAlgorithms.HmacSha256);

        // 4. Token oluştur
        var expiration = DateTime.UtcNow.AddMinutes(expirationMinutes);

        var token = new JwtSecurityToken(
            issuer: issuer,
            audience: audience,
            claims: claims,
            expires: expiration,
            signingCredentials: credentials
        );

        // 5. Token'ı string'e çevir
        var tokenString = new JwtSecurityTokenHandler().WriteToken(token);

        // 6. Response DTO'ya doldur
        return new AuthResponseDto
        {
            Token = tokenString,
            ExpiresAt = expiration,
            UserId = user.Id.ToString(),
            Email = user.Email!,
            Roles = userRoles.ToList()
        };
    }
}