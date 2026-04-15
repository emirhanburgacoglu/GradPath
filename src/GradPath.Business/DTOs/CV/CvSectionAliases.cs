namespace GradPath.Business.DTOs.CV;

public static class CvSectionAliases
{
    public static readonly Dictionary<CvSectionType, List<string>> All = new()
    {
        {
            CvSectionType.Summary,
            new List<string>
            {
                "SUMMARY",
                "PROFESSIONAL SUMMARY",
                "PROFILE",
                "PROFILE SUMMARY",
                "CAREER SUMMARY",
                "ABOUT",
                "ABOUT ME",
                "HAKKIMDA",
                "OZET",
                "ÖZET"
            }
        },
        {
            CvSectionType.Skills,
            new List<string>
            {
                "SKILLS",
                "TECHNICAL SKILLS",
                "TECHNICAL COMPETENCIES",
                "TECHNICAL PROFICIENCIES",
                "CORE COMPETENCIES",
                "COMPETENCIES",
                "TECH STACK",
                "TECHNOLOGIES",
                "TOOLS & TECHNOLOGIES",
                "YETENEKLER",
                "TEKNIK YETENEKLER",
                "TEKNİK YETENEKLER",
                "ADDITIONAL INFORMATION"
            }
        },
        {
            CvSectionType.Experience,
            new List<string>
            {
                "EXPERIENCE",
                "WORK EXPERIENCE",
                "PROFESSIONAL EXPERIENCE",
                "EMPLOYMENT HISTORY",
                "WORK HISTORY",
                "CAREER HISTORY",
                "INTERNSHIP EXPERIENCE",
                "INTERNSHIPS",
                "VOLUNTEER EXPERIENCE",
                "IS DENEYIMI",
                "İŞ DENEYİMİ",
                "DENEYIM",
                "DENEYİM"
            }
        },
        {
            CvSectionType.Projects,
            new List<string>
            {
                "PROJECTS",
                "SELECTED PROJECTS",
                "ACADEMIC PROJECTS",
                "PERSONAL PROJECTS",
                "RELEVANT PROJECTS",
                "KEY PROJECTS",
                "PROJECT EXPERIENCE",
                "PROJELER"
            }
        },
        {
            CvSectionType.Education,
            new List<string>
            {
                "EDUCATION",
                "ACADEMIC BACKGROUND",
                "ACADEMIC HISTORY",
                "EDUCATION & TRAINING",
                "EDUCATION AND TRAINING",
                "EGITIM",
                "EĞITIM",
                "EĞİTİM"
            }
        },
        {
            CvSectionType.Languages,
            new List<string>
            {
                "LANGUAGES",
                "LANGUAGE SKILLS",
                "FOREIGN LANGUAGES",
                "DILLER",
                "DİLLER"
            }
        },
        {
            CvSectionType.Certifications,
            new List<string>
            {
                "CERTIFICATIONS",
                "CERTIFICATES",
                "COURSES & CERTIFICATIONS",
                "COURSES AND CERTIFICATIONS",
                "TRAININGS",
                "SERTIFIKALAR",
                "SERTİFİKALAR"
            }
        },
        {
            CvSectionType.AdditionalInformation,
            new List<string>
            {
                "ADDITIONAL INFORMATION",
                "ADDITIONAL DETAILS",
                "OTHER INFORMATION",
                "PERSONAL INFORMATION",
                "EK BILGILER",
                "EK BİLGİLER"
            }
        },
        {
            CvSectionType.AwardsAndActivities,
            new List<string>
            {
                "AWARDS & ACTIVITIES",
                "AWARDS AND ACTIVITIES",
                "ACHIEVEMENTS",
                "HONORS",
                "EXTRACURRICULAR ACTIVITIES",
                "ÖDÜLLER VE AKTIVITELER",
                "ÖDÜLLER VE AKTİVİTELER"
            }
        }
    };
}
