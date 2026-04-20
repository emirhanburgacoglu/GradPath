namespace GradPath.Business.DTOs.StudentProjectPost;

public class StudentProjectPostResponseDto
{
    public Guid Id { get; set; }
    public Guid OwnerUserId { get; set; }

    public string Title { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public string Category { get; set; } = string.Empty;
    public string ProjectType { get; set; } = string.Empty;
    public string Status { get; set; } = string.Empty;

    public int TeamSize { get; set; }
    public int NeededMemberCount { get; set; }
    public DateTime? ApplicationDeadline { get; set; }

    public DateTime CreatedAt { get; set; }
    public DateTime? UpdatedAt { get; set; }

    public List<int> TechnologyIds { get; set; } = new();
    public List<string> TechnologyNames { get; set; } = new();

    public List<int> DepartmentIds { get; set; } = new();
    public List<string> DepartmentNames { get; set; } = new();

    public int PendingApplicationCount { get; set; }
    public int AcceptedApplicationCount { get; set; }
    public int RejectedApplicationCount { get; set; }
    public int AvailableMemberSlotCount { get; set; }
}
