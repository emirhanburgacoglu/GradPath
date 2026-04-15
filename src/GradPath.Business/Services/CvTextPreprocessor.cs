using System.Text.RegularExpressions;

namespace GradPath.Business.Services;

public static class CvTextPreprocessor
{
    public static string Normalize(string rawText)
    {
        if (string.IsNullOrWhiteSpace(rawText))
        {
            return string.Empty;
        }

        var text = rawText.Replace("\r", "\n");

        text = text.Replace("Ã¢â‚¬Â¢", "\n- ");
        text = text.Replace("Ã¯â€šÂ·", "\n- ");
        text = text.Replace("â€¢", "\n- ");
        text = text.Replace("ï‚·", "\n- ");
        text = text.Replace("•", "\n- ");
        text = text.Replace("–", "-");
        text = text.Replace("—", "-");
        text = text.Replace("â€“", "-");
        text = text.Replace("â€”", "-");

        text = NormalizeBrokenPhrases(text);
        text = Regex.Replace(text, @"[ \t]{2,}", " ");
        text = Regex.Replace(text, @"[ \t]+\n", "\n");
        text = Regex.Replace(text, @"\n[ \t]+", "\n");
        text = Regex.Replace(text, @"\n{3,}", "\n\n");

        return text.Trim();
    }

    private static string NormalizeBrokenPhrases(string text)
    {
        text = Regex.Replace(text, @"Code\s+Igniter", "CodeIgniter", RegexOptions.IgnoreCase);
        text = Regex.Replace(text, @"Git\s+Hub", "GitHub", RegexOptions.IgnoreCase);
        text = Regex.Replace(text, @"My\s+SQL", "MySQL", RegexOptions.IgnoreCase);
        text = Regex.Replace(text, @"Postgre\s+SQL", "PostgreSQL", RegexOptions.IgnoreCase);
        text = Regex.Replace(text, @"Open\s+CV", "OpenCV", RegexOptions.IgnoreCase);
        text = Regex.Replace(text, @"Java\s+Script", "JavaScript", RegexOptions.IgnoreCase);
        text = Regex.Replace(text, @"Saa\s+S", "SaaS", RegexOptions.IgnoreCase);
        text = Regex.Replace(text, @"Grad\s+Path", "GradPath", RegexOptions.IgnoreCase);
        text = Regex.Replace(text, @"VS\s+Code", "VS Code", RegexOptions.IgnoreCase);
        text = Regex.Replace(text, @"\.NET\s+Core", ".NET Core", RegexOptions.IgnoreCase);

        return text;
    }
}
