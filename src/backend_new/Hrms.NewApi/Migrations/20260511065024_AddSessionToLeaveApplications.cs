using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Hrms.NewApi.Migrations
{
    /// <inheritdoc />
    public partial class AddSessionToLeaveApplications : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "session",
                table: "leaveapplications",
                type: "character varying(20)",
                maxLength: 20,
                nullable: true);

            migrationBuilder.AddCheckConstraint(
                name: "chk_la_session",
                table: "leaveapplications",
                sql: "session IS NULL OR session IN ('FIRST_HALF','SECOND_HALF')");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropCheckConstraint(
                name: "chk_la_session",
                table: "leaveapplications");

            migrationBuilder.DropColumn(
                name: "session",
                table: "leaveapplications");
        }
    }
}
