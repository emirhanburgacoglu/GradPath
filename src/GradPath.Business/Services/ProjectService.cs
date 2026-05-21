using GradPath.Business.DTOs.Project;
using GradPath.Data;
using GradPath.Data.Entities;
using Microsoft.EntityFrameworkCore;

namespace GradPath.Business.Services;

public class ProjectService : IProjectService
{
    private readonly GradPathDbContext _context;

    public ProjectService(GradPathDbContext context)
    {
        _context = context;
    }

    public async Task<List<ProjectResponseDto>> GetAllAsync()
    {
        var projects = await BuildProjectQuery().ToListAsync();
        return projects.Select(MapToDto).ToList();
    }

    public async Task<ProjectResponseDto?> GetByIdAsync(int id)
    {
        var project = await BuildProjectQuery().FirstOrDefaultAsync(project => project.Id == id);
        return project == null ? null : MapToDto(project);
    }

    public async Task<List<ProjectResponseDto>> GetByAdvisorAsync(Guid advisorUserId)
    {
        var projects = await BuildProjectQuery()
            .Where(project => project.AdvisorUserId == advisorUserId)
            .OrderByDescending(project => project.CreatedAt)
            .ToListAsync();

        return projects.Select(MapToDto).ToList();
    }

    public async Task<ProjectResponseDto> CreateAsync(ProjectCreateDto request)
    {
        var project = new Project
        {
            Title = request.Title,
            Description = request.Description,
            Category = request.Category,
            DifficultyLevel = request.DifficultyLevel,
            EstimatedWeeks = request.EstimatedWeeks,
            AdvisorUserId = request.AdvisorUserId,
            CreatedAt = DateTime.UtcNow
        };

        foreach (var departmentId in request.DepartmentIds.Distinct())
        {
            project.ProjectDepartments.Add(new ProjectDepartment { DepartmentId = departmentId });
        }

        foreach (var technologyId in request.TechnologyIds.Distinct())
        {
            project.ProjectTechnologies.Add(new ProjectTechnology { TechnologyId = technologyId });
        }

        _context.Projects.Add(project);
        await _context.SaveChangesAsync();

        return await GetByIdAsync(project.Id) ?? new ProjectResponseDto { Id = project.Id };
    }

    public async Task<ProjectResponseDto> CreateForAdvisorAsync(Guid advisorUserId, ProjectCreateDto request)
    {
        var advisor = await _context.Users
            .AsNoTracking()
            .Include(user => user.AdvisorProfile)
            .FirstOrDefaultAsync(user => user.Id == advisorUserId && user.AdvisorProfile != null);

        if (advisor == null)
        {
            throw new InvalidOperationException("Danisman profili bulunamadi.");
        }

        request.AdvisorUserId = advisorUserId;

        if (!request.DepartmentIds.Any() && advisor.DepartmentId.HasValue)
        {
            request.DepartmentIds.Add(advisor.DepartmentId.Value);
        }

        return await CreateAsync(request);
    }

    public async Task<bool> UpdateAsync(int id, ProjectCreateDto request)
    {
        var project = await _context.Projects.FindAsync(id);
        if (project == null)
        {
            return false;
        }

        project.Title = request.Title;
        project.Description = request.Description;
        project.Category = request.Category;
        project.DifficultyLevel = request.DifficultyLevel;
        project.EstimatedWeeks = request.EstimatedWeeks;
        project.AdvisorUserId = request.AdvisorUserId;
        project.UpdatedAt = DateTime.UtcNow;

        await _context.SaveChangesAsync();
        return true;
    }

    public async Task<bool> DeleteAsync(int id)
    {
        var project = await _context.Projects.FindAsync(id);
        if (project == null)
        {
            return false;
        }

        _context.Projects.Remove(project);
        await _context.SaveChangesAsync();
        return true;
    }

    private IQueryable<Project> BuildProjectQuery()
    {
        return _context.Projects
            .Include(project => project.AdvisorUser)
                .ThenInclude(user => user!.AdvisorProfile)
            .Include(project => project.ProjectDepartments)
                .ThenInclude(projectDepartment => projectDepartment.Department)
            .Include(project => project.ProjectTechnologies)
                .ThenInclude(projectTechnology => projectTechnology.Technology);
    }

    private static ProjectResponseDto MapToDto(Project project)
    {
        return new ProjectResponseDto
        {
            Id = project.Id,
            Title = project.Title,
            Description = project.Description,
            Category = project.Category,
            DifficultyLevel = project.DifficultyLevel,
            EstimatedWeeks = project.EstimatedWeeks,
            AdvisorUserId = project.AdvisorUserId,
            AdvisorFullName = project.AdvisorUser?.FullName,
            AdvisorAcademicTitle = project.AdvisorUser?.AdvisorProfile?.AcademicTitle,
            CreatedAt = project.CreatedAt,
            UpdatedAt = project.UpdatedAt,
            DepartmentNames = project.ProjectDepartments
                .Select(projectDepartment => projectDepartment.Department.Name)
                .ToList(),
            TechnologyNames = project.ProjectTechnologies
                .Select(projectTechnology => projectTechnology.Technology.Name)
                .ToList()
        };
    }
}
