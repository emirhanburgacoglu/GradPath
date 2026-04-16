namespace GradPath.Data.Entities;

public class StudentCvProject
{
    public Guid Id { get; set; }
    public Guid UserId { get; set; }

    public string Name { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public string Role { get; set; } = string.Empty;
    public string Domain { get; set; } = string.Empty;
    public bool IsTeamProject { get; set; }

    public AppUser User { get; set; } = null!;
    public ICollection<StudentCvProjectTechnology> Technologies { get; set; } = new List<StudentCvProjectTechnology>();

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime? UpdatedAt { get; set; }
}
