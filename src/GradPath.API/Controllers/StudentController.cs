using System.Security.Claims;
using GradPath.Business.DTOs.Student;
using GradPath.Business.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using GradPath.Business.DTOs.CV;


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

        // 1. Dosyayı fiziksel olarak kaydet (Burası zaten sizde vardı)
        var fileName = await _fileUploadService.UploadFileAsync(file, "cvs");

        // 2. Veritabanındaki dosya adını güncelle (Burası da vardı)
        await _studentService.UpdateCvFileNameAsync(userId, fileName);

        // 3. YENİ: CV'yi AI ile işle (Ekleyeceğiniz kısım burası!)
        using (var stream = file.OpenReadStream())
        {
            await _studentService.ProcessCvAsync(userId, stream);
        }

        return Ok(new { Message = "CV başarıyla yüklendi ve AI tarafından analiz edildi.", FileName = fileName });
    }


    [HttpPost("upload-transcript")]
    public async Task<IActionResult> UploadTranscript(IFormFile file)
    {
        var userIdString = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        if (userIdString == null) return Unauthorized();

        var userId = Guid.Parse(userIdString);

        // 1. Dosyayı kaydet
        var fileName = await _fileUploadService.UploadFileAsync(file, "transcripts");
        await _studentService.UpdateTranscriptFileNameAsync(userId, fileName);

        // 2. Transkripti AI ile işle (Yeni!)
        using (var stream = file.OpenReadStream())
        {
            await _studentService.ProcessTranscriptAsync(userId, stream);
        }

        return Ok(new { Message = "Transkript başarıyla yüklendi ve AI tarafından analiz edildi.", FileName = fileName });
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
    // EGITIMLERIMI LISTELE: GET api/v1/student/educations
    [HttpGet("educations")]
    public async Task<IActionResult> GetMyEducations()
    {
        var userIdString = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        if (userIdString == null) return Unauthorized();

        var userId = Guid.Parse(userIdString);
        var educations = await _studentService.GetEducationsAsync(userId);

        return Ok(educations);
    }

    // EGITIM EKLE: POST api/v1/student/educations
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

    // EGITIM GUNCELLE: PUT api/v1/student/educations/{educationId}
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

    // EGITIM SIL: DELETE api/v1/student/educations/{educationId}
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

    // DENEYIMLERIMI LISTELE: GET api/v1/student/experiences
    [HttpGet("experiences")]
    public async Task<IActionResult> GetMyExperiences()
    {
        var userIdString = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        if (userIdString == null) return Unauthorized();

        var userId = Guid.Parse(userIdString);
        var experiences = await _studentService.GetExperiencesAsync(userId);

        return Ok(experiences);
    }

    // DENEYIM EKLE: POST api/v1/student/experiences
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

    // DENEYIM GUNCELLE: PUT api/v1/student/experiences/{experienceId}
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

    // DENEYIM SIL: DELETE api/v1/student/experiences/{experienceId}
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

    // CV PROJELERIMI LISTELE: GET api/v1/student/cv-projects
    [HttpGet("cv-projects")]
    public async Task<IActionResult> GetMyCvProjects()
    {
        var userIdString = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        if (userIdString == null) return Unauthorized();

        var userId = Guid.Parse(userIdString);
        var projects = await _studentService.GetCvProjectsAsync(userId);

        return Ok(projects);
    }

    // CV PROJESI EKLE: POST api/v1/student/cv-projects
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

    // CV PROJESI GUNCELLE: PUT api/v1/student/cv-projects/{projectId}
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

    // CV PROJESI SIL: DELETE api/v1/student/cv-projects/{projectId}
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

    // ALANLARIMI LISTELE: GET api/v1/student/domain-signals
    [HttpGet("domain-signals")]
    public async Task<IActionResult> GetMyDomainSignals()
    {
        var userIdString = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        if (userIdString == null) return Unauthorized();

        var userId = Guid.Parse(userIdString);
        var domainSignals = await _studentService.GetDomainSignalsAsync(userId);

        return Ok(domainSignals);
    }

    // ALAN EKLE: POST api/v1/student/domain-signals
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

    // ALAN GUNCELLE: PUT api/v1/student/domain-signals/{domainSignalId}
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

    // ALAN SIL: DELETE api/v1/student/domain-signals/{domainSignalId}
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
            return BadRequest("CV metni boş olamaz.");
        }

        var normalizedText = CvTextPreprocessor.Normalize(request.RawText);
        var result = CvAnalysisBuilder.Build(normalizedText);

        return Ok(result);
    }

}

