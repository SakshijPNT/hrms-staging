using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Hrms.NewApi.Migrations
{
    /// <inheritdoc />
    public partial class AddRegularizationPrdFields : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropCheckConstraint(
                name: "chk_ar_requested_times",
                table: "attendanceregularizations");

            migrationBuilder.AddColumn<bool>(
                name: "isregularized",
                table: "userattendancelogs",
                type: "boolean",
                nullable: false,
                defaultValue: false);

            migrationBuilder.AddColumn<int>(
                name: "regularizationwindowdays",
                table: "companypolicies",
                type: "integer",
                nullable: false,
                defaultValue: 30);

            migrationBuilder.AlterColumn<DateTimeOffset>(
                name: "requestedcheckouttime",
                table: "attendanceregularizations",
                type: "timestamp with time zone",
                nullable: true,
                oldClrType: typeof(DateTimeOffset),
                oldType: "timestamp with time zone");

            migrationBuilder.AlterColumn<DateTimeOffset>(
                name: "requestedcheckintime",
                table: "attendanceregularizations",
                type: "timestamp with time zone",
                nullable: true,
                oldClrType: typeof(DateTimeOffset),
                oldType: "timestamp with time zone");

            migrationBuilder.AddColumn<string>(
                name: "originalattendancestatus",
                table: "attendanceregularizations",
                type: "character varying(20)",
                maxLength: 20,
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<string>(
                name: "requestedcorrectiontype",
                table: "attendanceregularizations",
                type: "character varying(20)",
                maxLength: 20,
                nullable: false,
                defaultValue: "");

            migrationBuilder.Sql(
                """
                UPDATE attendanceregularizations
                SET originalattendancestatus = 'ABSENT'
                WHERE originalattendancestatus = '' OR originalattendancestatus IS NULL;

                UPDATE attendanceregularizations
                SET requestedcorrectiontype = 'FULL_DAY'
                WHERE requestedcorrectiontype = '' OR requestedcorrectiontype IS NULL;
                """);

            migrationBuilder.AddCheckConstraint(
                name: "chk_ar_correction_type",
                table: "attendanceregularizations",
                sql: "requestedcorrectiontype IN ('FULL_DAY','HALF_DAY')");

            migrationBuilder.AddCheckConstraint(
                name: "chk_ar_original_status",
                table: "attendanceregularizations",
                sql: "originalattendancestatus IN ('ABSENT','HALF_DAY','SHORT_DAY')");

            migrationBuilder.AddCheckConstraint(
                name: "chk_ar_requested_times",
                table: "attendanceregularizations",
                sql: "requestedcheckintime IS NULL OR requestedcheckouttime IS NULL OR requestedcheckouttime > requestedcheckintime");
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

            migrationBuilder.DropCheckConstraint(
                name: "chk_ar_requested_times",
                table: "attendanceregularizations");

            migrationBuilder.DropColumn(
                name: "isregularized",
                table: "userattendancelogs");

            migrationBuilder.DropColumn(
                name: "regularizationwindowdays",
                table: "companypolicies");

            migrationBuilder.DropColumn(
                name: "originalattendancestatus",
                table: "attendanceregularizations");

            migrationBuilder.DropColumn(
                name: "requestedcorrectiontype",
                table: "attendanceregularizations");

            migrationBuilder.AlterColumn<DateTimeOffset>(
                name: "requestedcheckouttime",
                table: "attendanceregularizations",
                type: "timestamp with time zone",
                nullable: false,
                defaultValue: new DateTimeOffset(new DateTime(1, 1, 1, 0, 0, 0, 0, DateTimeKind.Unspecified), new TimeSpan(0, 0, 0, 0, 0)),
                oldClrType: typeof(DateTimeOffset),
                oldType: "timestamp with time zone",
                oldNullable: true);

            migrationBuilder.AlterColumn<DateTimeOffset>(
                name: "requestedcheckintime",
                table: "attendanceregularizations",
                type: "timestamp with time zone",
                nullable: false,
                defaultValue: new DateTimeOffset(new DateTime(1, 1, 1, 0, 0, 0, 0, DateTimeKind.Unspecified), new TimeSpan(0, 0, 0, 0, 0)),
                oldClrType: typeof(DateTimeOffset),
                oldType: "timestamp with time zone",
                oldNullable: true);

            migrationBuilder.AddCheckConstraint(
                name: "chk_ar_requested_times",
                table: "attendanceregularizations",
                sql: "requestedcheckouttime > requestedcheckintime");
        }
    }
}
