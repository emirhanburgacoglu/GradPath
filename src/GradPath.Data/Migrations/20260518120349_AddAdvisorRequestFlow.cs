using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace GradPath.Data.Migrations
{
    /// <inheritdoc />
    public partial class AddAdvisorRequestFlow : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "AdvisorRequests",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    StudentUserId = table.Column<Guid>(type: "uuid", nullable: false),
                    AdvisorUserId = table.Column<Guid>(type: "uuid", nullable: false),
                    ProjectId = table.Column<int>(type: "integer", nullable: false),
                    Status = table.Column<string>(type: "text", nullable: false),
                    StudentNote = table.Column<string>(type: "text", nullable: true),
                    AdvisorNote = table.Column<string>(type: "text", nullable: true),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    RespondedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_AdvisorRequests", x => x.Id);
                    table.ForeignKey(
                        name: "FK_AdvisorRequests_AspNetUsers_AdvisorUserId",
                        column: x => x.AdvisorUserId,
                        principalTable: "AspNetUsers",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_AdvisorRequests_AspNetUsers_StudentUserId",
                        column: x => x.StudentUserId,
                        principalTable: "AspNetUsers",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_AdvisorRequests_Projects_ProjectId",
                        column: x => x.ProjectId,
                        principalTable: "Projects",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_AdvisorRequests_AdvisorUserId",
                table: "AdvisorRequests",
                column: "AdvisorUserId");

            migrationBuilder.CreateIndex(
                name: "IX_AdvisorRequests_ProjectId",
                table: "AdvisorRequests",
                column: "ProjectId");

            migrationBuilder.CreateIndex(
                name: "IX_AdvisorRequests_StudentUserId",
                table: "AdvisorRequests",
                column: "StudentUserId");

            migrationBuilder.CreateIndex(
                name: "IX_AdvisorRequests_StudentUserId_ProjectId_AdvisorUserId",
                table: "AdvisorRequests",
                columns: new[] { "StudentUserId", "ProjectId", "AdvisorUserId" },
                unique: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "AdvisorRequests");
        }
    }
}
