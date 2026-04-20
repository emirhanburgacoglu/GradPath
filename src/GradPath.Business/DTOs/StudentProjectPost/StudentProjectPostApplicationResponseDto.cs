namespace GradPath.Business.DTOs.StudentProjectPost;

public class StudentProjectPostApplicationResponseDto
{
    public Guid Id { get; set; }
    public Guid StudentProjectPostId { get; set; }
    public Guid ApplicantUserId { get; set; }

    public string ApplicantFullName { get; set; } = string.Empty;
    public string ApplicantEmail { get; set; } = string.Empty;
    public string ApplicantDepartmentName { get; set; } = string.Empty;

    public string Status { get; set; } = string.Empty;

    public DateTime CreatedAt { get; set; }
    public DateTime? UpdatedAt { get; set; }
}
