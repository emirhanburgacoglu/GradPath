namespace GradPath.Data.Entities;

public class StudentProjectPostTechnology
{
    public Guid StudentProjectPostId { get; set; }
    public int TechnologyId { get; set; }

    public StudentProjectPost StudentProjectPost { get; set; } = null!;
    public Technology Technology { get; set; } = null!;
}
