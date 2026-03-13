using GradPath.Business.DTOs.Project;

namespace GradPath.Business.Services;

public interface IProjectService
{
    // Tüm projeleri listeler
    Task<List<ProjectResponseDto>> GetAllAsync();

    // ID'ye göre tek bir proje getirir
    Task<ProjectResponseDto?> GetByIdAsync(int id);

    // Yeni proje oluşturur
    Task<ProjectResponseDto> CreateAsync(ProjectCreateDto request);

    // Mevcut projeyi günceller
    Task<bool> UpdateAsync(int id, ProjectCreateDto request);

    // Projeyi siler
    Task<bool> DeleteAsync(int id);
}
