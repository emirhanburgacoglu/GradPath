using GradPath.Data.Entities;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;

namespace GradPath.Data;

public static class DbSeeder
{
    public static async Task SeedRolesAndAdminAsync(RoleManager<AppRole> roleManager, GradPathDbContext context)
    {
        // 1. Rolleri Ekle
        string[] roleNames = { "Admin", "Student" };
        foreach (var roleName in roleNames)
        {
            if (!await roleManager.RoleExistsAsync(roleName))
            {
                await roleManager.CreateAsync(new AppRole { Name = roleName });
            }
        }

        // 2. Bölümleri Ekle
        if (!await context.Departments.AnyAsync())
        {
            context.Departments.Add(new Department { Name = "Bilgisayar Mühendisliği", Code = "BM", FacultyName = "Mühendislik Fakültesi" });
            await context.SaveChangesAsync();
        }

        // 3. Teknolojileri Ekle (YENİ EKLEDİĞİMİZ KISIM)
        if (!await context.Technologies.AnyAsync())
        {
            context.Technologies.AddRange(
                new Technology { Name = "React", Category = "Frontend" },
                new Technology { Name = ".NET 8", Category = "Backend" },
                new Technology { Name = "Python", Category = "Data Science" }
            );
            await context.SaveChangesAsync();
        }
    }

    public static async Task SeedDemoDataAsync(UserManager<AppUser> userManager, GradPathDbContext context)
    {
        // 1. Ayşe isminde uzman bir öğrenci oluşturalım
        if (!await context.Users.AnyAsync(u => u.UserName == "ayse_uzman"))
        {
            var dept = await context.Departments.FirstAsync();
            var ayse = new AppUser 
            { 
                UserName = "ayse_uzman", 
                Email = "ayse@test.com",
                EmailConfirmed = true,
                FullName = "Ayşe Uzman",
                DepartmentId = dept.Id
            };
            await userManager.CreateAsync(ayse, "Ayse123!");
            await userManager.AddToRoleAsync(ayse, "Student");

            // Ayşe'nin profili (Yüksek GPA)
            var profile = new StudentProfile
            {
                UserId = ayse.Id,
                CGPA = 3.85m,
                TotalECTS = 120
            };
            context.StudentProfiles.Add(profile);

            // Ayşe'nin uzmanlığı: .NET 8 (Projenin eksiği)
            var dotNetTech = await context.Technologies.FirstAsync(t => t.Name == ".NET 8");
            context.StudentTechnologies.Add(new StudentTechnology
            {
                UserId = ayse.Id,
                TechnologyId = dotNetTech.Id,
                ProficiencyLevel = 3 // Senior (1: Junior, 2: Mid, 3: Senior)
            });

            await context.SaveChangesAsync();
        }

        // 2. Proje 1'in teknoloji gereksinimlerini belirleyelim
        var project = await context.Projects.Include(p => p.ProjectTechnologies).FirstOrDefaultAsync(p => p.Id == 1);
        if (project != null && !project.ProjectTechnologies.Any())
        {
            var reactTech = await context.Technologies.FirstAsync(t => t.Name == "React");
            var dotNetTech = await context.Technologies.FirstAsync(t => t.Name == ".NET 8");

            context.ProjectTechnologies.AddRange(
                new ProjectTechnology { ProjectId = project.Id, TechnologyId = reactTech.Id },
                new ProjectTechnology { ProjectId = project.Id, TechnologyId = dotNetTech.Id }
            );
            await context.SaveChangesAsync();
        }
    }
}
