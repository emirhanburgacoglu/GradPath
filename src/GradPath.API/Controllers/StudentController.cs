using System.Security.Claims;
using GradPath.Business.DTOs.CV;
using GradPath.Business.DTOs.Student;
using GradPath.Business.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace GradPath.API.Controllers;

[ApiController]
[Route("api/v1/student")]
[Authorize]
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
        var fileName = await _fileUploadService.UploadFileAsync(file, "cvs");

        await _studentService.UpdateCvFileNameAsync(userId, fileName);

        using (var stream = file.OpenReadStream())
        {
            await _studentService.ProcessCvAsync(userId, stream);
        }

        return Ok(new { Message = "CV basariyla yuklendi ve AI tarafindan analiz edildi.", FileName = fileName });
    }

    [HttpPost("upload-transcript")]
    public async Task<IActionResult> UploadTranscript(IFormFile file)
    {
        var userIdString = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        if (userIdString == null) return Unauthorized();

        var userId = Guid.Parse(userIdString);
        var fileName = await _fileUploadService.UploadFileAsync(file, "transcripts");

        await _studentService.UpdateTranscriptFileNameAsync(userId, fileName);

        using (var stream = file.OpenReadStream())
        {
            await _studentService.ProcessTranscriptAsync(userId, stream);
        }

        return Ok(new { Message = "Transkript basariyla yuklendi ve AI tarafindan analiz edildi.", FileName = fileName });
    }

    [HttpGet("me")]
    public async Task<IActionResult> GetMyProfile()
    {
        var userIdString = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        if (userIdString == null) return Unauthorized();

        var userId = Guid.Parse(userIdString);
        var profile = await _studentService.GetProfileByUserIdAsync(userId);

        if (profile == null) return NotFound("Profil bulunamadi.");
        return Ok(profile);
    }

    [HttpPut("me")]
    public async Task<IActionResult> UpdateProfile(StudentProfileUpdateDto request)
    {
        var userIdString = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        if (userIdString == null) return Unauthorized();

        var userId = Guid.Parse(userIdString);
        var result = await _studentService.UpdateProfileAsync(userId, request);

        if (!result) return BadRequest("Profil guncellenemedi.");
        return Ok("Profil basariyla guncellendi.");
    }

    [HttpGet("skills")]
    public async Task<IActionResult> GetMySkills()
    {
        var userIdString = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        if (userIdString == null) return Unauthorized();

        var userId = Guid.Parse(userIdString);
        var skills = await _studentService.GetSkillsAsync(userId);

        return Ok(skills);
    }

    [HttpGet("skills/options")]
    public async Task<IActionResult> GetSkillOptions()
    {
        var options = await _studentService.GetAvailableTechnologiesAsync();
        return Ok(options);
    }

    [HttpPost("skills")]
    public async Task<IActionResult> AddSkill(StudentSkillDto skillDto)
    {
        var userIdString = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        if (userIdString == null) return Unauthorized();

        var userId = Guid.Parse(userIdString);
        var result = await _studentService.AddSkillAsync(userId, skillDto);

        if (!result) return BadRequest("Yetenek eklenemedi.");
        return Ok("Yetenek basariyla kaydedildi.");
    }

    [HttpDelete("skills/{technologyId}")]
    public async Task<IActionResult> RemoveSkill(int technologyId)
    {
        var userIdString = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        if (userIdString == null) return Unauthorized();

        var userId = Guid.Parse(userIdString);
        var result = await _studentService.RemoveSkillAsync(userId, technologyId);

        if (!result) return NotFound("Yetenek bulunamadi.");
        return Ok("Yetenek basariyla silindi.");
    }

    [HttpGet("skills/draft")]
    public async Task<IActionResult> GetDraftSkillsFromCv()
    {
        var userIdString = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        if (userIdString == null) return Unauthorized();

        var userId = Guid.Parse(userIdString);
        var skills = await _studentService.GetDraftSkillsFromCvAsync(userId);

        return Ok(skills);
    }

    [HttpPut("skills")]
    public async Task<IActionResult> ReplaceSkills(List<StudentSkillDto> skills)
    {
        var userIdString = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        if (userIdString == null) return Unauthorized();

        var userId = Guid.Parse(userIdString);
        var result = await _studentService.ReplaceSkillsAsync(userId, skills);

        if (!result) return BadRequest("Yetenekler guncellenemedi.");
        return Ok("Yetenekler basariyla guncellendi.");
    }

    [HttpGet("educations")]
    public async Task<IActionResult> GetMyEducations()
    {
        var userIdString = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        if (userIdString == null) return Unauthorized();

        var userId = Guid.Parse(userIdString);
        var educations = await _studentService.GetEducationsAsync(userId);

        return Ok(educations);
    }

    [HttpPost("educations")]
    public async Task<IActionResult> AddEducation(StudentEducationCrudDto dto)
    {
        var userIdString = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        if (userIdString == null) return Unauthorized();

        var userId = Guid.Parse(userIdString);
        var result = await _studentService.AddEducationAsync(userId, dto);

        if (!result) return BadRequest("Egitim eklenemedi.");
        return Ok("Egitim basariyla eklendi.");
    }

    [HttpPut("educations/{educationId}")]
    public async Task<IActionResult> UpdateEducation(Guid educationId, StudentEducationCrudDto dto)
    {
        var userIdString = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        if (userIdString == null) return Unauthorized();

        var userId = Guid.Parse(userIdString);
        var result = await _studentService.UpdateEducationAsync(userId, educationId, dto);

        if (!result) return BadRequest("Egitim guncellenemedi.");
        return Ok("Egitim basariyla guncellendi.");
    }

    [HttpDelete("educations/{educationId}")]
    public async Task<IActionResult> RemoveEducation(Guid educationId)
    {
        var userIdString = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        if (userIdString == null) return Unauthorized();

        var userId = Guid.Parse(userIdString);
        var result = await _studentService.RemoveEducationAsync(userId, educationId);

        if (!result) return NotFound("Egitim bulunamadi.");
        return Ok("Egitim basariyla silindi.");
    }

    [HttpGet("experiences")]
    public async Task<IActionResult> GetMyExperiences()
    {
        var userIdString = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        if (userIdString == null) return Unauthorized();

        var userId = Guid.Parse(userIdString);
        var experiences = await _studentService.GetExperiencesAsync(userId);

        return Ok(experiences);
    }

    [HttpPost("experiences")]
    public async Task<IActionResult> AddExperience(StudentExperienceCrudDto dto)
    {
        var userIdString = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        if (userIdString == null) return Unauthorized();

        var userId = Guid.Parse(userIdString);
        var result = await _studentService.AddExperienceAsync(userId, dto);

        if (!result) return BadRequest("Deneyim eklenemedi.");
        return Ok("Deneyim basariyla eklendi.");
    }

    [HttpPut("experiences/{experienceId}")]
    public async Task<IActionResult> UpdateExperience(Guid experienceId, StudentExperienceCrudDto dto)
    {
        var userIdString = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        if (userIdString == null) return Unauthorized();

        var userId = Guid.Parse(userIdString);
        var result = await _studentService.UpdateExperienceAsync(userId, experienceId, dto);

        if (!result) return BadRequest("Deneyim guncellenemedi.");
        return Ok("Deneyim basariyla guncellendi.");
    }

    [HttpDelete("experiences/{experienceId}")]
    public async Task<IActionResult> RemoveExperience(Guid experienceId)
    {
        var userIdString = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        if (userIdString == null) return Unauthorized();

        var userId = Guid.Parse(userIdString);
        var result = await _studentService.RemoveExperienceAsync(userId, experienceId);

        if (!result) return NotFound("Deneyim bulunamadi.");
        return Ok("Deneyim basariyla silindi.");
    }

    [HttpGet("cv-projects")]
    public async Task<IActionResult> GetMyCvProjects()
    {
        var userIdString = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        if (userIdString == null) return Unauthorized();

        var userId = Guid.Parse(userIdString);
        var projects = await _studentService.GetCvProjectsAsync(userId);

        return Ok(projects);
    }

    [HttpPost("cv-projects")]
    public async Task<IActionResult> AddCvProject(StudentCvProjectCrudDto dto)
    {
        var userIdString = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        if (userIdString == null) return Unauthorized();

        var userId = Guid.Parse(userIdString);
        var result = await _studentService.AddCvProjectAsync(userId, dto);

        if (!result) return BadRequest("CV projesi eklenemedi.");
        return Ok("CV projesi basariyla eklendi.");
    }

    [HttpPut("cv-projects/{projectId}")]
    public async Task<IActionResult> UpdateCvProject(Guid projectId, StudentCvProjectCrudDto dto)
    {
        var userIdString = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        if (userIdString == null) return Unauthorized();

        var userId = Guid.Parse(userIdString);
        var result = await _studentService.UpdateCvProjectAsync(userId, projectId, dto);

        if (!result) return BadRequest("CV projesi guncellenemedi.");
        return Ok("CV projesi basariyla guncellendi.");
    }

    [HttpDelete("cv-projects/{projectId}")]
    public async Task<IActionResult> RemoveCvProject(Guid projectId)
    {
        var userIdString = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        if (userIdString == null) return Unauthorized();

        var userId = Guid.Parse(userIdString);
        var result = await _studentService.RemoveCvProjectAsync(userId, projectId);

        if (!result) return NotFound("CV projesi bulunamadi.");
        return Ok("CV projesi basariyla silindi.");
    }

    [HttpGet("domain-signals")]
    public async Task<IActionResult> GetMyDomainSignals()
    {
        var userIdString = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        if (userIdString == null) return Unauthorized();

        var userId = Guid.Parse(userIdString);
        var domainSignals = await _studentService.GetDomainSignalsAsync(userId);

        return Ok(domainSignals);
    }

    [HttpPost("domain-signals")]
    public async Task<IActionResult> AddDomainSignal(StudentDomainSignalCrudDto dto)
    {
        var userIdString = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        if (userIdString == null) return Unauthorized();

        var userId = Guid.Parse(userIdString);
        var result = await _studentService.AddDomainSignalAsync(userId, dto);

        if (!result) return BadRequest("Alan eklenemedi.");
        return Ok("Alan basariyla eklendi.");
    }

    [HttpPut("domain-signals/{domainSignalId}")]
    public async Task<IActionResult> UpdateDomainSignal(Guid domainSignalId, StudentDomainSignalCrudDto dto)
    {
        var userIdString = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        if (userIdString == null) return Unauthorized();

        var userId = Guid.Parse(userIdString);
        var result = await _studentService.UpdateDomainSignalAsync(userId, domainSignalId, dto);

        if (!result) return BadRequest("Alan guncellenemedi.");
        return Ok("Alan basariyla guncellendi.");
    }

    [HttpDelete("domain-signals/{domainSignalId}")]
    public async Task<IActionResult> RemoveDomainSignal(Guid domainSignalId)
    {
        var userIdString = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        if (userIdString == null) return Unauthorized();

        var userId = Guid.Parse(userIdString);
        var result = await _studentService.RemoveDomainSignalAsync(userId, domainSignalId);

        if (!result) return NotFound("Alan bulunamadi.");
        return Ok("Alan basariyla silindi.");
    }

    [HttpPost("debug-analyze-cv-text")]
    public IActionResult DebugAnalyzeCvText([FromBody] CvRawTextRequestDto request)
    {
        if (request == null || string.IsNullOrWhiteSpace(request.RawText))
        {
            return BadRequest("CV metni bos olamaz.");
        }

        var normalizedText = CvTextPreprocessor.Normalize(request.RawText);
        var result = CvAnalysisBuilder.Build(normalizedText);

        return Ok(result);
    }
}
