namespace GradPath.Business.DTOs.CV;

public static class CvSkillNormalizationRules
{
    public static readonly List<CvSkillNormalizationRule> All = new()
    {
        new() { CanonicalName = "C#", CategoryName = CvSkillCategories.Programming, Aliases = new() { "c#", "c sharp", "c-sharp" } },
        new() { CanonicalName = "Python", CategoryName = CvSkillCategories.Programming, Aliases = new() { "python" } },
        new() { CanonicalName = "Java", CategoryName = CvSkillCategories.Programming, Aliases = new() { "java" } },
        new() { CanonicalName = "JavaScript", CategoryName = CvSkillCategories.Programming, Aliases = new() { "javascript", "java script", "js" } },
        new() { CanonicalName = "TypeScript", CategoryName = CvSkillCategories.Programming, Aliases = new() { "typescript", "type script", "ts" } },
        new() { CanonicalName = "PHP", CategoryName = CvSkillCategories.Programming, Aliases = new() { "php" } },
        new() { CanonicalName = "C++", CategoryName = CvSkillCategories.Programming, Aliases = new() { "c++", "cpp" } },
        new() { CanonicalName = "Dart", CategoryName = CvSkillCategories.Programming, Aliases = new() { "dart" } },
        new() { CanonicalName = "Go", CategoryName = CvSkillCategories.Programming, Aliases = new() { "golang", "go" } },

        new() { CanonicalName = ".NET", CategoryName = CvSkillCategories.Frameworks, Aliases = new() { ".net", "dotnet", ".net 8", ".net 7", ".net 6", "dotnet 8", "dotnet 7", "dotnet 6", "net 8", "net 7", "net 6" } },
        new() { CanonicalName = ".NET Core", CategoryName = CvSkillCategories.Frameworks, Aliases = new() { ".net core", "net core", "dotnet core" } },
        new() { CanonicalName = "ASP.NET Core", CategoryName = CvSkillCategories.Frameworks, Aliases = new() { "asp.net core", "asp net core", "aspnet core", "asp.net" } },
        new() { CanonicalName = "ASP.NET MVC", CategoryName = CvSkillCategories.Frameworks, Aliases = new() { "asp.net mvc", "asp net mvc", "aspnet mvc" } },
        new() { CanonicalName = "Entity Framework", CategoryName = CvSkillCategories.Frameworks, Aliases = new() { "entity framework", "ef core", "entity framework core" } },
        new() { CanonicalName = "Node.js", CategoryName = CvSkillCategories.Frameworks, Aliases = new() { "node.js", "nodejs", "node js" } },
        new() { CanonicalName = "Express.js", CategoryName = CvSkillCategories.Frameworks, Aliases = new() { "express.js", "expressjs", "express js" } },
        new() { CanonicalName = "Django", CategoryName = CvSkillCategories.Frameworks, Aliases = new() { "django" } },
        new() { CanonicalName = "Flask", CategoryName = CvSkillCategories.Frameworks, Aliases = new() { "flask" } },
        new() { CanonicalName = "FastAPI", CategoryName = CvSkillCategories.Frameworks, Aliases = new() { "fastapi", "fast api" } },
        new() { CanonicalName = "Spring Boot", CategoryName = CvSkillCategories.Frameworks, Aliases = new() { "spring boot" } },
        new() { CanonicalName = "Laravel", CategoryName = CvSkillCategories.Frameworks, Aliases = new() { "laravel" } },
        new() { CanonicalName = "CodeIgniter", CategoryName = CvSkillCategories.Frameworks, Aliases = new() { "codeigniter", "code igniter" } },
        new() { CanonicalName = "React", CategoryName = CvSkillCategories.Frameworks, Aliases = new() { "react", "react.js", "reactjs" } },
        new() { CanonicalName = "Angular", CategoryName = CvSkillCategories.Frameworks, Aliases = new() { "angular", "angularjs", "angular.js" } },
        new() { CanonicalName = "Vue.js", CategoryName = CvSkillCategories.Frameworks, Aliases = new() { "vue", "vue.js", "vuejs" } },

        new() { CanonicalName = "Flutter", CategoryName = CvSkillCategories.Mobile, Aliases = new() { "flutter" } },

        new() { CanonicalName = "HTML", CategoryName = CvSkillCategories.Web, Aliases = new() { "html", "html5" } },
        new() { CanonicalName = "CSS", CategoryName = CvSkillCategories.Web, Aliases = new() { "css", "css3" } },
        new() { CanonicalName = "Bootstrap", CategoryName = CvSkillCategories.Web, Aliases = new() { "bootstrap" } },
        new() { CanonicalName = "Tailwind CSS", CategoryName = CvSkillCategories.Web, Aliases = new() { "tailwind", "tailwind css" } },
        new() { CanonicalName = "REST API", CategoryName = CvSkillCategories.Web, Aliases = new() { "rest api", "restful api", "api development", "rest api development" } },
        new() { CanonicalName = "GraphQL", CategoryName = CvSkillCategories.Web, Aliases = new() { "graphql", "graph ql" } },

        new() { CanonicalName = "SQL", CategoryName = CvSkillCategories.Databases, Aliases = new() { "sql" } },
        new() { CanonicalName = "PostgreSQL", CategoryName = CvSkillCategories.Databases, Aliases = new() { "postgresql", "postgre sql", "postgres" } },
        new() { CanonicalName = "MySQL", CategoryName = CvSkillCategories.Databases, Aliases = new() { "mysql", "my sql" } },
        new() { CanonicalName = "MSSQL", CategoryName = CvSkillCategories.Databases, Aliases = new() { "mssql", "ms sql", "sql server", "microsoft sql server" } },
        new() { CanonicalName = "SQLite", CategoryName = CvSkillCategories.Databases, Aliases = new() { "sqlite", "sqlite3" } },
        new() { CanonicalName = "MongoDB", CategoryName = CvSkillCategories.Databases, Aliases = new() { "mongodb", "mongo db" } },
        new() { CanonicalName = "Redis", CategoryName = CvSkillCategories.Databases, Aliases = new() { "redis" } },
        new() { CanonicalName = "Firebase", CategoryName = CvSkillCategories.Databases, Aliases = new() { "firebase" } },

        new() { CanonicalName = "Git", CategoryName = CvSkillCategories.Tools, Aliases = new() { "git" } },
        new() { CanonicalName = "GitHub", CategoryName = CvSkillCategories.Tools, Aliases = new() { "github", "git hub" } },
        new() { CanonicalName = "GitLab", CategoryName = CvSkillCategories.Tools, Aliases = new() { "gitlab", "git lab" } },
        new() { CanonicalName = "VS Code", CategoryName = CvSkillCategories.Tools, Aliases = new() { "vs code", "visual studio code" } },
        new() { CanonicalName = "Visual Studio", CategoryName = CvSkillCategories.Tools, Aliases = new() { "visual studio" } },
        new() { CanonicalName = "Postman", CategoryName = CvSkillCategories.Tools, Aliases = new() { "postman" } },
        new() { CanonicalName = "Jira", CategoryName = CvSkillCategories.Tools, Aliases = new() { "jira" } },
        new() { CanonicalName = "JDBC", CategoryName = CvSkillCategories.Tools, Aliases = new() { "jdbc" } },
        new() { CanonicalName = "Linux", CategoryName = CvSkillCategories.Tools, Aliases = new() { "linux" } },
        new() { CanonicalName = "Matlab", CategoryName = CvSkillCategories.Tools, Aliases = new() { "matlab" } },
        new() { CanonicalName = "Simulink", CategoryName = CvSkillCategories.Tools, Aliases = new() { "simulink" } },
        new() { CanonicalName = "Figma", CategoryName = CvSkillCategories.Tools, Aliases = new() { "figma" } },

        new() { CanonicalName = "Machine Learning", CategoryName = CvSkillCategories.AiData, Aliases = new() { "machine learning", "ml" } },
        new() { CanonicalName = "Deep Learning", CategoryName = CvSkillCategories.AiData, Aliases = new() { "deep learning", "dl" } },
        new() { CanonicalName = "NLP", CategoryName = CvSkillCategories.AiData, Aliases = new() { "nlp", "natural language processing" } },
        new() { CanonicalName = "OpenCV", CategoryName = CvSkillCategories.AiData, Aliases = new() { "opencv", "open cv" } },
        new() { CanonicalName = "Scikit-learn", CategoryName = CvSkillCategories.AiData, Aliases = new() { "scikit-learn", "sklearn" } },
        new() { CanonicalName = "TensorFlow", CategoryName = CvSkillCategories.AiData, Aliases = new() { "tensorflow", "tensor flow" } },
        new() { CanonicalName = "PyTorch", CategoryName = CvSkillCategories.AiData, Aliases = new() { "pytorch", "py torch" } },
        new() { CanonicalName = "NumPy", CategoryName = CvSkillCategories.AiData, Aliases = new() { "numpy", "num py" } },
        new() { CanonicalName = "Pandas", CategoryName = CvSkillCategories.AiData, Aliases = new() { "pandas" } },
        new() { CanonicalName = "Computer Vision", CategoryName = CvSkillCategories.AiData, Aliases = new() { "computer vision" } },
        new() { CanonicalName = "Image Processing", CategoryName = CvSkillCategories.AiData, Aliases = new() { "image processing" } },
        new() { CanonicalName = "LLM", CategoryName = CvSkillCategories.AiData, Aliases = new() { "llm", "large language model", "large language models" } },
        new() { CanonicalName = "InsightFace", CategoryName = CvSkillCategories.AiData, Aliases = new() { "insightface" } },

        new() { CanonicalName = "Raspberry Pi", CategoryName = CvSkillCategories.Embedded, Aliases = new() { "raspberry pi", "raspberrypi" } },
        new() { CanonicalName = "Arduino", CategoryName = CvSkillCategories.Embedded, Aliases = new() { "arduino" } },

        new() { CanonicalName = "Docker", CategoryName = CvSkillCategories.DevOps, Aliases = new() { "docker" } },
        new() { CanonicalName = "Kubernetes", CategoryName = CvSkillCategories.DevOps, Aliases = new() { "kubernetes", "k8s" } },
        new() { CanonicalName = "CI/CD", CategoryName = CvSkillCategories.DevOps, Aliases = new() { "ci/cd", "ci cd", "continuous integration", "continuous delivery" } }
    };
}
