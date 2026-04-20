using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace GradPath.Data.Migrations
{
    /// <inheritdoc />
    public partial class AddStudentProjectPostApplications : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "StudentProjectPostApplications",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    StudentProjectPostId = table.Column<Guid>(type: "uuid", nullable: false),
                    ApplicantUserId = table.Column<Guid>(type: "uuid", nullable: false),
                    Status = table.Column<string>(type: "text", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_StudentProjectPostApplications", x => x.Id);
                    table.ForeignKey(
                        name: "FK_StudentProjectPostApplications_AspNetUsers_ApplicantUserId",
                        column: x => x.ApplicantUserId,
                        principalTable: "AspNetUsers",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_StudentProjectPostApplications_StudentProjectPosts_StudentP~",
                        column: x => x.StudentProjectPostId,
                        principalTable: "StudentProjectPosts",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_StudentProjectPostApplications_ApplicantUserId",
                table: "StudentProjectPostApplications",
                column: "ApplicantUserId");

            migrationBuilder.CreateIndex(
                name: "IX_StudentProjectPostApplications_StudentProjectPostId_Applica~",
                table: "StudentProjectPostApplications",
                columns: new[] { "StudentProjectPostId", "ApplicantUserId" },
                unique: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "StudentProjectPostApplications");
        }
    }
}
