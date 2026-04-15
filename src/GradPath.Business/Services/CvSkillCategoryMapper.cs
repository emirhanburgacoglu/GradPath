using GradPath.Business.DTOs.CV;

namespace GradPath.Business.Services;

public static class CvSkillCategoryMapper
{
    public static string MapCategory(string rawCategory)
    {
        if (string.IsNullOrWhiteSpace(rawCategory))
        {
            return CvSkillCategories.Other;
        }

        var normalized = rawCategory.Trim().ToLowerInvariant();

        if (normalized.Contains("programming") || normalized.Contains("language"))
            return CvSkillCategories.Programming;

        if (normalized.Contains("framework")
            || normalized.Contains("backend")
            || normalized.Contains("technology")
            || normalized.Contains("library")
            || normalized.Contains("tech stack"))
            return CvSkillCategories.Frameworks;

        if (normalized.Contains("web") || normalized.Contains("frontend"))
            return CvSkillCategories.Web;

        if (normalized.Contains("database"))
            return CvSkillCategories.Databases;

        if (normalized.Contains("tool") || normalized.Contains("platform"))
            return CvSkillCategories.Tools;

        if (normalized.Contains("ai") || normalized.Contains("data"))
            return CvSkillCategories.AiData;

        if (normalized.Contains("mobile"))
            return CvSkillCategories.Mobile;

        if (normalized.Contains("embedded"))
            return CvSkillCategories.Embedded;

        if (normalized.Contains("devops"))
            return CvSkillCategories.DevOps;

        return CvSkillCategories.Other;
    }
}
