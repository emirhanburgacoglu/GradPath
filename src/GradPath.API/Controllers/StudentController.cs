using System.Security.Claims;
using GradPath.Business.DTOs.Student;
using GradPath.Business.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace GradPath.API.Controllers;

[ApiController]
[Route("api/v1/student")]
[Authorize] // Sadece giriş yapmış olanlar bu kapıdan girebilir!
public class StudentController : ControllerBase
{
    private readonly IStudentService _studentService;
    private readonly IFileUploadService _fileUploadService;

    public StudentController(IStudentService studentService, IFileUploadService fileUploadService)
    {
        _studentService = studentService;
        _fileUploadService = fileUploadService;
    }

    [HttpPost("upload-cv")]
    public async Task<IActionResult> UploadCv(IFormFile file)
    {
        var userIdString = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        if (userIdString == null) return Unauthorized();

        var userId = Guid.Parse(userIdString);
        
        // 1. Dosyayı fiziksel olarak kaydet
        var fileName = await _fileUploadService.UploadFileAsync(file, "cvs");

        // 2. Veritabanında profil bilgisini güncelle
        await _studentService.UpdateCvFileNameAsync(userId, fileName);

        return Ok(new { Message = "CV başarıyla yüklendi", FileName = fileName });
    }

    [HttpPost("upload-transcript")]
    public async Task<IActionResult> UploadTranscript(IFormFile file)
    {
        var userIdString = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        if (userIdString == null) return Unauthorized();

        var userId = Guid.Parse(userIdString);
        
        var fileName = await _fileUploadService.UploadFileAsync(file, "transcripts");

        await _studentService.UpdateTranscriptFileNameAsync(userId, fileName);

        return Ok(new { Message = "Transkript başarıyla yüklendi", FileName = fileName });
    }

    // PROFILIMI GETIR: GET api/v1/student/me
    [HttpGet("me")]
    public async Task<IActionResult> GetMyProfile()
    {
        // Token içinden "Ben kimim?" sorusunun cevabını (User ID) alıyoruz
        var userIdString = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        if (userIdString == null) return Unauthorized();

        var userId = Guid.Parse(userIdString);
        var profile = await _studentService.GetProfileByUserIdAsync(userId);

        if (profile == null) return NotFound("Profil bulunamadı.");
        return Ok(profile);
    }

    // PROFILIMI GÜNCELLE: PUT api/v1/student/me
    [HttpPut("me")]
    public async Task<IActionResult> UpdateProfile(StudentProfileUpdateDto request)
    {
        var userIdString = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        if (userIdString == null) return Unauthorized();

        var userId = Guid.Parse(userIdString);
        var result = await _studentService.UpdateProfileAsync(userId, request);

        if (!result) return BadRequest("Profil güncellenemedi.");
        return Ok("Profil başarıyla güncellendi.");
    }
        // YETENEKLERİMİ LİSTELE: GET api/v1/student/skills
    [HttpGet("skills")]
    public async Task<IActionResult> GetMySkills()
    {
        var userIdString = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        if (userIdString == null) return Unauthorized();

        var userId = Guid.Parse(userIdString);
        var skills = await _studentService.GetSkillsAsync(userId);
        
        return Ok(skills);
    }

    // YETENEK EKLE/GÜNCELLE: POST api/v1/student/skills
    [HttpPost("skills")]
    public async Task<IActionResult> AddSkill(StudentSkillDto skillDto)
    {
        var userIdString = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        if (userIdString == null) return Unauthorized();

        var userId = Guid.Parse(userIdString);
        var result = await _studentService.AddSkillAsync(userId, skillDto);

        if (!result) return BadRequest("Yetenek eklenemedi.");
        return Ok("Yetenek başarıyla kaydedildi.");
    }

    // YETENEK SİL: DELETE api/v1/student/skills/{id}
    [HttpDelete("skills/{technologyId}")]
    public async Task<IActionResult> RemoveSkill(int technologyId)
    {
        var userIdString = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        if (userIdString == null) return Unauthorized();

        var userId = Guid.Parse(userIdString);
        var result = await _studentService.RemoveSkillAsync(userId, technologyId);

        if (!result) return NotFound("Yetenek bulunamadı.");
        return Ok("Yetenek başarıyla silindi.");
    }

}

