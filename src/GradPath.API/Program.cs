using Microsoft.EntityFrameworkCore;
using GradPath.Data;
using GradPath.Core.Entities;
using Microsoft.OpenApi.Models;
using GradPath.Business.Services;
var builder = WebApplication.CreateBuilder(args);

// 1. Veritabanı Bağlantı Dizesini Al (appsettings.json'dan okur)
var connectionString = builder.Configuration.GetConnectionString("DefaultConnection");

// 2. DbContext Kaydı (PostgreSQL Sürücüsü ile)
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
builder.Services.AddScoped<IAuthService, AuthService>();
builder.Services.AddControllers(); // API Controller'larını tanıması için şart
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen(); // API dökümantasyonu için

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

app.Run();