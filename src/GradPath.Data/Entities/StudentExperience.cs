namespace GradPath.Data.Entities;

public class StudentExperience
{
    public Guid Id { get; set; }
    public Guid UserId { get; set; }

    public string CompanyName { get; set; } = string.Empty;
    public string Position { get; set; } = string.Empty;
    public string StartDateText { get; set; } = string.Empty;
    public string EndDateText { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;

    public AppUser User { get; set; } = null!;
    public ICollection<StudentExperienceTechnology> Technologies { get; set; } = new List<StudentExperienceTechnology>();

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime? UpdatedAt { get; set; }
}
