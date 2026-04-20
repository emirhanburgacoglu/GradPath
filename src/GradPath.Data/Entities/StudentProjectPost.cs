namespace GradPath.Data.Entities;

public class StudentProjectPost
{
    public Guid Id { get; set; }
    public Guid OwnerUserId { get; set; }

    public string Title { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public string Category { get; set; } = string.Empty;
    public string ProjectType { get; set; } = string.Empty; // Competition, Hackathon, Startup, CourseProject
    public string Status { get; set; } = "Open";            // Draft, Open, Closed, Filled

    public int TeamSize { get; set; }
    public int NeededMemberCount { get; set; }
    public DateTime? ApplicationDeadline { get; set; }

    public AppUser OwnerUser { get; set; } = null!;
    public ICollection<StudentProjectPostTechnology> Technologies { get; set; } = new List<StudentProjectPostTechnology>();
    public ICollection<StudentProjectPostDepartment> Departments { get; set; } = new List<StudentProjectPostDepartment>();
    public ICollection<StudentProjectPostApplication> Applications { get; set; } = new List<StudentProjectPostApplication>();

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime? UpdatedAt { get; set; }
}
