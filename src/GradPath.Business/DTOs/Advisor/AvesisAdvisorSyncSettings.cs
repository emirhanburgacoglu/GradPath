namespace GradPath.Business.DTOs.Advisor;

public class AvesisAdvisorSyncSettings
{
    public string BaseUrl { get; set; } = "https://avesis.mcbu.edu.tr";
    public int ComputerEngineeringUnitId { get; set; } = 200115;
    public string ComputerEngineeringDirectoryUrl { get; set; } =
        "https://bilgisayarmuh.mcbu.edu.tr/akademik-personel.9254.tr.html";
    public List<string> ComputerEngineeringProfileUrls { get; set; } = new();
    public string InitialAdvisorPassword { get; set; } = "Advisor123!";
    public int DefaultMaxConcurrentStudents { get; set; } = 5;
}
