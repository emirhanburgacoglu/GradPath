using GradPath.Business.DTOs.Project;
using GradPath.Business.Services;
using Microsoft.AspNetCore.Mvc;

namespace GradPath.API.Controllers;

[ApiController]
[Route("api/[controller]")] // URL'miz: api/project olacak
public class ProjectController : ControllerBase
{
    private readonly IProjectService _projectService;

    // Garson, sisteme kayıtlı olan o aşçıyı (Service) burada yanına çağırıyor
    public ProjectController(IProjectService projectService)
    {
        _projectService = projectService;
    }

    // LISTELEME: GET https://localhost:xxxx/api/project
    [HttpGet]
    public async Task<IActionResult> GetAll()
    {
        // Garson, aşçıya "Her şeyi getir" diyor
        var projects = await _projectService.GetAllAsync();
        // Gelen listeyi müşteriye (Web sitesine) 200 Tamam koduyla veriyor
        return Ok(projects);
    }

    // TEK PROJE: GET api/project/1
    [HttpGet("{id}")]
    public async Task<IActionResult> GetById(int id)
    {
        var project = await _projectService.GetByIdAsync(id);
        if (project == null) return NotFound("Proje bulunamadı.");
        return Ok(project);
    }

    // EKLEME: POST api/project
    [HttpPost]
    public async Task<IActionResult> Create(ProjectCreateDto request)
    {
        // Web'den gelen paketle aşçıya "Yeni yemek yap" diyor
        var result = await _projectService.CreateAsync(request);
        // "Başarıyla oluşturuldu" mesajı döner
        return CreatedAtAction(nameof(GetById), new { id = result.Id }, result);
    }
}
