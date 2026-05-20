using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace GradPath.Data.Migrations
{
    /// <inheritdoc />
    public partial class AddInitialPasswordSetupFlags : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<bool>(
                name: "HasCompletedInitialPasswordSetup",
                table: "AspNetUsers",
                type: "boolean",
                nullable: false,
                defaultValue: true);

            migrationBuilder.AddColumn<bool>(
                name: "MustChangePassword",
                table: "AspNetUsers",
                type: "boolean",
                nullable: false,
                defaultValue: false);

            migrationBuilder.Sql("""
                UPDATE "AspNetUsers" AS u
                SET "HasCompletedInitialPasswordSetup" = FALSE,
                    "MustChangePassword" = TRUE
                FROM "AdvisorProfiles" AS ap
                WHERE ap."UserId" = u."Id"
                  AND ap."SourceUrl" IS NOT NULL
                  AND ap."SourceUrl" <> '';
                """);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "HasCompletedInitialPasswordSetup",
                table: "AspNetUsers");

            migrationBuilder.DropColumn(
                name: "MustChangePassword",
                table: "AspNetUsers");
        }
    }
}
