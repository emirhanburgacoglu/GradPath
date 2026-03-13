using Microsoft.AspNetCore.Http;

namespace GradPath.Business.Services;

/// <summary>
/// Dosya yükleme işlemlerini standart bir şekilde yapmak için kullanılan sözleşme.
/// </summary>
public interface IFileUploadService
{
    /// <summary>
    /// Verilen dosyayı sunucudaki belirtilen klasöre kaydeder.
    /// </summary>
    /// <param name="file">Yüklenecek dosya (Web'den gelen IFormFile)</param>
    /// <param name="folderName">Kaydedileceği klasör adı (Örn: "cvs", "transcripts")</param>
    /// <returns>Sistemin oluşturduğu benzersiz dosya adını döner.</returns>
    Task<string> UploadFileAsync(IFormFile file, string folderName);
}
