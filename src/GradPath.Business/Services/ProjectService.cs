using GradPath.Business.DTOs.Project;
using GradPath.Data;
using GradPath.Data.Entities;
using Microsoft.EntityFrameworkCore;

namespace GradPath.Business.Services;

public class ProjectService : IProjectService
{
    private readonly GradPathDbContext _context;

    // Veritabanına (Depoya) erişebilmek için anahtarı (context) alıyoruz.
    public ProjectService(GradPathDbContext context)
    {
        _context = context;
    }

    // LISTELEME: Tüm projeleri getirir
    public async Task<List<ProjectResponseDto>> GetAllAsync()
    {
        // 1. Veritabanından projeleri çekiyoruz. 
        // Yanında hangi departmanlara ve teknolojilere ait olduğunu da (Include) getir diyoruz.
        var projects = await _context.Projects
            .Include(p => p.ProjectDepartments).ThenInclude(pd => pd.Department)
            .Include(p => p.ProjectTechnologies).ThenInclude(pt => pt.Technology)
            .ToListAsync();

        // 2. Veritabanı dosyasını (Entity), Web'e göndereceğimiz pakete (Dto) dönüştürüyoruz.
        return projects.Select(p => new ProjectResponseDto
        {
            Id = p.Id,
            Title = p.Title,
            Description = p.Description,
            Category = p.Category,
            DifficultyLevel = p.DifficultyLevel,
            EstimatedWeeks = p.EstimatedWeeks,
            CreatedAt = p.CreatedAt,
            UpdatedAt = p.UpdatedAt,
            // Departman ID'sini değil, ismini pakete koyuyoruz
            DepartmentNames = p.ProjectDepartments.Select(pd => pd.Department.Name).ToList(),
            // Teknoloji ID'sini değil, ismini pakete koyuyoruz
            TechnologyNames = p.ProjectTechnologies.Select(pt => pt.Technology.Name).ToList()
        }).ToList();
    }

    // TEK BIR PROJE GETIRME: ID'ye göre bulur
    public async Task<ProjectResponseDto?> GetByIdAsync(int id)
    {
        var project = await _context.Projects
            .Include(p => p.ProjectDepartments).ThenInclude(pd => pd.Department)
            .Include(p => p.ProjectTechnologies).ThenInclude(pt => pt.Technology)
            .FirstOrDefaultAsync(p => p.Id == id); // ID'si eşleşen ilk projeyi bul.

        if (project == null) return null; // Bulamazsan boş dön.

        // Bulursan paketi hazırla ve gönder
        return new ProjectResponseDto
        {
            Id = project.Id,
            Title = project.Title,
            Description = project.Description,
            Category = project.Category,
            DifficultyLevel = project.DifficultyLevel,
            EstimatedWeeks = project.EstimatedWeeks,
            CreatedAt = project.CreatedAt,
            UpdatedAt = project.UpdatedAt,
            DepartmentNames = project.ProjectDepartments.Select(pd => pd.Department.Name).ToList(),
            TechnologyNames = project.ProjectTechnologies.Select(pt => pt.Technology.Name).ToList()
        };
    }

    // EKLEME: Yeni bir proje kaydeder
      public async Task<ProjectResponseDto> CreateAsync(ProjectCreateDto request)
    {
        // 1. Ana proje bilgilerini oluştur
        var project = new Project
        {
            Title = request.Title,
            Description = request.Description,
            Category = request.Category,
            DifficultyLevel = request.DifficultyLevel,
            EstimatedWeeks = request.EstimatedWeeks,
            CreatedAt = DateTime.UtcNow
        };

        // 2. Bölüm İlişkilerini Kur (request.DepartmentIds olarak düzelttik)
        if (request.DepartmentIds != null)
        {
            foreach (var deptId in request.DepartmentIds)
            {
                project.ProjectDepartments.Add(new ProjectDepartment { DepartmentId = deptId });
            }
        }

        // 3. Teknoloji İlişkilerini Kur (request.TechnologyIds olarak düzelttik)
        if (request.TechnologyIds != null)
        {
            foreach (var techId in request.TechnologyIds)
            {
                project.ProjectTechnologies.Add(new ProjectTechnology { TechnologyId = techId });
            }
        }

        // 4. Hepsini tek seferde kaydet
        _context.Projects.Add(project);
        await _context.SaveChangesAsync();

        // 5. Kayıt bitti! Zengin veriyi çekip geri gönderiyoruz.
        return await GetByIdAsync(project.Id) ?? new ProjectResponseDto { Id = project.Id };
    }


    // GÜNCELLEME: Mevcut projeyi değiştirmemizi sağlar (İleride kullanacağız)
    public async Task<bool> UpdateAsync(int id, ProjectCreateDto request)
    {
        var project = await _context.Projects.FindAsync(id);
        if (project == null) return false;

        project.Title = request.Title;
        project.Description = request.Description;
        project.UpdatedAt = DateTime.UtcNow;

        await _context.SaveChangesAsync();
        return true;
    }

    // SILME: Projeyi uçurur
    public async Task<bool> DeleteAsync(int id)
    {
        var project = await _context.Projects.FindAsync(id);
        if (project == null) return false;

        _context.Projects.Remove(project);
        await _context.SaveChangesAsync();
        return true;
    }
}
