using Microsoft.AspNetCore.Identity.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore;
using GradPath.Core.Entities;

namespace GradPath.Data;

/// <summary>
/// Veritabanı yönetim merkezi. 
/// IdentityDbContext kullanarak giriş/çıkış tablolarını otomatik oluşturur.
/// </summary>
public class GradPathDbContext : IdentityDbContext<AppUser, AppRole, Guid>
{
    public GradPathDbContext(DbContextOptions<GradPathDbContext> options) : base(options)
    {
    }

    // Ana Tablolar
    public DbSet<Department> Departments { get; set; }
    public DbSet<Project> Projects { get; set; }
    public DbSet<Technology> Technologies { get; set; }
    public DbSet<StudentProfile> StudentProfiles { get; set; }
    public DbSet<Recommendation> Recommendations { get; set; }
    public DbSet<TeamMatch> TeamMatches { get; set; }

    // Ara Tablolar (Çok-a-Çok İlişkiler)
    public DbSet<ProjectDepartment> ProjectDepartments { get; set; }
    public DbSet<ProjectTechnology> ProjectTechnologies { get; set; }

    protected override void OnModelCreating(ModelBuilder builder)
    {
        base.OnModelCreating(builder);

        // ProjectDepartment için birleşik anahtar (Composite Key) tanımlama
        builder.Entity<ProjectDepartment>()
            .HasKey(pd => new { pd.ProjectId, pd.DepartmentId });

        // ProjectTechnology için birleşik anahtar tanımlama
        builder.Entity<ProjectTechnology>()
            .HasKey(pt => new { pt.ProjectId, pt.TechnologyId });

        // PostgreSQL için özel JSONB yapılandırmaları ve diğer kısıtlamalar buraya gelecek
    }
}