using GradPath.Business.DTOs.CV;

namespace GradPath.Business.Services;

public static class CvDomainSignalBuilder
{
    public static List<string> Build(CvAnalysisResultDto analysis)
    {
        var signals = new HashSet<string>(StringComparer.OrdinalIgnoreCase);

        var allSkills = analysis.SkillsByCategory
            .SelectMany(x => x.Skills)
            .ToHashSet(StringComparer.OrdinalIgnoreCase);

        var allProjectText = string.Join(" ",
            analysis.Projects.Select(x => $"{x.Name} {x.Description}"));

        var allExperienceText = string.Join(" ",
            analysis.Experiences.Select(x => $"{x.Position} {x.Description}"));

        if (ContainsAny(allSkills, "PHP", "CodeIgniter", ".NET", ".NET Core", "ASP.NET Core", "Entity Framework", "Node.js", "Express.js", "Spring Boot", "Laravel", "Flask", "FastAPI", "Java", "C#"))
        {
            signals.Add("Backend");
        }

        if (ContainsAny(allSkills, "HTML", "CSS", "JavaScript", "TypeScript", "React", "Angular", "Vue.js", "Bootstrap", "Tailwind CSS"))
        {
            signals.Add("Web");
        }

        if (ContainsAny(allSkills, "Machine Learning", "Deep Learning", "Computer Vision", "OpenCV", "InsightFace", "NLP", "Scikit-learn", "TensorFlow", "PyTorch", "NumPy", "Pandas", "LLM"))
        {
            signals.Add("AI");
        }

        if (ContainsAny(allSkills, "Flutter"))
        {
            signals.Add("Mobile");
        }

        if (ContainsAny(allSkills, "Raspberry Pi"))
        {
            signals.Add("Embedded");
        }

        if (allProjectText.Contains("database", StringComparison.OrdinalIgnoreCase) ||
            allExperienceText.Contains("database", StringComparison.OrdinalIgnoreCase))
        {
            signals.Add("Data");
        }

        return signals.OrderBy(x => x).ToList();
    }

    private static bool ContainsAny(HashSet<string> source, params string[] values)
    {
        return values.Any(source.Contains);
    }
}
