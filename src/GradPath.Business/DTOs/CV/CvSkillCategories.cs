namespace GradPath.Business.DTOs.CV;

public static class CvSkillCategories
{
    public const string Programming = "Programming";
    public const string Frameworks = "Frameworks";
    public const string Web = "Web";
    public const string Databases = "Databases";
    public const string Tools = "Tools";
    public const string AiData = "AI/Data";
    public const string Mobile = "Mobile";
    public const string Embedded = "Embedded";
    public const string DevOps = "DevOps";
    public const string Other = "Other";

    public static readonly List<string> All = new()
    {
        Programming,
        Frameworks,
        Web,
        Databases,
        Tools,
        AiData,
        Mobile,
        Embedded,
        DevOps,
        Other
    };
}
