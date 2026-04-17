using Microsoft.AspNetCore.Identity.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore;
using GradPath.Data.Entities;

namespace GradPath.Data;

/// <summary>
/// Veritabani yonetim merkezi.
/// IdentityDbContext kullanarak giris/cikis tablolarini otomatik olusturur.
/// </summary>
public class GradPathDbContext : IdentityDbContext<AppUser, AppRole, Guid>
{
    public GradPathDbContext(DbContextOptions<GradPathDbContext> options) : base(options)
    {
    }

    // Ana Tablolar
    public DbSet<Department> Departments { get; set; } = null!;
    public DbSet<Project> Projects { get; set; } = null!;
    public DbSet<Technology> Technologies { get; set; } = null!;
    public DbSet<StudentProfile> StudentProfiles { get; set; } = null!;
    public DbSet<Recommendation> Recommendations { get; set; } = null!;
    public DbSet<TeamMatch> TeamMatches { get; set; } = null!;

    // Ara Tablolar (Cok-a-Cok Iliskiler)
    public DbSet<ProjectDepartment> ProjectDepartments { get; set; } = null!;
    public DbSet<ProjectTechnology> ProjectTechnologies { get; set; } = null!;
    public DbSet<StudentTechnology> StudentTechnologies { get; set; } = null!;

    public DbSet<StudentEducation> StudentEducations { get; set; } = null!;
    public DbSet<StudentExperience> StudentExperiences { get; set; } = null!;
    public DbSet<StudentExperienceTechnology> StudentExperienceTechnologies { get; set; } = null!;
    public DbSet<StudentCvProject> StudentCvProjects { get; set; } = null!;
    public DbSet<StudentCvProjectTechnology> StudentCvProjectTechnologies { get; set; } = null!;
    public DbSet<StudentDomainSignal> StudentDomainSignals { get; set; } = null!;
    public DbSet<StudentProjectPost> StudentProjectPosts { get; set; } = null!;
    public DbSet<StudentProjectPostTechnology> StudentProjectPostTechnologies { get; set; } = null!;
    public DbSet<StudentProjectPostDepartment> StudentProjectPostDepartments { get; set; } = null!;

    protected override void OnModelCreating(ModelBuilder builder)
    {
        base.OnModelCreating(builder);

        // Composite Keys
        builder.Entity<ProjectDepartment>()
            .HasKey(pd => new { pd.ProjectId, pd.DepartmentId });

        builder.Entity<ProjectTechnology>()
            .HasKey(pt => new { pt.ProjectId, pt.TechnologyId });

        builder.Entity<StudentTechnology>()
            .HasKey(st => new { st.UserId, st.TechnologyId });

        builder.Entity<StudentExperienceTechnology>()
            .HasKey(set => new { set.StudentExperienceId, set.TechnologyId });

        builder.Entity<StudentCvProjectTechnology>()
            .HasKey(set => new { set.StudentCvProjectId, set.TechnologyId });

        builder.Entity<StudentEducation>()
            .HasOne(se => se.User)
            .WithMany()
            .HasForeignKey(se => se.UserId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.Entity<StudentExperience>()
            .HasOne(se => se.User)
            .WithMany()
            .HasForeignKey(se => se.UserId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.Entity<StudentCvProject>()
            .HasOne(sp => sp.User)
            .WithMany()
            .HasForeignKey(sp => sp.UserId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.Entity<StudentDomainSignal>()
            .HasOne(ds => ds.User)
            .WithMany()
            .HasForeignKey(ds => ds.UserId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.Entity<StudentExperienceTechnology>()
            .HasOne(set => set.StudentExperience)
            .WithMany(se => se.Technologies)
            .HasForeignKey(set => set.StudentExperienceId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.Entity<StudentExperienceTechnology>()
            .HasOne(set => set.Technology)
            .WithMany()
            .HasForeignKey(set => set.TechnologyId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.Entity<StudentCvProjectTechnology>()
            .HasOne(set => set.StudentCvProject)
            .WithMany(sp => sp.Technologies)
            .HasForeignKey(set => set.StudentCvProjectId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.Entity<StudentCvProjectTechnology>()
            .HasOne(set => set.Technology)
            .WithMany()
            .HasForeignKey(set => set.TechnologyId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.Entity<StudentDomainSignal>()
            .HasIndex(ds => new { ds.UserId, ds.Name })
            .IsUnique();

        // TeamMatch - Initiator iliskisi
        builder.Entity<TeamMatch>()
            .HasOne(tm => tm.Initiator)
            .WithMany(u => u.InitiatedMatches)
            .HasForeignKey(tm => tm.InitiatorId)
            .OnDelete(DeleteBehavior.Restrict);

        // TeamMatch - Partner iliskisi
        builder.Entity<TeamMatch>()
            .HasOne(tm => tm.Partner)
            .WithMany(u => u.ReceivedMatches)
            .HasForeignKey(tm => tm.PartnerId)
            .OnDelete(DeleteBehavior.Restrict);
        builder.Entity<StudentProjectPostTechnology>()
          .HasKey(sppt => new { sppt.StudentProjectPostId, sppt.TechnologyId });

        builder.Entity<StudentProjectPostDepartment>()
            .HasKey(sppd => new { sppd.StudentProjectPostId, sppd.DepartmentId });

        builder.Entity<StudentProjectPost>()
            .HasOne(spp => spp.OwnerUser)
            .WithMany()
            .HasForeignKey(spp => spp.OwnerUserId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.Entity<StudentProjectPostTechnology>()
            .HasOne(sppt => sppt.StudentProjectPost)
            .WithMany(spp => spp.Technologies)
            .HasForeignKey(sppt => sppt.StudentProjectPostId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.Entity<StudentProjectPostTechnology>()
            .HasOne(sppt => sppt.Technology)
            .WithMany()
            .HasForeignKey(sppt => sppt.TechnologyId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.Entity<StudentProjectPostDepartment>()
            .HasOne(sppd => sppd.StudentProjectPost)
            .WithMany(spp => spp.Departments)
            .HasForeignKey(sppd => sppd.StudentProjectPostId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.Entity<StudentProjectPostDepartment>()
            .HasOne(sppd => sppd.Department)
            .WithMany()
            .HasForeignKey(sppd => sppd.DepartmentId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.Entity<StudentProjectPost>()
            .HasIndex(spp => spp.OwnerUserId);

        builder.Entity<StudentProjectPost>()
            .HasIndex(spp => new { spp.Status, spp.ProjectType });

    }
}
