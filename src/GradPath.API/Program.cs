using Microsoft.EntityFrameworkCore;
using GradPath.Data;
using GradPath.Data.Entities;
using Microsoft.AspNetCore.Identity; // <-- Bu satırı ekle
using Microsoft.OpenApi.Models;
using GradPath.Business.Services;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.IdentityModel.Tokens;
using System.Text;


var builder = WebApplication.CreateBuilder(args);

// 1. Veritabanı Bağlantı Dizesini Al (appsettings.json'dan okur)
var connectionString = builder.Configuration.GetConnectionString("DefaultConnection");

// 2. DbContext Kaydı (PostgreSQL Sürücüsü ile)
builder.Services.AddScoped<IAuthService, AuthService>();
builder.Services.AddScoped<IProjectService, ProjectService>();
builder.Services.AddScoped<IStudentService, StudentService>();
builder.Services.AddScoped<IMatchingService, MatchingService>(); 
builder.Services.AddScoped<IFileUploadService, FileUploadService>();

builder.Services.AddScoped<ITeamService, TeamService>();

// Yapay zeka servisinin internete (Groq API) çıkabilmesi için HttpClient ile kaydediyoruz
builder.Services.AddHttpClient<IGroqApiService, GroqApiService>();

// Groq API Ayarlarını (ApiKey vs.) appsettings'ten oku ve sisteme tanıt
builder.Services.Configure<GradPath.Business.DTOs.AI.GroqApiSettings>(builder.Configuration.GetSection("GroqApiSettings"));



builder.Services.AddDbContext<GradPathDbContext>(options =>
    options.UseNpgsql(connectionString));

// 3. Identity (Giriş/Çıkış ve Rol) Kaydı
builder.Services.AddIdentity<AppUser, AppRole>(options =>
{
    options.Password.RequireDigit = false;
    options.Password.RequiredLength = 6;
    options.Password.RequireNonAlphanumeric = false;
    options.Password.RequireUppercase = false;
    options.Password.RequireLowercase = false;
})
.AddEntityFrameworkStores<GradPathDbContext>();

// Add services to the container.

// 4. Authentication (JWT) Ayarları
var jwtSettings = builder.Configuration.GetSection("JwtSettings");
var secretKey = jwtSettings["SecretKey"] ?? "GradPath-Super-Gizli-Anahtar-En-Az-32-Karakter-Olmali-2025";
var issuer = jwtSettings["Issuer"];
var audience = jwtSettings["Audience"];
var key = Encoding.UTF8.GetBytes(secretKey);

builder.Services.AddAuthentication(options =>
{
    options.DefaultAuthenticateScheme = JwtBearerDefaults.AuthenticationScheme;
    options.DefaultChallengeScheme = JwtBearerDefaults.AuthenticationScheme;
})
.AddJwtBearer(options =>
{
    options.TokenValidationParameters = new TokenValidationParameters
    {
        ValidateIssuerSigningKey = true,
        IssuerSigningKey = new SymmetricSecurityKey(key),
        ValidateIssuer = true,
        ValidIssuer = issuer,
        ValidateAudience = true,
        ValidAudience = audience,
        ValidateLifetime = true
    };
});

builder.Services.AddControllers(); 
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen(c =>
{
    c.SwaggerDoc("v1", new OpenApiInfo { Title = "GradPath API", Version = "v1" });
    c.AddSecurityDefinition("Bearer", new OpenApiSecurityScheme
    {
        Description = "JWT Authorization header using the Bearer scheme. Example: \"Bearer {token}\"",
        Name = "Authorization",
        In = ParameterLocation.Header,
        Type = SecuritySchemeType.ApiKey,
        Scheme = "Bearer"
    });
    c.AddSecurityRequirement(new OpenApiSecurityRequirement
    {
        {
            new OpenApiSecurityScheme
            {
                Reference = new OpenApiReference { Type = ReferenceType.SecurityScheme, Id = "Bearer" }
            },
            Array.Empty<string>()
        }
    });
});

var app = builder.Build();

// Configure the HTTP request pipeline.
if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

app.UseHttpsRedirection();

// Kimlik doğrulama ve yetkilendirme middleware'leri (Sıralama önemlidir!)
app.UseAuthentication();
app.UseAuthorization();

app.MapControllers(); // Controller rotalarını haritalar

// Veritabanı başlangıç verilerini (Seeding) çalıştır
using (var scope = app.Services.CreateScope())
{
    // Program.cs içinde
    var roleManager = scope.ServiceProvider.GetRequiredService<RoleManager<AppRole>>();
    var userManager = scope.ServiceProvider.GetRequiredService<UserManager<AppUser>>();
    var context = scope.ServiceProvider.GetRequiredService<GradPathDbContext>(); 
    await DbSeeder.SeedRolesAndAdminAsync(roleManager, context);
    await DbSeeder.SeedDemoDataAsync(userManager, context);
}

app.Run();