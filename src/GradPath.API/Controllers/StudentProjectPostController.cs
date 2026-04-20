using System.Security.Claims;
using GradPath.Business.DTOs.StudentProjectPost;
using GradPath.Business.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace GradPath.API.Controllers;

[ApiController]
[Route("api/v1/student-project-posts")]
[Authorize]
public class StudentProjectPostController : ControllerBase
{
    private readonly IStudentProjectPostService _studentProjectPostService;

    public StudentProjectPostController(IStudentProjectPostService studentProjectPostService)
    {
        _studentProjectPostService = studentProjectPostService;
    }

    [HttpGet("mine")]
    public async Task<IActionResult> GetMine()
    {
        if (!TryGetCurrentUserId(out var userId)) return Unauthorized();
        var posts = await _studentProjectPostService.GetMineAsync(userId);
        return Ok(posts);
    }

    [HttpGet("applications/mine")]
    public async Task<IActionResult> GetMyApplications()
    {
        if (!TryGetCurrentUserId(out var userId)) return Unauthorized();
        var applications = await _studentProjectPostService.GetMyApplicationsAsync(userId);
        return Ok(applications);
    }

    [HttpGet("open")]
    [AllowAnonymous]
    public async Task<IActionResult> GetOpenPosts()
    {
        var posts = await _studentProjectPostService.GetOpenPostsAsync();
        return Ok(posts);
    }

    [HttpGet("form-options")]
    [AllowAnonymous]
    public async Task<IActionResult> GetFormOptions()
    {
        var options = await _studentProjectPostService.GetFormOptionsAsync();
        return Ok(options);
    }

    [HttpGet("{id}")]
    [AllowAnonymous]
    public async Task<IActionResult> GetById(Guid id)
    {
        var post = await _studentProjectPostService.GetByIdAsync(id, GetCurrentUserId());
        if (post == null) return NotFound("Ilan bulunamadi.");

        return Ok(post);
    }

    [HttpGet("{id}/applications")]
    public async Task<IActionResult> GetApplications(Guid id)
    {
        if (!TryGetCurrentUserId(out var userId)) return Unauthorized();

        var applications = await _studentProjectPostService.GetApplicationsForPostAsync(userId, id);
        if (applications == null) return NotFound("Ilan bulunamadi veya bu ilana erisim iznin yok.");

        return Ok(applications);
    }

    [HttpPost]
    public async Task<IActionResult> Create(StudentProjectPostUpsertDto dto)
    {
        if (!TryGetCurrentUserId(out var userId)) return Unauthorized();
        var created = await _studentProjectPostService.CreateAsync(userId, dto);

        return CreatedAtAction(nameof(GetById), new { id = created.Id }, created);
    }

    [HttpPut("{id}")]
    public async Task<IActionResult> Update(Guid id, StudentProjectPostUpsertDto dto)
    {
        if (!TryGetCurrentUserId(out var userId)) return Unauthorized();
        var updated = await _studentProjectPostService.UpdateAsync(userId, id, dto);

        if (!updated) return NotFound("Ilan bulunamadi veya bu ilana erisim iznin yok.");
        return Ok("Ilan basariyla guncellendi.");
    }

    [HttpDelete("{id}")]
    public async Task<IActionResult> Delete(Guid id)
    {
        if (!TryGetCurrentUserId(out var userId)) return Unauthorized();
        var deleted = await _studentProjectPostService.DeleteAsync(userId, id);

        if (!deleted) return NotFound("Ilan bulunamadi veya bu ilana erisim iznin yok.");
        return Ok("Ilan basariyla silindi.");
    }

    [HttpPost("{id}/apply")]
    public async Task<IActionResult> Apply(Guid id)
    {
        if (!TryGetCurrentUserId(out var userId)) return Unauthorized();

        var result = await _studentProjectPostService.ApplyAsync(userId, id);
        if (!result.Succeeded) return BadRequest(result.Message);

        return Ok(result.Message);
    }

    [HttpDelete("{id}/apply")]
    public async Task<IActionResult> Withdraw(Guid id)
    {
        if (!TryGetCurrentUserId(out var userId)) return Unauthorized();

        var result = await _studentProjectPostService.WithdrawApplicationAsync(userId, id);
        if (!result.Succeeded) return BadRequest(result.Message);

        return Ok(result.Message);
    }

    [HttpPost("{postId}/applications/{applicationId}/accept")]
    public async Task<IActionResult> Accept(Guid postId, Guid applicationId)
    {
        if (!TryGetCurrentUserId(out var userId)) return Unauthorized();

        var result = await _studentProjectPostService.AcceptApplicationAsync(userId, postId, applicationId);
        if (!result.Succeeded) return BadRequest(result.Message);

        return Ok(result.Message);
    }

    [HttpPost("{postId}/applications/{applicationId}/reject")]
    public async Task<IActionResult> Reject(Guid postId, Guid applicationId)
    {
        if (!TryGetCurrentUserId(out var userId)) return Unauthorized();

        var result = await _studentProjectPostService.RejectApplicationAsync(userId, postId, applicationId);
        if (!result.Succeeded) return BadRequest(result.Message);

        return Ok(result.Message);
    }

    private Guid? GetCurrentUserId()
    {
        return TryGetCurrentUserId(out var userId)
            ? userId
            : null;
    }

    private bool TryGetCurrentUserId(out Guid userId)
    {
        var userIdString = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        return Guid.TryParse(userIdString, out userId);
    }
}
