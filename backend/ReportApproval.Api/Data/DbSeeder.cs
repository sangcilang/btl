using ReportApproval.Api.Entities;
using Microsoft.EntityFrameworkCore;

namespace ReportApproval.Api.Data;

public static class DbSeeder
{
    public static void Seed(AppDbContext context)
    {
        AlignUserIdSequence(context);

        if (!context.Users.Any())
        {
            context.Users.AddRange(
                new User { Id = 1, UserName = "nhanvien01", Password = "123456", Role = "Staff" },
                new User { Id = 2, UserName = "truongphong01", Password = "123456", Role = "Manager" },
                new User { Id = 3, UserName = "giamdoc01", Password = "123456", Role = "Director" },
                new User { Id = 4, UserName = "admin01", Password = "123456", Role = "Admin" }
            );
        }
        else
        {
            var users = context.Users.ToList();
            foreach (var user in users.Where(x => string.IsNullOrWhiteSpace(x.Password)))
            {
                user.Password = "123456";
            }

            if (!users.Any(x => x.UserName == "admin01"))
            {
                var nextId = users.Count == 0 ? 1 : users.Max(x => x.Id) + 1;
                context.Users.Add(new User
                {
                    Id = nextId,
                    UserName = "admin01",
                    Password = "123456",
                    Role = "Admin"
                });
            }
        }

        if (!context.Reports.Any())
        {
            context.Reports.AddRange(
                new Report
                {
                    Id = Guid.Parse("11111111-1111-1111-1111-111111111111"),
                    Title = "Báo cáo tháng 1",
                    Content = "Nội dung báo cáo tháng 1",
                    CreatedByUserId = 1,
                    CurrentLevel = 1,
                    IsApproved = false,
                    Status = "PendingManager"
                },
                new Report
                {
                    Id = Guid.Parse("22222222-2222-2222-2222-222222222222"),
                    Title = "Báo cáo tháng 2",
                    Content = "Nội dung báo cáo tháng 2",
                    CreatedByUserId = 1,
                    CurrentLevel = 1,
                    IsApproved = false,
                    Status = "PendingManager"
                }
            );
        }

        if (!context.ReportApprovals.Any())
        {
            context.ReportApprovals.AddRange(
                new Entities.ReportApproval
                {
                    Id = Guid.NewGuid(),
                    ReportId = Guid.Parse("11111111-1111-1111-1111-111111111111"),
                    ApproverUserId = 1,
                    Level = 0,
                    Action = "Submitted",
                    Comment = "Nhân viên gửi báo cáo.",
                    ApprovedAt = DateTime.UtcNow.AddMinutes(-20)
                },
                new Entities.ReportApproval
                {
                    Id = Guid.NewGuid(),
                    ReportId = Guid.Parse("22222222-2222-2222-2222-222222222222"),
                    ApproverUserId = 1,
                    Level = 0,
                    Action = "Submitted",
                    Comment = "Nhân viên gửi báo cáo.",
                    ApprovedAt = DateTime.UtcNow.AddMinutes(-10)
                }
            );
        }

        context.SaveChanges();

        AlignUserIdSequence(context);
    }

    private static void AlignUserIdSequence(AppDbContext context)
    {
        context.Database.ExecuteSqlRaw("""
            SELECT setval(
                pg_get_serial_sequence('"Users"', 'Id'),
                COALESCE((SELECT MAX("Id") FROM "Users"), 1),
                true
            );
            """);
    }
}
