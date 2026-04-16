namespace GradPath.Data.Entities;

public class StudentEducation
{
    public Guid Id { get; set; }
    public Guid UserId { get; set; }

    public string SchoolName { get; set; } = string.Empty;
    public string Department { get; set; } = string.Empty;
    public string Degree { get; set; } = string.Empty;
    public string StartDateText { get; set; } = string.Empty;
    public string EndDateText { get; set; } = string.Empty;

    public AppUser User { get; set; } = null!;

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime? UpdatedAt { get; set; }
}
