namespace GradPath.Business.DTOs.Advisor;

public class AvesisAdvisorSyncSettings
{
    public List<string> ComputerEngineeringProfileUrls { get; set; } = new();
    public string InitialAdvisorPassword { get; set; } = "Advisor123!";
    public int DefaultMaxConcurrentStudents { get; set; } = 5;
}
