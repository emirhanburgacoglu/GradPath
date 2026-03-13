using System;
using Microsoft.EntityFrameworkCore.Migrations;
using Npgsql.EntityFrameworkCore.PostgreSQL.Metadata;

#nullable disable

namespace GradPath.Data.Migrations
{
    /// <inheritdoc />
    public partial class AddStudentTechnologyTable : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "Message",
                table: "TeamMatches");

            migrationBuilder.RenameColumn(
                name: "MatchedAt",
                table: "TeamMatches",
                newName: "UpdatedAt");

            // Önce eski Guid olan Id kolonunu ve birincil anahtarı siliyoruz
            migrationBuilder.DropPrimaryKey(name: "PK_TeamMatches", table: "TeamMatches");
            migrationBuilder.DropColumn(name: "Id", table: "TeamMatches");

            // Şimdi int (sayı) tipinde yeni Id kolonunu ekliyoruz
            migrationBuilder.AddColumn<int>(
                name: "Id",
                table: "TeamMatches",
                type: "integer",
                nullable: false)
                .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn);

            // Birincil anahtarı (Primary Key) yeni Id kolonu üzerinden tekrar kuruyoruz
            migrationBuilder.AddPrimaryKey(name: "PK_TeamMatches", table: "TeamMatches", column: "Id");

            migrationBuilder.CreateTable(
                name: "StudentTechnologies",
                columns: table => new
                {
                    UserId = table.Column<Guid>(type: "uuid", nullable: false),
                    TechnologyId = table.Column<int>(type: "integer", nullable: false),
                    ProficiencyLevel = table.Column<int>(type: "integer", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_StudentTechnologies", x => new { x.UserId, x.TechnologyId });
                    table.ForeignKey(
                        name: "FK_StudentTechnologies_AspNetUsers_UserId",
                        column: x => x.UserId,
                        principalTable: "AspNetUsers",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_StudentTechnologies_Technologies_TechnologyId",
                        column: x => x.TechnologyId,
                        principalTable: "Technologies",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_StudentTechnologies_TechnologyId",
                table: "StudentTechnologies",
                column: "TechnologyId");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "StudentTechnologies");

            migrationBuilder.RenameColumn(
                name: "UpdatedAt",
                table: "TeamMatches",
                newName: "MatchedAt");

            migrationBuilder.AlterColumn<Guid>(
                name: "Id",
                table: "TeamMatches",
                type: "uuid",
                nullable: false,
                oldClrType: typeof(int),
                oldType: "integer")
                .OldAnnotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn);

            migrationBuilder.AddColumn<string>(
                name: "Message",
                table: "TeamMatches",
                type: "text",
                nullable: true);
        }
    }
}
