using Microsoft.EntityFrameworkCore;

namespace ReportApproval.Api.Data;

public static class DbSchemaUpdater
{
    public static void EnsureLatestSchema(AppDbContext context)
    {
        context.Database.ExecuteSqlRaw("""
            ALTER TABLE "Users"
            ADD COLUMN IF NOT EXISTS "Password" text NOT NULL DEFAULT '';
            """);

        context.Database.ExecuteSqlRaw("""
            ALTER TABLE "Reports"
            ADD COLUMN IF NOT EXISTS "Status" text NOT NULL DEFAULT 'PendingManager';
            """);

        context.Database.ExecuteSqlRaw("""
            ALTER TABLE "Reports"
            ADD COLUMN IF NOT EXISTS "ReturnedReason" text NULL;
            """);

        context.Database.ExecuteSqlRaw("""
            ALTER TABLE "Reports"
            ADD COLUMN IF NOT EXISTS "FileOriginalName" text NULL;
            """);

        context.Database.ExecuteSqlRaw("""
            ALTER TABLE "Reports"
            ADD COLUMN IF NOT EXISTS "FileStoredName" text NULL;
            """);

        context.Database.ExecuteSqlRaw("""
            ALTER TABLE "Reports"
            ADD COLUMN IF NOT EXISTS "FileContentType" text NULL;
            """);

        context.Database.ExecuteSqlRaw("""
            ALTER TABLE "ReportApprovals"
            ADD COLUMN IF NOT EXISTS "Action" text NOT NULL DEFAULT 'Approved';
            """);

        context.Database.ExecuteSqlRaw("""
            CREATE TABLE IF NOT EXISTS "Tasks" (
                "Id" uuid NOT NULL,
                "Title" text NOT NULL,
                "Description" text NOT NULL,
                "AssignedToUserId" integer NOT NULL,
                "AssignedByUserId" integer NOT NULL,
                "DueDate" timestamp with time zone NULL,
                "Status" text NOT NULL DEFAULT 'Todo',
                "CreatedAt" timestamp with time zone NOT NULL,
                CONSTRAINT "PK_Tasks" PRIMARY KEY ("Id")
            );
            """);

        context.Database.ExecuteSqlRaw("""
            ALTER TABLE "Tasks"
            ADD COLUMN IF NOT EXISTS "Status" text NOT NULL DEFAULT 'Todo';
            """);

        context.Database.ExecuteSqlRaw("""
            ALTER TABLE "Tasks"
            ADD COLUMN IF NOT EXISTS "CreatedAt" timestamp with time zone NOT NULL DEFAULT NOW();
            """);

        context.Database.ExecuteSqlRaw("""
            ALTER TABLE "Tasks"
            ADD COLUMN IF NOT EXISTS "CompletedAt" timestamp with time zone NULL;
            """);

        context.Database.ExecuteSqlRaw("""
            ALTER TABLE "Tasks"
            ADD COLUMN IF NOT EXISTS "CompletedByUserId" integer NULL;
            """);

        context.Database.ExecuteSqlRaw("""
            CREATE TABLE IF NOT EXISTS "TaskHistories" (
                "Id" uuid NOT NULL,
                "TaskId" uuid NOT NULL,
                "Action" text NOT NULL,
                "Status" text NOT NULL,
                "Note" text NOT NULL,
                "ChangedByUserId" integer NOT NULL,
                "ChangedAt" timestamp with time zone NOT NULL,
                CONSTRAINT "PK_TaskHistories" PRIMARY KEY ("Id")
            );
            """);
    }
}
