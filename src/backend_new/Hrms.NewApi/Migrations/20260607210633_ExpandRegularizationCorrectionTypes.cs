using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Hrms.NewApi.Migrations
{
    /// <inheritdoc />
    public partial class ExpandRegularizationCorrectionTypes : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropCheckConstraint(
                name: "chk_ar_correction_type",
                table: "attendanceregularizations");

            migrationBuilder.DropCheckConstraint(
                name: "chk_ar_original_status",
                table: "attendanceregularizations");

            migrationBuilder.AddCheckConstraint(
                name: "chk_ar_correction_type",
                table: "attendanceregularizations",
                sql: "requestedcorrectiontype IN ('FULL_DAY','HALF_DAY','SHORT_DAY','FORGOT_CHECK_IN','FORGOT_CHECK_OUT')");

            migrationBuilder.AddCheckConstraint(
                name: "chk_ar_original_status",
                table: "attendanceregularizations",
                sql: "originalattendancestatus IN ('ABSENT','HALF_DAY','SHORT_DAY','CHECKED_IN')");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropCheckConstraint(
                name: "chk_ar_correction_type",
                table: "attendanceregularizations");

            migrationBuilder.DropCheckConstraint(
                name: "chk_ar_original_status",
                table: "attendanceregularizations");

            migrationBuilder.AddCheckConstraint(
                name: "chk_ar_correction_type",
                table: "attendanceregularizations",
                sql: "requestedcorrectiontype IN ('FULL_DAY','HALF_DAY')");

            migrationBuilder.AddCheckConstraint(
                name: "chk_ar_original_status",
                table: "attendanceregularizations",
                sql: "originalattendancestatus IN ('ABSENT','HALF_DAY','SHORT_DAY')");
        }
    }
}
