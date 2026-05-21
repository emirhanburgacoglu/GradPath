using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace GradPath.Data.Migrations
{
    /// <inheritdoc />
    public partial class AddAdvisorOwnedProjects : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<Guid>(
                name: "AdvisorUserId",
                table: "Projects",
                type: "uuid",
                nullable: true);

            migrationBuilder.CreateIndex(
                name: "IX_Projects_AdvisorUserId",
                table: "Projects",
                column: "AdvisorUserId");

            migrationBuilder.AddForeignKey(
                name: "FK_Projects_AspNetUsers_AdvisorUserId",
                table: "Projects",
                column: "AdvisorUserId",
                principalTable: "AspNetUsers",
                principalColumn: "Id",
                onDelete: ReferentialAction.SetNull);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_Projects_AspNetUsers_AdvisorUserId",
                table: "Projects");

            migrationBuilder.DropIndex(
                name: "IX_Projects_AdvisorUserId",
                table: "Projects");

            migrationBuilder.DropColumn(
                name: "AdvisorUserId",
                table: "Projects");
        }
    }
}
