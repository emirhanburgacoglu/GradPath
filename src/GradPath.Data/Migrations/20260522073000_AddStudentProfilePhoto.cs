using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace GradPath.Data.Migrations
{
    /// <inheritdoc />
    public partial class AddStudentProfilePhoto : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "ProfilePhotoUrl",
                table: "StudentProfiles",
                type: "text",
                nullable: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "ProfilePhotoUrl",
                table: "StudentProfiles");
        }
    }
}
