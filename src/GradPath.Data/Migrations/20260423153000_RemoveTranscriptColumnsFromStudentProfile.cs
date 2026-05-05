using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace GradPath.Data.Migrations
{
    /// <inheritdoc />
    public partial class RemoveTranscriptColumnsFromStudentProfile : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "ParsedTranscriptData",
                table: "StudentProfiles");

            migrationBuilder.DropColumn(
                name: "TranscriptFileName",
                table: "StudentProfiles");

            migrationBuilder.DropColumn(
                name: "TranscriptUploadedAt",
                table: "StudentProfiles");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "ParsedTranscriptData",
                table: "StudentProfiles",
                type: "text",
                nullable: false,
                defaultValue: "{}");

            migrationBuilder.AddColumn<string>(
                name: "TranscriptFileName",
                table: "StudentProfiles",
                type: "text",
                nullable: true);

            migrationBuilder.AddColumn<DateTime>(
                name: "TranscriptUploadedAt",
                table: "StudentProfiles",
                type: "timestamp with time zone",
                nullable: true);
        }
    }
}
