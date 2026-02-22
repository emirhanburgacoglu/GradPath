using Microsoft.AspNetCore.Identity.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore;
using GradPath.Data.Entities;


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

        // Composite Keys
        builder.Entity<ProjectDepartment>()
            .HasKey(pd => new { pd.ProjectId, pd.DepartmentId });

        builder.Entity<ProjectTechnology>()
            .HasKey(pt => new { pt.ProjectId, pt.TechnologyId });

        // TeamMatch - Initiator ilişkisi (isteği atan kullanıcı)
        builder.Entity<TeamMatch>()
            .HasOne(tm => tm.Initiator)
            .WithMany(u => u.InitiatedMatches)
            .HasForeignKey(tm => tm.InitiatorId)
            .OnDelete(DeleteBehavior.Restrict);

        // TeamMatch - Partner ilişkisi (eşleşen kullanıcı)
        builder.Entity<TeamMatch>()
            .HasOne(tm => tm.Partner)
            .WithMany(u => u.ReceivedMatches)
            .HasForeignKey(tm => tm.PartnerId)
            .OnDelete(DeleteBehavior.Restrict);
    }

}