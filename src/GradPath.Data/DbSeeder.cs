using GradPath.Data.Entities;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore; // AnyAsync için lazım

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

        // 2. Bölümleri Ekle (Eğer tablo boşsa)
        if (!await context.Departments.AnyAsync())
        {
            context.Departments.Add(new Department
            {
                Id = 1,
                Name = "Bilgisayar Mühendisliği",
                Code = "BM",
                FacultyName = "Mühendislik Fakültesi"
            });
            await context.SaveChangesAsync();
        }
    }
}