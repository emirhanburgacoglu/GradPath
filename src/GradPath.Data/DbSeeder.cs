using GradPath.Data.Entities;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;

namespace GradPath.Data;

public static class DbSeeder
{
    public static async Task SeedRolesAndAdminAsync(RoleManager<AppRole> roleManager, GradPathDbContext context)
    {
        string[] roleNames = { "Admin", "Student" };
        foreach (var roleName in roleNames)
        {
            if (!await roleManager.RoleExistsAsync(roleName))
            {
                await roleManager.CreateAsync(new AppRole { Name = roleName });
            }
        }

        if (!await context.Departments.AnyAsync())
        {
            context.Departments.Add(new Department
            {
                Name = "Bilgisayar Muhendisligi",
                Code = "BM",
                FacultyName = "Muhendislik Fakultesi"
            });

            await context.SaveChangesAsync();
        }

        var technologiesToSeed = new List<Technology>
        {
            new() { Name = "C#", Category = "Language" },
            new() { Name = "Python", Category = "Language" },
            new() { Name = "Java", Category = "Language" },
            new() { Name = "JavaScript", Category = "Language" },
            new() { Name = "SQL", Category = "Language" },
            new() { Name = "PHP", Category = "Language" },
            new() { Name = "HTML", Category = "Web" },
            new() { Name = "CSS", Category = "Web" },
            new() { Name = ".NET Core", Category = "Framework" },
            new() { Name = "ASP.NET Core", Category = "Framework" },
            new() { Name = "CodeIgniter", Category = "Framework" },
            new() { Name = "Entity Framework", Category = "ORM" },
            new() { Name = "React", Category = "Framework" },
            new() { Name = "Django", Category = "Framework" },
            new() { Name = "Flutter", Category = "Mobile" },
            new() { Name = "REST API", Category = "Framework" },
            new() { Name = "PostgreSQL", Category = "Database" },
            new() { Name = "MySQL", Category = "Database" },
            new() { Name = "MSSQL", Category = "Database" },
            new() { Name = "Git", Category = "Tool" },
            new() { Name = "GitHub", Category = "Tool" },
            new() { Name = "OpenCV", Category = "AI" },
            new() { Name = "Raspberry Pi", Category = "Hardware" },
            new() { Name = "Machine Learning", Category = "AI" },
            new() { Name = "Deep Learning", Category = "AI" },
            new() { Name = "NLP", Category = "AI" },
            new() { Name = "Scikit-learn", Category = "AI" },
            new() { Name = "Matlab", Category = "Tool" },
            new() { Name = "Simulink", Category = "Tool" }
        };

        var existingTechnologyNames = (await context.Technologies
       .AsNoTracking()
       .Select(t => t.Name.ToLower())
       .ToListAsync())
       .ToHashSet();


        var missingTechnologies = technologiesToSeed
            .Where(technology => !existingTechnologyNames.Contains(technology.Name.ToLower()))
            .ToList();

        if (missingTechnologies.Count > 0)
        {
            context.Technologies.AddRange(missingTechnologies);
            await context.SaveChangesAsync();
        }
    }

