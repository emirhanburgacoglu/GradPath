namespace GradPath.Core.Entities;

/// <summary>
/// Sistemde tanımlı olan teknolojileri (Diller, Frameworkler, Veritabanları) temsil eder.
/// </summary>
public class Technology : BaseEntity
{
    /// <summary>
    /// Teknolojinin adı (Örn: ASP.NET Core, React, Python).
    /// </summary>
    public string Name { get; set; } = null!;

    /// <summary>
    /// Teknolojinin kategorisi (Örn: Backend, Frontend, Database, AI).
    /// </summary>
    public string Category { get; set; } = null!;

    /// <summary>
    /// Teknolojinin kısa açıklaması.
    /// </summary>
    public string Description { get; set; } = null!;

    /// <summary>
    /// İlişki: Bu teknolojinin kullanıldığı projelerin listesi.
    /// </summary>
    public ICollection<ProjectTechnology> ProjectTechnologies { get; set; } = new List<ProjectTechnology>();
}