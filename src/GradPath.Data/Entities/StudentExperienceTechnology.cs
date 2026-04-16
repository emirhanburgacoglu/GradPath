namespace GradPath.Data.Entities;

public class StudentExperienceTechnology
{
    public Guid StudentExperienceId { get; set; }
    public Guid UserId { get; set; }
    public int TechnologyId { get; set; }

    public StudentExperience StudentExperience { get; set; } = null!;
    public Technology Technology { get; set; } = null!;

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}
