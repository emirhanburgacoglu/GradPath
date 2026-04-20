namespace GradPath.Data.Entities;

public class StudentProjectPostApplication
{
    public Guid Id { get; set; }
    public Guid StudentProjectPostId { get; set; }
    public Guid ApplicantUserId { get; set; }

    public string Status { get; set; } = "Pending"; // Pending, Accepted, Rejected, Withdrawn

    public StudentProjectPost StudentProjectPost { get; set; } = null!;
    public AppUser ApplicantUser { get; set; } = null!;

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime? UpdatedAt { get; set; }
}
