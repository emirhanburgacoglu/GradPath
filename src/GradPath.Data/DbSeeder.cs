using GradPath.Data.Entities;
using Microsoft.AspNetCore.Identity;

namespace GradPath.Data;

public static class DbSeeder
{
    public static async Task SeedRolesAndAdminAsync(RoleManager<AppRole> roleManager)
    {
        // 1. Gerekli rolleri tanımlıyoruz
        string[] roleNames = { "Admin", "Student" };

        foreach (var roleName in roleNames)
        {
            // Eğer veritabanında bu rol yoksa oluştur
            var roleExist = await roleManager.RoleExistsAsync(roleName);
            if (!roleExist)
            {
                await roleManager.CreateAsync(new AppRole { Name = roleName });
            }
        }
    }
}