    public static async Task SeedDemoDataAsync(UserManager<AppUser> userManager, GradPathDbContext context)
    {
        var department = await context.Departments.FirstAsync();

        if (!await context.Users.AnyAsync(u => u.UserName == "ayse_uzman"))
        {
            var ayse = new AppUser
            {
                UserName = "ayse_uzman",
                Email = "ayse@test.com",
                EmailConfirmed = true,
                FullName = "Ayse Uzman",
                DepartmentId = department.Id
            };

            await userManager.CreateAsync(ayse, "Ayse123!");
            await userManager.AddToRoleAsync(ayse, "Student");

            context.StudentProfiles.Add(new StudentProfile
            {
                UserId = ayse.Id,
                CGPA = 3.85m,
                TotalECTS = 120
            });

            var dotNetCoreTech = await context.Technologies
                .FirstOrDefaultAsync(t => t.Name == ".NET Core");

            var postgreSqlTech = await context.Technologies
                .FirstOrDefaultAsync(t => t.Name == "PostgreSQL");

            if (dotNetCoreTech != null)
            {
                context.StudentTechnologies.Add(new StudentTechnology
                {
                    UserId = ayse.Id,
                    TechnologyId = dotNetCoreTech.Id,
                    ProficiencyLevel = 3
                });
            }

            if (postgreSqlTech != null)
            {
                context.StudentTechnologies.Add(new StudentTechnology
                {
                    UserId = ayse.Id,
                    TechnologyId = postgreSqlTech.Id,
                    ProficiencyLevel = 3
                });
            }

            await context.SaveChangesAsync();
        }

        var technologyMap = (await context.Technologies
            .AsNoTracking()
            .ToListAsync())
            .GroupBy(t => t.Name, StringComparer.OrdinalIgnoreCase)
            .ToDictionary(
                g => g.Key,
                g => g.OrderBy(t => t.Id).First().Id,
                StringComparer.OrdinalIgnoreCase);


        var existingProjects = (await context.Projects
            .AsNoTracking()
            .Select(p => p.Title)
            .ToListAsync())
            .ToHashSet();

        var projectSeeds = new List<ProjectSeed>
        {
            new(
                "AI Destekli CV Analiz ve Proje Oneri Sistemi",
                "Ogrencilerin CV ve transkript verilerini analiz edip uygun bitirme projeleri oneren yapay zeka destekli platform.",
                "AI",
                2,
                10,
                new[] { "Python", "Machine Learning", "NLP", "PostgreSQL" }),

            new(
                "Kurumsal Gorev ve Surec Yonetim Platformu",
                "Sirket ici gorev atama, durum takibi ve raporlama icin gelistirilen backend agirlikli web uygulamasi.",
                "Backend",
                2,
                8,
                new[] { "ASP.NET Core", "PostgreSQL", "Git" }),

            new(
                "Akilli Otopark Tahmin ve Yonlendirme Sistemi",
                "Doluluk tahmini yapan ve kullanicilari uygun alana yonlendiren mobil destekli akilli otopark cozumu.",
                "AI",
                2,
                10,
                new[] { "Python", "Machine Learning", "Flutter", "REST API" }),

            new(
                "Ogrenci Kulup ve Etkinlik Portali",
                "Universite kulupleri ve etkinlikleri icin duyuru, basvuru ve yonetim modulleri sunan web platformu.",
                "Web",
                1,
                6,
                new[] { "ASP.NET Core", "HTML", "CSS", "JavaScript", "PostgreSQL" }),

            new(
                "IoT Tabanli Sera Izleme Sistemi",
                "Sensor verilerini toplayan ve gercek zamanli dashboard uzerinden izleme saglayan gomulu sistem projesi.",
                "Embedded",
                3,
                12,
                new[] { "Raspberry Pi", "Python", "PostgreSQL" }),

            new(
                "Kurumsal Web CMS",
                "Icerik yonetimi ve coklu dil destegi sunan kurumsal web yonetim sistemi.",
                "Web",
                2,
                8,
                new[] { "PHP", "CodeIgniter", "MySQL", "Git" }),

            new(
                "Mobil Kampus Yardimcisi",
                "Ders programi, duyurular ve kampus ici servisleri tek uygulamada sunan mobil cozum.",
                "Mobile",
                2,
                8,
                new[] { "Flutter", "REST API", "PostgreSQL" }),

            new(
                "Bilgisayarli Goru ile Hedef Tespit Sistemi",
                "Gercek zamanli goruntu isleme ile nesne tespiti ve siniflandirma yapan savunma teknolojisi odakli proje.",
                "AI",
                3,
                12,
                new[] { "Python", "OpenCV", "Raspberry Pi" })
        };

        foreach (var projectSeed in projectSeeds)
        {
            if (existingProjects.Contains(projectSeed.Title))
            {
                continue;
            }

            var project = new Project
            {
                Title = projectSeed.Title,
                Description = projectSeed.Description,
                Category = projectSeed.Category,
                DifficultyLevel = projectSeed.DifficultyLevel,
                EstimatedWeeks = projectSeed.EstimatedWeeks,
                CreatedAt = DateTime.UtcNow
            };

            project.ProjectDepartments.Add(new ProjectDepartment
            {
                DepartmentId = department.Id,
                IsRequired = true
            });

            foreach (var technologyName in projectSeed.TechnologyNames)
            {
                if (!technologyMap.TryGetValue(technologyName, out var technologyId))
                {
                    continue;
                }

                project.ProjectTechnologies.Add(new ProjectTechnology
                {
                    TechnologyId = technologyId,
                    ImportanceLevel = 3
                });
            }

            context.Projects.Add(project);
        }

        if (context.ChangeTracker.HasChanges())
        {
            await context.SaveChangesAsync();
        }
    }

    private sealed record ProjectSeed(
        string Title,
        string Description,
        string Category,
        int DifficultyLevel,
        int EstimatedWeeks,
        IReadOnlyList<string> TechnologyNames);
}
