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

    public StudentController(IStudentService studentService)
    {
        _studentService = studentService;
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
}
