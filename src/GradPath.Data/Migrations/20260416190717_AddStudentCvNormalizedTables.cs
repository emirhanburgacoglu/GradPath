using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace GradPath.Data.Migrations
{
    /// <inheritdoc />
    public partial class AddStudentCvNormalizedTables : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "StudentCvProjects",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    UserId = table.Column<Guid>(type: "uuid", nullable: false),
                    Name = table.Column<string>(type: "text", nullable: false),
                    Description = table.Column<string>(type: "text", nullable: false),
                    Role = table.Column<string>(type: "text", nullable: false),
                    Domain = table.Column<string>(type: "text", nullable: false),
                    IsTeamProject = table.Column<bool>(type: "boolean", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_StudentCvProjects", x => x.Id);
                    table.ForeignKey(
                        name: "FK_StudentCvProjects_AspNetUsers_UserId",
                        column: x => x.UserId,
                        principalTable: "AspNetUsers",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "StudentDomainSignals",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    UserId = table.Column<Guid>(type: "uuid", nullable: false),
                    Name = table.Column<string>(type: "text", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_StudentDomainSignals", x => x.Id);
                    table.ForeignKey(
                        name: "FK_StudentDomainSignals_AspNetUsers_UserId",
                        column: x => x.UserId,
                        principalTable: "AspNetUsers",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "StudentEducations",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    UserId = table.Column<Guid>(type: "uuid", nullable: false),
                    SchoolName = table.Column<string>(type: "text", nullable: false),
                    Department = table.Column<string>(type: "text", nullable: false),
                    Degree = table.Column<string>(type: "text", nullable: false),
                    StartDateText = table.Column<string>(type: "text", nullable: false),
                    EndDateText = table.Column<string>(type: "text", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_StudentEducations", x => x.Id);
                    table.ForeignKey(
                        name: "FK_StudentEducations_AspNetUsers_UserId",
                        column: x => x.UserId,
                        principalTable: "AspNetUsers",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "StudentExperiences",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    UserId = table.Column<Guid>(type: "uuid", nullable: false),
                    CompanyName = table.Column<string>(type: "text", nullable: false),
                    Position = table.Column<string>(type: "text", nullable: false),
                    StartDateText = table.Column<string>(type: "text", nullable: false),
                    EndDateText = table.Column<string>(type: "text", nullable: false),
                    Description = table.Column<string>(type: "text", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_StudentExperiences", x => x.Id);
                    table.ForeignKey(
                        name: "FK_StudentExperiences_AspNetUsers_UserId",
                        column: x => x.UserId,
                        principalTable: "AspNetUsers",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "StudentCvProjectTechnologies",
                columns: table => new
                {
                    StudentCvProjectId = table.Column<Guid>(type: "uuid", nullable: false),
                    TechnologyId = table.Column<int>(type: "integer", nullable: false),
                    UserId = table.Column<Guid>(type: "uuid", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_StudentCvProjectTechnologies", x => new { x.StudentCvProjectId, x.TechnologyId });
                    table.ForeignKey(
                        name: "FK_StudentCvProjectTechnologies_StudentCvProjects_StudentCvPro~",
                        column: x => x.StudentCvProjectId,
                        principalTable: "StudentCvProjects",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_StudentCvProjectTechnologies_Technologies_TechnologyId",
                        column: x => x.TechnologyId,
                        principalTable: "Technologies",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateTable(
                name: "StudentExperienceTechnologies",
                columns: table => new
                {
                    StudentExperienceId = table.Column<Guid>(type: "uuid", nullable: false),
                    TechnologyId = table.Column<int>(type: "integer", nullable: false),
                    UserId = table.Column<Guid>(type: "uuid", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_StudentExperienceTechnologies", x => new { x.StudentExperienceId, x.TechnologyId });
                    table.ForeignKey(
                        name: "FK_StudentExperienceTechnologies_StudentExperiences_StudentExp~",
                        column: x => x.StudentExperienceId,
                        principalTable: "StudentExperiences",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_StudentExperienceTechnologies_Technologies_TechnologyId",
                        column: x => x.TechnologyId,
                        principalTable: "Technologies",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateIndex(
                name: "IX_StudentCvProjects_UserId",
                table: "StudentCvProjects",
                column: "UserId");

            migrationBuilder.CreateIndex(
                name: "IX_StudentCvProjectTechnologies_TechnologyId",
                table: "StudentCvProjectTechnologies",
                column: "TechnologyId");

            migrationBuilder.CreateIndex(
                name: "IX_StudentDomainSignals_UserId_Name",
                table: "StudentDomainSignals",
                columns: new[] { "UserId", "Name" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_StudentEducations_UserId",
                table: "StudentEducations",
                column: "UserId");

            migrationBuilder.CreateIndex(
                name: "IX_StudentExperiences_UserId",
                table: "StudentExperiences",
                column: "UserId");

            migrationBuilder.CreateIndex(
                name: "IX_StudentExperienceTechnologies_TechnologyId",
                table: "StudentExperienceTechnologies",
                column: "TechnologyId");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "StudentCvProjectTechnologies");

            migrationBuilder.DropTable(
                name: "StudentDomainSignals");

            migrationBuilder.DropTable(
                name: "StudentEducations");

            migrationBuilder.DropTable(
                name: "StudentExperienceTechnologies");

            migrationBuilder.DropTable(
                name: "StudentCvProjects");

            migrationBuilder.DropTable(
                name: "StudentExperiences");
        }
    }
}
