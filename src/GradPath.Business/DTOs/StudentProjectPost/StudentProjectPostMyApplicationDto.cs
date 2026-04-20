namespace GradPath.Business.DTOs.StudentProjectPost;

public class StudentProjectPostMyApplicationDto
{
    public Guid Id { get; set; }
    public Guid StudentProjectPostId { get; set; }
    public Guid OwnerUserId { get; set; }

    public string PostTitle { get; set; } = string.Empty;
    public string PostCategory { get; set; } = string.Empty;
    public string PostProjectType { get; set; } = string.Empty;
    public string PostStatus { get; set; } = string.Empty;
    public DateTime? ApplicationDeadline { get; set; }

    public string Status { get; set; } = string.Empty;

    public DateTime CreatedAt { get; set; }
    public DateTime? UpdatedAt { get; set; }
}
