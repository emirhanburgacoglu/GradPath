using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Http;

namespace GradPath.Business.Services;

public class FileUploadService : IFileUploadService
{
    private readonly IWebHostEnvironment _env;

    // IWebHostEnvironment sayesinde projenin ana klasör yoluna erişebiliyoruz.
    public FileUploadService(IWebHostEnvironment env)
    {
        _env = env;
    }

    public async Task<string> UploadFileAsync(IFormFile file, string folderName)
    {
        if (file == null || file.Length == 0)
            throw new Exception("Dosya boş veya geçersiz.");

        // 1. Kaydedilecek ana klasörü belirle (wwwroot/uploads/cvs gibi)
        var uploadsPath = Path.Combine(_env.ContentRootPath, "wwwroot", "uploads", folderName);

        // 2. Klasör yoksa oluştur
        if (!Directory.Exists(uploadsPath))
            Directory.CreateDirectory(uploadsPath);

        // 3. Dosya adını benzersiz yap (Örn: uniqueID_ozgecmis.pdf)
        var fileName = $"{Guid.NewGuid()}_{file.FileName}";
        var filePath = Path.Combine(uploadsPath, fileName);

        // 4. Dosyayı fiziksel olarak diske kaydet
        using (var stream = new FileStream(filePath, FileMode.Create))
        {
            await file.CopyToAsync(stream);
        }

        // Sadece dosya adını geri dönüyoruz, veritabanına bu isimle kaydedeceğiz.
        return fileName;
    }
}
