namespace GradPath.Data.Entities;

public class StudentCvProjectTechnology
{
    public Guid StudentCvProjectId { get; set; }
    public Guid UserId { get; set; }
    public int TechnologyId { get; set; }

    public StudentCvProject StudentCvProject { get; set; } = null!;
    public Technology Technology { get; set; } = null!;

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}
