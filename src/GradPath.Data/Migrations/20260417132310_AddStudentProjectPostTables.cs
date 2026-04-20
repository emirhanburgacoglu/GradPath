using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace GradPath.Data.Migrations
{
    /// <inheritdoc />
    public partial class AddStudentProjectPostTables : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "StudentProjectPosts",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    OwnerUserId = table.Column<Guid>(type: "uuid", nullable: false),
                    Title = table.Column<string>(type: "text", nullable: false),
                    Description = table.Column<string>(type: "text", nullable: false),
                    Category = table.Column<string>(type: "text", nullable: false),
                    ProjectType = table.Column<string>(type: "text", nullable: false),
                    Status = table.Column<string>(type: "text", nullable: false),
                    TeamSize = table.Column<int>(type: "integer", nullable: false),
                    NeededMemberCount = table.Column<int>(type: "integer", nullable: false),
                    ApplicationDeadline = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_StudentProjectPosts", x => x.Id);
                    table.ForeignKey(
                        name: "FK_StudentProjectPosts_AspNetUsers_OwnerUserId",
                        column: x => x.OwnerUserId,
                        principalTable: "AspNetUsers",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "StudentProjectPostDepartments",
                columns: table => new
                {
                    StudentProjectPostId = table.Column<Guid>(type: "uuid", nullable: false),
                    DepartmentId = table.Column<int>(type: "integer", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_StudentProjectPostDepartments", x => new { x.StudentProjectPostId, x.DepartmentId });
                    table.ForeignKey(
                        name: "FK_StudentProjectPostDepartments_Departments_DepartmentId",
                        column: x => x.DepartmentId,
                        principalTable: "Departments",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_StudentProjectPostDepartments_StudentProjectPosts_StudentPr~",
                        column: x => x.StudentProjectPostId,
                        principalTable: "StudentProjectPosts",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "StudentProjectPostTechnologies",
                columns: table => new
                {
                    StudentProjectPostId = table.Column<Guid>(type: "uuid", nullable: false),
                    TechnologyId = table.Column<int>(type: "integer", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_StudentProjectPostTechnologies", x => new { x.StudentProjectPostId, x.TechnologyId });
                    table.ForeignKey(
                        name: "FK_StudentProjectPostTechnologies_StudentProjectPosts_StudentP~",
                        column: x => x.StudentProjectPostId,
                        principalTable: "StudentProjectPosts",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_StudentProjectPostTechnologies_Technologies_TechnologyId",
                        column: x => x.TechnologyId,
                        principalTable: "Technologies",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateIndex(
                name: "IX_StudentProjectPostDepartments_DepartmentId",
                table: "StudentProjectPostDepartments",
                column: "DepartmentId");

            migrationBuilder.CreateIndex(
                name: "IX_StudentProjectPosts_OwnerUserId",
                table: "StudentProjectPosts",
                column: "OwnerUserId");

            migrationBuilder.CreateIndex(
                name: "IX_StudentProjectPosts_Status_ProjectType",
                table: "StudentProjectPosts",
                columns: new[] { "Status", "ProjectType" });

            migrationBuilder.CreateIndex(
                name: "IX_StudentProjectPostTechnologies_TechnologyId",
                table: "StudentProjectPostTechnologies",
                column: "TechnologyId");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "StudentProjectPostDepartments");

            migrationBuilder.DropTable(
                name: "StudentProjectPostTechnologies");

            migrationBuilder.DropTable(
                name: "StudentProjectPosts");
        }
    }
}
