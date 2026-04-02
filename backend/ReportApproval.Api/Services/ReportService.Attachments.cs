using Microsoft.AspNetCore.Http;
using Microsoft.EntityFrameworkCore;

namespace ReportApproval.Api.Services;

public partial class ReportService
{
    public async Task<(bool Success, string Message, (byte[] Data, string ContentType, string DownloadName)? File)> GetAttachmentAsync(Guid reportId, int viewerUserId)
    {
        var report = await dbContext.Reports.FirstOrDefaultAsync(x => x.Id == reportId);
        if (report is null)
        {
            return (false, "Không tìm thấy báo cáo.", null);
        }

        if (!await CanAccessReportAsync(report, viewerUserId))
        {
            return (false, "FORBIDDEN", null);
        }

        if (string.IsNullOrWhiteSpace(report.FileStoredName) || string.IsNullOrWhiteSpace(report.FileOriginalName))
        {
            return (false, "Báo cáo không có tệp đính kèm.", null);
        }

        var filePath = Path.Combine(GetUploadRoot(), report.FileStoredName);
        if (!File.Exists(filePath))
        {
            return (false, "Không tìm thấy tệp trên hệ thống.", null);
        }

        var bytes = await File.ReadAllBytesAsync(filePath);
        var contentType = string.IsNullOrWhiteSpace(report.FileContentType)
            ? "application/octet-stream"
            : report.FileContentType;

        return (true, "OK", (bytes, contentType, report.FileOriginalName));
    }

    private async Task<(bool Success, string Message, (string OriginalName, string StoredName, string ContentType)? FileMeta)> SaveAttachmentAsync(
        IFormFile? file,
        string? existingStoredFileName = null)
    {
        if (file is null)
        {
            return (true, "OK", null);
        }

        var extension = Path.GetExtension(file.FileName).ToLowerInvariant();
        if (!AllowedExtensions.Contains(extension))
        {
            return (false, "Chỉ cho phép tệp Excel/Word (.xls, .xlsx, .doc, .docx).", null);
        }

        var root = GetUploadRoot();
        Directory.CreateDirectory(root);

        if (!string.IsNullOrWhiteSpace(existingStoredFileName))
        {
            var oldPath = Path.Combine(root, existingStoredFileName);
            if (File.Exists(oldPath))
            {
                File.Delete(oldPath);
            }
        }

        var storedName = $"{Guid.NewGuid()}{extension}";
        var path = Path.Combine(root, storedName);
        await using var stream = File.Create(path);
        await file.CopyToAsync(stream);

        return (true, "OK", (file.FileName, storedName, file.ContentType));
    }

    private string GetUploadRoot()
    {
        return Path.Combine(environment.ContentRootPath, "uploads");
    }
}
