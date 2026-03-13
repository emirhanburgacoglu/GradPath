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
}
